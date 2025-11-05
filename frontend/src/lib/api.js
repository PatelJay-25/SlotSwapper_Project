import axios from 'axios';
import { API_BASE_URL, authHeader } from './auth.js';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  config.headers = {
    ...(config.headers || {}),
    ...authHeader()
  };
  return config;
});

export default api;

