import * as screeningService from './screening.service.js';

export const getScreeningSession = async (req, res) => {
  try {
    const { token } = req.params;
    const session = await screeningService.getSessionByToken(token);
    return res.status(200).json(session);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
};

export const recordConsent = async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
    const result = await screeningService.recordWebConsent(token, ipAddress);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
};

export const submitScreening = async (req, res) => {
  try {
    const { token } = req.params;
    const { transcript, ai_score, dossier } = req.body;
    const result = await screeningService.submitWebScreeningSession(token, {
      transcript,
      ai_score,
      dossier
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
};
