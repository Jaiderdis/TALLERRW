import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:35373/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para ver errores detallados
api.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error:', JSON.stringify(error.response?.data));
    console.log('Status:', error.response?.status);
    return Promise.reject(error);
  }
);

export default api;
