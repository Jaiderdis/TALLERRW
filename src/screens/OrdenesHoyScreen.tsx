import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  ListRenderItemInfo,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useOrdenesHoy } from '../hooks/useOrdenesHoy';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Orden } from '../types';
import { COLORS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import StatusPill from '../components/StatusPill';
import PriorityBadge, { Priority } from '../components/PriorityBadge';

// ─── tipos y mapeos ──────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrdenesHoy'>;
};

type DesignStatus = 'progreso' | 'pendiente' | 'completada' | 'cancelada';
type FilterKey = 'todas' | 'progreso' | 'pendiente' | 'completada';

interface StatusMeta {
  label: string;
  color: string;
}

// Mapea el estado del backend al estado visual del diseño.
// EnEspera → pendiente, EnProceso → progreso, Completada → completada, Cancelada → cancelada
const mapStatus = (estado: string): DesignStatus => {
  switch (estado) {
    case 'EnProceso':  return 'progreso';
    case 'Completada': return 'completada';
    case 'Cancelada':  return 'cancelada';
    default:           return 'pendiente';
  }
};

// Mapea prioridad del backend al valor en minúsculas del diseño.
// Fallback 'normal' si el campo no existe en la respuesta.
const mapPriority = (raw: unknown): Priority => {
  const v = (raw ?? 'normal').toString().toLowerCase();
  if (v === 'urgente' || v === 'inmediato') return v;
  return 'normal';
};

const STATUS_META: Record<DesignStatus, StatusMeta> = {
  progreso:   { label: 'En proceso', color: COLORS.blue },
  pendiente:  { label: 'Pendiente',  color: COLORS.orange },
  completada: { label: 'Completada', color: COLORS.green },
  cancelada:  { label: 'Cancelada',  color: COLORS.red },
};

// Mapeo de estado del backend al siguiente label del botón de acción.
const NEXT_ACTION: Record<string, string | null> = {
  EnEspera:   'Iniciar servicio',
  EnProceso:  'Marcar completada',
  Completada: null,
  Cancelada:  null,
};

// ─── utilidades de formato ──────────────────────────────────────────────────

const formatHour = (iso: string): string => {
  try {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '--:--';
  }
};

const formatFechaLarga = (d: Date): string =>
  d
    .toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

// ─── screen ──────────────────────────────────────────────────────────────────

export default function OrdenesHoyScreen({ navigation }: Props) {
  const { ordenes, loading, refreshing, cargar, onRefresh, cambiarEstado } = useOrdenesHoy();
  const [filter, setFilter] = useState<FilterKey>('todas');

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Contadores por estado de diseño
  const counts = useMemo(() => {
    const base = { todas: ordenes.length, progreso: 0, pendiente: 0, completada: 0 };
    for (const o of ordenes) {
      const s = mapStatus(o.estado);
      if (s === 'progreso') base.progreso += 1;
      else if (s === 'pendiente') base.pendiente += 1;
      else if (s === 'completada') base.completada += 1;
    }
    return base;
  }, [ordenes]);

  const filtered = useMemo(() => {
    if (filter === 'todas') return ordenes;
    return ordenes.filter((o) => mapStatus(o.estado) === filter);
  }, [ordenes, filter]);

  const today = useMemo(() => formatFechaLarga(new Date()), []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator color={COLORS.blue} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        }
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title="Ordenes del dia"
              meta={today}
              onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
            />
            <StatTiles filter={filter} counts={counts} onPick={setFilter} />
          </View>
        }
        renderItem={({ item }: ListRenderItemInfo<Orden>) => (
          <OrdenCard
            orden={item}
            onDetalle={() => {
              // TODO: navegar a detalle de orden si existe la ruta
              navigation.navigate('Vehiculo', { vehiculo: item.vehiculo });
            }}
            onCambiarEstado={() => cambiarEstado(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<EmptyState filter={filter} />}
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}

// ─── stat tiles ──────────────────────────────────────────────────────────────

interface StatTilesProps {
  filter: FilterKey;
  counts: { todas: number; progreso: number; pendiente: number; completada: number };
  onPick: (k: FilterKey) => void;
}

function StatTiles({ filter, counts, onPick }: StatTilesProps) {
  const tiles: Array<{
    key: FilterKey;
    label: string;
    count: number;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: 'todas',      label: 'Totales',     count: counts.todas,      color: COLORS.text,   icon: 'calendar-outline' },
    { key: 'progreso',   label: 'En proceso',  count: counts.progreso,   color: COLORS.blue,   icon: 'construct-outline' },
    { key: 'pendiente',  label: 'Pendientes',  count: counts.pendiente,  color: COLORS.orange, icon: 'time-outline' },
    { key: 'completada', label: 'Completadas', count: counts.completada, color: COLORS.green,  icon: 'checkmark-done' },
  ];

  return (
    <View style={styles.tilesGrid}>
      {tiles.map((t) => {
        const active = filter === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onPick(t.key)}
            activeOpacity={0.8}
            style={[
              styles.tile,
              { borderColor: active ? t.color : COLORS.line },
              active && {
                borderBottomWidth: 3,
                borderBottomColor: t.color,
                paddingBottom: 12,
              },
            ]}
          >
            <View style={styles.tileRow}>
              <Ionicons name={t.icon} size={18} color={t.color} />
              <Text style={[styles.tileCount, { color: t.color }]}>
                {String(t.count).padStart(2, '0')}
              </Text>
            </View>
            <Text style={styles.tileLabel}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── orden card ──────────────────────────────────────────────────────────────

interface OrdenCardProps {
  orden: Orden;
  onDetalle: () => void;
  onCambiarEstado: () => void;
}

function OrdenCard({ orden, onDetalle, onCambiarEstado }: OrdenCardProps) {
  const statusKey = mapStatus(orden.estado);
  const s = STATUS_META[statusKey];
  const isCompleted = statusKey === 'completada';
  const isCancelled = statusKey === 'cancelada';
  const prio = mapPriority(orden.prioridad);
  const actionLabel = NEXT_ACTION[orden.estado] ?? null;

  // Soft glow para el borde lateral en proceso
  const cardDynamic = {
    borderLeftColor: s.color,
    opacity: isCompleted ? 0.78 : isCancelled ? 0.6 : 1,
  };

  // TODO: el backend aún no expone el "motivo" como campo separado.
  // Usamos observaciones como fallback visual.
  const motivo = orden.observaciones?.trim() || null;

  // TODO: el backend no expone id alfanumérico tipo "A0002".
  // Formateamos el id numérico con prefijo visual.
  const idLabel = `#${String(orden.id).padStart(4, '0')}`;

  return (
    <View style={[styles.card, cardDynamic]}>
      {/* Header row: tiempo + ID | info | pill + prioridad */}
      <View style={styles.cardHead}>
        {/* Hora + ID */}
        <View style={styles.timeCol}>
          <Text style={[styles.timeText, { color: s.color }]}>
            {formatHour(orden.fechaIngreso)}
          </Text>
          <Text style={styles.idText}>{idLabel}</Text>
        </View>

        {/* Info principal */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.plate}>{orden.vehiculo.placa}</Text>
            <Text style={styles.vehiculo} numberOfLines={1}>
              {orden.vehiculo.marca} {orden.vehiculo.modelo} {orden.vehiculo.anio}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {orden.cliente?.nombre ?? '—'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="build" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {orden.tecnico?.nombre ?? 'Sin técnico'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={13} color={COLORS.textMuted} />
              <Text style={[styles.metaText, styles.mono]}>
                {orden.kmIngreso?.toLocaleString('es-CO') ?? 0} km
              </Text>
            </View>
          </View>

          {motivo ? (
            <Text style={styles.motivo} numberOfLines={2}>
              “{motivo}”
            </Text>
          ) : null}
        </View>

        {/* Estado + prioridad */}
        <View style={styles.rightCol}>
          <StatusPill label={s.label} color={s.color} />
          <PriorityBadge priority={prio} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Chips de servicios */}
      {orden.detalles && orden.detalles.length > 0 ? (
        <View style={styles.serviciosWrap}>
          {orden.detalles.map((d) => (
            <View key={d.id} style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: s.color }]} />
              <Text style={styles.chipText} numberOfLines={1}>
                {d.servicio}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnGhost]}
          onPress={onDetalle}
          activeOpacity={0.75}
        >
          <Ionicons name="eye-outline" size={15} color={COLORS.text} />
          <Text style={styles.btnGhostText}>Ver detalle</Text>
        </TouchableOpacity>

        {actionLabel ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={onCambiarEstado}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={15} color={COLORS.black} />
            <Text style={styles.btnPrimaryText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : isCompleted ? (
          <View style={[styles.btn, styles.btnCompleted]}>
            <Ionicons name="checkmark-done" size={15} color={COLORS.green} />
            <Text style={[styles.btnCompletedText]}>Completada</Text>
          </View>
        ) : (
          <View style={[styles.btn, styles.btnCancelled]}>
            <Ionicons name="close" size={15} color={COLORS.red} />
            <Text style={[styles.btnCancelledText]}>Cancelada</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterKey }) {
  const label = filter === 'todas'
    ? 'No hay órdenes registradas hoy.'
    : 'No hay órdenes en este estado.';
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={36} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 40,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },

  // ── stat tiles ──
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileCount: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tileLabel: {
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: '500',
  },

  // ── card ──
  card: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 3,
    borderRadius: 14,
    padding: 18,
    gap: 14,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    flexWrap: 'wrap',
  },

  // hora + id
  timeCol: {
    alignItems: 'center',
    paddingTop: 2,
    minWidth: 58,
  },
  timeText: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // info central
  infoCol: {
    flex: 1,
    minWidth: 200,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    flexWrap: 'wrap',
  },
  plate: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.blue,
    letterSpacing: 1.5,
  },
  vehiculo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textDim,
    flexShrink: 1,
  },
  mono: {
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  },
  motivo: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // pill + prioridad
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },

  // chips
  serviciosWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textDim,
  },

  // acciones
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  btnGhostText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: COLORS.blue,
  },
  btnPrimaryText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '700',
  },
  btnCompleted: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(46,213,115,0.4)',
  },
  btnCompletedText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '700',
  },
  btnCancelled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.35)',
  },
  btnCancelledText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '700',
  },

  // empty
  empty: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
