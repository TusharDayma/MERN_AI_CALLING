import * as emailService from './email.service.js';

export const checkEmailStatus = async (req, res) => {
  try {
    const status = await emailService.verifyEmailConfiguration();
    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const sendCandidateInvite = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const result = await emailService.sendCandidateScreeningEmail(candidateId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Email Controller] Error sending candidate email:', error);
    return res.status(500).json({ error: error.message });
  }
};
