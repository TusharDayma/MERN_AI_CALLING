import { apiClient } from '../../../shared/api/apiClient';

export const signin = async (credentials) => {
  const response = await apiClient.post('/auth/signin', credentials);
  return response.data;
};

export const signup = async (userData) => {
  const response = await apiClient.post('/auth/signup', userData);
  return response.data;
};

export const forgotPassword = async (emailData) => {
  const response = await apiClient.post('/auth/forgot-password', emailData);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await apiClient.put('/auth/profile', profileData);
  return response.data;
};
