import prisma from '../../../config/db.js';

export const importCandidates = async (campaignId, candidatesList) => {
  const created = await prisma.candidate.createMany({
    data: candidatesList.map(c => ({
      name: (c.name || '').trim(),
      email: (c.email || '').trim().toLowerCase(),
      contact: (c.contact || '').trim(),
      emp_details: (c.emp_details || '').trim(),
      campaign_id: campaignId
    }))
  });

  return { message: `${created.count} candidates imported successfully.`, count: created.count };
};

export const getCandidateRankings = async (hrId, filters = {}) => {
  const { campaignId, search, sortBy } = filters;

  const where = {
    status: { in: ['COMPLETED', 'SCREENED', 'INTEREST_DECLINED'] },
    campaign: { created_by_hr_id: hrId }
  };

  if (campaignId) {
    where.campaign_id = campaignId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } }
    ];
  }

  const orderBy = sortBy === 'score_high'
    ? { ai_score: 'desc' }
    : { campaign: { created_at: 'desc' } };

  const candidates = await prisma.candidate.findMany({
    where,
    include: {
      campaign: {
        include: { jobRole: true }
      }
    },
    orderBy
  });

  return candidates.map(c => {
    let dossier = null;
    if (c.dossier_json) {
      try {
        dossier = typeof c.dossier_json === 'string' ? JSON.parse(c.dossier_json) : c.dossier_json;
      } catch (e) {
        console.error('[Candidate Service] Failed to parse dossier JSON', e);
      }
    }
    return { ...c, dossier_json: dossier };
  });
};

export const updateCandidateResults = async (candidateId, { ai_score, dossier_json, status }) => {
  const existing = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!existing) {
    console.warn(`[Candidate Service] Candidate '${candidateId}' not found — skipping update (likely a test session).`);
    return null;
  }

  return await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      ai_score: ai_score,
      dossier_json: JSON.stringify(dossier_json),
      status: status || 'COMPLETED'
    }
  });
};

export const updateCandidateScore = async (candidateId, newScore) => {
  return await prisma.candidate.update({
    where: { id: candidateId },
    data: { ai_score: newScore }
  });
};
