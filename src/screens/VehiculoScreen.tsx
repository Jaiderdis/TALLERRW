import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Vehiculo, PlanRevision } from '../types';
import { COLORS } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Vehiculo'>;
  route: RouteProp<RootStackParamList, 'Vehiculo'>;
};

export default function VehiculoScreen({ navigation, route }: Props) {
  const vehiculo: Vehiculo = route.params.vehiculo;
  const hechas = vehiculo.planesRevision.filter(p => p.estado === 'Completada').length;
  const total = vehiculo.planesRevision.length;
  const tienePlan = total > 0;

  const estadoColor = (estado: string): string => {
    if (estado === 'Bien') return COLORS.success;
    if (estado === 'Regular') return COLORS.warning;
    return COLORS.danger;
  };

  const planColor = (p: PlanRevision): string => {
    if (p.estado === 'Completada') return COLORS.success;
    const primero = vehiculo.planesRevision.find(x => x.estado === 'Pendiente');
    if (primero?.id === p.id) return COLORS.accent;
    return COLORS.textSecondary;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* Header placa */}
      <View style={styles.header}>
        <Text style={styles.placa}>{vehiculo.placa}</Text>
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>
            {vehiculo.totalVisitas > 1
              ? `✓ Cliente recurrente (${vehiculo.totalVisitas} visitas)`
              : '✨ Primera visita'}
          </Text>
        </View>
      </View>

      {/* Info vehículo */}
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <Text style={styles.carName}>{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}</Text>
        <Text style={styles.carOwner}>👤 {vehiculo.cliente.nombre} · 📱 {vehiculo.cliente.telefono}</Text>
        {vehiculo.empresa && (
          <Text style={styles.empresa}>🏢 {vehiculo.empresa.nombre}</Text>
        )}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{vehiculo.totalVisitas}</Text>
            <Text style={styles.statLbl}>Visitas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>
              {vehiculo.ultimaVisita
                ? new Date(vehiculo.ultimaVisita).toLocaleDateString('es-CO')
                : '—'}
            </Text>
            <Text style={styles.statLbl}>Última visita</Text>
          </View>
        </View>
      </View>

      {/* Plan revisiones */}
      {tienePlan && (
        <>
          <Text style={styles.sectionTitle}>📅 PLAN DE REVISIONES</Text>
          <View style={styles.card}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>
                {hechas === total ? '🏆 Plan completo' : 'Plan de Revisiones AC'}
              </Text>
              <Text style={[styles.planBadge, { color: hechas === total ? '#00e096' : '#00c8ff' }]}>
                {hechas}/{total} completadas
              </Text>
            </View>
            {/* Barra progreso */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(hechas / total) * 100}%` as `${number}%` }]} />
            </View>
            {vehiculo.planesRevision.map((p) => {
              const color = planColor(p);
              const esSiguiente = p.estado === 'Pendiente' &&
                vehiculo.planesRevision.find(x => x.estado === 'Pendiente')?.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.planItem, { borderColor: color }]}
                  onPress={() => {
                    if (p.estado === 'Completada' && p.ficha) {
                      Alert.alert(
                        `Revisión ${p.numero}`,
                        `Fecha: ${new Date(p.fechaCompletada!).toLocaleDateString('es-CO')}\n` +
                        `Presión alta: ${p.ficha.presionAlta} psi\n` +
                        `Presión baja: ${p.ficha.presionBaja} psi\n` +
                        `Temp. salida: ${p.ficha.tempSalida}°C\n` +
                        `Gas: ${p.ficha.gasTipo} ${p.ficha.gasCantidad ? `· ${p.ficha.gasCantidad}g` : ''}\n\n` +
                        `${p.ficha.notas}`
                      );
                    }
                  }}
                  disabled={p.estado === 'Pendiente' && !esSiguiente}
                >
                  <View style={[styles.planNum, { backgroundColor: color }]}>
                    <Text style={styles.planNumText}>
                      {p.estado === 'Completada' ? '✓' : p.numero}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planItemTitle, { color }]}>
                      {p.numero === 1 ? 'Revisión Inicial' : p.numero === 2 ? 'Revisión Intermedia' : 'Revisión Final'}
                    </Text>
                    <Text style={styles.planItemSub}>
                      {p.estado === 'Completada'
                        ? `${new Date(p.fechaCompletada!).toLocaleDateString('es-CO')} · Toca para ver detalle`
                        : esSiguiente
                          ? `⏳ Programada: ${p.fechaProgramada ? new Date(p.fechaProgramada).toLocaleDateString('es-CO') : '—'}`
                          : '🔒 Esperando revisión anterior'}
                    </Text>
                  </View>
                  <Text style={[styles.planArrow, { color }]}>
                    {p.estado === 'Completada' ? 'Ver →' : esSiguiente ? 'Registrar →' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Botón nueva orden */}
      <Text style={styles.sectionTitle}>➕ NUEVO SERVICIO</Text>
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => navigation.navigate('NuevaOrden', { vehiculo })}
      >
        <Text style={styles.btnPrimaryText}>✅ REGISTRAR NUEVO INGRESO</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f14', padding: 16 },
  header: { marginBottom: 16 },
  placa: { fontSize: 40, fontWeight: '900', color: '#00c8ff', letterSpacing: 8 },
  tagContainer: { marginTop: 4 },
  tag: { fontSize: 11, color: '#00c8ff', backgroundColor: 'rgba(0,200,255,0.1)', padding: 4, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start' },
  card: { backgroundColor: '#0d1826', borderWidth: 1, borderColor: '#1e2d40', borderRadius: 14, padding: 16, marginBottom: 16, position: 'relative' },
  accentBar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: '#00c8ff', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  carName: { fontSize: 17, fontWeight: '700', color: '#e8f0f8', marginBottom: 4, marginLeft: 8 },
  carOwner: { fontSize: 13, color: '#5a7a99', marginBottom: 8, marginLeft: 8 },
  empresa: { fontSize: 13, color: '#00c8ff', marginBottom: 8, marginLeft: 8 },
  statsRow: { flexDirection: 'row', gap: 20, marginLeft: 8 },
  stat: {},
  statVal: { fontSize: 18, fontWeight: '700', color: '#00c8ff' },
  statLbl: { fontSize: 10, color: '#5a7a99', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#5a7a99', marginBottom: 10, fontWeight: '700' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planTitle: { fontSize: 14, fontWeight: '600', color: '#e8f0f8' },
  planBadge: { fontSize: 12, fontWeight: '700' },
  progressBar: { height: 6, backgroundColor: '#182030', borderRadius: 10, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00c8ff', borderRadius: 10 },
  planItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#182030', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  planNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  planNumText: { color: '#000', fontWeight: '800', fontSize: 14 },
  planItemTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  planItemSub: { fontSize: 11, color: '#5a7a99' },
  planArrow: { fontSize: 11 },
  btnPrimary: { backgroundColor: '#00c8ff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});