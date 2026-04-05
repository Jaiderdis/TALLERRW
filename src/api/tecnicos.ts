import api from './config';
import { ApiResponse, Tecnico } from '../types';
import { AxiosResponse } from 'axios';

export const obtenerTecnicos = async (): Promise<AxiosResponse<ApiResponse<Tecnico[]>>> => {
  return api.get('/tecnicos');
};