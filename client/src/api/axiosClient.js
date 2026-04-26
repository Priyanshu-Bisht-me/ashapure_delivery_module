import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

export default axiosClient;
