import api from './config';
import { ApiResponse, CatalogoServicio } from '../types';
import { AxiosResponse } from 'axios';

export const obtenerCatalogo = async (): Promise<AxiosResponse<ApiResponse<CatalogoServicio[]>>> => {
  return api.get('/catalogo');
};