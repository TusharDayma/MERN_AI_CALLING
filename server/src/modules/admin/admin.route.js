import express from 'express';
import * as adminController from './admin.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';
import { requireRole } from '../../../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('ADMIN'));

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.getHRUsers);
router.post('/users', adminController.createHRUser);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

router.get('/notifications', adminController.getNotifications);
router.post('/notifications/:id/resolve', adminController.resolvePasswordReset);

export default router;
