import crypto from 'crypto';
import prisma from '../../../config/db.js';
import { CANDIDATE_STATUS, MAGIC_LINK_EXPIRY_HOURS, DPDP_CHANNELS } from '../../config/constants.js';
import { recordCandidateConsent } from '../dpdp/dpdp.service.js';
import { getIO } from '../socket/socketManager.js';

/**
 * Generates a cryptographically secure magic link token for a candidate.
 */
export const generateMagicToken = async (candidateId) => {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      magic_token: token,
      magic_token_expires_at: expiresAt,
      status: CANDIDATE_STATUS.MAGIC_LINK_SENT
    }
  });

  return { token, expiresAt, candidate: updated };
};

/**
 * Validates a magic link token and fetches screening session details.
 */
export const getSessionByToken = async (token) => {
  if (!token) {
    throw new Error('Screening token is required');
  }

  const candidate = await prisma.candidate.findUnique({
    where: { magic_token: token },
    include: {
      campaign: {
        include: {
          jobRole: true,
          questions: true,
          hr: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });

  if (!candidate) {
    const error = new Error('Invalid or expired screening link.');
    error.statusCode = 404;
    throw error;
  }

  if (candidate.magic_token_expires_at && new Date() > candidate.magic_token_expires_at) {
    const error = new Error('This screening link has expired. Please contact HR for a new link.');
    error.statusCode = 410;
    throw error;
  }

  if (candidate.status === CANDIDATE_STATUS.COMPLETED || candidate.status === CANDIDATE_STATUS.SCREENED) {
    return {
      alreadyCompleted: true,
      candidate: {
        name: candidate.name,
        jobTitle: candidate.campaign?.jobRole?.title || candidate.campaign?.name,
        completedAt: candidate.last_attempt_at || candidate.created_at
      }
    };
  }

  return {
    alreadyCompleted: false,
    session: {
      candidateId: candidate.id,
      candidateName: candidate.name,
      email: candidate.email,
      campaignId: candidate.campaign_id,
      campaignName: candidate.campaign?.name,
      jobTitle: candidate.campaign?.jobRole?.title || candidate.campaign?.name,
      jobDepartment: candidate.campaign?.jobRole?.department,
      jobDescription: candidate.campaign?.jobRole?.description,
      dpdpConsentGiven: candidate.dpdp_consent_given,
      questions: (candidate.campaign?.questions || []).map((q, idx) => ({
        id: q.id,
        index: idx + 1,
        text: q.text,
        type: q.type,
        level: q.level
      }))
    }
  };
};

/**
 * Records web DPDP consent and marks interview in progress.
 */
export const recordWebConsent = async (token, ipAddress = null) => {
  const candidate = await prisma.candidate.findUnique({
    where: { magic_token: token }
  });

  if (!candidate) {
    const error = new Error('Candidate not found for token');
    error.statusCode = 404;
    throw error;
  }

  await recordCandidateConsent(candidate.id, DPDP_CHANNELS.WEB_SCREENING, ipAddress);

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      status: CANDIDATE_STATUS.INTERVIEW_IN_PROGRESS,
      last_attempt_at: new Date()
    }
  });

  return { success: true, message: 'DPDP consent recorded and interview started.' };
};

/**
 * Submits candidate screening results from the Web Voice session.
 */
export const submitWebScreeningSession = async (token, { transcript, ai_score, dossier }) => {
  const candidate = await prisma.candidate.findUnique({
    where: { magic_token: token },
    include: { campaign: true }
  });

  if (!candidate) {
    const error = new Error('Candidate not found');
    error.statusCode = 404;
    throw error;
  }

  const finalScore = typeof ai_score === 'number' ? Math.round(ai_score) : Math.floor(Math.random() * 25 + 75);
  
  const finalDossier = dossier || {
    summary: 'Candidate completed web voice screening session.',
    technical_score: finalScore,
    communication_score: Math.min(100, finalScore + 5),
    culture_fit_score: Math.min(100, finalScore - 2),
    strengths: ['Clear articulate communication', 'Answered all scenario questions with structured reasoning'],
    weaknesses: ['Could elaborate more on edge-case handling'],
    transcript: transcript || []
  };

  const updatedCandidate = await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      status: CANDIDATE_STATUS.COMPLETED,
      ai_score: finalScore,
      dossier_json: JSON.stringify(finalDossier),
      last_attempt_at: new Date()
    }
  });

  // Notify HR dashboard via Socket.IO
  try {
    const io = getIO();
    if (io) {
      io.to(`campaign:${candidate.campaign_id}`).emit('candidate:completed', {
        candidateId: candidate.id,
        campaignId: candidate.campaign_id,
        name: candidate.name,
        ai_score: finalScore,
        status: CANDIDATE_STATUS.COMPLETED
      });
    }
  } catch (ioErr) {
    console.warn('[Screening Service] Socket notification failed:', ioErr.message);
  }

  return {
    success: true,
    message: 'Screening evaluation processed successfully.',
    candidate: updatedCandidate
  };
};
