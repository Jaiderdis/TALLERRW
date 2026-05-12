import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  SectionListData,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/AppNavigator';
import { Orden } from '../types';
import { COLORS } from '../theme';
import { llamarApi } from '../api/apiHelper';
import { obtenerHistorial } from '../api/ordenes';
import ScreenHeader from '../components/ScreenHeader';

// ─── constants ────────────────────────────────────────────────────────────────

const DIA_OPTIONS: { label: string; value: number }[] = [
  { label: '7 días',  value: 7  },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
];

type EstadoFiltro = 'todas' | 'completada' | 'cancelada' | 'revision';

const ESTADO_OPTIONS: { label: string; value: EstadoFiltro }[] = [
  { label: 'Todas',       value: 'todas'      },
  { label: 'Completadas', value: 'completada' },
  { label: 'Canceladas',  value: 'cancelada'  },
  { label: 'Revisiones',  value: 'revision'   },
];

// ─── types ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Historial'>;
};

type DesignStatus = 'progreso' | 'pendiente' | 'completada' | 'cancelada';

interface SectionItem {
  title: string;   // "LUNES 21 ENERO"
  dateKey: string; // "2026-01-21" — used as SectionList key
  count: number;
  data: Orden[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const mapStatus = (estado: string): DesignStatus => {
  switch (estado) {
    case 'EnProceso':  return 'progreso';
    case 'Completada': return 'completada';
    case 'Cancelada':  return 'cancelada';
    default:           return 'pendiente';
  }
};

const STATUS_META: Record<DesignStatus, { label: string; color: string }> = {
  progreso:   { label: 'En proceso', color: COLORS.blue },
  pendiente:  { label: 'Pendiente',  color: COLORS.orange },
  completada: { label: 'Completada', color: COLORS.green },
  cancelada:  { label: 'Cancelada',  color: COLORS.red },
};

const formatHour = (iso: string): string => {
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '--:--';
  }
};

const formatSectionTitle = (dateKey: string): string => {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date
      .toLocaleDateString('es-CO', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
      .toUpperCase();
  } catch {
    return dateKey;
  }
};

const groupByDate = (ordenes: Orden[]): SectionItem[] => {
  const map = new Map<string, Orden[]>();

  for (const o of ordenes) {
    try {
      const d = new Date(o.fechaIngreso);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    } catch {
      // skip malformed dates
    }
  }

  const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

  return keys.map((dateKey) => {
    const data = map.get(dateKey)!;
    data.sort(
      (a, b) =>
        new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
    );
    return {
      title: formatSectionTitle(dateKey),
      dateKey,
      count: data.length,
      data,
    };
  });
};

// ─── screen ───────────────────────────────────────────────────────────────────

export default function HistorialOrdenesScreen({ navigation }: Props) {
  const [allOrdenes, setAllOrdenes]         = useState<Orden[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [diasSeleccionados, setDias]        = useState<number>(30);
  const [busqueda, setBusqueda]             = useState('');
  const [estadoFiltro, setEstadoFiltro]     = useState<EstadoFiltro>('todas');
  const inputRef                            = useRef<TextInput>(null);

  // ── load ──
  const cargar = useCallback(async (dias: number, silent = false) => {
    if (!silent) setLoading(true);
    const result = await llamarApi(() => obtenerHistorial(dias));
    if (result.success && Array.isArray(result.data)) {
      setAllOrdenes(result.data);
    } else {
      setAllOrdenes([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar(diasSeleccionados);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void cargar(diasSeleccionados, true);
  }, [cargar, diasSeleccionados]);

  const handleDiasChange = useCallback((dias: number) => {
    setDias(dias);
    void cargar(dias);
  }, [cargar]);

  // ── derived: apply client-side filters ──
  const sections = useMemo<SectionItem[]>(() => {
    let filtered = allOrdenes;

    if (busqueda.trim().length > 0) {
      const q = busqueda.trim().toLowerCase();
      filtered = filtered.filter((o) =>
        o.vehiculo?.placa?.toLowerCase().includes(q)
      );
    }

    if (estadoFiltro !== 'todas') {
      if (estadoFiltro === 'revision') {
        filtered = filtered.filter((o) => o.esRevision === true);
      } else {
        filtered = filtered.filter(
          (o) => o.estado?.toLowerCase() === estadoFiltro
        );
      }
    }

    return groupByDate(filtered);
  }, [allOrdenes, busqueda, estadoFiltro]);

  // ── loading screen ──
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
      <SectionList<Orden, SectionItem>
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        sections={sections as SectionListData<Orden, SectionItem>[]}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Historial"
              eyebrow={`ÚLTIMOS ${diasSeleccionados} DÍAS`}
              onBack={() => navigation.goBack()}
            />

            {/* ── selector de días ── */}
            <View style={styles.chipsBar}>
              {DIA_OPTIONS.map((opt) => {
                const active = diasSeleccionados === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => handleDiasChange(opt.value)}
                    activeOpacity={0.75}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── buscador por placa ── */}
            <View style={styles.searchRow}>
              <Ionicons
                name="search-outline"
                size={16}
                color={COLORS.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Buscar placa..."
                placeholderTextColor={COLORS.textMuted}
                value={busqueda}
                onChangeText={setBusqueda}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
              />
              {busqueda.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setBusqueda('');
                    inputRef.current?.blur();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.searchClear}
                >
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── filtros de estado ── */}
            <View style={styles.chipsBar}>
              {ESTADO_OPTIONS.map((opt) => {
                const active = estadoFiltro === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setEstadoFiltro(opt.value)}
                    activeOpacity={0.75}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.headerDivider} />
          </>
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.count} />
        )}
        renderItem={({ item }) => (
          <HistorialCard
            orden={item}
            onPress={() => navigation.navigate('OrdenDetalle', { orden: item })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListEmptyComponent={
          <EmptyState dias={diasSeleccionados} hasFilters={busqueda.length > 0 || estadoFiltro !== 'todas'} />
        }
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}

// ─── section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>
          {count} {count === 1 ? 'orden' : 'órdenes'}
        </Text>
      </View>
    </View>
  );
}

// ─── historial card ───────────────────────────────────────────────────────────

interface HistorialCardProps {
  orden: Orden;
  onPress: () => void;
}

function HistorialCard({ orden, onPress }: HistorialCardProps) {
  const statusKey = mapStatus(orden.estado);
  const s = STATUS_META[statusKey];
  const isCompleted = statusKey === 'completada';
  const isCancelled = statusKey === 'cancelada';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[
        styles.card,
        {
          borderLeftColor: orden.esRevision ? COLORS.blue : s.color,
          opacity: isCancelled ? 0.6 : isCompleted ? 0.82 : 1,
        },
      ]}
    >
      {/* Row 1: hora + placa + marca/modelo */}
      <View style={styles.cardRow}>
        <Text style={styles.hora}>{formatHour(orden.fechaIngreso)}</Text>
        <Text style={styles.placa}>{orden.vehiculo.placa}</Text>
        <Text style={styles.vehiculo} numberOfLines={1}>
          {orden.vehiculo.marca} {orden.vehiculo.modelo} {orden.vehiculo.anio}
        </Text>
        <View style={{ flex: 1 }} />
        {orden.esRevision && (
          <View style={styles.revBadge}>
            <Text style={styles.revBadgeText}>REVISIÓN</Text>
          </View>
        )}
        <StatusPillCompact label={s.label} color={s.color} />
      </View>

      {/* Row 2: cliente · técnico */}
      <View style={styles.metaRow}>
        {orden.cliente?.nombre ? (
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {orden.cliente.nombre}
            </Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="construct-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {orden.tecnico?.nombre ?? '—'}
          </Text>
        </View>
      </View>

      {/* Row 3: chips de servicios */}
      {orden.detalles && orden.detalles.length > 0 && (
        <View style={styles.chipsRow}>
          {orden.detalles.map((d) => (
            <View key={d.id} style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: s.color }]} />
              <Text style={styles.chipText} numberOfLines={1}>
                {d.servicio}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── status pill (compact inline variant) ─────────────────────────────────────

function StatusPillCompact({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ dias, hasFilters }: { dias: number; hasFilters: boolean }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="time-outline" size={36} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>
        {hasFilters
          ? 'Sin resultados para los filtros aplicados'
          : `Sin órdenes en los últimos ${dias} días`}
      </Text>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

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

  // ── filter controls ──
  chipsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDim,
    letterSpacing: 0.2,
  },
  filterChipTextActive: {
    color: COLORS.black,
  },

  // ── search ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
  searchClear: {
    marginLeft: 8,
  },

  // ── header divider ──
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.lineSoft,
    marginTop: 16,
    marginBottom: 4,
  },

  // ── section header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    paddingVertical: 10,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  sectionBadge: {
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDim,
  },

  // ── card ──
  card: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 3,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },

  // row 1
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'nowrap',
  },
  hora: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: -0.3,
    minWidth: 42,
  },
  placa: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.blue,
    letterSpacing: 1,
  },
  vehiculo: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
    maxWidth: 160,
  },

  // revision badge
  revBadge: {
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  revBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.blue,
    letterSpacing: 0.8,
  },

  // status pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // row 2
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textDim,
    flexShrink: 1,
  },

  // row 3 — chips de servicios
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textDim,
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
    marginTop: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
