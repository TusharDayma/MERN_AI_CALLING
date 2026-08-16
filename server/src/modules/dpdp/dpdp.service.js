import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, CONSENT_STATUS, DPDP_ACTIONS, DPDP_CHANNELS } from '../../config/constants.js';

/**
 * Logs a DPDP Compliance event in the immutable audit log table.
 */
export const logDpdpAction = async ({
  candidateId = null,
  candidatePhone = null,
  action,
  channel = DPDP_CHANNELS.WHATSAPP,
  details = '',
  ipAddress = null
}) => {
  try {
    return await prisma.dpdpAuditLog.create({
      data: {
        candidate_id: candidateId,
        candidate_phone: candidatePhone,
        action,
        channel,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ip_address: ipAddress
      }
    });
  } catch (err) {
    console.error('[DPDP Service] Failed to write DPDP audit log:', err);
    return null;
  }
};

/**
 * Records explicit candidate consent according to DPDP Section 6.
 */
export const recordCandidateConsent = async (candidateId, channel = DPDP_CHANNELS.WHATSAPP, ipAddress = null) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId }
  });

  if (!candidate) {
    throw new Error(`Candidate with id ${candidateId} not found`);
  }

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      dpdp_consent_given: true,
      dpdp_consent_at: new Date(),
      dpdp_consent_channel: channel,
      consent_status: CONSENT_STATUS.OPTED_IN
    }
  });

  await logDpdpAction({
    candidateId: candidate.id,
    candidatePhone: candidate.contact,
    action: DPDP_ACTIONS.CONSENT_GRANTED,
    channel,
    details: 'Candidate provided explicit consent for AI voice screening & evaluation under DPDP Act.',
    ipAddress
  });

  return updated;
};

/**
 * Implements DPDP Section 12 (Right to Erasure / Right to be Forgotten).
 * Anonymizes candidate PII, purges transcripts and evaluation dossiers immediately.
 */
export const executeRightToErasure = async (candidateIdentifier, channel = DPDP_CHANNELS.WHATSAPP, ipAddress = null) => {
  // Can be identified by ID or last 10 digits of phone number
  const candidate = await prisma.candidate.findFirst({
    where: {
      OR: [
        { id: candidateIdentifier },
        { contact: { contains: candidateIdentifier.slice(-10) } }
      ]
    }
  });

  if (!candidate) {
    console.warn(`[DPDP Erasure] No candidate found for identifier: ${candidateIdentifier}`);
    return { success: false, reason: 'Candidate not found' };
  }

  // Anonymize personal identifying information and purge transcripts/dossier
  const anonymizedMask = `[ANONYMIZED_DPDP_${candidate.id.slice(0, 8)}]`;

  const updated = await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      name: 'Anonymized Candidate',
      email: `${candidate.id.slice(0, 8)}@deleted.dpdp`,
      contact: '+910000000000',
      emp_details: anonymizedMask,
      dossier_json: JSON.stringify({
        erased: true,
        reason: 'Candidate exercised DPDP Right to Erasure (Section 12)',
        erased_at: new Date().toISOString()
      }),
      ai_score: null,
      magic_token: null,
      magic_token_expires_at: null,
      status: CANDIDATE_STATUS.DATA_ERASED_DPDP,
      consent_status: CONSENT_STATUS.OPTED_OUT,
      dpdp_consent_given: false,
      erasure_requested_at: new Date()
    }
  });

  await logDpdpAction({
    candidateId: candidate.id,
    candidatePhone: candidate.contact,
    action: DPDP_ACTIONS.RIGHT_TO_ERASURE_PURGED,
    channel,
    details: `Candidate PII, voice transcript, and AI dossier purged upon DPDP Right to Erasure request.`,
    ipAddress
  });

  console.log(`[DPDP Service] Candidate ${candidate.id} successfully erased under DPDP compliance.`);
  return { success: true, candidateId: candidate.id, message: 'Data purged successfully' };
};

/**
 * Retrieves DPDP audit trail logs for HR/Admin compliance reporting.
 */
export const getDpdpAuditTrail = async ({ limit = 50, action = null } = {}) => {
  const where = {};
  if (action) where.action = action;

  return await prisma.dpdpAuditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit
  });
};
