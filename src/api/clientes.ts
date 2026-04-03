import api from './config';
import { ApiResponse, Cliente } from '../types';

export const crearCliente = async (data: {
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  empresaId?: number | null;
}): Promise<ApiResponse<Cliente>> => {
  const response = await api.post('/clientes', data);
  return response.data;
};

export const buscarPorCedula = async (cedula: string): Promise<ApiResponse<Cliente>> => {
  const response = await api.get(`/clientes/cedula/${cedula}`);
  return response.data;
};

export const actualizarCliente = async (id: number, data: {
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  empresaId?: number | null;
}): Promise<ApiResponse<Cliente>> => {
  const response = await api.put(`/clientes/${id}`, data);
  return response.data;
};
