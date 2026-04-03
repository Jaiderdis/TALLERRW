import api from './config';
import { ApiResponse, Orden } from '../types';

export const crearOrden = async (data: {
  vehiculoId: number;
  tecnicoId: number;
  clienteId: number;
  empresaId?: number | null;
  prioridad: string;
  kmIngreso: number;
  observaciones: string;
  serviciosIds: number[];
}): Promise<ApiResponse<Orden>> => {
  try {
    const response = await api.post('/ordenes', data);
    return response.data;
  } catch (error: any) {
    // Si la API responde con un error controlado, retornarlo como ApiResponse
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const obtenerOrdenesHoy = async (): Promise<ApiResponse<Orden[]>> => {
  const response = await api.get('/ordenes/hoy');
  return response.data;
};

export const actualizarEstado = async (id: number, estado: string): Promise<ApiResponse<Orden>> => {
  const response = await api.put(`/ordenes/${id}/estado`, { estado });
  return response.data;
};