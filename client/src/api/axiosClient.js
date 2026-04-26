import axios from 'axios';
import { AUTH_STORAGE_KEY, clearStoredAuth } from '../auth/authStorage';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

axiosClient.interceptors.request.use((config) => {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (rawValue) {
    try {
      const storedAuth = JSON.parse(rawValue);
      if (storedAuth?.token) {
        config.headers.Authorization = `Bearer ${storedAuth.token}`;
      }
    } catch {
      clearStoredAuth();
    }
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      window.dispatchEvent(new Event('aasapure:logout'));
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
