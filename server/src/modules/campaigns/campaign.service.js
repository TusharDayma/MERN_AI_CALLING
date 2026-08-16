import prisma from '../../../config/db.js';
import { dispatchExotelCall } from '../telephony/telephony.service.js';
import { sendInitialWhatsAppInvite } from '../twilio/twilio.service.js';
import { sendCandidateScreeningEmail } from '../email/email.service.js';

export const getHRMetrics = async (hrId) => {
  const totalCampaigns = await prisma.campaign.count({ where: { created_by_hr_id: hrId } });
  const activeCampaigns = await prisma.campaign.count({ where: { created_by_hr_id: hrId, status: 'ACTIVE' } });
  const screenedCandidates = await prisma.candidate.count({
    where: { campaign: { created_by_hr_id: hrId }, status: { in: ['SCREENED', 'COMPLETED'] } }
  });

  // Priority 6 — Analytics: status counts, avg score, score buckets
  const allCandidates = await prisma.candidate.findMany({
    where: { campaign: { created_by_hr_id: hrId } },
    select: { status: true, ai_score: true }
  });

  const statusCounts = {};
  let scoreSum = 0;
  let scoreCount = 0;
  const scoreBuckets = { low: 0, mid: 0, high: 0 }; // 0-40 / 40-70 / 70-100

  for (const c of allCandidates) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    if (c.ai_score !== null && c.ai_score !== undefined) {
      scoreSum += c.ai_score;
      scoreCount++;
      if (c.ai_score < 40) scoreBuckets.low++;
      else if (c.ai_score < 70) scoreBuckets.mid++;
      else scoreBuckets.high++;
    }
  }

  const avgScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

  return { totalCampaigns, activeCampaigns, screenedCandidates, statusCounts, avgScore, scoreBuckets };
};

export const getJobRoles = async () => {
  return await prisma.jobRole.findMany({
    orderBy: { title: 'asc' }
  });
};

export const createJobRole = async (userId, { title, department, description, scoring_rubric }) => {
  const existing = await prisma.jobRole.findFirst({
    where: { title, department }
  });
  if (existing) {
    const error = new Error('A job role with this title and department already exists. Please edit it instead.');
    error.statusCode = 409;
    throw error;
  }

  return await prisma.jobRole.create({
    data: {
      title,
      department,
      description,
      scoring_rubric: scoring_rubric ? JSON.stringify(scoring_rubric) : null,
      created_by: userId
    }
  });
};

export const updateJobRole = async (roleId, { title, department, description }) => {
  return await prisma.jobRole.update({
    where: { id: roleId },
    data: { title, department, description }
  });
};

export const deleteJobRole = async (roleId) => {
  const count = await prisma.campaign.count({ where: { job_role_id: roleId } });
  if (count > 0) {
    const error = new Error('Cannot delete job role because it is associated with one or more campaigns.');
    error.statusCode = 400;
    throw error;
  }
  return await prisma.jobRole.delete({ where: { id: roleId } });
};

export const createCampaign = async (hrId, { name, location, job_role_id }) => {
  const existing = await prisma.campaign.findFirst({
    where: { name, created_by_hr_id: hrId }
  });
  if (existing) {
    const error = new Error('A campaign with this name already exists.');
    error.statusCode = 409;
    throw error;
  }

  return await prisma.campaign.create({
    data: {
      name,
      location,
      job_role_id,
      created_by_hr_id: hrId
    }
  });
};

export const getCampaignsByHR = async (hrId) => {
  const campaigns = await prisma.campaign.findMany({
    where: { created_by_hr_id: hrId },
    include: {
      jobRole: true,
      _count: {
        select: { candidates: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  const campaignIds = campaigns.map(c => c.id);
  if (campaignIds.length === 0) return campaigns;

  const aggregateCounts = await prisma.candidate.groupBy({
    by: ['campaign_id'],
    where: { campaign_id: { in: campaignIds }, status: 'COMPLETED' },
    _count: { campaign_id: true }
  });

  const completedMap = {};
  aggregateCounts.forEach(c => completedMap[c.campaign_id] = c._count.campaign_id);

  return campaigns.map(c => ({
    ...c,
    completed_candidates: completedMap[c.id] || 0
  }));
};

export const getCampaignById = async (hrId, campaignId) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, created_by_hr_id: hrId },
    include: {
      jobRole: true,
      questions: true,
      candidates: {
        orderBy: { ai_score: 'desc' }
      }
    }
  });

  if (!campaign) {
    const error = new Error('Campaign not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  return campaign;
};

export const addCampaignQuestions = async (campaignId, questions) => {
  return await prisma.$transaction(
    questions.map(q =>
      prisma.question.create({
        data: {
          campaign_id: campaignId,
          text: q.text,
          type: q.type || 'Technical',
          level: q.level || 'MEDIUM',
          key_criteria: q.key_criteria || '',
          expected_answer: q.expected_answer || ''
        }
      })
    )
  );
};

/**
 * Dispatches parallel messaging (Email + WhatsApp) simultaneously to a single candidate.
 */
export const dispatchParallelCandidateOutreach = async (candidateId) => {
  console.log(`[Omnichannel Engine] Dispatching PARALLEL Email + WhatsApp invites for candidate: ${candidateId}`);
  const [emailResult, waResult] = await Promise.allSettled([
    sendCandidateScreeningEmail(candidateId),
    sendInitialWhatsAppInvite(candidateId)
  ]);

  const emailSuccess = emailResult.status === 'fulfilled' && emailResult.value?.success;
  const waSuccess = waResult.status === 'fulfilled' && waResult.value?.success;

  if (emailResult.status === 'rejected') {
    console.error(`[Omnichannel Engine] Email dispatch rejected for candidate ${candidateId}:`, emailResult.reason);
  }
  if (waResult.status === 'rejected') {
    console.error(`[Omnichannel Engine] WhatsApp dispatch rejected for candidate ${candidateId}:`, waResult.reason);
  }

  return {
    candidateId,
    email: emailSuccess ? emailResult.value : { success: false, error: emailResult.reason?.message || emailResult.value?.error },
    whatsapp: waSuccess ? waResult.value : { success: false, error: waResult.reason?.message || waResult.value?.error }
  };
};

export const launchCampaign = async (campaignId, ttsVoice = 'en-US-AvaNeural') => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { candidates: true }
  });

  if (!campaign) {
    const error = new Error('Campaign not found');
    error.statusCode = 404;
    throw error;
  }

  const hr = await prisma.user.findUnique({
    where: { id: campaign.created_by_hr_id }
  });

  const candidatesCount = campaign.candidates.length;
  if (hr.credits_balance < candidatesCount) {
    const error = new Error(`Insufficient credits. You need ${candidatesCount} credits to launch this campaign, but you only have ${hr.credits_balance}.`);
    error.statusCode = 402;
    throw error;
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'ACTIVE' }
  });

  console.log(`[Campaign Service] Parallel Omnichannel Launch for Campaign ${campaignId}: Concurrently dispatching Email & WhatsApp to ${candidatesCount} candidate(s)...`);

  // Parallel outreach to all candidates simultaneously
  const dispatchPromises = campaign.candidates.map(candidate =>
    dispatchParallelCandidateOutreach(candidate.id)
  );

  const results = await Promise.allSettled(dispatchPromises);
  const successfulCount = results.filter(r => r.status === 'fulfilled').length;

  console.log(`[Campaign Service] Parallel invitations dispatched to ${successfulCount}/${candidatesCount} candidate(s). Voice calling held as last resort fallback.`);

  return {
    message: `Campaign launched successfully. Parallel Email and WhatsApp invitations dispatched to ${candidatesCount} candidates. Voice calling is reserved as last-resort fallback.`,
    totalCandidates: candidatesCount,
    dispatchedCount: successfulCount
  };
};

export const updateCampaignStatus = async (hrId, campaignId, status, ttsVoice = 'en-US-AvaNeural') => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, created_by_hr_id: hrId }
  });

  if (!campaign) {
    const error = new Error('Campaign not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  if (status === 'ACTIVE' && campaign.status !== 'ACTIVE') {
    return await launchCampaign(campaignId, ttsVoice);
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status }
  });

  return { message: `Campaign status updated to ${status}` };
};

export const deleteCampaign = async (hrId, campaignId) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, created_by_hr_id: hrId }
  });

  if (!campaign) {
    const error = new Error('Campaign not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { campaign_id: campaignId } }),
    prisma.candidate.deleteMany({ where: { campaign_id: campaignId } }),
    prisma.campaign.delete({ where: { id: campaignId } })
  ]);

  return { message: 'Campaign deleted successfully' };
};

// Priority 4 — CSV Export Data
export const exportCampaignData = async (hrId, campaignId) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, created_by_hr_id: hrId },
    include: {
      candidates: {
        orderBy: { ai_score: 'desc' }
      }
    }
  });

  if (!campaign) {
    const error = new Error('Campaign not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const rows = campaign.candidates.map(c => {
    let summary = '';
    let strengths = '';
    let weaknesses = '';
    if (c.dossier_json) {
      try {
        const d = typeof c.dossier_json === 'string' ? JSON.parse(c.dossier_json) : c.dossier_json;
        summary = d.summary || d.overall_summary || '';
        strengths = Array.isArray(d.strengths) ? d.strengths.join('; ') : (d.strengths || '');
        weaknesses = Array.isArray(d.weaknesses) ? d.weaknesses.join('; ') : (d.weaknesses || '');
      } catch { }
    }
    return { name: c.name, email: c.email, contact: c.contact, status: c.status, ai_score: c.ai_score, summary, strengths, weaknesses };
  });

  return { rows, campaignName: campaign.name };
};
