import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/AppNavigator';
import { agregarServicios, eliminarServicio, actualizarEstado } from '../api/ordenes';
import { llamarApi } from '../api/apiHelper';
import { useNuevaOrdenData } from '../hooks/useNuevaOrdenData';
import { CatalogoServicio, Orden } from '../types';
import { COLORS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Section from '../components/Section';
import StatusPill from '../components/StatusPill';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrdenDetalle'>;
  route: RouteProp<RootStackParamList, 'OrdenDetalle'>;
};

const STATUS_COLOR: Record<string, string> = {
  EnEspera:   COLORS.orange,
  EnProceso:  COLORS.blue,
  Completada: COLORS.green,
  Cancelada:  COLORS.red,
};
const STATUS_LABEL: Record<string, string> = {
  EnEspera:   'Pendiente',
  EnProceso:  'En proceso',
  Completada: 'Completada',
  Cancelada:  'Cancelada',
};
const NEXT_ESTADO: Record<string, string> = {
  EnEspera:  'EnProceso',
  EnProceso: 'Completada',
};
const NEXT_LABEL: Record<string, string> = {
  EnEspera:  'Iniciar servicio',
  EnProceso: 'Marcar completada',
};

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function OrdenDetalleScreen({ navigation, route }: Props) {
  const [orden, setOrden] = useState<Orden>(route.params.orden);
  const { catalogo, cargando } = useNuevaOrdenData();

  const [agregando, setAgregando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [eliminando, setEliminando] = useState<number | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const serviciosYaEnOrden = useMemo(
    () => new Set(orden.detalles.map((d) => d.servicio)),
    [orden.detalles]
  );

  const catalogoDisponible = useMemo(
    () => catalogo.filter((s) => !serviciosYaEnOrden.has(s.nombre)),
    [catalogo, serviciosYaEnOrden]
  );

  const toggle = (id: number) =>
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const isEditable = orden.estado !== 'Completada' && orden.estado !== 'Cancelada';
  const nextEstado = NEXT_ESTADO[orden.estado];
  const idLabel = `#${String(orden.id).padStart(4, '0')}`;

  const guardarServicios = async () => {
    if (seleccionados.length === 0) return;
    setAgregando(true);
    try {
      const result = await llamarApi(() => agregarServicios(orden.id, seleccionados));
      if (result.success) {
        setOrden(result.data);
        setSeleccionados([]);
        Toast.show({ type: 'success', text1: 'Servicios agregados' });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: result.message });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Sin conexión' });
    } finally {
      setAgregando(false);
    }
  };

  const confirmarEliminar = (detalleId: number, nombre: string) => {
    Alert.alert(
      'Eliminar servicio',
      `¿Eliminar "${nombre}" de la orden?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setEliminando(detalleId);
            const result = await llamarApi(() => eliminarServicio(orden.id, detalleId));
            if (result.success) {
              setOrden(result.data);
              Toast.show({ type: 'success', text1: 'Servicio eliminado' });
            } else {
              Toast.show({ type: 'error', text1: 'Error', text2: result.message });
            }
            setEliminando(null);
          },
        },
      ]
    );
  };

  const abrirFicha = () => {
    if (!orden.planRevisionId) return;
    navigation.navigate('FichaRevision', {
      planId: orden.planRevisionId,
      ordenId: orden.id,
      vehiculoId: orden.vehiculo.id,
      tecnicoId: orden.tecnico.id,
    });
  };

  const cambiarEstado = () => {
    if (!nextEstado) return;

    // Si es una revisión y se está completando → ir a FichaRevision
    if (orden.esRevision && nextEstado === 'Completada' && orden.planRevisionId) {
      navigation.navigate('FichaRevision', {
        planId: orden.planRevisionId,
        ordenId: orden.id,
        vehiculoId: orden.vehiculo.id,
        tecnicoId: orden.tecnico.id,
      });
      return;
    }

    Alert.alert(
      'Cambiar estado',
      `¿Cambiar a "${STATUS_LABEL[nextEstado]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setCambiandoEstado(true);
            const result = await llamarApi(() => actualizarEstado(orden.id, nextEstado));
            if (result.success) {
              setOrden(result.data);
              Toast.show({ type: 'success', text1: 'Estado actualizado' });
            } else {
              Toast.show({ type: 'error', text1: 'Error', text2: result.message });
            }
            setCambiandoEstado(false);
          },
        },
      ]
    );
  };

  const statusColor = STATUS_COLOR[orden.estado] ?? COLORS.textDim;
  const statusLabel = STATUS_LABEL[orden.estado] ?? orden.estado;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          onBack={() => navigation.goBack()}
          title={`Orden ${idLabel}`}
          meta={formatFecha(orden.fechaIngreso)}
          accent={statusColor}
        />

        {/* Resumen */}
        <View style={[styles.resumenCard, { borderLeftColor: statusColor }]}>
          <View style={styles.resumenRow}>
            <View style={styles.resumenLeft}>
              <Text style={styles.placa}>{orden.vehiculo?.placa}</Text>
              <Text style={styles.vehiculoText} numberOfLines={1}>
                {orden.vehiculo?.marca} {orden.vehiculo?.modelo} {orden.vehiculo?.anio}
              </Text>
            </View>
            <StatusPill label={statusLabel} color={statusColor} />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{orden.tecnico?.nombre ?? '—'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{orden.cliente?.nombre ?? '—'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{orden.kmIngreso?.toLocaleString('es-CO')} km</Text>
            </View>
          </View>

          {orden.observaciones ? (
            <Text style={styles.observaciones}>"{orden.observaciones}"</Text>
          ) : null}

          {orden.esRevision && (
            <View style={styles.revisionBanner}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.blue} />
              <Text style={styles.revisionBannerText}>Orden de revisión de plan de mantenimiento</Text>
              {orden.estado === 'EnProceso' && (
                <TouchableOpacity style={styles.fichaBtn} onPress={abrirFicha} activeOpacity={0.85}>
                  <Text style={styles.fichaBtnText}>Llenar ficha</Text>
                  <Ionicons name="arrow-forward" size={13} color={COLORS.black} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Servicios actuales */}
        <Section title="Servicios registrados" icon="construct-outline">
          {orden.detalles.length === 0 ? (
            <Text style={styles.emptyText}>Sin servicios registrados.</Text>
          ) : (
            orden.detalles.map((d) => (
              <View key={d.id} style={styles.detalleRow}>
                <View style={[styles.detalleDot, { backgroundColor: statusColor }]} />
                <Text style={styles.detalleNombre} numberOfLines={1}>{d.servicio}</Text>
                <Text style={styles.detallePrecio}>
                  ${Number(d.precio).toLocaleString('es-CO')}
                </Text>
                {isEditable && (
                  eliminando === d.id ? (
                    <ActivityIndicator size="small" color={COLORS.red} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => confirmarEliminar(d.id, d.servicio)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={17} color={COLORS.red} />
                    </TouchableOpacity>
                  )
                )}
              </View>
            ))
          )}
        </Section>

        {/* Agregar servicios — solo si la orden es editable y NO es una revisión */}
        {isEditable && !orden.esRevision && (
          <Section title="Agregar servicios" icon="add-circle-outline">
            {cargando ? (
              <ActivityIndicator color={COLORS.blue} />
            ) : catalogoDisponible.length === 0 ? (
              <Text style={styles.emptyText}>Todos los servicios ya están en la orden.</Text>
            ) : (
              <>
                <View style={styles.serviciosGrid}>
                  {catalogoDisponible.map((sv: CatalogoServicio) => {
                    const on = seleccionados.includes(sv.id);
                    return (
                      <TouchableOpacity
                        key={sv.id}
                        activeOpacity={0.85}
                        style={[styles.servicioBtn, on && styles.servicioBtnOn]}
                        onPress={() => toggle(sv.id)}
                      >
                        <View style={[styles.checkbox, on && styles.checkboxOn]}>
                          {on && <Ionicons name="checkmark" size={13} color={COLORS.black} />}
                        </View>
                        <View style={styles.servicioBody}>
                          <Text style={styles.servicioNombre} numberOfLines={2}>{sv.nombre}</Text>
                          <Text style={[styles.servicioPrecio, { color: on ? COLORS.blue : COLORS.textDim }]}>
                            ${sv.precioBase.toLocaleString('es-CO')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {seleccionados.length > 0 && (
                  <TouchableOpacity
                    style={[styles.addBtn, agregando && { opacity: 0.6 }]}
                    onPress={guardarServicios}
                    disabled={agregando}
                    activeOpacity={0.85}
                  >
                    {agregando ? (
                      <ActivityIndicator color={COLORS.black} size="small" />
                    ) : (
                      <>
                        <Ionicons name="add" size={16} color={COLORS.black} />
                        <Text style={styles.addBtnText}>
                          Agregar {seleccionados.length} servicio{seleccionados.length > 1 ? 's' : ''}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </Section>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Botón de cambio de estado */}
      {nextEstado && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.estadoBtn, cambiandoEstado && { opacity: 0.6 }]}
            onPress={cambiarEstado}
            disabled={cambiandoEstado}
            activeOpacity={0.85}
          >
            {cambiandoEstado ? (
              <ActivityIndicator color={COLORS.black} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={COLORS.black} />
                <Text style={styles.estadoBtnText}>{NEXT_LABEL[orden.estado]}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20 },

  resumenCard: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 4,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    gap: 12,
  },
  resumenRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  resumenLeft: { flex: 1, gap: 4 },
  placa: { fontFamily: 'monospace', fontSize: 22, fontWeight: '800', color: COLORS.blue, letterSpacing: 1.5 },
  vehiculoText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.textDim },
  observaciones: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  detalleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.lineSoft,
  },
  detalleDot: { width: 6, height: 6, borderRadius: 3 },
  detalleNombre: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  detallePrecio: { fontSize: 13, color: COLORS.textDim, fontFamily: 'monospace' },

  serviciosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  servicioBtn: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    flexGrow: 1, flexBasis: '47%', minWidth: 160,
    backgroundColor: COLORS.bg3, borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 12, padding: 12,
  },
  servicioBtnOn: { backgroundColor: COLORS.blueSoft, borderColor: COLORS.blue },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.line,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxOn: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  servicioBody: { flex: 1 },
  servicioNombre: { fontSize: 13, fontWeight: '600', color: COLORS.text, lineHeight: 17 },
  servicioPrecio: { fontSize: 12, fontFamily: 'monospace', fontWeight: '700', marginTop: 3 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 10, backgroundColor: COLORS.blue,
  },
  addBtnText: { color: COLORS.black, fontSize: 14, fontWeight: '700' },

  emptyText: { fontSize: 13, color: COLORS.textMuted },

  revisionBanner: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8,
    backgroundColor: COLORS.blueSoft, borderWidth: 1, borderColor: COLORS.blue,
    borderRadius: 10, padding: 10,
  },
  revisionBannerText: { flex: 1, fontSize: 12, color: COLORS.blue, fontWeight: '600' },
  fichaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.blue, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7,
  },
  fichaBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.black },

  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.lineSoft,
  },
  estadoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: COLORS.blue, minHeight: 52,
  },
  estadoBtnText: { color: COLORS.black, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
});
