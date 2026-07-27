import express from 'express';
import { signup, signin, forgotPassword, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/forgot-password', forgotPassword);
router.put('/profile', verifyToken, updateProfile);

export default router;
