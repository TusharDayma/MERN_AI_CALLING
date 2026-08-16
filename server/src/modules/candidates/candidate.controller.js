import * as candidateService from './candidate.service.js';
import * as telephonyService from '../telephony/telephony.service.js';
import { z } from 'zod';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { getIO } from '../socket/socketManager.js';

// ─── Contact validation helper ────────────────────────────────────────────────
// Accepts: E.164 (+919876543210), local 10-digit (9876543210), or with prefix (09876543210)
const normaliseContact = (val) => {
  if (!val) return '+910000000000';
  // Strip all non-digit characters for length check
  const digits = String(val).replace(/\D/g, '');
  // If 10-digit Indian number (no country code), prepend +91
  if (digits.length === 10) return `+91${digits}`;
  // If 11-digit with leading 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  // If 12-digit with 91 prefix
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  // If starts with +, return cleaned string
  if (String(val).startsWith('+')) return `+${digits}`;
  return digits.length >= 8 ? `+91${digits}` : val;
};

const contactSchema = z
  .string()
  .transform(normaliseContact)
  .refine((val) => {
    try {
      if (isValidPhoneNumber(val)) return true;
    } catch (_) {}
    // Fallback tolerance for test numbers with 10+ digits
    const digits = val.replace(/\D/g, '');
    return digits.length >= 10;
  }, {
    message: 'Invalid phone number — please enter a 10-digit mobile number (e.g. 9876543210)',
  })
  .transform((val) => {
    try {
      if (isValidPhoneNumber(val)) {
        return parsePhoneNumber(val).format('E.164');
      }
    } catch (_) {}
    const digits = val.replace(/\D/g, '');
    return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
  });

const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format').or(z.string().min(3)),
  contact: contactSchema,
  emp_details: z.string().optional()
});

const importCandidatesSchema = z.object({
  candidates: z.array(candidateSchema).min(1, 'At least one candidate is required')
});

export const importCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = importCandidatesSchema.parse(req.body);
    const result = await candidateService.importCandidates(id, validatedData.candidates);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedDetails = err.errors.map(e => {
        const field = e.path.length > 0 ? `Candidate #${(e.path[1] ?? 0) + 1} (${e.path[e.path.length - 1]})` : 'Field';
        return `${field}: ${e.message}`;
      });
      return res.status(400).json({ 
        error: 'Validation Failed', 
        details: formattedDetails 
      });
    }
    console.error('Add candidates error:', err);
    res.status(500).json({ error: 'Failed to import candidates' });
  }
};

export const getCandidateRankings = async (req, res) => {
  try {
    const { campaignId, search, sortBy } = req.query;
    const rankings = await candidateService.getCandidateRankings(req.user.id, { campaignId, search, sortBy });
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

    const updated = await candidateService.updateCandidateResults(candidate_id, {
      ai_score,
      dossier_json,
      status: status || 'COMPLETED'
    });

    // ── Emit live update to campaign room ──────────────────────────────────
    if (updated?.campaign_id) {
      try {
        const io = getIO();
        io.to(`campaign:${updated.campaign_id}`).emit('candidate:updated', {
          candidateId: candidate_id,
          status: updated.status,
          ai_score: updated.ai_score
        });
      } catch (e) {
        console.warn('[Webhook] Socket.IO emit skipped:', e.message);
      }
    }

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

export const retryCall = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await telephonyService.dispatchExotelCall(id);
    res.status(200).json(result);
  } catch (err) {
    console.error('Retry call error:', err);
    res.status(500).json({ error: err.message || 'Failed to retry call' });
  }
};

export const sendCandidateInvites = async (req, res) => {
  try {
    const { id } = req.params;
    const { dispatchParallelCandidateOutreach } = await import('../campaigns/campaign.service.js');
    const result = await dispatchParallelCandidateOutreach(id);
    res.status(200).json({ success: true, message: 'Parallel Email & WhatsApp invitations dispatched', result });
  } catch (err) {
    console.error('Send candidate invites error:', err);
    res.status(500).json({ error: err.message || 'Failed to send candidate invitations' });
  }
};
