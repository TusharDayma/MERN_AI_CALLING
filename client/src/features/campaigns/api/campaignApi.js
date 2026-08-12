import { apiClient } from '../../../shared/api/apiClient';

export const getHRMetrics = async () => {
  const response = await apiClient.get('/hr/metrics');
  return response.data;
};

export const getJobRoles = async () => {
  const response = await apiClient.get('/hr/job-roles');
  return response.data;
};

export const createJobRole = async (roleData) => {
  const response = await apiClient.post('/hr/job-roles', roleData);
  return response.data;
};

export const getCampaigns = async () => {
  const response = await apiClient.get('/hr/campaigns');
  return response.data;
};

export const createCampaign = async (campaignData) => {
  const response = await apiClient.post('/hr/campaigns', campaignData);
  return response.data;
};

export const getCampaignDetails = async (campaignId) => {
  const response = await apiClient.get(`/hr/campaigns/${campaignId}`);
  return response.data;
};

export const addCampaignQuestions = async (campaignId, questions) => {
  const response = await apiClient.post(`/hr/campaigns/${campaignId}/questions`, { questions });
  return response.data;
};

export const launchCampaign = async (campaignId) => {
  // Read saved voice config from AgentStudio settings
  let ttsVoice = 'en-US-AvaNeural';
  try {
    const studioConfig = localStorage.getItem('antitalk_agent_studio_config');
    if (studioConfig) {
      const parsed = JSON.parse(studioConfig);
      if (parsed.selectedVoice) ttsVoice = parsed.selectedVoice;
    }
  } catch (_) {}

  const response = await apiClient.post(`/hr/campaigns/${campaignId}/launch`, { ttsVoice });
  return response.data;
};
