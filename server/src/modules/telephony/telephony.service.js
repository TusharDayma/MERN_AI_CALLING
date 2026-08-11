/**
 * telephony.service.js
 * Domain service for Exotel telephony operations.
 *
 * Added in this version:
 *  - isWithinCallingHours()  — Priority 5 guardrail
 *  - call_attempts tracking  — Priority 7
 *  - Socket.IO emit on dispatch — Priority 1
 */

import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, WHATSAPP_STATUS, CONSENT_STATUS, CALLING_HOURS_START, CALLING_HOURS_END, CALLING_TIMEZONE } from '../../config/constants.js';
import {
  EXOTEL_BASE_URL,
  EXOTEL_WHATSAPP_CHANNEL,
  STREAM_DIRECTION,
  POSITIVE_REPLIES,
  NEGATIVE_REPLIES
} from './telephony.constants.js';
import { getIO } from '../socket/socketManager.js';

// ── Environment Configuration ─────────────────────────────────────────────────
const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY;
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN;
const EXOTEL_ACCOUNT_SID = process.env.EXOTEL_ACCOUNT_SID;
const EXOTEL_CALLER_ID = process.env.EXOTEL_CALLER_ID;
const BOT_WEBSOCKET_URL = process.env.BOT_WEBSOCKET_URL || 'wss://your-bot/media-stream';
const STATUS_CALLBACK_URL = process.env.STATUS_CALLBACK_URL;

const IS_MOCK = !EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_ACCOUNT_SID;

/**
 * Priority 5 — Calling Hours Guardrail
 * Returns true if current time in CALLING_TIMEZONE is within [START, END) hours.
 */
export const isWithinCallingHours = () => {
  try {
    const tz = CALLING_TIMEZONE || 'Asia/Kolkata';
    const start = typeof CALLING_HOURS_START === 'number' ? CALLING_HOURS_START : 9;
    const end = typeof CALLING_HOURS_END === 'number' ? CALLING_HOURS_END : 19;

    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false
    });
    const currentHour = parseInt(formatter.format(new Date()), 10);
    return currentHour >= start && currentHour < end;
  } catch (e) {
    console.error('[Telephony] isWithinCallingHours error:', e.message);
    return true; // fail open so calls aren't silently blocked
  }
};

/**
 * Build the base Exotel API URL for v1.
 */
const buildExotelV1Url = (path) =>
  `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}${path}`;

/**
 * Generic Exotel REST call helper for v1 APIs.
 */
const exotelPostV1 = async (path, params) => {
  const url = buildExotelV1Url(path);

  if (IS_MOCK) {
    console.log(`[Telephony Service] [MOCK] POST ${path}`, JSON.stringify(params, null, 2));
    return { Call: { Sid: 'MOCK_SID_' + Date.now(), Status: 'queued' } };
  }

  const authHeader = 'Basic ' + Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString('base64');
  const body = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': authHeader
    },
    body
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Exotel V1 API error ${response.status} at ${path}: ${errText}`);
  }

  return response.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// Voice — Exotel V1 Calls/connect API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initiates an outbound call using the Exotel V1 Calls API.
 * Priority 5: Checks calling hours first.
 * Priority 7: Increments call_attempts + sets last_attempt_at.
 * Priority 1: Emits candidate:updated via Socket.IO.
 */
export const dispatchExotelCall = async (candidateId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { campaign: { include: { questions: true } } }
  });

  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  // Priority 5 — Calling Hours Guardrail
  if (!isWithinCallingHours()) {
    console.log(`[Telephony Service] Outside calling hours — queuing candidate ${candidate.name} for later.`);
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: CANDIDATE_STATUS.PENDING }
    });
    return { success: false, reason: 'OUTSIDE_CALLING_HOURS' };
  }

  console.log(`[Telephony Service] Dispatching Exotel voice call to ${candidate.name} (${candidate.contact})...`);

  let questionsParam = '[]';
  let scoringRubricStr = '{}';
  try {
    const qs = candidate?.campaign?.questions || [];
    if (qs.length > 0) {
      questionsParam = JSON.stringify(
        qs.map(q => ({
          text: q.text,
          key_criteria: q.key_criteria || '',
          category: q.type || 'Pre-Screening'
        }))
      );
    }

    // Support Custom Scoring Rubrics builder feature
    const rubric = candidate?.campaign?.jobRole?.scoring_rubric;
    if (rubric) {
      scoringRubricStr = typeof rubric === 'string' ? rubric : JSON.stringify(rubric);
    }
  } catch (e) {
    console.error('[Telephony Service] Failed to serialize campaign questions:', e.message);
  }

  // Pass configuration to the webhook via query parameters
  const serverBaseUrl = process.env.PUBLIC_SERVER_URL || 'http://localhost:5000';
  const exomlUrl = `${serverBaseUrl}/api/webhooks/exotel-answer?candidateId=${candidateId}&questionsJson=${encodeURIComponent(questionsParam)}&scoringRubric=${encodeURIComponent(scoringRubricStr)}`;

  const payload = {
    From: EXOTEL_CALLER_ID,
    To: candidate.contact,
    CallerId: EXOTEL_CALLER_ID,
    Url: exomlUrl,
    CallType: 'trans'
  };

  if (STATUS_CALLBACK_URL) {
    payload.StatusCallback = STATUS_CALLBACK_URL;
  }

  const result = await exotelPostV1('/Calls/connect.json', payload);
  const callSid = result.Call?.Sid || ('MOCK_CALL_' + Date.now());

  console.log(`[Telephony Service] Call created. CallSid: ${callSid}`);

  // Priority 7 — increment call_attempts and set last_attempt_at
  const updatedCandidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: CANDIDATE_STATUS.VOICE_FALLBACK_DISPATCHED,
      fallback_call_at: new Date(),
      last_attempt_at: new Date(),
      call_attempts: { increment: 1 },
      dossier_json: JSON.stringify({ call_sid: callSid })
    }
  });

  // Priority 1 — emit live update to campaign room
  try {
    const io = getIO();
    io.to(`campaign:${updatedCandidate.campaign_id}`).emit('candidate:updated', {
      candidateId,
      status: CANDIDATE_STATUS.VOICE_FALLBACK_DISPATCHED,
      ai_score: updatedCandidate.ai_score,
      call_attempts: updatedCandidate.call_attempts
    });
  } catch (e) {
    console.warn('[Telephony] Socket.IO emit skipped:', e.message);
  }

  return { success: true, callSid };
};


// ─────────────────────────────────────────────────────────────────────────────
// Call Billing
// ─────────────────────────────────────────────────────────────────────────────

export const processCallBilling = async (candidateId, durationSeconds) => {
  if (!durationSeconds || durationSeconds <= 0) return;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      campaign: { select: { created_by_hr_id: true } }
    }
  });

  if (!candidate || !candidate.campaign?.created_by_hr_id) return;

  const minutes = Math.ceil(durationSeconds / 60);
  const costPerMinute = 0.05;
  const totalCost = minutes * costPerMinute;

  await prisma.user.update({
    where: { id: candidate.campaign.created_by_hr_id },
    data: {
      total_voice_minutes: { increment: durationSeconds / 60 },
      credits_balance: { decrement: minutes },
      api_cost: { increment: totalCost }
    }
  });
};

/**
 * Parses an inbound Exotel WhatsApp message body, updates DB, and triggers
 * a voice call if the candidate consented.
 */
export const handleInboundWhatsAppReply = async ({ from, messageBody }) => {
  const cleanPhone = (from || '').trim();
  const text = (messageBody || '').trim().toLowerCase();

  console.log(`[Telephony Service] WhatsApp inbound from ${cleanPhone}: "${messageBody}"`);

  const candidate = await prisma.candidate.findFirst({
    where: {
      contact: { contains: cleanPhone.slice(-10) }
    }
  });

  if (!candidate) {
    console.warn(`[Telephony Service] No candidate found for phone ${cleanPhone}`);
    return { success: false, reason: 'Candidate not found' };
  }

  const isPositive = POSITIVE_REPLIES.some(w => text.includes(w));
  const isNegative = NEGATIVE_REPLIES.some(w => text.includes(w));

  if (isPositive) {
    console.log(`[Telephony Service] Candidate ${candidate.name} CONSENTED via WhatsApp → dispatching call.`);

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        status: CANDIDATE_STATUS.WHATSAPP_REPLIED,
        whatsapp_status: WHATSAPP_STATUS.REPLIED,
        whatsapp_replied_at: new Date(),
        consent_status: CONSENT_STATUS.OPTED_IN
      }
    });

    await dispatchExotelCall(candidate.id);
    return { success: true, action: 'VOICE_CALL_DISPATCHED' };

  } else if (isNegative) {
    console.log(`[Telephony Service] Candidate ${candidate.name} DECLINED via WhatsApp.`);

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        status: CANDIDATE_STATUS.INTEREST_DECLINED,
        whatsapp_status: WHATSAPP_STATUS.REPLIED,
        whatsapp_replied_at: new Date(),
        consent_status: CONSENT_STATUS.OPTED_OUT
      }
    });

    return { success: true, action: 'CANDIDATE_OPTED_OUT' };
  }

  console.log(`[Telephony Service] Ambiguous reply from ${candidate.name} — no action taken.`);
  return { success: true, action: 'AMBIGUOUS_REPLY' };
};
