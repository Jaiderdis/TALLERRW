import api from './config';
import { ApiResponse, PlanRevision, FichaRevision } from '../types';
import { AxiosResponse } from 'axios';

export const obtenerRevisionesPorVehiculo = async (vehiculoId: number): Promise<AxiosResponse<ApiResponse<PlanRevision[]>>> => {
  return api.get(`/revisiones/vehiculo/${vehiculoId}`);
};

export const registrarFicha = async (data: {
  planId: number;
  ordenId: number;
  tecnicoId: number;
  presionAlta: number;
  presionBaja: number;
  tempSalida: number;
  gasTipo: string;
  gasCantidad?: number | null;
  notas: string;
  componentes: { componente: string; estado: string; observacion: string }[];
}): Promise<AxiosResponse<ApiResponse<FichaRevision>>> => {
  return api.post('/revisiones/ficha', data);
};