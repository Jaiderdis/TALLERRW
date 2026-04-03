import api from './config';
import { ApiResponse, Vehiculo } from '../types';

export const buscarPorPlaca = async (placa: string): Promise<ApiResponse<Vehiculo>> => {
  const response = await api.get(`/vehiculos/${placa}`);
  return response.data;
};

export const crearVehiculo = async (data: {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  clienteId: number;
  empresaId?: number | null;
}): Promise<ApiResponse<Vehiculo>> => {
  const response = await api.post('/vehiculos', data);
  return response.data;
};