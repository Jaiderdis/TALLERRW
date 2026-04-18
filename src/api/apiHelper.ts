import { ApiResponse } from '../types';

// Wrapper genérico para todas las llamadas a la API.
// Maneja errores de red de forma centralizada — HTTP 4xx/5xx ya son
// resueltos como datos por el interceptor en config.ts; solo errores de red
// reales (sin internet, timeout, servidor caído) llegan al catch.
export async function llamarApi<T>(
  fn: () => Promise<{ data: ApiResponse<T> }>
): Promise<ApiResponse<T>> {
  try {
    const response = await fn();
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de red';
    console.log('Error de red:', message);
    return {
      success: false,
      message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      data: null as unknown as T,
      errors: [message],
    };
  }
}