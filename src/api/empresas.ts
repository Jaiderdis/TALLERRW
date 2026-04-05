import api from './config';
import { ApiResponse, Empresa } from '../types';
import { AxiosResponse } from 'axios';

export const obtenerEmpresas = async (): Promise<AxiosResponse<ApiResponse<Empresa[]>>> => {
  return api.get('/empresas');
};