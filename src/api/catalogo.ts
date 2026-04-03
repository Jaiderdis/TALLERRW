import api from './config';
import { ApiResponse, CatalogoServicio } from '../types';

export const obtenerCatalogo = async (): Promise<ApiResponse<CatalogoServicio[]>> => {
  const response = await api.get('/catalogo');
  return response.data;
};