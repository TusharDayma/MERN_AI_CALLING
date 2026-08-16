import * as dpdpService from './dpdp.service.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { limit, action } = req.query;
    const logs = await dpdpService.getDpdpAuditTrail({
      limit: limit ? parseInt(limit, 10) : 50,
      action
    });
    return res.status(200).json(logs);
  } catch (error) {
    console.error('[DPDP Controller] Error fetching audit logs:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const requestErasure = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

    const result = await dpdpService.executeRightToErasure(
      candidateId,
      'HR_PORTAL',
      ipAddress
    );

    if (!result.success) {
      return res.status(404).json({ error: result.reason || 'Candidate not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[DPDP Controller] Error performing data erasure:', error);
    return res.status(500).json({ error: error.message });
  }
};
