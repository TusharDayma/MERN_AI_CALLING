import express from 'express';
import { checkEmailStatus, sendCandidateInvite } from './email.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import { requireRole } from '../../../middleware/roleMiddleware.js';

const router = express.Router();

// HR and Admin can check email SMTP configuration
router.get('/status', verifyToken, checkEmailStatus);

// HR can send or resend an email invitation to a specific candidate
router.post('/send-invite/:candidateId', verifyToken, requireRole('ADMIN', 'HR'), sendCandidateInvite);

export default router;
