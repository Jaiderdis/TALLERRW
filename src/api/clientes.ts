import api from './config';
import { ApiResponse, Cliente } from '../types';
import { AxiosResponse } from 'axios';

export const crearCliente = async (data: {
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  empresaId?: number | null;
}): Promise<AxiosResponse<ApiResponse<Cliente>>> => {
  return api.post('/clientes', data);
};

export const buscarPorCedula = async (cedula: string): Promise<AxiosResponse<ApiResponse<Cliente>>> => {
  return api.get(`/clientes/cedula/${cedula}`);
};

export const actualizarCliente = async (id: number, data: {
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  empresaId?: number | null;
}): Promise<AxiosResponse<ApiResponse<Cliente>>> => {
  return api.put(`/clientes/${id}`, data);
};