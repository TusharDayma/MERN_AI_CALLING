import twilio from 'twilio';
import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, WHATSAPP_STATUS, CONSENT_STATUS, DPDP_ACTIONS, DPDP_CHANNELS } from '../../config/constants.js';
import { logDpdpAction, recordCandidateConsent, executeRightToErasure } from '../dpdp/dpdp.service.js';
import { generateMagicToken } from '../screening/screening.service.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
const ngrokUrl = process.env.NGROK_URL || 'https://stonable-remiform-augustina.ngrok-free.dev';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const twilioClient = (accountSid && authToken && !accountSid.includes('YOUR_'))
  ? twilio(accountSid, authToken)
  : null;

/**
 * Sends outbound WhatsApp message to candidate (via Twilio or simulated log).
 */
export const sendWhatsAppMessage = async (toPhone, messageBody) => {
  const formattedTo = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const formattedFrom = twilioPhoneNumber.startsWith('whatsapp:') ? twilioPhoneNumber : `whatsapp:${twilioPhoneNumber}`;

  if (twilioClient) {
    try {
      const msg = await twilioClient.messages.create({
        from: formattedFrom,
        to: formattedTo,
        body: messageBody
      });
      console.log(`[Twilio WhatsApp] Message sent to ${toPhone}, SID: ${msg.sid}`);
      return { success: true, sid: msg.sid };
    } catch (err) {
      console.error(`[Twilio WhatsApp] Error sending message to ${toPhone}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[Twilio WhatsApp] [MOCK MODE] Sent WhatsApp message to ${toPhone}:\n---\n${messageBody}\n---`);
    return { success: true, sid: `MOCK_WA_${Date.now()}` };
  }
};

/**
 * Dispatches Step 1: Initial Hook & DPDP Consent Notice to Candidate.
 */
export const sendInitialWhatsAppInvite = async (candidateId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      campaign: {
        include: { jobRole: true }
      }
    }
  });

  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const roleTitle = candidate.campaign?.jobRole?.title || candidate.campaign?.name || 'Open Position';
  const candidateName = candidate.name || 'Candidate';

  const body = 
`Hi ${candidateName},

We are pleased to inform you that your profile has been shortlisted for the *${roleTitle}* role!

🔒 *Data Privacy Notice (DPDP Act 2023)*:
To evaluate your application, we conduct a quick 3-minute AI voice screening. Your responses will be recorded and used solely for recruitment evaluation.

*Would you like to proceed?*
👉 Reply *YES* to receive your instant Web Screening Link
👉 Reply *NO* if you are not interested
👉 Reply *DELETE* anytime to exercise your Right to Erasure and purge your data.`;

  const result = await sendWhatsAppMessage(candidate.contact, body);

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      status: CANDIDATE_STATUS.WHATSAPP_SENT,
      whatsapp_status: WHATSAPP_STATUS.SENT,
      whatsapp_sent_at: new Date()
    }
  });

  return result;
};

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
 * Handles incoming Twilio WhatsApp text replies (YES / NO / DELETE / Questions).
 */
export const handleInboundWhatsAppMessage = async ({ From, Body }) => {
  const cleanPhone = (From || '').replace('whatsapp:', '').trim();
  const text = (Body || '').trim().toLowerCase();

  console.log(`[WhatsApp Inbound] Received message from ${cleanPhone}: "${Body}"`);

  // 1. Check for DPDP Right to Erasure command ("DELETE", "FORGET", "ERASE", "REMOVE")
  const isErasure = ['delete', 'forget', 'erase', 'remove', 'purge', 'gdpr', 'dpdp'].some(w => text === w || text.startsWith(w));
  if (isErasure) {
    console.log(`[WhatsApp Inbound] Candidate requested DPDP Right to Erasure for phone ${cleanPhone}`);
    const erasureResult = await executeRightToErasure(cleanPhone, DPDP_CHANNELS.WHATSAPP);

    const replyMsg = 
`✅ *DPDP Data Erasure Confirmed*

Under Section 12 of the Digital Personal Data Protection (DPDP) Act, all your personal information, phone records, interview audio, and AI dossiers have been permanently purged from our databases.

You will not receive any further automated recruitment communications.`;

    await sendWhatsAppMessage(cleanPhone, replyMsg);
    return { success: true, action: 'DPDP_ERASURE_COMPLETED', details: erasureResult };
  }

  // Find candidate by contact phone number
  const candidate = await prisma.candidate.findFirst({
    where: {
      contact: { contains: cleanPhone.slice(-10) }
    },
    include: {
      campaign: {
        include: {
          jobRole: true,
          hr: { select: { name: true, email: true } }
        }
      }
    }
  });

  if (!candidate) {
    console.warn(`[WhatsApp Inbound] No candidate found matching phone ${cleanPhone}`);
    return { success: false, reason: 'Candidate not found' };
  }

  const isPositive = ['yes', 'yeah', 'sure', 'interested', 'yep', 'ok', 'okay', '1', 'consent', 'start'].some(w => text.includes(w));
  const isNegative = ['no', 'nope', 'pass', 'stop', 'busy', 'not interested', '2', 'decline'].some(w => text.includes(w));

  // 2. Handle Positive Consent -> Generate & Send Magic Web Link (Step 2)
  if (isPositive) {
    console.log(`[WhatsApp Inbound] Candidate ${candidate.name} ACCEPTED screening via WhatsApp. Generating Magic Link...`);
    
    // Record DPDP Consent
    await recordCandidateConsent(candidate.id, DPDP_CHANNELS.WHATSAPP);

    // Generate Magic Link
    const { token } = await generateMagicToken(candidate.id);
    const magicLinkUrl = `${frontendUrl}/screening/${token}`;
    const roleTitle = candidate.campaign?.jobRole?.title || candidate.campaign?.name || 'Position';

    const magicLinkMessage =
`🎉 *Awesome! Here is your AI Voice Screening Link*

Please click the secure link below to begin your 3-minute voice screening for *${roleTitle}*:
🔗 ${magicLinkUrl}

✨ *Why you will love this*:
• You can take it on your smartphone or PC at your own convenience.
• Tap your mic to speak naturally to our friendly AI interviewer.
• Zero app download required!

_Link valid for 48 hours. If you wish to delete your data at any time, reply DELETE._`;

    await sendWhatsAppMessage(cleanPhone, magicLinkMessage);

    return { success: true, action: 'MAGIC_LINK_SENT', magicLinkUrl };

  // 3. Handle Negative Consent / Decline
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

    await logDpdpAction({
      candidateId: candidate.id,
      candidatePhone: candidate.contact,
      action: DPDP_ACTIONS.CONSENT_DECLINED,
      channel: DPDP_CHANNELS.WHATSAPP,
      details: 'Candidate declined participation in AI voice screening.'
    });

    const declineMsg = `Thank you for letting us know, ${candidate.name}. We have updated your status and will not contact you further for this role. Have a great day!`;
    await sendWhatsAppMessage(cleanPhone, declineMsg);

    return { success: true, action: 'CANDIDATE_OPTED_OUT' };

  // 4. Handle Candidate Questions / FAQ
  } else {
    console.log(`[WhatsApp Inbound] Candidate query received: "${Body}"`);
    const hrEmail = candidate.campaign?.hr?.email || 'hr@company.com';
    const roleTitle = candidate.campaign?.jobRole?.title || candidate.campaign?.name || 'Open Position';

    const queryReply =
`👋 Hello ${candidate.name},

I am the AntiTalk AI Hiring Assistant for the *${roleTitle}* role.

• To start your 3-minute voice screening, reply *YES*.
• If you do not wish to proceed, reply *NO*.
• For specific queries regarding job offer, CTC, or company policies, please contact your HR recruiter directly at: *${hrEmail}*.
• To delete your profile under the DPDP Act, reply *DELETE*.`;

    await sendWhatsAppMessage(cleanPhone, queryReply);
    return { success: true, action: 'FAQ_RESPONSE_SENT' };
  }
};

