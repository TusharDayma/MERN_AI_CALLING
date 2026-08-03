import * as campaignService from './campaign.service.js';

export const getHRMetrics = async (req, res) => {
  try {
    const metrics = await campaignService.getHRMetrics(req.user.id);
    res.status(200).json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch HR metrics' });
  }
};

export const getJobRoles = async (req, res) => {
  try {
    const roles = await campaignService.getJobRoles();
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job roles' });
  }
};

export const createJobRole = async (req, res) => {
  try {
    const role = await campaignService.createJobRole(req.user.id, req.body);
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job role' });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const campaign = await campaignService.createCampaign(req.user.id, req.body);
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await campaignService.getCampaignsByHR(req.user.id);
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

export const getCampaignDetails = async (req, res) => {
  try {
    const campaign = await campaignService.getCampaignById(req.user.id, req.params.id);
    res.status(200).json(campaign);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch campaign details' });
  }
};

export const addQuestions = async (req, res) => {
  try {
    const result = await campaignService.addCampaignQuestions(req.params.id, req.body.questions || []);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add questions to campaign' });
  }
};

export const launchCampaign = async (req, res) => {
  try {
    const result = await campaignService.launchCampaign(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const result = await campaignService.deleteCampaign(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete campaign' });
  }
};
