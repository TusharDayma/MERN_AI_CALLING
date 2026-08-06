import * as campaignService from './campaign.service.js';

export const getHRMetrics = async (req, res) => {
  try {
    const metrics = await campaignService.getHRMetrics(req.user.id);
    res.status(200).json(metrics);
  } catch (err) {
    console.error('[CampaignController] getHRMetrics error:', err);
    res.status(500).json({ error: 'Failed to fetch HR metrics' });
  }
};

export const getJobRoles = async (req, res) => {
  try {
    const roles = await campaignService.getJobRoles();
    res.status(200).json(roles);
  } catch (err) {
    console.error('[CampaignController] getJobRoles error:', err);
    res.status(500).json({ error: 'Failed to fetch job roles' });
  }
};

export const createJobRole = async (req, res) => {
  try {
    const role = await campaignService.createJobRole(req.user.id, req.body);
    res.status(201).json(role);
  } catch (err) {
    console.error('[CampaignController] createJobRole error:', err);
    res.status(500).json({ error: 'Failed to create job role' });
  }
};

export const updateJobRole = async (req, res) => {
  try {
    const role = await campaignService.updateJobRole(req.params.id, req.body);
    res.status(200).json(role);
  } catch (err) {
    console.error('[CampaignController] updateJobRole error:', err);
    res.status(500).json({ error: 'Failed to update job role' });
  }
};

export const deleteJobRole = async (req, res) => {
  try {
    await campaignService.deleteJobRole(req.params.id);
    res.status(200).json({ message: 'Job role deleted successfully' });
  } catch (err) {
    console.error('[CampaignController] deleteJobRole error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete job role' });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const campaign = await campaignService.createCampaign(req.user.id, req.body);
    res.status(201).json(campaign);
  } catch (err) {
    console.error('[CampaignController] createCampaign error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await campaignService.getCampaignsByHR(req.user.id);
    res.status(200).json(campaigns);
  } catch (err) {
    console.error('[CampaignController] getCampaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

export const getCampaignDetails = async (req, res) => {
  try {
    const campaign = await campaignService.getCampaignById(req.user.id, req.params.id);
    res.status(200).json(campaign);
  } catch (err) {
    console.error('[CampaignController] getCampaignDetails error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch campaign details' });
  }
};

export const addQuestions = async (req, res) => {
  try {
    const result = await campaignService.addCampaignQuestions(req.params.id, req.body.questions || []);
    res.status(201).json(result);
  } catch (err) {
    console.error('[CampaignController] addQuestions error:', err);
    res.status(500).json({ error: 'Failed to add questions to campaign' });
  }
};

export const launchCampaign = async (req, res) => {
  try {
    const result = await campaignService.launchCampaign(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    console.error('[CampaignController] launchCampaign error:', err);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
};

export const updateCampaignStatus = async (req, res) => {
  try {
    const result = await campaignService.updateCampaignStatus(req.user.id, req.params.id, req.body.status);
    res.status(200).json(result);
  } catch (err) {
    console.error('[CampaignController] updateCampaignStatus error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update campaign status' });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const result = await campaignService.deleteCampaign(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    console.error('[CampaignController] deleteCampaign error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete campaign' });
  }
};
