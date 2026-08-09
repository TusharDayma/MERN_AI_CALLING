import * as candidateService from './candidate.service.js';
import { z } from 'zod';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

const candidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format"),
  contact: z.string().refine((val) => isValidPhoneNumber(val), {
    message: "Invalid phone number format or region",
  }).transform((val) => parsePhoneNumber(val).format('E.164')),
  emp_details: z.string().optional()
});

const importCandidatesSchema = z.object({
  candidates: z.array(candidateSchema).min(1, "At least one candidate is required")
});
export const importCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = importCandidatesSchema.parse(req.body);
    const result = await candidateService.importCandidates(id, validatedData.candidates);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Failed', details: err.errors });
    }
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
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  const secret = req.headers['x-internal-webhook-secret'];
  
  if (expectedSecret && secret !== expectedSecret) {
    return res.status(403).json({ error: 'Forbidden: Invalid internal webhook secret' });
  }

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

export const updateCandidateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be a number between 0 and 100' });
    }
    
    const result = await candidateService.updateCandidateScore(id, score);
    res.status(200).json(result);
  } catch (err) {
    console.error('Update score error:', err);
    res.status(500).json({ error: 'Failed to update candidate score' });
  }
};
