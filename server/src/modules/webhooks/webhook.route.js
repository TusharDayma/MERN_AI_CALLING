import express from 'express';
import { handleCallCompletedWebhook } from '../candidates/candidate.controller.js';

const router = express.Router();

// Centralized webhook routes
router.post('/call-completed', handleCallCompletedWebhook);

export default router;
