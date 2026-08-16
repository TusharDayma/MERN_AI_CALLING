import express from 'express';
import * as candidateController from './candidate.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import { requireRole } from '../../../middleware/roleMiddleware.js';

const router = express.Router();

// Private HR candidate rankings route
router.get('/rankings', verifyToken, requireRole('HR'), candidateController.getCandidateRankings);
router.get('/', verifyToken, requireRole('HR'), candidateController.getCandidateRankings);

// Candidate import route under campaign
router.post('/campaigns/:id/candidates', verifyToken, requireRole('HR'), candidateController.importCandidates);

// Candidate score override
router.patch('/:id/score', verifyToken, requireRole('HR'), candidateController.updateCandidateScore);

// Priority 7 — Retry a call for a specific candidate (Last resort fallback)
router.post('/:id/retry-call', verifyToken, requireRole('HR'), candidateController.retryCall);

// Send or resend parallel Email + WhatsApp outreach invitations
router.post('/:id/send-invites', verifyToken, requireRole('HR'), candidateController.sendCandidateInvites);

export default router;
