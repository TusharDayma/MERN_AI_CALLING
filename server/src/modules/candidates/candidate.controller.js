import * as candidateService from './candidate.service.js';

export const importCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidates } = req.body;
    const result = await candidateService.importCandidates(id, candidates || []);
    res.status(201).json(result);
  } catch (err) {
    console.error('Add candidates error:', err);
    res.status(500).json({ error: 'Failed to import candidates' });
  }
};

export const getCandidateRankings = async (req, res) => {
  try {
    const rankings = await candidateService.getCandidateRankings(req.user.id);
    res.status(200).json(rankings);
  } catch (error) {
    console.error('Candidate rankings error:', error);
    res.status(500).json({ error: 'Failed to fetch candidate rankings' });
  }
};

export const handleCallCompletedWebhook = async (req, res) => {
  try {
    const { candidate_id, ai_score, dossier_json, status } = req.body;

    if (!candidate_id) {
      return res.status(400).json({ success: false, error: 'candidate_id is required' });
    }

    await candidateService.updateCandidateResults(candidate_id, {
      ai_score,
      dossier_json,
      status: status || 'COMPLETED'
    });

    console.log(`[Webhook] Candidate ${candidate_id} results updated successfully (Score: ${ai_score})`);
    res.status(200).json({ success: true, message: 'Candidate results updated successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Failed to update candidate results' });
  }
};
