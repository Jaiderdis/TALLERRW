import { ApiResponse } from '../types';

// Wrapper genérico para todas las llamadas a la API
// Maneja errores de red de forma centralizada
export async function llamarApi<T>(
  fn: () => Promise<{ data: ApiResponse<T> }>
): Promise<ApiResponse<T>> {
  try {
    const response = await fn();
    return response.data;
  } catch (error: any) {
    // Solo llega aquí si es error de red real (sin internet, timeout, servidor caído)
    console.log('Error de red:', error?.message);
    return {
      success: false,
      message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      data: null as any,
      errors: [error?.message ?? 'Error de red'],
    };
  }
}