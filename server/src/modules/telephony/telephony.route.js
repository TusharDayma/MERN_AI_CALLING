/**
 * telephony.route.js
 * HTTP routing for the Exotel Telephony domain.
 * This file handles ONLY route definitions and middleware application.
 */

import crypto from 'crypto';
import express from 'express';
import * as telephonyController from './telephony.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import { requireRole } from '../../../middleware/roleMiddleware.js';

const router = express.Router();

export const verifyExotelSignature = (req, res, next) => {
  const authToken = process.env.EXOTEL_AUTH_TOKEN;
  if (!authToken) {
    console.error('Missing EXOTEL_AUTH_TOKEN in environment.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const signature = req.headers['x-exotel-signature']; 
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing Exotel Signature' });
  }
  
  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', authToken).update(payload).digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid Exotel Signature' });
  }
  next();
};

// ── Public Webhook Endpoints (called by Exotel, no JWT) ──────────────────────

/**
 * POST /api/telephony/whatsapp/webhook
 * Receives inbound WhatsApp messages and delivery status updates from Exotel.
 */
router.post('/whatsapp/webhook', verifyExotelSignature, telephonyController.handleWhatsAppWebhook);

/**
 * POST /api/telephony/leg/webhook
 * Receives leg lifecycle events (answered, completed, failed) from Exotel.
 */
router.post('/leg/webhook', verifyExotelSignature, telephonyController.handleLegWebhook);

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
