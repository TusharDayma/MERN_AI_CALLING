import express from 'express';
import { handleCallCompletedWebhook } from '../candidates/candidate.controller.js';

const router = express.Router();

// Centralized webhook routes
router.post('/call-completed', handleCallCompletedWebhook);

// Exotel ExoML Webhook that builds the <Stream> XML logic and passes scoring rubrics
router.post('/exotel-answer', (req, res) => {
    const { candidateId, questionsJson, scoringRubric } = req.query;
    const botSocketUrl = process.env.BOT_WEBSOCKET_URL || 'wss://your-bot/media-stream';

    // Format the parameters to forward to the Python Engine
    const queryParams = new URLSearchParams();
    if (candidateId) queryParams.append('candidateId', candidateId);
    if (questionsJson) queryParams.append('questionsJson', questionsJson);
    if (scoringRubric) queryParams.append('scoring_rubric', scoringRubric);

    const fullWebSocketUrl = `${botSocketUrl}?${queryParams.toString()}`;

    const exoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${fullWebSocketUrl.replace(/&/g, '&amp;')}" />
  </Connect>
</Response>`;

    res.header('Content-Type', 'application/xml');
    res.send(exoml);
});

export default router;
