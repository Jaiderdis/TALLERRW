import { useState, useEffect } from 'react';
import { Tecnico, CatalogoServicio } from '../types';
import { obtenerTecnicos } from '../api/tecnicos';
import { obtenerCatalogo } from '../api/catalogo';
import { llamarApi } from '../api/apiHelper';

interface UseNuevaOrdenDataResult {
  tecnicos: Tecnico[];
  catalogo: CatalogoServicio[];
  cargando: boolean;
}

/**
 * Carga en paralelo técnicos y catálogo de servicios para la pantalla NuevaOrden.
 */
export function useNuevaOrdenData(): UseNuevaOrdenDataResult {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoServicio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cargar = async () => {
      setCargando(true);
      const [t, c] = await Promise.all([
        llamarApi(() => obtenerTecnicos()),
        llamarApi(() => obtenerCatalogo()),
      ]);
      if (!cancelled) {
        setTecnicos(t.success ? t.data : []);
        setCatalogo(c.success ? c.data : []);
        setCargando(false);
      }
    };

    void cargar();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tecnicos, catalogo, cargando };
}
