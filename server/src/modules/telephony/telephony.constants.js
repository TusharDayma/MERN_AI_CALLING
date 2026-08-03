/**
 * telephony.constants.js
 * Centralised Exotel API configuration and event type identifiers.
 * No business logic here — pure constants only.
 */

export const EXOTEL_BASE_URL = 'https://api.exotel.com/v2/accounts';

export const EXOTEL_WHATSAPP_CHANNEL = 'whatsapp';

/** Exotel WhatsApp webhook event types */
export const EXOTEL_WA_EVENTS = {
  INBOUND_MESSAGE: 'inbound_message',
  MESSAGE_STATUS: 'message_status'
};

/** Exotel Legs/Voice webhook event types */
export const EXOTEL_LEG_EVENTS = {
  LEG_ANSWERED: 'leg_answered',
  LEG_COMPLETED: 'leg_completed',
  LEG_FAILED: 'leg_failed'
};

/** Exotel AgentStream direction */
export const STREAM_DIRECTION = 'bidirectional';

/** Candidate consent keyword matchers */
export const POSITIVE_REPLIES = ['yes', 'yeah', 'sure', 'interested', 'yep', 'ok', 'okay', '1', 'haan', 'ha'];
export const NEGATIVE_REPLIES = ['no', 'nope', 'pass', 'stop', 'busy', 'not interested', '2', 'nahi', 'na'];
