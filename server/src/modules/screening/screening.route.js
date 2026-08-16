import express from 'express';
import { getScreeningSession, recordConsent, submitScreening } from './screening.controller.js';

const router = express.Router();

// Candidate public magic link endpoints (token-protected)
router.get('/:token', getScreeningSession);
router.post('/:token/consent', recordConsent);
router.post('/:token/submit', submitScreening);

export default router;
