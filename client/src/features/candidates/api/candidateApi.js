import { apiClient } from '../../../shared/api/apiClient';

export const getCandidateRankings = async () => {
  const response = await apiClient.get('/hr/candidates/rankings');
  return response.data;
};

export const importCandidates = async (campaignId, candidates) => {
  const response = await apiClient.post(`/hr/candidates/campaigns/${campaignId}/candidates`, { candidates });
  return response.data;
};
