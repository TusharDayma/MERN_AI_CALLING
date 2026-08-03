import express from 'express';
import * as twilioController from './twilio.controller.js';

const router = express.Router();

// TwiML webhook endpoint called by Twilio during outbound call handshake
router.post('/twiml', twilioController.handleTwiMLRequest);

// Trigger outbound call manually
router.post('/call', twilioController.triggerOutboundCall);

// Inbound WhatsApp webhook called by Twilio Messaging
router.post('/whatsapp-inbound', express.urlencoded({ extended: true }), twilioController.handleWhatsAppInbound);

export default router;
