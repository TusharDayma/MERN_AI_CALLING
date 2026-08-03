/**
 * telephony.route.js
 * HTTP routing for the Exotel Telephony domain.
 * This file handles ONLY route definitions and middleware application.
 */

import express from 'express';
import * as telephonyController from './telephony.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import { requireRole } from '../../../middleware/roleMiddleware.js';

const router = express.Router();

// ── Public Webhook Endpoints (called by Exotel, no JWT) ──────────────────────

/**
 * POST /api/telephony/whatsapp/webhook
 * Receives inbound WhatsApp messages and delivery status updates from Exotel.
 */
router.post('/whatsapp/webhook', telephonyController.handleWhatsAppWebhook);

/**
 * POST /api/telephony/leg/webhook
 * Receives leg lifecycle events (answered, completed, failed) from Exotel.
 */
router.post('/leg/webhook', telephonyController.handleLegWebhook);

// ── Protected HR Action Endpoints ────────────────────────────────────────────

/**
 * POST /api/telephony/call/:candidateId
 * Manually dispatch an Exotel voice call for a candidate. HR only.
 */
router.post('/call/:candidateId', verifyToken, requireRole('HR'), telephonyController.triggerManualCall);

/**
 * POST /api/telephony/whatsapp/:candidateId
 * Manually send a WhatsApp screening invite to a candidate. HR only.
 */
router.post('/whatsapp/:candidateId', verifyToken, requireRole('HR'), telephonyController.triggerWhatsAppInvite);

export default router;
