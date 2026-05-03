import client from './client';

export const getAllProducts = async (params = {}) => {
  const response = await client.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await client.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await client.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await client.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await client.delete(`/products/${id}`);
  return response.data;
};

export const getProductCategories = async () => {
  const response = await client.get('/products/categories');
  return response.data;
};