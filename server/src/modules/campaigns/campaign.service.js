import prisma from '../../../config/db.js';
import { dispatchExotelCall } from '../telephony/telephony.service.js';

export const getHRMetrics = async (hrId) => {
  const totalCampaigns = await prisma.campaign.count({ where: { created_by_hr_id: hrId } });
  const activeCampaigns = await prisma.campaign.count({ where: { created_by_hr_id: hrId, status: 'ACTIVE' } });
  const screenedCandidates = await prisma.candidate.count({
    where: { campaign: { created_by_hr_id: hrId }, status: { in: ['SCREENED', 'COMPLETED'] } }
  });

  return { totalCampaigns, activeCampaigns, screenedCandidates };
};

export const getJobRoles = async () => {
  return await prisma.jobRole.findMany({
    orderBy: { title: 'asc' }
  });
};

export const createJobRole = async (userId, { title, department, description }) => {
  return await prisma.jobRole.create({
    data: {
      title,
      department,
      description,
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
  return await prisma.campaign.findMany({
    where: { created_by_hr_id: hrId },
    include: {
      jobRole: true,
      _count: {
        select: { candidates: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });
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

export const launchCampaign = async (campaignId) => {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'ACTIVE' }
  });

  const candidates = await prisma.candidate.findMany({
    where: { campaign_id: campaignId }
  });

  console.log(`[Campaign Service] Launching campaign ${campaignId}. Dispatching voice calls to ${candidates.length} candidate(s)...`);

  for (const candidate of candidates) {
    try {
      await dispatchExotelCall(candidate.id);
    } catch (err) {
      console.error(`[Campaign Service] Failed to dispatch voice call to candidate ${candidate.id}:`, err);
    }
  }

  return { message: 'Campaign launched. Voice calls dispatched to candidates.' };
};

export const updateCampaignStatus = async (hrId, campaignId, status) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, created_by_hr_id: hrId }
  });

  if (!campaign) {
    const error = new Error('Campaign not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  if (status === 'ACTIVE' && campaign.status !== 'ACTIVE') {
    return await launchCampaign(campaignId);
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

  // Transaction ensures we delete child records first to avoid foreign key constraint failures
  await prisma.$transaction([
    prisma.question.deleteMany({ where: { campaign_id: campaignId } }),
    prisma.candidate.deleteMany({ where: { campaign_id: campaignId } }),
    prisma.campaign.delete({ where: { id: campaignId } })
  ]);

  return { message: 'Campaign deleted successfully' };
};
