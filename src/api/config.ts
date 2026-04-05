import axios, { AxiosResponse } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:35373/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      // La API respondió con 4xx o 5xx — es un error controlado
      return Promise.resolve(error.response);
    }
    // Sin respuesta — error de red real (sin internet, servidor caído)
    return Promise.reject(error);
  }
);

export default api;