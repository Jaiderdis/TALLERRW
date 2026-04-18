import api from './config';
import { ApiResponse, Cliente, CrearClienteRequest, ActualizarClienteRequest } from '../types';
import { AxiosResponse } from 'axios';

export const crearCliente = async (
  data: CrearClienteRequest
): Promise<AxiosResponse<ApiResponse<Cliente>>> => {
  return api.post('/clientes', data);
};

export const buscarPorCedula = async (
  cedula: string
): Promise<AxiosResponse<ApiResponse<Cliente>>> => {
  return api.get(`/clientes/cedula/${cedula}`);
};

export const actualizarCliente = async (
  id: number,
  data: ActualizarClienteRequest
): Promise<AxiosResponse<ApiResponse<Cliente>>> => {
  return api.put(`/clientes/${id}`, data);
};