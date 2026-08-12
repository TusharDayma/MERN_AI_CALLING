import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, WHATSAPP_TIMEOUT_MINUTES } from '../../config/constants.js';
// UPDATED: Using Exotel telephony service instead of deprecated Twilio module
import { dispatchExotelCall } from '../telephony/telephony.service.js';

let intervalId = null;

/**
 * Checks database for candidates whose WhatsApp invitation timed out and triggers voice fallback.
 */
export const checkAndTriggerFallbackCalls = async () => {
  try {
    const timeoutMs = WHATSAPP_TIMEOUT_MINUTES * 60 * 1000;
    const cutoffDate = new Date(Date.now() - timeoutMs);

    // Find candidates who were sent WhatsApp > TIMEOUT minutes ago and haven't replied
    const staleCandidates = await prisma.candidate.findMany({
      where: {
        status: CANDIDATE_STATUS.WHATSAPP_SENT,
        whatsapp_sent_at: { lt: cutoffDate }
      }
    });

    if (staleCandidates.length > 0) {
      console.log(`[Fallback Scheduler] Found ${staleCandidates.length} candidate(s) timed out on WhatsApp. Initiating voice fallback...`);

      for (const candidate of staleCandidates) {
        console.log(`[Fallback Scheduler] Dispatching fallback voice call for ${candidate.name} (${candidate.id})`);
        
        // Mark fallback dispatched
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            status: CANDIDATE_STATUS.VOICE_FALLBACK_DISPATCHED,
            fallback_call_at: new Date()
          }
        });

        // Trigger Exotel outbound call (fallback when no WhatsApp reply) — use TTS_VOICE env or default
        await dispatchExotelCall(candidate.id, process.env.TTS_VOICE || 'en-US-AvaNeural');
      }
    }
  } catch (error) {
    console.error(`[Fallback Scheduler] Error running fallback check:`, error);
  }
};

/**
 * Starts the fallback background polling timer.
 */
export const startFallbackScheduler = (pollIntervalSeconds = 60) => {
  if (intervalId) return;
  console.log(`[Fallback Scheduler] Started background polling every ${pollIntervalSeconds}s (Timeout window: ${WHATSAPP_TIMEOUT_MINUTES} mins)`);
  intervalId = setInterval(checkAndTriggerFallbackCalls, pollIntervalSeconds * 1000);
};

/**
 * Stops the fallback background polling timer.
 */
export const stopFallbackScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log(`[Fallback Scheduler] Stopped.`);
  }
};
