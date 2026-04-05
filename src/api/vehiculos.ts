import api from './config';
import { ApiResponse, Vehiculo } from '../types';
import { AxiosResponse } from 'axios';

export const buscarPorPlaca = async (placa: string): Promise<AxiosResponse<ApiResponse<Vehiculo>>> => {
  return api.get(`/vehiculos/${placa}`);
};

export const crearVehiculo = async (data: {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  clienteId: number;
  empresaId?: number | null;
}): Promise<AxiosResponse<ApiResponse<Vehiculo>>> => {
  return api.post('/vehiculos', data);
};