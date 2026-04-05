import api from './config';
import { ApiResponse, Orden } from '../types';
import { AxiosResponse } from 'axios';

export const crearOrden = async (data: {
  vehiculoId: number;
  tecnicoId: number;
  clienteId: number;
  empresaId?: number | null;
  prioridad: string;
  kmIngreso: number;
  observaciones: string;
  serviciosIds: number[];
}): Promise<AxiosResponse<ApiResponse<Orden>>> => {
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