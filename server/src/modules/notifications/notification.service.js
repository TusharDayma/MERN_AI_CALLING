import twilio from 'twilio';
import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, WHATSAPP_STATUS } from '../../config/constants.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio Sandbox or WhatsApp Enabled Number

const twilioClient = (accountSid && authToken && !accountSid.includes('YOUR_'))
  ? twilio(accountSid, authToken)
  : null;

/**
 * Sends an automated WhatsApp message to a candidate to schedule an AI screening call.
 */
export const sendWhatsAppScreeningInvite = async (candidateId) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { campaign: true }
  });

  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const campaignName = candidate.campaign?.name || 'Open Role';
  const messageBody = (
    `Hi ${candidate.name}! 🚀 We are reaching out regarding your application for ${campaignName}.\n\n` +
    `Are you interested and available for a brief AI voice preliminary screening call?\n\n` +
    `Reply *YES* to confirm or *NO* to opt out.`
  );

  console.log(`[WhatsApp Service] Sending invite to ${candidate.contact} (${candidate.name})...`);

  let messageSid = 'MOCK_WA_SID_' + Date.now();
  if (twilioClient) {
    try {
      const recipientNumber = candidate.contact.startsWith('whatsapp:')
        ? candidate.contact
        : `whatsapp:${candidate.contact}`;

      const res = await twilioClient.messages.create({
        from: whatsappFrom,
        to: recipientNumber,
        body: messageBody
      });
      messageSid = res.sid;
      console.log(`[WhatsApp Service] Sent message ${messageSid} to ${recipientNumber}`);
    } catch (err) {
      console.error(`[WhatsApp Service] Failed to send Twilio WhatsApp message: ${err.message}`);
    }
  } else {
    console.log(`[WhatsApp Service] [MOCK MODE] Simulating WhatsApp invite to ${candidate.contact}`);
  }

  // Update candidate status in database
  const updatedCandidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: CANDIDATE_STATUS.WHATSAPP_SENT,
      whatsapp_status: WHATSAPP_STATUS.SENT,
      whatsapp_sent_at: new Date(),
      consent_status: 'PENDING'
    }
  });

  return updatedCandidate;
};
