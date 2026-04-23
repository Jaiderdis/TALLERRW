import React, { useLayoutEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/AppNavigator';
import { crearOrden } from '../api/ordenes';
import { llamarApi } from '../api/apiHelper';
import { useNuevaOrdenData } from '../hooks/useNuevaOrdenData';
import { Tecnico } from '../types';
import { COLORS } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Section from '../components/Section';
import StickyCTA from '../components/StickyCTA';
import PlateBlock from '../components/PlateBlock';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IniciarRevision'>;
  route: RouteProp<RootStackParamList, 'IniciarRevision'>;
};

function getInitials(nombre: string): string {
  return nombre.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function IniciarRevisionScreen({ navigation, route }: Props) {
  const { planId, vehiculo } = route.params;
  const { tecnicos, cargando } = useNuevaOrdenData();

  const [guardando, setGuardando] = useState(false);
  const [tecnicoId, setTecnicoId] = useState<number | null>(null);
  const [km, setKm] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const canSave = tecnicoId !== null && km.length > 0 && !guardando;

  const iniciar = async () => {
    Keyboard.dismiss();
    if (!tecnicoId || !km) return;

    setGuardando(true);
    try {
      const result = await llamarApi(() =>
        crearOrden({
          vehiculoId: vehiculo.id,
          tecnicoId,
          clienteId: vehiculo.cliente.id,
          empresaId: vehiculo.empresa?.id ?? null,
          prioridad: 'Normal',
          kmIngreso: parseInt(km.trim(), 10),
          observaciones: observaciones.trim() || `Revisión de plan #${planId}`,
          serviciosIds: [],
          esRevision: true,
          planRevisionId: planId,
        })
      );

      if (result.success) {
        Toast.show({ type: 'success', text1: 'Revisión iniciada', text2: 'Aparece en órdenes del día' });
        navigation.reset({
          index: 1,
          routes: [{ name: 'BuscarPlaca' }, { name: 'OrdenesHoy' }],
        });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: result.message || result.errors?.[0] });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Sin conexión', text2: 'No se pudo conectar con el servidor' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.blue} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.flex}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={Keyboard.dismiss}
          >
            <ScreenHeader
              onBack={() => navigation.goBack()}
              title="Iniciar revisión"
              meta={`PLAN · REVISIÓN #${planId}`}
              accent={COLORS.blue}
            />

            {/* Info del plan */}
            <View style={styles.planBanner}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.blue} />
              <View style={styles.planBannerText}>
                <Text style={styles.planBannerTitle}>Revisión de plan de mantenimiento</Text>
                <Text style={styles.planBannerSub}>
                  Al iniciar se crea una orden del día. Puedes agregar servicios extra desde órdenes.
                </Text>
              </View>
            </View>

            {/* Vehículo */}
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

            {/* Técnico */}
            <Section title="Técnico asignado" icon="person-outline">
              {tecnicos.length === 0 ? (
                <Text style={styles.emptyText}>No hay técnicos disponibles.</Text>
              ) : (
                <View style={styles.tecnicosRow}>
                  {tecnicos.map((t: Tecnico) => {
                    const on = tecnicoId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        activeOpacity={0.85}
                        style={[styles.tecnicoChip, on && styles.tecnicoChipOn]}
                        onPress={() => setTecnicoId(t.id)}
                      >
                        <View style={[styles.avatar, on && styles.avatarOn]}>
                          <Text style={[styles.avatarText, { color: on ? COLORS.blue : COLORS.textDim }]}>
                            {getInitials(t.nombre)}
                          </Text>
                        </View>
                        <Text style={[styles.tecnicoText, on && styles.tecnicoTextOn]} numberOfLines={1}>
                          {t.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Section>

            {/* KM */}
            <Section title="Kilometraje actual" icon="speedometer-outline">
              <TextInput
                style={styles.input}
                value={km}
                onChangeText={(t) => setKm(t.replace(/\D/g, ''))}
                keyboardType="numeric"
                placeholder="Ej: 38000"
                placeholderTextColor={COLORS.textDim}
                selectionColor={COLORS.blue}
                maxLength={10}
              />
            </Section>

            {/* Observaciones */}
            <Section title="Observaciones" icon="document-text-outline">
              <TextInput
                style={[styles.input, styles.textarea]}
                value={observaciones}
                onChangeText={setObservaciones}
                multiline
                placeholder={`Revisión de plan #${planId}…`}
                placeholderTextColor={COLORS.textDim}
                selectionColor={COLORS.blue}
                textAlignVertical="top"
                onFocus={() => setTimeout(() => {}, 300)}
              />
            </Section>

            <View style={{ height: 8 }} />
          </ScrollView>

          <StickyCTA style={styles.stickyWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.saveBtn, !canSave && styles.saveBtnOff]}
              onPress={iniciar}
              disabled={!canSave}
            >
              {guardando ? (
                <ActivityIndicator color={COLORS.black} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={16} color={canSave ? COLORS.black : COLORS.textMuted} />
                  <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextOff]}>
                    Iniciar revisión
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  planBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.blueSoft, borderWidth: 1, borderColor: COLORS.blue,
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  planBannerText: { flex: 1, gap: 4 },
  planBannerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
  planBannerSub: { fontSize: 12, color: COLORS.textDim, lineHeight: 17 },

  vehicleCard: {
    flexDirection: 'row', backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, marginBottom: 22, overflow: 'hidden',
  },
  vehicleBorder: { width: 4, backgroundColor: COLORS.blue },
  vehicleContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingVertical: 14, paddingHorizontal: 16, flexWrap: 'wrap',
  },
  vehicleInfo: { flex: 1, minWidth: 140 },
  vehicleTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  vehicleOwnerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  vehicleOwner: { fontSize: 13, color: COLORS.textDim },

  tecnicosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tecnicoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    minHeight: 40, paddingVertical: 6, paddingHorizontal: 10, paddingRight: 14,
    borderRadius: 999, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.bg3,
  },
  tecnicoChipOn: { backgroundColor: COLORS.blueSoft, borderColor: COLORS.blue },
  avatar: {
    width: 26, height: 26, borderRadius: 999, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line,
  },
  avatarOn: { borderColor: COLORS.blue },
  avatarText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  tecnicoText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  tecnicoTextOn: { color: COLORS.blue, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },

  input: {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text, minHeight: 48, fontFamily: 'monospace',
  },
  textarea: { minHeight: 80, paddingTop: 13, fontFamily: undefined },

  stickyWrap: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.lineSoft,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: COLORS.blue, minHeight: 52,
  },
  saveBtnOff: { backgroundColor: COLORS.bg3, opacity: 0.7 },
  saveBtnText: { color: COLORS.black, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  saveBtnTextOff: { color: COLORS.textMuted },
});
