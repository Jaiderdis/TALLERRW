import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/AppNavigator';
import { registrarFicha } from '../api/revisiones';
import { llamarApi } from '../api/apiHelper';
import { COLORS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Section from '../components/Section';
import StickyCTA from '../components/StickyCTA';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FichaRevision'>;
  route: RouteProp<RootStackParamList, 'FichaRevision'>;
};

type EstadoComponente = 'Bien' | 'Regular' | 'Mal';

interface ComponenteItem {
  nombre: string;
  estado: EstadoComponente | null;
  observacion: string;
}

const COMPONENTES_DEFAULT: string[] = [
  'Compresor',
  'Condensador',
  'Evaporador',
  'Válvula de expansión',
  'Filtro secador',
  'Ventilador condensador',
  'Ventilador evaporador',
  'Mangueras y conexiones',
  'Termostato / control',
];

const ESTADOS: Array<{
  key: EstadoComponente;
  color: string;
  softColor: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { key: 'Bien',    color: COLORS.green,  softColor: COLORS.greenSoft,  icon: 'checkmark-circle' },
  { key: 'Regular', color: COLORS.orange, softColor: COLORS.orangeSoft, icon: 'alert-circle' },
  { key: 'Mal',     color: COLORS.red,    softColor: COLORS.redSoft,    icon: 'close-circle' },
];

export default function FichaRevisionScreen({ navigation, route }: Props) {
  const { planId, ordenId, tecnicoId } = route.params;

  const [guardando, setGuardando] = useState(false);
  const [presionAlta, setPresionAlta] = useState('');
  const [presionBaja, setPresionBaja] = useState('');
  const [tempSalida, setTempSalida]   = useState('');
  const [gasTipo, setGasTipo]         = useState('');
  const [gasCantidad, setGasCantidad] = useState('');
  const [notas, setNotas]             = useState('');
  const [componentes, setComponentes] = useState<ComponenteItem[]>(
    COMPONENTES_DEFAULT.map((nombre) => ({ nombre, estado: null, observacion: '' }))
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const setEstado = (index: number, estado: EstadoComponente) =>
    setComponentes((prev) => prev.map((c, i) => (i === index ? { ...c, estado } : c)));

  const setObservacion = (index: number, observacion: string) =>
    setComponentes((prev) => prev.map((c, i) => (i === index ? { ...c, observacion } : c)));

  const marcarTodos = (estado: EstadoComponente) =>
    setComponentes((prev) => prev.map((c) => ({ ...c, estado })));

  const todosEvaluados = componentes.every((c) => c.estado !== null);

  const canSave =
    presionAlta.length > 0 &&
    presionBaja.length > 0 &&
    tempSalida.length > 0 &&
    gasTipo.trim().length > 0 &&
    todosEvaluados &&
    !guardando;

  const guardar = async () => {
    Keyboard.dismiss();
    setGuardando(true);
    try {
      const result = await llamarApi(() =>
        registrarFicha({
          planId,
          ordenId,
          tecnicoId,
          presionAlta: parseFloat(presionAlta),
          presionBaja: parseFloat(presionBaja),
          tempSalida: parseFloat(tempSalida),
          gasTipo: gasTipo.trim(),
          gasCantidad: gasCantidad ? parseFloat(gasCantidad) : null,
          notas: notas.trim(),
          componentes: componentes.map((c) => ({
            componente: c.nombre,
            estado: c.estado!,
            observacion: c.observacion.trim(),
          })),
        })
      );

      if (result.success) {
        Toast.show({ type: 'success', text1: 'Ficha registrada', text2: result.message });
        navigation.reset({ index: 1, routes: [{ name: 'BuscarPlaca' }, { name: 'OrdenesHoy' }] });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: result.message || result.errors?.[0] });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Sin conexión', text2: 'No se pudo conectar con el servidor' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.flex}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={Keyboard.dismiss}
          >
            <ScreenHeader
              onBack={() => navigation.goBack()}
              title="Ficha de revisión"
              meta={`REVISIÓN #${planId}`}
              accent={COLORS.blue}
            />

            {/* Mediciones */}
            <Section title="Mediciones del sistema" icon="speedometer-outline">
              <View style={styles.grid3}>
                <View style={styles.col}>
                  <Text style={styles.label}>Presión alta <Text style={styles.unit}>(psi)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={presionAlta}
                    onChangeText={(t) => setPresionAlta(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={COLORS.textDim}
                    selectionColor={COLORS.blue}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Presión baja <Text style={styles.unit}>(psi)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={presionBaja}
                    onChangeText={(t) => setPresionBaja(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={COLORS.textDim}
                    selectionColor={COLORS.blue}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Temp. salida <Text style={styles.unit}>(°C)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={tempSalida}
                    onChangeText={(t) => setTempSalida(t.replace(/[^0-9.\-]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={COLORS.textDim}
                    selectionColor={COLORS.blue}
                  />
                </View>
              </View>

              <View style={styles.grid2}>
                <View style={styles.colWide}>
                  <Text style={styles.label}>
                    Tipo de gas <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={gasTipo}
                    onChangeText={setGasTipo}
                    placeholder="Ej: R-134a"
                    placeholderTextColor={COLORS.textDim}
                    selectionColor={COLORS.blue}
                    maxLength={20}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Cantidad <Text style={styles.unit}>(oz)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={gasCantidad}
                    onChangeText={(t) => setGasCantidad(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={COLORS.textDim}
                    selectionColor={COLORS.blue}
                  />
                </View>
              </View>
            </Section>

            {/* Componentes */}
            <Section title="Estado de componentes" icon="construct-outline">
              {/* Selección rápida */}
              <View style={styles.quickRow}>
                <Text style={styles.quickLabel}>Selección rápida:</Text>
                {ESTADOS.map((e) => (
                  <TouchableOpacity
                    key={e.key}
                    activeOpacity={0.8}
                    style={[styles.quickBtn, { borderColor: e.color }]}
                    onPress={() => marcarTodos(e.key)}
                  >
                    <Ionicons name={e.icon} size={13} color={e.color} />
                    <Text style={[styles.quickBtnText, { color: e.color }]}>Todo {e.key}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!todosEvaluados && (
                <View style={styles.banner}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.orange} />
                  <Text style={styles.bannerText}>Evalúa todos los componentes para continuar</Text>
                </View>
              )}

              {componentes.map((comp, i) => (
                <View
                  key={comp.nombre}
                  style={[styles.compCard, i < componentes.length - 1 && styles.compCardBorder]}
                >
                  <View style={styles.compRow}>
                    <Text style={styles.compNombre} numberOfLines={1}>{comp.nombre}</Text>
                    <View style={styles.estadosRow}>
                      {ESTADOS.map((e) => {
                        const on = comp.estado === e.key;
                        return (
                          <TouchableOpacity
                            key={e.key}
                            activeOpacity={0.7}
                            style={[styles.estadoBtn, on && { backgroundColor: e.softColor, borderColor: e.color }]}
                            onPress={() => setEstado(i, e.key)}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          >
                            <Ionicons name={e.icon} size={14} color={on ? e.color : COLORS.textMuted} />
                            <Text style={[styles.estadoText, on && { color: e.color, fontWeight: '700' }]}>
                              {e.key}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {comp.estado !== null && comp.estado !== 'Bien' && (
                    <TextInput
                      style={styles.obsInput}
                      value={comp.observacion}
                      onChangeText={(t) => setObservacion(i, t)}
                      placeholder="Observación (opcional)"
                      placeholderTextColor={COLORS.textMuted}
                      selectionColor={COLORS.blue}
                      maxLength={300}
                    />
                  )}
                </View>
              ))}
            </Section>

            {/* Notas */}
            <Section title="Notas generales" icon="document-text-outline">
              <TextInput
                style={[styles.input, styles.textarea]}
                value={notas}
                onChangeText={setNotas}
                multiline
                placeholder="Observaciones adicionales del servicio…"
                placeholderTextColor={COLORS.textDim}
                selectionColor={COLORS.blue}
                textAlignVertical="top"
                maxLength={500}
              />
            </Section>

            <View style={{ height: 8 }} />
          </ScrollView>

          <StickyCTA style={styles.stickyWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.saveBtn, !canSave && styles.saveBtnOff]}
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
                  <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextOff]}>
                    Registrar ficha
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </StickyCTA>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20 },

  grid3: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  grid2: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  col:     { flex: 1, minWidth: 90 },
  colWide: { flex: 2, minWidth: 140 },

  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textDim,
    marginBottom: 6,
  },
  unit: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0,
    textTransform: 'none',
    color: COLORS.textMuted,
  },
  required: { color: COLORS.orange, textTransform: 'none', letterSpacing: 0 },

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
    fontFamily: 'monospace',
  },
  textarea: { minHeight: 90, paddingTop: 13, fontFamily: undefined },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.orangeSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  bannerText: { fontSize: 12, color: COLORS.orange, fontWeight: '500', flex: 1 },

  quickRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 8, marginBottom: 14,
  },
  quickLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginRight: 2 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: COLORS.bg3,
  },
  quickBtnText: { fontSize: 12, fontWeight: '700' },

  compCard: { paddingVertical: 12, gap: 10 },
  compCardBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.lineSoft },
  compRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  compNombre: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },

  estadosRow: { flexDirection: 'row', gap: 6 },
  estadoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.line, backgroundColor: COLORS.bg3,
    minWidth: 60,
  },
  estadoText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  obsInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    minHeight: 40,
  },

  stickyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    minHeight: 52,
  },
  saveBtnOff: { backgroundColor: COLORS.bg3, opacity: 0.7 },
  saveBtnText: { color: COLORS.black, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  saveBtnTextOff: { color: COLORS.textMuted },
});
