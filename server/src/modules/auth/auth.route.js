import express from 'express';
import * as authController from './auth.controller.js';
import { verifyToken } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/forgot-password', authController.forgotPassword);
router.put('/profile', verifyToken, authController.updateProfile);
router.get('/profile', verifyToken, authController.getProfile);
router.post('/upgrade', verifyToken, authController.upgradeAccount);

export default router;
