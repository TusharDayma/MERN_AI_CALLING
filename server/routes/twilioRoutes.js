import express from 'express';
import prisma from '../config/db.js';

const router = express.Router();

/** Escape special XML characters so JSON can be safely embedded in a TwiML attribute value. */
const xmlEscape = (str) =>
  String(str || '')
    .replace(/&/g,  '&amp;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');

// @desc Generate TwiML for outbound calls
// @route POST /api/twilio/twiml
// @access Public (called by Twilio webhook)
router.post('/twiml', async (req, res) => {
  const { candidateId } = req.query;

  // ── Fetch the campaign's screening questions from the DB ──────────────────
  let questionsJson = '[]';
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        campaign: {
          include: { questions: true }
        }
      }
    });

    const qs = candidate?.campaign?.questions || [];
    if (qs.length > 0) {
      // Pass only the fields the Python agent needs
      questionsJson = JSON.stringify(
        qs.map(q => ({
          text:         q.text,
          key_criteria: q.key_criteria || '',
          category:     q.type         || 'Pre-Screening'
        }))
      );
    }
  } catch (e) {
    console.error('[TwiML] Error fetching questions for stream:', e.message);
  }

  const websocketUrl = process.env.NGROK_PYTHON_URL || 'wss://placeholder-ngrok.ngrok.io/media-stream';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${websocketUrl}">
      <Parameter name="candidateId"   value="${xmlEscape(candidateId || '')}" />
      <Parameter name="questionsJson" value="${xmlEscape(questionsJson)}" />
    </Stream>
  </Connect>
</Response>`.trim();

  res.type('text/xml');
  res.send(twiml);
});

export default router;
