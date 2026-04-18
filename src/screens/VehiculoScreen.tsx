import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Vehiculo, PlanRevision } from '../types';
import { COLORS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import PlateBlock from '../components/PlateBlock';
import StickyCTA from '../components/StickyCTA';

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

export default function VehiculoScreen({ navigation, route }: Props) {
  const vehiculo: Vehiculo = route.params.vehiculo;

  const primeraVisita = vehiculo.totalVisitas <= 1;

  // Plan de revisiones: detectamos el paso activo (primer "Pendiente")
  const planes = vehiculo.planesRevision ?? [];
  const total = planes.length;
  const hechas = planes.filter(p => p.estado === 'Completada').length;
  const tienePlan = total > 0;
  const progresoPct = total > 0 ? (hechas / total) * 100 : 0;
  const primerPendienteId = planes.find(p => p.estado === 'Pendiente')?.id ?? null;

  const estadoPaso = (p: PlanRevision): PasoEstado => {
    if (p.estado === 'Completada') return 'done';
    if (p.id === primerPendienteId) return 'active';
    return 'locked';
  };

  const abrirFicha = (p: PlanRevision) => {
    // Ver detalle de una revisión completada
    if (p.estado === 'Completada' && p.ficha) {
      Alert.alert(
        `Revisión ${p.numero}`,
        `Fecha: ${formatearFecha(p.fechaCompletada)}\n` +
          `Presión alta: ${p.ficha.presionAlta} psi\n` +
          `Presión baja: ${p.ficha.presionBaja} psi\n` +
          `Temp. salida: ${p.ficha.tempSalida}°C\n` +
          `Gas: ${p.ficha.gasTipo}${p.ficha.gasCantidad ? ` · ${p.ficha.gasCantidad}g` : ''}\n\n` +
          `${p.ficha.notas}`
      );
    }
  };

  const registrarPaso = (_p: PlanRevision) => {
    // TODO: navegar a FichaRevision cuando la pantalla esté lista.
    // navigation.navigate('FichaRevision', { planId: p.id, ordenId: ?, vehiculoId: vehiculo.id });
    Alert.alert('Registrar revisión', 'La ficha de revisión estará disponible próximamente.');
  };

  // TODO: backend no devuelve un contador separado "visitas en taller"; usamos totalVisitas.
  const visitasLabel = String(vehiculo.totalVisitas ?? 0).padStart(2, '0');
  const ultimaVisita = formatearFecha(vehiculo.ultimaVisita);
  const hace = diasDesde(vehiculo.ultimaVisita);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          onBack={() => navigation.goBack()}
          title="Ficha del vehículo"
          meta={`FICHA · ${vehiculo.placa}`}
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
            {/* Section header con progreso */}
            <View style={styles.planSectionHeader}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.blue} />
              <Text style={styles.planSectionLabel}>PLAN DE REVISIONES</Text>
              <View style={styles.planSectionDivider} />
              <Text style={styles.planSectionMeta}>{hechas}/{total} COMPLETADAS</Text>
            </View>

            {/* Card de plan */}
            <View style={styles.planCard}>
              <View style={styles.planCardHeader}>
                <Text style={styles.planCardTitle}>
                  {hechas === total ? 'Plan completo' : 'Plan de Revisiones AC'}
                </Text>
                <View style={styles.planProgressGroup}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progresoPct}%` as `${number}%` }]} />
                  </View>
                  <Text style={styles.planProgressCount}>{hechas}/{total}</Text>
                </View>
              </View>

              {/* Stepper vertical */}
              {planes.map((p, i) => {
                const state = estadoPaso(p);
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
                      i > 0 && styles.stepRowBorder,
                      esActive && styles.stepRowActive,
                      esLocked && styles.stepRowLocked,
                    ]}
                  >
                    {/* Circle del paso */}
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
                          : esActive
                            ? `Programada · ${formatearFecha(p.fechaProgramada)}`
                            : 'Esperando revisión anterior'}
                      </Text>
                    </View>

                    {/* Acción lateral */}
                    {esActive && (
                      <TouchableOpacity
                        style={styles.stepCta}
                        activeOpacity={0.85}
                        onPress={() => registrarPaso(p)}
                      >
                        <Text style={styles.stepCtaText}>Registrar</Text>
                        <Ionicons name="arrow-forward" size={12} color={COLORS.textDark} />
                      </TouchableOpacity>
                    )}
                    {esDone && (
                      <Text style={styles.stepDoneHint}>Ver</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botón dashed "Nuevo plan" */}
            <TouchableOpacity
              style={styles.dashedBtn}
              activeOpacity={0.75}
              onPress={() =>
                Alert.alert('Nuevo plan', 'Esta acción se creará al registrar una orden con un servicio que genere plan.')
              }
            >
              <Ionicons name="add" size={14} color={COLORS.blue} />
              <Text style={styles.dashedBtnText}>NUEVO PLAN DE SERVICIO</Text>
            </TouchableOpacity>
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
  planCard: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  planCardHeader: {
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
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

  // Botón dashed "Nuevo plan"
  dashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    backgroundColor: 'transparent',
  },
  dashedBtnText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
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
