import api from './config';
import { ApiResponse, Empresa } from '../types';

export const obtenerEmpresas = async (): Promise<ApiResponse<Empresa[]>> => {
  const response = await api.get('/empresas');
  return response.data;
};
