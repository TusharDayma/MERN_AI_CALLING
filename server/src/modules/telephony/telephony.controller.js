/**
 * telephony.controller.js
 * HTTP transport layer for the Exotel Telephony domain.
 *
 * Responsibilities:
 *   - Extract parameters from req/res
 *   - Call the appropriate service function
 *   - Return HTTP responses
 *
 * This file MUST NOT contain any business logic or direct DB queries.
 */

import * as telephonyService from './telephony.service.js';
import { EXOTEL_WA_EVENTS, EXOTEL_LEG_EVENTS } from './telephony.constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Webhooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/telephony/whatsapp/webhook
 *
 * Exotel sends one of two event types:
 *   - "inbound_message": A reply from the candidate
 *   - "message_status":  A delivery/read receipt — log only
 */
export const handleWhatsAppWebhook = async (req, res) => {
  // Acknowledge quickly — Exotel webhooks time out if no 200 is returned promptly
  res.status(200).json({ received: true });

  try {
    const { type, data } = req.body;

    if (type === EXOTEL_WA_EVENTS.INBOUND_MESSAGE) {
      const from = data?.message?.from || data?.from;
      const messageBody = data?.message?.body || data?.body || '';

      await telephonyService.handleInboundWhatsAppReply({ from, messageBody });

    } else if (type === EXOTEL_WA_EVENTS.MESSAGE_STATUS) {
      // Delivery / read receipts — log only, no action needed
      console.log(`[Telephony Controller] WhatsApp status update: ${data?.status} for ${data?.to}`);

    } else {
      console.warn(`[Telephony Controller] Unknown WhatsApp webhook type: ${type}`);
    }
  } catch (err) {
    // Do not re-throw — 200 is already sent. Log the error for debugging.
    console.error('[Telephony Controller] Error processing WhatsApp webhook:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Voice / Leg Webhooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/telephony/leg/webhook
 *
 * Exotel sends leg lifecycle events:
 *   - "leg_answered":  Candidate answered → start the AgentStream
 *   - "leg_completed": Call ended — log only
 *   - "leg_failed":    Call failed — log + optionally retry
 */
export const handleLegWebhook = async (req, res) => {
  // Acknowledge first — critical for Exotel not to retry
  res.status(200).json({ received: true });

  try {
    const { type, data } = req.body;
    const legSid = data?.leg_sid || data?.sid;

    if (type === EXOTEL_LEG_EVENTS.LEG_ANSWERED) {
      // Pull the candidateId from the metadata we attached when creating the leg
      const candidateId = data?.metadata?.candidate_id;

      if (!legSid || !candidateId) {
        console.error('[Telephony Controller] leg_answered missing legSid or candidateId', data);
        return;
      }

      console.log(`[Telephony Controller] Call answered. LegSid=${legSid}, CandidateId=${candidateId}`);
      // In V1, the stream starts automatically via streamurl. No need to manually start it.

    } else if (type === EXOTEL_LEG_EVENTS.LEG_COMPLETED) {
      console.log(`[Telephony Controller] Leg completed. LegSid=${legSid}, Duration=${data?.duration}s`);
      
      const candidateId = data?.metadata?.candidate_id;
      if (candidateId && data?.duration) {
        await telephonyService.processCallBilling(candidateId, parseInt(data.duration, 10));
      }

    } else if (type === EXOTEL_LEG_EVENTS.LEG_FAILED) {
      console.error(`[Telephony Controller] Leg failed. LegSid=${legSid}, Reason=${data?.reason}`);

    } else {
      console.warn(`[Telephony Controller] Unknown leg webhook type: ${type}`);
    }
  } catch (err) {
    console.error('[Telephony Controller] Error processing leg webhook:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Manual HR-triggered actions (protected routes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/telephony/call/:candidateId
 * HR manually triggers an outbound call for a specific candidate.
 */
export const triggerManualCall = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const result = await telephonyService.dispatchExotelCall(candidateId);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[Telephony Controller] Manual call trigger error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/telephony/whatsapp/:candidateId
 * HR manually sends a WhatsApp screening invite to a specific candidate.
 */
export const triggerWhatsAppInvite = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const result = await telephonyService.dispatchExotelCall(candidateId);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[Telephony Controller] Voice dispatch error (from legacy WA trigger):', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
