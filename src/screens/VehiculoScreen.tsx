import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal, Pressable, Platform, LayoutAnimation, UIManager
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Vehiculo, PlanRevision } from '../types';
import { COLORS } from '../theme';
import { llamarApi } from '../api/apiHelper';
import { buscarPorPlaca } from '../api/vehiculos';
import ScreenHeader from '../components/ScreenHeader';
import PlateBlock from '../components/PlateBlock';
import StickyCTA from '../components/StickyCTA';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Vehiculo'>;
  route: RouteProp<RootStackParamList, 'Vehiculo'>;
};

type PasoEstado = 'done' | 'active' | 'locked';

const LABEL_PASO: Record<number, string> = {
  1: 'Revisión Inicial',
  2: 'Revisión Intermedia',
  3: 'Revisión Final',
};

function formatearFecha(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('es-CO');
  } catch {
    return '-';
  }
}

function diasDesde(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (dias < 0) return null;
    if (dias === 0) return 'hoy';
    if (dias === 1) return 'hace 1 día';
    return `hace ${dias} días`;
  } catch {
    return null;
  }
}

type FichaDetalle = {
  numero: number;
  fechaCompletada: string | null;
  ficha: NonNullable<PlanRevision['ficha']>;
};

// Groups a flat array of PlanRevision into cycles of CYCLE_SIZE by position.
// E.g. 6 plans → [[p1,p2,p3], [p4,p5,p6]]
const CYCLE_SIZE = 3;

function groupIntoCycles(planes: PlanRevision[]): PlanRevision[][] {
  const cycles: PlanRevision[][] = [];
  for (let i = 0; i < planes.length; i += CYCLE_SIZE) {
    cycles.push(planes.slice(i, i + CYCLE_SIZE));
  }
  return cycles;
}

export default function VehiculoScreen({ navigation, route }: Props) {
  const [vehiculo, setVehiculo] = useState<Vehiculo>(route.params.vehiculo);
  const [recargando, setRecargando] = useState(false);
  const [fichaModal, setFichaModal] = useState<FichaDetalle | null>(null);

  const planes = vehiculo.planesRevision ?? [];
  const cycles = groupIntoCycles(planes);

  // Last cycle is expanded by default; track which cycle indices are expanded.
  const lastCycleIdx = cycles.length > 0 ? cycles.length - 1 : 0;
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(
    () => new Set([lastCycleIdx])
  );

  const toggleCycle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCycles(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const recargar = async () => {
        setRecargando(true);
        const result = await llamarApi(() => buscarPorPlaca(vehiculo.placa));
        if (active && result.success && result.data) {
          const updated = result.data as Vehiculo;
          setVehiculo(updated);
          // Expand last cycle of freshly loaded data
          const newCycles = groupIntoCycles(updated.planesRevision ?? []);
          if (newCycles.length > 0) {
            setExpandedCycles(new Set([newCycles.length - 1]));
          }
        }
        if (active) setRecargando(false);
      };
      void recargar();
      return () => { active = false; };
    }, [vehiculo.placa])
  );

  const primeraVisita = vehiculo.totalVisitas <= 1;

  const total = planes.length;
  const hechas = planes.filter(p => p.estado === 'Completada').length;
  const tienePlan = total > 0;
  const progresoPct = total > 0 ? (hechas / total) * 100 : 0;

  // puedeRegistrar is scoped to the cycle that contains the step,
  // so revision #1 of a new cycle is not unlocked by revision #3 of a past cycle.
  const puedeRegistrar = (p: PlanRevision, cycleRevisions: PlanRevision[]): boolean => {
    if (p.estado !== 'Pendiente') return false;
    if (!p.origenCompletada) return false;
    // All earlier steps within the same cycle must be Completada
    const idxInCycle = cycleRevisions.indexOf(p);
    return cycleRevisions
      .slice(0, idxInCycle)
      .every(prev => prev.estado === 'Completada');
  };

  const estadoPaso = (p: PlanRevision, cycleRevisions: PlanRevision[]): PasoEstado => {
    if (p.estado === 'Completada') return 'done';
    if (p.estado === 'EnProceso') return 'active';
    if (puedeRegistrar(p, cycleRevisions)) return 'active';
    return 'locked';
  };

  const abrirFicha = (p: PlanRevision) => {
    if (p.estado === 'Completada' && p.ficha) {
      setFichaModal({ numero: p.numero, fechaCompletada: p.fechaCompletada, ficha: p.ficha });
    }
  };

  const registrarPaso = (p: PlanRevision) => {
    navigation.navigate('IniciarRevision', { planId: p.id, vehiculo });
  };

  // TODO: backend no devuelve un contador separado "visitas en taller"; usamos totalVisitas.
  const visitasLabel = String(vehiculo.totalVisitas ?? 0).padStart(2, '0');
  const ultimaVisita = formatearFecha(vehiculo.ultimaVisita);
  const hace = diasDesde(vehiculo.ultimaVisita);

  const estadoColor: Record<string, string> = {
    Bien: COLORS.green,
    Regular: COLORS.orange,
    Mal: COLORS.red,
  };

  return (
    <View style={styles.root}>
      {/* ── Modal detalle ficha ── */}
      <Modal
        visible={fichaModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setFichaModal(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFichaModal(null)} />
          <View style={styles.modalSheet}>
          {fichaModal && (
            <>
              {/* Handle visual */}
              <View style={styles.modalHandle} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalTitle}>Revisión {fichaModal.numero}</Text>
                  <Text style={styles.modalSubtitle}>
                    {formatearFecha(fichaModal.fechaCompletada)}
                    {fichaModal.ficha.tecnico ? `  ·  ${fichaModal.ficha.tecnico}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setFichaModal(null)} style={styles.modalClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <View style={styles.modalCloseInner}>
                    <Ionicons name="close" size={16} color={COLORS.textDim} />
                  </View>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Mediciones */}
                <Text style={styles.modalSectionLabel}>MEDICIONES</Text>
                <View style={styles.modalGrid}>
                  <View style={styles.modalCell}>
                    <View style={styles.modalCellInner}>
                      <Text style={styles.modalCellLabel}>PRESIÓN ALTA</Text>
                      <Text style={styles.modalCellValue}>{fichaModal.ficha.presionAlta}</Text>
                      <Text style={styles.modalCellUnit}>psi</Text>
                    </View>
                  </View>
                  <View style={styles.modalCell}>
                    <View style={styles.modalCellInner}>
                      <Text style={styles.modalCellLabel}>PRESIÓN BAJA</Text>
                      <Text style={styles.modalCellValue}>{fichaModal.ficha.presionBaja}</Text>
                      <Text style={styles.modalCellUnit}>psi</Text>
                    </View>
                  </View>
                  <View style={styles.modalCell}>
                    <View style={styles.modalCellInner}>
                      <Text style={styles.modalCellLabel}>TEMP. SALIDA</Text>
                      <Text style={styles.modalCellValue}>{fichaModal.ficha.tempSalida}</Text>
                      <Text style={styles.modalCellUnit}>°C</Text>
                    </View>
                  </View>
                  <View style={styles.modalCell}>
                    <View style={styles.modalCellInner}>
                      <Text style={styles.modalCellLabel}>GAS</Text>
                      <Text style={styles.modalCellValue}>{fichaModal.ficha.gasTipo}</Text>
                      <Text style={styles.modalCellUnit}>
                        {fichaModal.ficha.gasCantidad ? `${fichaModal.ficha.gasCantidad} oz` : '—'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Componentes */}
                <Text style={styles.modalSectionLabel}>COMPONENTES</Text>
                <View style={styles.modalComponentesCard}>
                  {fichaModal.ficha.componentes.map((c, i) => (
                    <View
                      key={i}
                      style={[
                        styles.modalComponenteRow,
                        i > 0 && styles.modalComponenteRowBorder,
                      ]}
                    >
                      <Text style={styles.modalComponenteNombre}>{c.componente}</Text>
                      <View style={styles.modalComponenteRight}>
                        <View
                          style={[
                            styles.modalEstadoPill,
                            { borderColor: estadoColor[c.estado] ?? COLORS.line },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalEstadoText,
                              { color: estadoColor[c.estado] ?? COLORS.textMuted },
                            ]}
                          >
                            {c.estado}
                          </Text>
                        </View>
                      </View>
                      {!!c.observacion && (
                        <Text style={styles.modalObservacion}>{c.observacion}</Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Notas */}
                {!!fichaModal.ficha.notas && (
                  <>
                    <Text style={styles.modalSectionLabel}>NOTAS</Text>
                    <View style={styles.modalNotasCard}>
                      <Text style={styles.modalNotasText}>{fichaModal.ficha.notas}</Text>
                    </View>
                  </>
                )}
              </ScrollView>
            </>
          )}
          </View>
        </View>
      </Modal>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          onBack={() => navigation.goBack()}
          title="Ficha del vehículo"
          meta={recargando ? 'Actualizando...' : `FICHA · ${vehiculo.placa}`}
        />

        {/* Hero card */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <PlateBlock plate={vehiculo.placa} color={COLORS.blue} size="md" />
            {primeraVisita && (
              <View style={styles.firstVisitPill}>
                <Ionicons name="sparkles" size={12} color={COLORS.orange} />
                <Text style={styles.firstVisitText}>PRIMERA VISITA</Text>
              </View>
            )}
          </View>

          <View style={styles.heroGrid}>
            {/* VEHÍCULO */}
            <View style={styles.heroCell}>
              <Text style={styles.heroLabel}>VEHÍCULO</Text>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {vehiculo.marca} {vehiculo.modelo}
              </Text>
              <Text style={styles.heroMono}>{vehiculo.anio}</Text>
            </View>

            {/* CLIENTE */}
            <View style={styles.heroCell}>
              <Text style={styles.heroLabel}>CLIENTE</Text>
              <View style={styles.heroInlineRow}>
                <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.heroClienteName} numberOfLines={1}>
                  {vehiculo.cliente?.nombre ?? '-'}
                </Text>
              </View>
              <View style={[styles.heroInlineRow, { marginTop: 4 }]}>
                <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.heroClientePhone} numberOfLines={1}>
                  {vehiculo.cliente?.telefono ?? '-'}
                </Text>
              </View>
            </View>

            {/* VISITAS */}
            <View style={styles.heroCell}>
              <Text style={styles.heroLabel}>VISITAS</Text>
              <Text style={styles.heroBigNumber}>{visitasLabel}</Text>
              <Text style={styles.heroSubLabel}>en taller</Text>
            </View>

            {/* ÚLTIMA VISITA */}
            <View style={styles.heroCell}>
              <Text style={styles.heroLabel}>ÚLTIMA VISITA</Text>
              <Text style={styles.heroDate}>{ultimaVisita}</Text>
              <Text style={styles.heroSubLabel}>{hace ?? '-'}</Text>
            </View>
          </View>
        </View>

        {/* Plan de revisiones */}
        {tienePlan && (
          <View style={styles.planWrap}>
            {/* Section header con progreso global */}
            <View style={styles.planSectionHeader}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.blue} />
              <Text style={styles.planSectionLabel}>PLAN DE REVISIONES</Text>
              <View style={styles.planSectionDivider} />
              <Text style={styles.planSectionMeta}>{hechas}/{total} COMPLETADAS</Text>
            </View>

            {/* Barra de progreso global */}
            <View style={styles.globalProgressTrack}>
              <View style={[styles.globalProgressFill, { width: `${progresoPct}%` as `${number}%` }]} />
            </View>

            {/* Acordeón — un card por ciclo */}
            {cycles.map((cycleRevisions, cycleIdx) => {
              const isLast = cycleIdx === cycles.length - 1;
              const isExpanded = expandedCycles.has(cycleIdx);
              const cycleHechas = cycleRevisions.filter(p => p.estado === 'Completada').length;
              const cycleTotal = cycleRevisions.length;
              const cycleCompleto = cycleHechas === cycleTotal;
              const cycleNum = cycleIdx + 1;

              // Badge color for collapsed summary
              const badgeColor = cycleCompleto
                ? COLORS.green
                : isLast
                  ? COLORS.blue
                  : COLORS.textMuted;
              const badgeBg = cycleCompleto
                ? COLORS.greenSoft
                : isLast
                  ? COLORS.blueSoft
                  : 'transparent';

              return (
                <View
                  key={cycleIdx}
                  style={[
                    styles.planCard,
                    cycleIdx < cycles.length - 1 && styles.planCardOld,
                    { marginBottom: 10 },
                  ]}
                >
                  {/* Accordion header — always visible */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleCycle(cycleIdx)}
                    style={[
                      styles.planCardHeader,
                      isExpanded && styles.planCardHeaderExpanded,
                    ]}
                  >
                    {/* Left: plan number + status badge */}
                    <View style={styles.planCardHeaderLeft}>
                      <View style={[styles.cycleNumBadge, { backgroundColor: badgeBg, borderColor: badgeColor }]}>
                        <Text style={[styles.cycleNumText, { color: badgeColor }]}>
                          #{cycleNum}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planCardTitle} numberOfLines={1}>
                          {isLast && !cycleCompleto
                            ? 'Plan activo'
                            : cycleCompleto
                              ? `Plan completo`
                              : `Plan #${cycleNum}`}
                        </Text>
                        <Text style={styles.planCardSubtitle}>
                          {cycleHechas}/{cycleTotal} revisiones completadas
                        </Text>
                      </View>
                    </View>

                    {/* Right: mini progress dots + chevron */}
                    <View style={styles.planCardHeaderRight}>
                      <View style={styles.dotRow}>
                        {cycleRevisions.map((p, di) => (
                          <View
                            key={di}
                            style={[
                              styles.dot,
                              p.estado === 'Completada' && styles.dotDone,
                              p.estado === 'EnProceso' && styles.dotInProgress,
                            ]}
                          />
                        ))}
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={COLORS.textMuted}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Accordion body — stepper */}
                  {isExpanded && (
                    <View>
                      {cycleRevisions.map((p, i) => {
                        const state = estadoPaso(p, cycleRevisions);
                        const esActive = state === 'active';
                        const esDone = state === 'done';
                        const esLocked = state === 'locked';

                        return (
                          <TouchableOpacity
                            key={p.id}
                            activeOpacity={esDone ? 0.7 : 1}
                            onPress={() => esDone && abrirFicha(p)}
                            disabled={esLocked}
                            style={[
                              styles.stepRow,
                              styles.stepRowBorder,
                              esActive && styles.stepRowActive,
                              esLocked && styles.stepRowLocked,
                            ]}
                          >
                            {/* Circle */}
                            <View
                              style={[
                                styles.stepCircle,
                                esActive && styles.stepCircleActive,
                                esDone && styles.stepCircleDone,
                                esLocked && styles.stepCircleLocked,
                              ]}
                            >
                              {esDone ? (
                                <Ionicons name="checkmark" size={16} color={COLORS.textDark} />
                              ) : (
                                <Text
                                  style={[
                                    styles.stepNumber,
                                    esActive && styles.stepNumberActive,
                                    esLocked && styles.stepNumberLocked,
                                  ]}
                                >
                                  {p.numero}
                                </Text>
                              )}
                            </View>

                            {/* Label + meta */}
                            <View style={styles.stepBody}>
                              <View style={styles.stepLabelRow}>
                                {esLocked && (
                                  <Ionicons
                                    name="lock-closed"
                                    size={12}
                                    color={COLORS.textMuted}
                                    style={{ marginRight: 4 }}
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.stepLabel,
                                    esActive && styles.stepLabelActive,
                                    esLocked && styles.stepLabelLocked,
                                  ]}
                                >
                                  {LABEL_PASO[p.numero] ?? `Revisión ${p.numero}`}
                                </Text>
                              </View>
                              <Text style={styles.stepMeta}>
                                {esDone
                                  ? `Completada · ${formatearFecha(p.fechaCompletada)}`
                                  : p.estado === 'EnProceso'
                                    ? 'En proceso — orden activa en taller'
                                    : esActive
                                      ? `Programada · ${formatearFecha(p.fechaProgramada)}`
                                      : 'Esperando revisión anterior'}
                              </Text>
                            </View>

                            {/* Side action */}
                            {puedeRegistrar(p, cycleRevisions) && (
                              <TouchableOpacity
                                style={styles.stepCta}
                                activeOpacity={0.85}
                                onPress={() => registrarPaso(p)}
                              >
                                <Text style={styles.stepCtaText}>Registrar</Text>
                                <Ionicons name="arrow-forward" size={12} color={COLORS.textDark} />
                              </TouchableOpacity>
                            )}
                            {p.estado === 'EnProceso' && (
                              <View style={styles.stepInProgress}>
                                <Ionicons name="time-outline" size={12} color={COLORS.orange} />
                                <Text style={styles.stepInProgressText}>En taller</Text>
                              </View>
                            )}
                            {esDone && (
                              <Text style={styles.stepDoneHint}>Ver</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

          </View>
        )}

        {/* Si no tiene plan, un hint discreto */}
        {!tienePlan && (
          <View style={styles.emptyPlan}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.emptyPlanText}>
              Sin plan de revisiones activo. Se creará automáticamente al registrar un servicio que lo requiera.
            </Text>
          </View>
        )}

        {/* Sticky CTA al final del scroll */}
        <StickyCTA>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('NuevaOrden', { vehiculo })}
          >
            <Ionicons name="checkmark" size={18} color={COLORS.textDark} />
            <Text style={styles.ctaBtnText}>Registrar nuevo ingreso</Text>
          </TouchableOpacity>
        </StickyCTA>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ─── Hero ────────────────────────────────────────────────────────
  hero: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  firstVisitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  firstVisitText: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
    paddingTop: 16,
    marginHorizontal: -8,
  },
  heroCell: {
    width: '50%',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  heroLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  heroMono: {
    fontSize: 13,
    color: COLORS.textDim,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  heroInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroClienteName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  heroClientePhone: {
    fontSize: 12,
    color: COLORS.textDim,
    fontFamily: 'monospace',
    flexShrink: 1,
  },
  heroBigNumber: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.blue,
    letterSpacing: -1,
    lineHeight: 30,
  },
  heroSubLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  heroDate: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  // ─── Plan de revisiones ──────────────────────────────────────────
  planWrap: {
    marginBottom: 18,
  },
  planSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  planSectionLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: COLORS.textDim,
    textTransform: 'uppercase',
  },
  planSectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lineSoft,
  },
  planSectionMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  // Global thin progress bar under section header
  globalProgressTrack: {
    height: 4,
    backgroundColor: COLORS.bg3,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  globalProgressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 2,
  },

  planCard: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  // Older cycles get a slightly muted border to visually recede
  planCardOld: {
    borderColor: COLORS.lineSoft,
    opacity: 0.85,
  },
  planCardHeader: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  planCardHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  planCardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  planCardSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Cycle number badge (#1, #2, …)
  cycleNumBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  cycleNumText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  // Mini dot indicators (one per revision in the cycle)
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  dotDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  dotInProgress: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  // Legacy — kept for compatibility if referenced elsewhere
  planProgressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    width: 100,
    height: 6,
    backgroundColor: COLORS.bg3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 3,
  },
  planProgressCount: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.textMuted,
    minWidth: 28,
    textAlign: 'right',
  },

  // Stepper
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  stepRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  stepRowActive: {
    backgroundColor: 'rgba(0,200,255,0.06)',
  },
  stepRowLocked: {
    opacity: 0.6,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  stepCircleDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  stepCircleLocked: {
    backgroundColor: COLORS.bg3,
    borderColor: COLORS.line,
  },
  stepNumber: {
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 13,
    color: COLORS.textDim,
  },
  stepNumberActive: {
    color: COLORS.textDark,
  },
  stepNumberLocked: {
    color: COLORS.textMuted,
  },
  stepBody: {
    flex: 1,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  stepLabelActive: {
    color: COLORS.blue,
  },
  stepLabelLocked: {
    color: COLORS.textMuted,
  },
  stepMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  stepCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  stepCtaText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stepDoneHint: {
    fontSize: 11,
    color: COLORS.green,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepInProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.orangeSoft,
    borderWidth: 1,
    borderColor: COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stepInProgressText: {
    fontSize: 11,
    color: COLORS.orange,
    fontWeight: '700',
  },

  // Empty state (sin plan)
  emptyPlan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    backgroundColor: COLORS.bg2,
  },
  emptyPlanText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },

  // ─── Modal ficha ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalSheet: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 20,
    // paddingBottom cubre home indicator (≥34px) + margen propio
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.line,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.line,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalClose: {
    // hitSlop aplicado inline; este style solo posiciona
    marginTop: 2,
  },
  modalCloseInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 10,
    marginTop: 4,
  },
  // Grid 2 columnas con margen explícito para evitar problemas de flexWrap + gap
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginHorizontal: -4,
  },
  modalCell: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  modalCellInner: {
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 12,
  },
  modalCellLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalCellValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.blue,
    fontFamily: 'monospace',
    letterSpacing: -1,
  },
  modalCellUnit: {
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 2,
  },
  modalComponentesCard: {
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalComponenteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
  },
  modalComponenteRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  modalComponenteNombre: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    marginRight: 8,
  },
  modalComponenteRight: {
    alignItems: 'flex-end',
  },
  modalEstadoPill: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalEstadoText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalObservacion: {
    width: '100%',
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
    paddingLeft: 2,
  },
  modalNotasCard: {
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  modalNotasText: {
    fontSize: 13,
    color: COLORS.textDim,
    lineHeight: 20,
  },

  // ─── Sticky CTA ──────────────────────────────────────────────────
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.blue,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 52,
  },
  ctaBtnText: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
