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

export const getCandidateRankings = async (hrId) => {
  const candidates = await prisma.candidate.findMany({
    where: {
      status: { in: ['COMPLETED', 'SCREENED', 'INTEREST_DECLINED'] },
      campaign: {
        created_by_hr_id: hrId
      }
    },
    include: {
      campaign: {
        include: {
          jobRole: true
        }
      }
    },
    orderBy: {
      ai_score: 'desc'
    }
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
    return {
      ...c,
      dossier_json: dossier
    };
  });
};

export const updateCandidateResults = async (candidateId, { ai_score, dossier_json, status }) => {
  // Check if candidate exists first — test sessions (e.g. BROWSER_TEST) won't have a DB record
  const existing = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!existing) {
    console.warn(`[Candidate Service] Candidate '${candidateId}' not found in DB — skipping result update (likely a test session).`);
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
