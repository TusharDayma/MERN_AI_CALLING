import express from 'express';
import { getAuditLogs, requestErasure } from './dpdp.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import { requireRole } from '../../../middleware/roleMiddleware.js';

const router = express.Router();

// HR and Admin can view DPDP compliance logs
router.get('/audit-logs', verifyToken, requireRole('ADMIN', 'HR'), getAuditLogs);

// HR or Admin can manually trigger Right to Erasure on request
router.post('/erase-candidate/:candidateId', verifyToken, requireRole('ADMIN', 'HR'), requestErasure);

export default router;
