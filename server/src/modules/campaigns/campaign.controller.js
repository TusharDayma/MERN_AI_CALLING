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

import { z } from 'zod';

const createCampaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters").max(100, "Campaign name cannot exceed 100 characters"),
  location: z.string().max(100, "Location cannot exceed 100 characters").optional(),
  job_role_id: z.string().uuid("Invalid job role ID format")
});

const questionSchema = z.object({
  text: z.string().min(5, "Question text must be at least 5 characters").max(400, "Question text cannot exceed 400 characters"),
  key_criteria: z.string().max(500).optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  level: z.string().optional()
});

const addQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1, "At least one question is required")
});

export const createCampaign = async (req, res) => {
  try {
    const validatedData = createCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(req.user.id, validatedData);
    res.status(201).json(campaign);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Failed', details: err.errors });
    }
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
    const validatedData = addQuestionsSchema.parse(req.body);
    const result = await campaignService.addCampaignQuestions(req.params.id, validatedData.questions);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Failed', details: err.errors });
    }
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

// Priority 4 — CSV Export
export const exportCampaignCSV = async (req, res) => {
  try {
    const { rows, campaignName } = await campaignService.exportCampaignData(req.user.id, req.params.id);
    const safeName = campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const csv = [
      ['Name', 'Email', 'Contact', 'Status', 'AI Score', 'Summary', 'Strengths', 'Weaknesses'].join(','),
      ...rows.map(r => [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.contact || '').replace(/"/g, '""')}"`,
        `"${(r.status || '').replace(/"/g, '""')}"`,
        r.ai_score ?? '',
        `"${(r.summary || '').replace(/"/g, '""')}"`,
        `"${(r.strengths || '').replace(/"/g, '""')}"`,
        `"${(r.weaknesses || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-rankings.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('[CampaignController] exportCampaignCSV error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to export campaign data' });
  }
};
