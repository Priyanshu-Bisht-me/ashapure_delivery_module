import axiosClient from './axiosClient';

export const getAnalytics = async () => {
  const response = await axiosClient.get('/analytics');
  return response.data;
};

export const getAssignedDeliveries = async () => {
  const response = await axiosClient.get('/deliveries');
  return response.data;
};

export const getDeliveryById = async (deliveryId) => {
  const response = await axiosClient.get(`/deliveries/${deliveryId}`);
  return response.data;
};

export const updateDeliveryStatus = async (deliveryId, payload) => {
  const requestBody = typeof payload === 'string' ? { status: payload } : payload;
  const response = await axiosClient.put(`/deliveries/${deliveryId}/status`, requestBody);
  return response.data;
};

export const getTodaySummary = async () => {
  const response = await axiosClient.get('/summary');
  return response.data;
};

export const getAdminAgents = async () => {
  const response = await axiosClient.get('/admin/agents');
  return response.data;
};

export const createAdminDelivery = async (payload) => {
  const response = await axiosClient.post('/admin/deliveries', payload);
  return response.data;
};

export const assignAdminDelivery = async (deliveryId, payload) => {
  const response = await axiosClient.patch(`/admin/deliveries/${deliveryId}/assign`, payload);
  return response.data;
};

export const cancelAdminDelivery = async (deliveryId) => {
  const response = await axiosClient.delete(`/admin/deliveries/${deliveryId}`);
  return response.data;
};
