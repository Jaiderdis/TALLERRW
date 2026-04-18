import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Vehiculo, CatalogoServicio, Tecnico } from '../types';
import { crearOrden } from '../api/ordenes';
import { llamarApi } from '../api/apiHelper';
import { useNuevaOrdenData } from '../hooks/useNuevaOrdenData';
import { nuevaOrdenSchema } from '../schemas/nuevaOrden';
import { COLORS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Section from '../components/Section';
import StickyCTA from '../components/StickyCTA';
import PlateBlock from '../components/PlateBlock';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NuevaOrden'>;
  route: RouteProp<RootStackParamList, 'NuevaOrden'>;
};

// ---------- Prioridad (solo UI por ahora) ----------
// TODO: el backend acepta el campo `prioridad` como string en CrearOrdenRequest,
// pero se mantiene en UI como enum fijo hasta que haya validación server-side.
type PrioridadKey = 'Normal' | 'Urgente' | 'Inmediato';

const PRIORIDADES: Array<{
  key: PrioridadKey;
  label: string;
  color: string;
  softColor: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { key: 'Normal',    label: 'Normal',    color: COLORS.green,  softColor: 'rgba(46,213,115,0.15)',  icon: 'checkmark-circle' },
  { key: 'Urgente',   label: 'Urgente',   color: COLORS.orange, softColor: 'rgba(255,149,0,0.15)',   icon: 'sparkles' },
  { key: 'Inmediato', label: 'Inmediato', color: COLORS.red,    softColor: 'rgba(229,57,53,0.15)',   icon: 'warning' },
];

interface Errores {
  servicios?: string;
  tecnico?: string;
  km?: string;
}

function formatCOP(n: number): string {
  return '$' + n.toLocaleString('es-CO');
}

function getInitials(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function NuevaOrdenScreen({ navigation, route }: Props) {
  const { vehiculo } = route.params as { vehiculo: Vehiculo };
  const { tecnicos, catalogo, cargando: loading } = useNuevaOrdenData();

  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});

  const [tecnicoId, setTecnicoId] = useState<number | null>(null);
  const [serviciosIds, setServiciosIds] = useState<number[]>([]);
  const [prioridad, setPrioridad] = useState<PrioridadKey>('Normal');
  const [km, setKm] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const scrollRef = useRef<ScrollView>(null);

  // Oculta header nativo — usamos ScreenHeader del diseño
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // ---------- Derivados ----------
  const serviciosSeleccionados = useMemo<CatalogoServicio[]>(
    () => catalogo.filter((s) => serviciosIds.includes(s.id)),
    [catalogo, serviciosIds]
  );

  const total = useMemo(
    () => serviciosSeleccionados.reduce((acc, s) => acc + s.precioBase, 0),
    [serviciosSeleccionados]
  );

  // TODO: si en el futuro `CatalogoServicio` no trae `generaPlanRevision`, evaluar a partir de palabras clave.
  const generaPlan = useMemo(
    () => serviciosSeleccionados.some((s) => s.generaPlanRevision),
    [serviciosSeleccionados]
  );

  const canSave = serviciosIds.length > 0 && km.length > 0 && tecnicoId !== null && !guardando;

  const headerMeta = useMemo(() => {
    const fecha = new Date()
      .toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
      .replace('.', '')
      .toUpperCase();
    return `ORDEN · ${fecha}`;
  }, []);

  const fechaIngresoLabel = useMemo(
    () => new Date().toLocaleDateString('es-CO'),
    []
  );

  // ---------- Handlers ----------
  const toggleServicio = (id: number) => {
    setServiciosIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    if (errores.servicios) setErrores((e) => ({ ...e, servicios: undefined }));
  };

  const validar = (): boolean => {
    const parsed = nuevaOrdenSchema.safeParse({
      serviciosIds,
      tecnicoId: tecnicoId ?? undefined,
      prioridad,
      km,
      observaciones,
    });

    if (!parsed.success) {
      const nuevosErrores: Errores = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errores;
        if (!nuevosErrores[key]) {
          nuevosErrores[key] = issue.message;
        }
      }
      setErrores(nuevosErrores);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }

    setErrores({});
    return true;
  };

  const guardar = async () => {
    Keyboard.dismiss();
    if (!validar()) return;

    const body = {
      vehiculoId: vehiculo.id,
      tecnicoId: tecnicoId as number,
      clienteId: vehiculo.cliente.id,
      empresaId: vehiculo.empresa?.id ?? null,
      prioridad,
      kmIngreso: parseInt(km.trim(), 10),
      observaciones: observaciones || '',
      serviciosIds,
    };

    setGuardando(true);
    try {
      const result = await llamarApi(() => crearOrden(body));
      if (result.success) {
        navigation.reset({
          index: 1,
          routes: [{ name: 'BuscarPlaca' }, { name: 'OrdenesHoy' }],
        });
      } else {
        setErrores({ servicios: result.message });
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch {
      setErrores({ servicios: 'No se pudo conectar con el servidor' });
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Loading state ----------
  if (loading) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.blue} size="large" />
          <Text style={styles.loadingText}>Cargando catálogo…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Render ----------
  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
            <ScrollView
              ref={scrollRef}
              style={styles.container}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <ScreenHeader
                onBack={() => navigation.goBack()}
                title="Nueva orden"
                meta={headerMeta}
                accent={COLORS.blue}
              />

              {/* Vehicle header card */}
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleBorder} />
                <View style={styles.vehicleContent}>
                  <PlateBlock plate={vehiculo.placa} color={COLORS.blue} size="sm" />
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleTitle} numberOfLines={1}>
                      {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                    </Text>
                    <View style={styles.vehicleOwnerRow}>
                      <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.vehicleOwner} numberOfLines={1}>
                        {vehiculo.cliente.nombre}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Servicios */}
              <Section
                title="Tipo de servicio"
                icon="construct-outline"
                error={!!errores.servicios}
                errorSuffix={errores.servicios}
              >
                <View style={styles.serviciosGrid}>
                  {catalogo.map((sv) => {
                    const on = serviciosIds.includes(sv.id);
                    return (
                      <TouchableOpacity
                        key={sv.id}
                        activeOpacity={0.85}
                        style={[styles.servicioBtn, on && styles.servicioBtnOn]}
                        onPress={() => toggleServicio(sv.id)}
                      >
                        <View style={[styles.checkbox, on && styles.checkboxOn]}>
                          {on && (
                            <Ionicons name="checkmark" size={13} color={COLORS.black} />
                          )}
                        </View>
                        <View style={styles.servicioBody}>
                          <Text style={styles.servicioNombre} numberOfLines={2}>
                            {sv.nombre}
                          </Text>
                          <Text
                            style={[
                              styles.servicioPrecio,
                              { color: on ? COLORS.blue : COLORS.textDim },
                            ]}
                          >
                            {formatCOP(sv.precioBase)}
                          </Text>
                          {sv.generaPlanRevision && (
                            <View style={styles.planBadge}>
                              <Ionicons
                                name="calendar-outline"
                                size={10}
                                color={COLORS.orange}
                              />
                              <Text style={styles.planBadgeText}>GENERA PLAN</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Section>

              {/* Prioridad */}
              <Section title="Prioridad" icon="sparkles-outline">
                <View style={styles.prioridadRow}>
                  {PRIORIDADES.map((p) => {
                    const on = prioridad === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        activeOpacity={0.85}
                        style={[
                          styles.prioridadBtn,
                          on && {
                            backgroundColor: p.softColor,
                            borderColor: p.color,
                          },
                        ]}
                        onPress={() => setPrioridad(p.key)}
                      >
                        <Ionicons
                          name={p.icon}
                          size={14}
                          color={on ? p.color : COLORS.textDim}
                        />
                        <Text
                          style={[
                            styles.prioridadText,
                            on && { color: p.color, fontWeight: '700' },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Section>

              {/* Técnico asignado */}
              <Section
                title="Técnico asignado"
                icon="person-outline"
                error={!!errores.tecnico}
                errorSuffix={errores.tecnico}
              >
                {tecnicos.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No hay técnicos disponibles.
                  </Text>
                ) : (
                  <View style={styles.tecnicosRow}>
                    {tecnicos.map((t: Tecnico) => {
                      const on = tecnicoId === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          activeOpacity={0.85}
                          style={[styles.tecnicoChip, on && styles.tecnicoChipOn]}
                          onPress={() => {
                            setTecnicoId(t.id);
                            if (errores.tecnico) {
                              setErrores((e) => ({ ...e, tecnico: undefined }));
                            }
                          }}
                        >
                          <View
                            style={[styles.avatar, on && styles.avatarOn]}
                          >
                            <Text
                              style={[
                                styles.avatarText,
                                { color: on ? COLORS.blue : COLORS.textDim },
                              ]}
                            >
                              {getInitials(t.nombre)}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.tecnicoText,
                              on && styles.tecnicoTextOn,
                            ]}
                            numberOfLines={1}
                          >
                            {t.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Section>

              {/* Detalles */}
              <Section title="Detalles" icon="document-text-outline">
                <View style={styles.detailsGrid}>
                  <View style={styles.detailsCol}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        !!errores.km && styles.fieldLabelError,
                      ]}
                    >
                      Kilometraje actual
                      <Text style={styles.required}> *</Text>
                      {errores.km ? (
                        <Text style={styles.fieldLabelErrorSuffix}>
                          {' — '}
                          {errores.km}
                        </Text>
                      ) : null}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputMono,
                        !!errores.km && styles.inputError,
                      ]}
                      value={km}
                      onChangeText={(text) => {
                        setKm(text.replace(/\D/g, ''));
                        if (errores.km) {
                          setErrores((e) => ({ ...e, km: undefined }));
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="Ej: 37000"
                      placeholderTextColor={COLORS.textDim}
                      selectionColor={COLORS.blue}
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.detailsCol}>
                    <Text style={styles.fieldLabel}>Fecha de ingreso</Text>
                    <View style={[styles.input, styles.inputReadonly]}>
                      <Text style={[styles.inputReadonlyText, styles.inputMono]}>
                        {fechaIngresoLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Observaciones</Text>
                  <TextInput
                    style={[styles.input, styles.inputTextarea]}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    multiline
                    placeholder="Descripción del problema, solicitudes especiales…"
                    placeholderTextColor={COLORS.textDim}
                    selectionColor={COLORS.blue}
                    textAlignVertical="top"
                  />
                </View>
              </Section>

              {/* Spacer para que StickyCTA no tape contenido */}
              <View style={{ height: 8 }} />
            </ScrollView>

            {/* StickyCTA — fuera del ScrollView para anclarlo abajo */}
            <StickyCTA style={styles.stickyWrap}>
              <View style={styles.ctaBar}>
                <View style={styles.ctaSummary}>
                  <View style={styles.ctaMetric}>
                    <Text style={styles.ctaMetricLabel}>SERVICIOS</Text>
                    <Text style={styles.ctaMetricValue}>
                      {String(serviciosIds.length).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={styles.ctaMetric}>
                    <Text style={styles.ctaMetricLabel}>TOTAL</Text>
                    <Text
                      style={[
                        styles.ctaMetricValue,
                        { color: COLORS.blue },
                      ]}
                      numberOfLines={1}
                    >
                      {formatCOP(total)}
                    </Text>
                  </View>
                  {generaPlan && (
                    <View style={styles.ctaPlanPill}>
                      <Ionicons
                        name="calendar-outline"
                        size={11}
                        color={COLORS.orange}
                      />
                      <Text style={styles.ctaPlanPillText}>GENERA PLAN</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                  onPress={guardar}
                  disabled={!canSave}
                >
                  {guardando ? (
                    <ActivityIndicator color={COLORS.black} size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color={canSave ? COLORS.black : COLORS.textMuted}
                      />
                      <Text
                        style={[
                          styles.saveBtnText,
                          !canSave && styles.saveBtnTextDisabled,
                        ]}
                      >
                        Registrar ingreso
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </StickyCTA>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 13,
  },

  // Vehicle header card
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    marginBottom: 22,
    overflow: 'hidden',
  },
  vehicleBorder: {
    width: 4,
    backgroundColor: COLORS.blue,
  },
  vehicleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  vehicleInfo: {
    flex: 1,
    minWidth: 140,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  vehicleOwnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  vehicleOwner: {
    fontSize: 13,
    color: COLORS.textDim,
  },

  // Servicios grid
  serviciosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  servicioBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 200,
    backgroundColor: COLORS.bg3,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 14,
  },
  servicioBtnOn: {
    backgroundColor: COLORS.blueSoft,
    borderColor: COLORS.blue,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  servicioBody: {
    flex: 1,
  },
  servicioNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 17,
  },
  servicioPrecio: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
  },
  planBadgeText: {
    fontSize: 9,
    color: COLORS.orange,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // Prioridad
  prioridadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioridadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bg3,
  },
  prioridadText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Técnicos
  tecnicosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tecnicoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingVertical: 6,
    paddingHorizontal: 10,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bg3,
  },
  tecnicoChipOn: {
    backgroundColor: COLORS.blueSoft,
    borderColor: COLORS.blue,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  avatarOn: {
    borderColor: COLORS.blue,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tecnicoText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  tecnicoTextOn: {
    color: COLORS.blue,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // Detalles
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  detailsCol: {
    flex: 1,
    minWidth: 140,
  },
  formGroup: {
    marginTop: 0,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textDim,
    marginBottom: 6,
  },
  fieldLabelError: {
    color: COLORS.danger,
  },
  fieldLabelErrorSuffix: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
  },
  required: {
    color: COLORS.orange,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 48,
  },
  inputMono: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  inputReadonly: {
    justifyContent: 'center',
    backgroundColor: COLORS.bg3,
  },
  inputReadonlyText: {
    color: COLORS.textDim,
    fontSize: 15,
  },
  inputTextarea: {
    minHeight: 90,
    paddingTop: 13,
  },

  // StickyCTA
  stickyWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 0,
    paddingTop: 12,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 12,
    flexWrap: 'wrap',
  },
  ctaSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 180,
    flexWrap: 'wrap',
  },
  ctaMetric: {
    gap: 2,
  },
  ctaMetricLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  ctaMetricValue: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  ctaPlanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ctaPlanPillText: {
    fontSize: 10,
    color: COLORS.orange,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    minHeight: 48,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.bg3,
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveBtnTextDisabled: {
    color: COLORS.textMuted,
  },
});
