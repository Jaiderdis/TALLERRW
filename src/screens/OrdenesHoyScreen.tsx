import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { obtenerOrdenesHoy, actualizarEstado } from '../api/ordenes';
import { Orden } from '../types';

const ESTADO_COLORS: Record<string, string> = {
  EnEspera: '#ffb800', EnProceso: '#00c8ff', Completada: '#00e096', Cancelada: '#ff6b2b'
};
const ESTADO_LABELS: Record<string, string> = {
  EnEspera: '⏳ En espera', EnProceso: '🔧 En proceso', Completada: '✅ Completada', Cancelada: '❌ Cancelada'
};

export default function OrdenesHoyScreen() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async () => {
    try {
      const result = await obtenerOrdenesHoy();
      setOrdenes(result.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (orden: Orden) => {
    const siguientes: Record<string, string> = {
      EnEspera: 'EnProceso', EnProceso: 'Completada'
    };
    const siguiente = siguientes[orden.estado];
    if (!siguiente) return;

    Alert.alert(
      'Cambiar estado',
      `¿Cambiar a "${ESTADO_LABELS[siguiente]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await actualizarEstado(orden.id, siguiente);
              cargar();
            } catch {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            }
          }
        }
      ]
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color="#00c8ff" size="large" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} tintColor="#00c8ff" />}
    >
      <Text style={styles.fecha}>
        {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </Text>

      {ordenes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Sin órdenes por hoy</Text>
        </View>
      ) : (
        ordenes.map(orden => (
          <View key={orden.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.ordenId}>#{String(orden.id).padStart(4, '0')}</Text>
                <Text style={styles.placa}>{orden.vehiculo.placa}</Text>
                <Text style={styles.vehiculo}>{orden.vehiculo.marca} {orden.vehiculo.modelo} {orden.vehiculo.anio}</Text>
              </View>
              <View style={[styles.estadoBadge, { borderColor: ESTADO_COLORS[orden.estado] }]}>
                <Text style={[styles.estadoText, { color: ESTADO_COLORS[orden.estado] }]}>
                  {ESTADO_LABELS[orden.estado] ?? orden.estado}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.info}>👤 {orden.cliente.nombre}</Text>
            <Text style={styles.info}>🔧 {orden.tecnico.nombre}</Text>
            <Text style={styles.info}>📍 {orden.kmIngreso.toLocaleString()} km</Text>
            {orden.observaciones ? <Text style={styles.obs}>{orden.observaciones}</Text> : null}

            <View style={styles.servicios}>
              {orden.detalles.map(d => (
                <Text key={d.id} style={styles.servicio}>• {d.servicio}</Text>
              ))}
            </View>

            {orden.estado !== 'Completada' && orden.estado !== 'Cancelada' && (
              <TouchableOpacity
                style={styles.btnEstado}
                onPress={() => cambiarEstado(orden)}
              >
                <Text style={styles.btnEstadoText}>
                  {orden.estado === 'EnEspera' ? '▶ Iniciar servicio' : '✅ Marcar completada'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f14', padding: 16 },
  centered: { flex: 1, backgroundColor: '#0a0f14', alignItems: 'center', justifyContent: 'center' },
  fecha: { fontSize: 13, color: '#5a7a99', marginBottom: 16, textTransform: 'capitalize' },
  card: { backgroundColor: '#0d1826', borderWidth: 1, borderColor: '#1e2d40', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  ordenId: { fontSize: 11, color: '#5a7a99', fontFamily: 'monospace' },
  placa: { fontSize: 24, fontWeight: '900', color: '#00c8ff', letterSpacing: 4 },
  vehiculo: { fontSize: 13, color: '#e8f0f8', marginTop: 2 },
  estadoBadge: { borderWidth: 1, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  estadoText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#1e2d40', marginBottom: 10 },
  info: { fontSize: 13, color: '#5a7a99', marginBottom: 4 },
  obs: { fontSize: 12, color: '#5a7a99', fontStyle: 'italic', marginTop: 4 },
  servicios: { marginTop: 8 },
  servicio: { fontSize: 12, color: '#e8f0f8', marginBottom: 2 },
  btnEstado: { backgroundColor: '#00c8ff', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 },
  btnEstadoText: { color: '#000', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#5a7a99' },
});