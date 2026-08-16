import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, WHATSAPP_TIMEOUT_MINUTES, MAX_CALL_ATTEMPTS, CALLING_HOURS_START, CALLING_HOURS_END, CALLING_TIMEZONE } from '../../config/constants.js';
// UPDATED: Using Exotel telephony service instead of deprecated Twilio module
import { dispatchExotelCall } from '../telephony/telephony.service.js';

let intervalId = null;

/**
 * Checks database for candidates who ignored BOTH Email and WhatsApp invitations past the timeout window,
 * and triggers voice calling strictly as a last resort.
 */
export const checkAndTriggerFallbackCalls = async ({ bypassCallingHours = false } = {}) => {
  try {
    // Calling hours guardrail check (e.g. 9 AM - 7 PM IST)
    const currentHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: CALLING_TIMEZONE,
        hour: 'numeric',
        hour12: false
      }).format(new Date()),
      10
    );

    if (!bypassCallingHours && (currentHour < CALLING_HOURS_START || currentHour >= CALLING_HOURS_END)) {
      console.log(`[Fallback Scheduler] Current hour (${currentHour}:00 IST) is outside allowed calling window (${CALLING_HOURS_START}:00 - ${CALLING_HOURS_END}:00). Skipping last-resort voice fallback.`);
      return;
    }

    const timeoutMs = WHATSAPP_TIMEOUT_MINUTES * 60 * 1000;
    const cutoffDate = new Date(Date.now() - timeoutMs);

    // Find candidates who received outreach > TIMEOUT minutes ago, and have ignored both channels
    const candidatesAwaitingIntervention = await prisma.candidate.findMany({
      where: {
        status: { in: [CANDIDATE_STATUS.WHATSAPP_SENT, CANDIDATE_STATUS.MAGIC_LINK_SENT, CANDIDATE_STATUS.VOICE_FALLBACK_DISPATCHED] },
        OR: [
          { whatsapp_sent_at: { lt: cutoffDate } },
          { email_sent_at: { lt: cutoffDate } }
        ],
        whatsapp_replied_at: null,
        dpdp_consent_given: false
      }
    });

    if (candidatesAwaitingIntervention.length > 0) {
      console.log(`[Fallback Scheduler] Found ${candidatesAwaitingIntervention.length} candidate(s) who ignored both Email & WhatsApp. Evaluating for last-resort voice calling...`);

      for (const candidate of candidatesAwaitingIntervention) {
        // Exclude candidates who engaged in any way
        if (candidate.whatsapp_status === 'REPLIED' || candidate.consent_status === 'OPTED_OUT' || candidate.status === CANDIDATE_STATUS.INTEREST_DECLINED) {
          continue;
        }

        if (candidate.call_attempts >= MAX_CALL_ATTEMPTS) {
          console.log(`[Fallback Scheduler] Candidate ${candidate.name} (${candidate.id}) reached maximum call attempts (${MAX_CALL_ATTEMPTS}). Marking as EXPIRED.`);
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: {
              status: CANDIDATE_STATUS.EXPIRED,
              last_attempt_at: new Date()
            }
          });
          continue;
        }

        console.log(`[Fallback Scheduler] [LAST-RESORT VOICE CALL] Both Email & WhatsApp were ignored for candidate ${candidate.name} (${candidate.id}). Dispatching voice fallback call (Attempt ${candidate.call_attempts + 1}/${MAX_CALL_ATTEMPTS})...`);
        
        // Mark fallback dispatched and increment retry attempt
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            status: CANDIDATE_STATUS.VOICE_FALLBACK_DISPATCHED,
            fallback_call_at: new Date(),
            call_attempts: { increment: 1 },
            last_attempt_at: new Date()
          }
        });

        // Trigger automated AI voice call
        await dispatchExotelCall(candidate.id, process.env.TTS_VOICE || 'en-US-AvaNeural', { bypassCallingHours });
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
