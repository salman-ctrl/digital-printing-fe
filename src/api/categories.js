import client from './client';

export const getAllCategories = async (params = {}) => {
    const response = await client.get('/categories', { params });
    return response.data;
};

export const getCategoryById = async (id) => {
    const response = await client.get(`/categories/${id}`);
    return response.data;
};

export const createCategory = async (data) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };
    const response = await client.post('/categories', data, config);
    return response.data;
};

export const updateCategory = async (id, data) => {
    const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };
    const response = await client.put(`/categories/${id}`, data, config);
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await client.delete(`/categories/${id}`);
    return response.data;
};

