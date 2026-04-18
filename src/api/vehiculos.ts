import api from './config';
import { ApiResponse, Vehiculo, CrearVehiculoRequest } from '../types';
import { AxiosResponse } from 'axios';

export const buscarPorPlaca = async (
  placa: string
): Promise<AxiosResponse<ApiResponse<Vehiculo>>> => {
  return api.get(`/vehiculos/${placa}`);
};

export const crearVehiculo = async (
  data: CrearVehiculoRequest
): Promise<AxiosResponse<ApiResponse<Vehiculo>>> => {
  return api.post('/vehiculos', data);
};