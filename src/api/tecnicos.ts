import api from './config';
import { ApiResponse, Tecnico } from '../types';

export const obtenerTecnicos = async (): Promise<ApiResponse<Tecnico[]>> => {
  const response = await api.get('/tecnicos');
  return response.data;
};