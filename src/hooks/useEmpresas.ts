import { useState, useEffect } from 'react';
import { Empresa } from '../types';
import { obtenerEmpresas } from '../api/empresas';
import { llamarApi } from '../api/apiHelper';

interface UseEmpresasResult {
  empresas: Empresa[];
  cargando: boolean;
}

/**
 * Carga la lista de empresas desde la API.
 * Devuelve un array vacío (sin mostrar error) si la petición falla,
 * ya que las empresas son opcionales en el flujo de registro.
 */
export function useEmpresas(): UseEmpresasResult {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cargar = async () => {
      setCargando(true);
      const response = await llamarApi(() => obtenerEmpresas());
      if (!cancelled) {
        setEmpresas(response.success ? response.data : []);
        setCargando(false);
      }
    };

    void cargar();

    return () => {
      cancelled = true;
    };
  }, []);

  return { empresas, cargando };
}
