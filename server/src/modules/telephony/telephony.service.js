/**
 * telephony.service.js
 * Domain service for Exotel telephony operations.
 *
 * Responsibilities (SRP):
 *   1. sendWhatsAppInvite   — Exotel WhatsApp Template API
 *   2. dispatchExotelCall   — Exotel Legs API (dial the candidate)
 *   3. startAgentStream     — Exotel AgentStream (wire the leg to the Python WS bot)
 *
 * This file knows NOTHING about HTTP req/res — that is the controller's job.
 * It also knows NOTHING about routing — that is the route file's job.
 */

import fetch from 'node-fetch';
import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, WHATSAPP_STATUS, CONSENT_STATUS } from '../../config/constants.js';
import {
  EXOTEL_BASE_URL,
  EXOTEL_WHATSAPP_CHANNEL,
  STREAM_DIRECTION,
  POSITIVE_REPLIES,
  NEGATIVE_REPLIES
} from './telephony.constants.js';

// ── Environment Configuration ─────────────────────────────────────────────────
const EXOTEL_API_KEY     = process.env.EXOTEL_API_KEY;
const EXOTEL_API_TOKEN   = process.env.EXOTEL_API_TOKEN;
const EXOTEL_ACCOUNT_SID = process.env.EXOTEL_ACCOUNT_SID;
const EXOTEL_CALLER_ID   = process.env.EXOTEL_CALLER_ID;   // Exotel virtual number
const BOT_WEBSOCKET_URL  = process.env.BOT_WEBSOCKET_URL   || 'wss://your-bot/media-stream';
const STATUS_CALLBACK_URL = process.env.STATUS_CALLBACK_URL;

const IS_MOCK = !EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_ACCOUNT_SID;

/**
 * Build the base Exotel API URL for v1.
 */
const buildExotelV1Url = (path) =>
  `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}${path}`;

/**
 * Generic Exotel REST call helper for v1 APIs (expects application/x-www-form-urlencoded)
 * Throws a descriptive error on non-2xx responses.
 */
const exotelPostV1 = async (path, params) => {
  const url = buildExotelV1Url(path);

  if (IS_MOCK) {
    console.log(`[Telephony Service] [MOCK] POST ${path}`, JSON.stringify(params, null, 2));
    return { Call: { Sid: 'MOCK_SID_' + Date.now(), Status: 'queued' } };
  }

  const authHeader = 'Basic ' + Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString('base64');
  
  // Convert object to URLSearchParams for form-urlencoded
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
// 2. Voice — Exotel V1 Calls/connect API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initiates an outbound call using the Exotel V1 Calls API.
 * Uses streamurl to connect the call directly to the WebSocket Bot.
 */
export const dispatchExotelCall = async (candidateId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { campaign: { include: { questions: true } } }
  });

  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  console.log(`[Telephony Service] Dispatching Exotel voice call to ${candidate.name} (${candidate.contact}) via V1 API...`);

  // Fetch campaign questions to pass as stream metadata
  let questionsParam = '[]';
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
  } catch (e) {
    console.error('[Telephony Service] Failed to serialize campaign questions:', e.message);
  }

  // Construct streamurl with query parameters so Python backend can pick them up
  const streamUrl = `${BOT_WEBSOCKET_URL}?candidateId=${candidateId}&questionsJson=${encodeURIComponent(questionsParam)}`;

  const payload = {
    From: EXOTEL_CALLER_ID,
    To: candidate.contact,
    CallerId: EXOTEL_CALLER_ID,
    streamtype: 'bidirectional',
    streamurl: streamUrl,
  };

  if (STATUS_CALLBACK_URL) {
    payload.StatusCallback = STATUS_CALLBACK_URL;
  }

  const result = await exotelPostV1('/Calls/connect.json', payload);
  const callSid = result.Call?.Sid || ('MOCK_CALL_' + Date.now());

  console.log(`[Telephony Service] Call created. CallSid: ${callSid}`);

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: CANDIDATE_STATUS.VOICE_FALLBACK_DISPATCHED,
      fallback_call_at: new Date(),
      dossier_json: JSON.stringify({ call_sid: callSid })
    }
  });

  return { success: true, callSid };
};



// ─────────────────────────────────────────────────────────────────────────────
// 4. Inbound WhatsApp Reply Handler (Business Logic)
// ─────────────────────────────────────────────────────────────────────────────

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

    // Trigger Exotel voice call immediately
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
