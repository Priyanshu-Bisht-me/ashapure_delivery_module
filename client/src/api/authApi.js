import axiosClient from './axiosClient';

export const signupUser = async (payload) => {
  const response = await axiosClient.post('/auth/signup', payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await axiosClient.post('/auth/login', payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosClient.get('/auth/me');
  return response.data;
};
