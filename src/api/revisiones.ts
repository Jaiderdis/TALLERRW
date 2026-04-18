import api from './config';
import { ApiResponse, PlanRevision, FichaRevision, RegistrarFichaRequest } from '../types';
import { AxiosResponse } from 'axios';

export const obtenerRevisionesPorVehiculo = async (
  vehiculoId: number
): Promise<AxiosResponse<ApiResponse<PlanRevision[]>>> => {
  return api.get(`/revisiones/vehiculo/${vehiculoId}`);
};

export const registrarFicha = async (
  data: RegistrarFichaRequest
): Promise<AxiosResponse<ApiResponse<FichaRevision>>> => {
  return api.post('/revisiones/ficha', data);
};