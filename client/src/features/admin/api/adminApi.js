import { apiClient } from '../../../shared/api/apiClient';

export const getAdminMetrics = async () => {
  const response = await apiClient.get('/admin/metrics');
  return response.data;
};

export const getHRUsers = async () => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};

export const createHRUser = async (userData) => {
  const response = await apiClient.post('/admin/users', userData);
  return response.data;
};

export const toggleUserStatus = async (userId) => {
  const response = await apiClient.patch(`/admin/users/${userId}/status`);
  return response.data;
};

export const deleteUser = async (userId, hardDelete = false) => {
  const response = await apiClient.delete(`/admin/users/${userId}`, { data: { hardDelete } });
  return response.data;
};

export const getAdminNotifications = async () => {
  const response = await apiClient.get('/admin/notifications');
  return response.data;
};

export const resolvePasswordReset = async (resetId, tempPassword) => {
  const response = await apiClient.post(`/admin/notifications/${resetId}/resolve`, { tempPassword });
  return response.data;
};
