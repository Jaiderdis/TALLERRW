import api from './config';
import { ApiResponse, PlanRevision, FichaRevision } from '../types';

export const obtenerRevisionesPorVehiculo = async (vehiculoId: number): Promise<ApiResponse<PlanRevision[]>> => {
  const response = await api.get(`/revisiones/vehiculo/${vehiculoId}`);
  return response.data;
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
}): Promise<ApiResponse<FichaRevision>> => {
  const response = await api.post('/revisiones/ficha', data);
  return response.data;
};