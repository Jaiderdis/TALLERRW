import api from './config';
import { ApiResponse, Orden, CrearOrdenRequest } from '../types';
import { AxiosResponse } from 'axios';

export const crearOrden = async (
  data: CrearOrdenRequest
): Promise<AxiosResponse<ApiResponse<Orden>>> => {
  return api.post('/ordenes', data);
};

export const obtenerOrdenesHoy = async (): Promise<AxiosResponse<ApiResponse<Orden[]>>> => {
  return api.get('/ordenes/hoy');
};

export const obtenerOrdenesPendientes = async (): Promise<AxiosResponse<ApiResponse<Orden[]>>> => {
  return api.get('/ordenes/pendientes');
};

export const actualizarEstado = async (id: number, estado: string): Promise<AxiosResponse<ApiResponse<Orden>>> => {
  return api.put(`/ordenes/${id}/estado`, { estado });
};