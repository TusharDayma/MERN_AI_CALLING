import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { 
  getMetrics, 
  getHRUsers, 
  toggleUserStatus, 
  deleteUser, 
  createHRUser,
  getNotifications,
  resolvePasswordReset
} from '../controllers/adminController.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(verifyToken);
router.use(requireRole('ADMIN'));

router.get('/metrics', getMetrics);
router.get('/users', getHRUsers);
router.post('/users', createHRUser);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

router.get('/notifications', getNotifications);
router.post('/notifications/:id/resolve', resolvePasswordReset);

export default router;
