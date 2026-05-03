import client from './client';

export const loginUser = async (credentials) => {
  const response = await client.post('/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await client.post('/auth/logout');
  return response.data;
};