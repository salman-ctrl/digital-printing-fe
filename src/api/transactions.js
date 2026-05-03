import client from './client';

export const getAllTransactions = async () => {
  const response = await client.get('/transactions');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await client.get('/transactions/stats/dashboard');
  return response.data;
};

export const getWeeklySales = async (params) => {
  const response = await client.get('/transactions/sales/weekly', { params });
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await client.delete(`/transactions/${id}`);
  return response.data;
};

export const getTopProducts = async (limit = 500) => {
  const response = await client.get(`/transactions/products/top?limit=${limit}`);
  return response.data;
};

export const getProductTrend = async (params) => {
  const response = await client.get('/products/trend', { params });
  return response.data;
};