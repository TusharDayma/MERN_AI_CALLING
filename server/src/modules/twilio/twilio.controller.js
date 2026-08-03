import * as twilioService from './twilio.service.js';

export const handleTwiMLRequest = async (req, res) => {
  try {
    const { candidateId } = req.query;
    const twiml = await twilioService.generateTwiML(candidateId);
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('[Twilio Controller] Error generating TwiML:', error);
    res.status(500).send('<Response><Say>An internal error occurred.</Say></Response>');
  }
};

export const triggerOutboundCall = async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }
    const result = await twilioService.dispatchVoiceCall(candidateId);
    res.status(200).json(result);
  } catch (error) {
    console.error('[Twilio Controller] Error triggering call:', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch call' });
  }
};

export const handleWhatsAppInbound = async (req, res) => {
  try {
    const { From, Body } = req.body;
    const result = await twilioService.handleInboundWhatsAppMessage({ From, Body });
    
    // Respond to Twilio with valid TwiML empty Messaging Response
    res.type('text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('[Twilio Controller] WhatsApp Webhook Error:', error);
    res.status(500).send('<Response></Response>');
  }
};
