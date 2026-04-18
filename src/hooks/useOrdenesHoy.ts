import { useState, useCallback } from 'react';
import { Orden } from '../types';
import { obtenerOrdenesPendientes, actualizarEstado } from '../api/ordenes';
import { llamarApi } from '../api/apiHelper';
import { Alert } from 'react-native';

interface UseOrdenesHoyResult {
  ordenes: Orden[];
  loading: boolean;
  refreshing: boolean;
  cargar: () => Promise<void>;
  onRefresh: () => void;
  cambiarEstado: (orden: Orden) => void;
}

const ESTADO_LABELS: Record<string, string> = {
  EnEspera: 'En espera',
  EnProceso: 'En proceso',
  Completada: 'Completada',
  Cancelada: 'Cancelada',
};

const SIGUIENTE_ESTADO: Record<string, string> = {
  EnEspera: 'EnProceso',
  EnProceso: 'Completada',
};

/**
 * Lógica de carga y actualización de estado de órdenes del día.
 * Extrae todo el estado y efectos fuera del componente OrdenesHoyScreen.
 */
export function useOrdenesHoy(): UseOrdenesHoyResult {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    const result = await llamarApi(() => obtenerOrdenesPendientes());
    if (result.success) {
      setOrdenes(result.data);
    } else {
      Alert.alert('Error', 'No se pudieron cargar las órdenes pendientes');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void cargar();
  }, [cargar]);

  const cambiarEstado = useCallback(
    (orden: Orden) => {
      const siguiente = SIGUIENTE_ESTADO[orden.estado];
      if (!siguiente) return;

      Alert.alert(
        'Cambiar estado',
        `¿Cambiar a "${ESTADO_LABELS[siguiente]}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              const result = await llamarApi(() => actualizarEstado(orden.id, siguiente));
              if (result.success) {
                void cargar();
              } else {
                Alert.alert('Error', 'No se pudo actualizar el estado');
              }
            },
          },
        ]
      );
    },
    [cargar]
  );

  return { ordenes, loading, refreshing, cargar, onRefresh, cambiarEstado };
}
