import client from './client';

export const getAllCustomers = async () => {
  const response = await client.get('/customers');
  return response.data;
};

export const getCustomerStats = async () => {
  const response = await client.get('/customers/stats/summary');
  return response.data;
};


