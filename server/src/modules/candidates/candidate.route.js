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

export default router;
