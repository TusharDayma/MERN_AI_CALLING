import twilio from 'twilio';
import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, WHATSAPP_STATUS, CONSENT_STATUS } from '../../config/constants.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
const ngrokUrl = process.env.NGROK_URL || 'https://stonable-remiform-augustina.ngrok-free.dev';

const twilioClient = (accountSid && authToken && !accountSid.includes('YOUR_'))
  ? twilio(accountSid, authToken)
  : null;

/**
 * Escapes special XML characters for TwiML attributes.
 */
export const xmlEscape = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Initiates an outbound Twilio voice call for a candidate.
 */
export const dispatchVoiceCall = async (candidateId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId }
  });

  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const twimlUrl = `${ngrokUrl}/api/twilio/twiml?candidateId=${candidateId}`;
  console.log(`[Twilio Service] Triggering call to ${candidate.contact} with TwiML URL: ${twimlUrl}`);

  if (twilioClient) {
    const call = await twilioClient.calls.create({
      url: twimlUrl,
      to: candidate.contact,
      from: twilioPhoneNumber
    });
    console.log(`[Twilio Service] Call initiated SID: ${call.sid}`);
    return { success: true, sid: call.sid };
  } else {
    console.log(`[Twilio Service] [MOCK MODE] Simulating outbound voice call to ${candidate.contact}`);
    return { success: true, sid: 'MOCK_CALL_SID_' + Date.now() };
  }
};

/**
 * Generates TwiML XML string pointing to Python FastAPI media-stream WebSocket.
 */
export const generateTwiML = async (candidateId) => {
  let questionsJson = '[]';
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        campaign: {
          include: { questions: true }
        }
      }
    });

    const qs = candidate?.campaign?.questions || [];
    if (qs.length > 0) {
      questionsJson = JSON.stringify(
        qs.map(q => ({
          text: q.text,
          key_criteria: q.key_criteria || '',
          category: q.type || 'Pre-Screening'
        }))
      );
    }
  } catch (e) {
    console.error('[TwiML] Error fetching questions for stream:', e.message);
  }

  const websocketUrl = process.env.NGROK_PYTHON_URL || 'wss://placeholder-ngrok.ngrok.io/media-stream';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${websocketUrl}">
      <Parameter name="candidateId" value="${xmlEscape(candidateId || '')}" />
      <Parameter name="questionsJson" value="${xmlEscape(questionsJson)}" />
    </Stream>
  </Connect>
</Response>`.trim();

  return twiml;
};

/**
 * Handles incoming Twilio WhatsApp text replies (YES / NO / scheduling interest).
 */
export const handleInboundWhatsAppMessage = async ({ From, Body }) => {
  const cleanPhone = (From || '').replace('whatsapp:', '').trim();
  const text = (Body || '').trim().toLowerCase();

  console.log(`[WhatsApp Inbound] Received message from ${cleanPhone}: "${Body}"`);

  // Find candidate by contact phone number
  const candidate = await prisma.candidate.findFirst({
    where: {
      contact: { contains: cleanPhone.slice(-10) }
    }
  });

  if (!candidate) {
    console.warn(`[WhatsApp Inbound] No candidate found matching phone ${cleanPhone}`);
    return { success: false, reason: 'Candidate not found' };
  }

  const isPositive = ['yes', 'yeah', 'sure', 'interested', 'yep', 'ok', 'okay', '1'].some(w => text.includes(w));
  const isNegative = ['no', 'nope', 'pass', 'stop', 'busy', 'not interested', '2'].some(w => text.includes(w));

  if (isPositive) {
    console.log(`[WhatsApp Inbound] Candidate ${candidate.name} ACCEPTED screening via WhatsApp.`);
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        status: CANDIDATE_STATUS.WHATSAPP_REPLIED,
        whatsapp_status: WHATSAPP_STATUS.REPLIED,
        whatsapp_replied_at: new Date(),
        consent_status: CONSENT_STATUS.OPTED_IN
      }
    });

    // Automatically trigger voice call screening now that candidate consented
    await dispatchVoiceCall(candidate.id);
    return { success: true, action: 'VOICE_CALL_TRIGGERED' };

  } else if (isNegative) {
    console.log(`[WhatsApp Inbound] Candidate ${candidate.name} DECLINED screening via WhatsApp.`);
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

  return { success: true, action: 'UNKNOWN_REPLY_RECEIVED' };
};
