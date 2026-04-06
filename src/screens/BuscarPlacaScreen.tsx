import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { buscarPorPlaca } from '../api/vehiculos';
import { llamarApi } from '../api/apiHelper';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BuscarPlaca'>;
};

const WIDE_KEY_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const COMPACT_KEY_ROWS = [
  ['1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T'],
  ['Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G'],
  ['H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V'],
  ['B', 'N', 'M'],
];

const MAX_PLATE_LENGTH = 6;

export default function BuscarPlacaScreen({ navigation }: Props) {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const { width, height } = useWindowDimensions();

  const shortestSide = Math.min(width, height);
  const longestSide = Math.max(width, height);
  const isTablet = shortestSide >= 600 && longestSide >= 900;
  const isSplitLayout = isTablet && width >= 1180;
  const useCompactKeyboard = width < 980;
  const isCompact = width < 900;
  const keyRows = useCompactKeyboard ? COMPACT_KEY_ROWS : WIDE_KEY_ROWS;
  const canSearch = placa.trim().length === MAX_PLATE_LENGTH;
  const titleSize = isCompact ? 30 : 34;
  const slotHeight = isCompact ? 74 : 92;
  const keyHeight = useCompactKeyboard ? 58 : 82;
  const keyFontSize = isCompact ? 22 : 28;
  const slotFontSize = isCompact ? 28 : 34;

  const plateSlots = useMemo(
    () => Array.from({ length: MAX_PLATE_LENGTH }, (_, index) => placa[index] ?? ''),
    [placa]
  );

  const buscar = async () => {
    const placaNormalizada = placa.toUpperCase().trim();

    if (placaNormalizada.length !== MAX_PLATE_LENGTH) {
      Alert.alert('Error', 'Ingresa una placa completa de 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result =  await llamarApi(() => buscarPorPlaca(placaNormalizada));

      if (result.success) {
        navigation.navigate('Vehiculo', { vehiculo: result.data });
      } else {
        navigation.navigate('NuevoVehiculo', { placa: placaNormalizada });
      }
    } catch (error) {
      navigation.navigate('NuevoVehiculo', { placa: placaNormalizada });
    } finally {
      setLoading(false);
    }
  };

  const agregarCaracter = (char: string) => {
    if (loading || placa.length >= MAX_PLATE_LENGTH) {
      return;
    }

    setPlaca(current => `${current}${char}`);
  };

  const borrarUltimo = () => {
    if (loading) {
      return;
    }

    setPlaca(current => current.slice(0, -1));
  };

  const limpiar = () => {
    if (loading) {
      return;
    }

    setPlaca('');
  };

  const actualizarPlaca = (texto: string) => {
    const placaLimpia = texto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, MAX_PLATE_LENGTH);
    setPlaca(placaLimpia);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, isSplitLayout && styles.contentSplit]}>
          <View style={[styles.lookupPanel, isSplitLayout && styles.lookupPanelSplit]}>
            <Text style={[styles.title, { fontSize: titleSize }]}>INGRESO{'\n'}VEHICULO</Text>
            <Text style={styles.subtitle}>Placa de 6 caracteres</Text>

            <View style={styles.plateCard}>
              <Text style={styles.sectionLabel}>PLACA</Text>

              {isTablet ? (
                <View style={styles.slotRow}>
                  {plateSlots.map((char, index) => (
                    <View
                      key={`slot-${index}`}
                      style={[
                        styles.slot,
                        { minHeight: slotHeight },
                        index === 3 && styles.slotBreak,
                        index === placa.length && styles.slotActive,
                      ]}
                    >
                      <Text style={[styles.slotText, { fontSize: slotFontSize }]}>
                        {char || '-'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={styles.mobileInput}
                  value={placa}
                  onChangeText={actualizarPlaca}
                  placeholder="ABC123"
                  placeholderTextColor="#527089"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={MAX_PLATE_LENGTH}
                  editable={!loading}
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    if (canSearch) {
                      void buscar();
                    }
                  }}
                />
              )}
            </View>

            {/* Accesos solo en tablet */}
            {isTablet && (
            <View style={styles.shortcutsCard}>
              <Text style={styles.shortcutsTitle}>ACCESOS</Text>

              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonPrimary]}
                onPress={() => navigation.navigate('OrdenesHoy')}
              >
                <Text style={styles.shortcutButtonPrimaryText}>Ver ordenes del dia</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonDisabled]}
                disabled
              >
                <Text style={styles.shortcutButtonDisabledText}>Revisiones pendientes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonDisabled]}
                disabled
              >
                <Text style={styles.shortcutButtonDisabledText}>Ficha de revision</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonDisabled]}
                disabled
              >
                <Text style={styles.shortcutButtonDisabledText}>Cotizaciones</Text>
              </TouchableOpacity>
            </View>
            )}

            {/* En celular: botón buscar solo */}
            {!isTablet && (
              <View style={styles.mobileControlsCard}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    styles.controlPrimary,
                    styles.mobileControlPrimaryFull,
                    (!canSearch || loading) && styles.controlPrimaryDisabled,
                  ]}
                  onPress={buscar}
                  disabled={!canSearch || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#03131b" />
                  ) : (
                    <Text style={styles.controlPrimaryText}>Buscar vehiculo</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accesos solo en celular */}
          {!isTablet && (
            <View style={styles.shortcutsCard}>
              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonPrimary]}
                onPress={() => navigation.navigate('OrdenesHoy')}
              >
                <Text style={styles.shortcutButtonPrimaryText}>Ver ordenes del dia</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonDisabled]}
                disabled
              >
                <Text style={styles.shortcutButtonDisabledText}>Revisiones pendientes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonDisabled]}
                disabled
              >
                <Text style={styles.shortcutButtonDisabledText}>Ficha de revision</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutButton, styles.shortcutButtonDisabled]}
                disabled
              >
                <Text style={styles.shortcutButtonDisabledText}>Cotizaciones</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Panel de teclado + controles solo en tablet */}
          {isTablet && (
            <View style={styles.keyboardPanel}>
              <View style={styles.keyboardContent}>
                <View style={styles.keyboardSpacer} />

                <View style={styles.keyboardBody}>
                  {keyRows.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.keyRow}>
                      {row.map(key => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.keyButton,
                            { minHeight: keyHeight },
                            placa.length >= MAX_PLATE_LENGTH && styles.keyButtonDisabled,
                          ]}
                          onPress={() => agregarCaracter(key)}
                          disabled={loading || placa.length >= MAX_PLATE_LENGTH}
                        >
                          <Text style={[styles.keyText, { fontSize: keyFontSize }]}>{key}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>

                <View style={styles.keyboardSpacer} />
              </View>

              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.controlButton, styles.controlSecondary]}
                  onPress={borrarUltimo}
                  disabled={loading || !placa.length}
                >
                  <Text style={styles.controlSecondaryText}>Borrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, styles.controlSecondary]}
                  onPress={limpiar}
                  disabled={loading || !placa.length}
                >
                  <Text style={styles.controlSecondaryText}>Limpiar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    styles.controlPrimary,
                    (!canSearch || loading) && styles.controlPrimaryDisabled,
                  ]}
                  onPress={buscar}
                  disabled={!canSearch || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#03131b" />
                  ) : (
                    <Text style={styles.controlPrimaryText}>Buscar vehiculo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0f14',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
  },
  contentSplit: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  lookupPanel: {
    backgroundColor: '#101922',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1c3142',
    marginBottom: 40,
  },
  lookupPanelSplit: {
    flex: 0.72,
    marginBottom: 0,
    marginRight: 16,
  },
  title: {
    fontWeight: '900',
    color: '#00c8ff',
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6f8aa5',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 6,
    marginBottom: 16,
  },
  plateCard: {
    backgroundColor: '#0b1219',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#1a2b39',
  },
  mobileInput: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: '#111d27',
    borderWidth: 1,
    borderColor: '#244052',
    color: '#eef7ff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  shortcutsCard: {
    marginTop: 14,
    backgroundColor: '#0b1219',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2b39',
  },
  shortcutsTitle: {
    color: '#6f8aa5',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#6f8aa5',
    fontSize: 12,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#111d27',
    borderWidth: 1,
    borderColor: '#244052',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  slotBreak: {
    marginLeft: 8,
  },
  slotActive: {
    borderColor: '#00c8ff',
    shadowColor: '#00c8ff',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  slotText: {
    color: '#eef7ff',
    fontWeight: '900',
    letterSpacing: 2,
  },
  keyboardPanel: {
    flex: 1.38,
    backgroundColor: '#111820',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1c3142',
  },
  keyboardContent: {
    flex: 1,
  },
  keyboardSpacer: {
    flex: 1,
    minHeight: 10,
  },
  keyboardBody: {
    justifyContent: 'center',
  },
  keyRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  keyButton: {
    flex: 1,
    backgroundColor: '#17222c',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#244052',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  keyButtonDisabled: {
    opacity: 0.45,
  },
  keyText: {
    color: '#eef7ff',
    fontWeight: '800',
    letterSpacing: 1,
  },
  shortcutButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  shortcutButtonPrimary: {
    backgroundColor: '#00c8ff',
  },
  shortcutButtonPrimaryText: {
    color: '#03131b',
    fontSize: 16,
    fontWeight: '900',
  },
  shortcutButtonDisabled: {
    backgroundColor: '#121d27',
    borderWidth: 1,
    borderColor: '#223645',
    opacity: 0.72,
  },
  shortcutButtonDisabledText: {
    color: '#88a1b7',
    fontSize: 15,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  controlButton: {
    minHeight: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginRight: 10,
  },
  controlSecondary: {
    backgroundColor: '#17222c',
    borderWidth: 1,
    borderColor: '#244052',
    flex: 0.8,
  },
  controlSecondaryText: {
    color: '#d8e7f4',
    fontSize: 17,
    fontWeight: '700',
  },
  controlPrimary: {
    backgroundColor: '#00c8ff',
    flex: 1.3,
  },
  controlPrimaryDisabled: {
    opacity: 0.45,
  },
  controlPrimaryText: {
    color: '#03131b',
    fontSize: 18,
    fontWeight: '900',
  },
  mobileControlsCard: {
    marginTop: 18,
  },
  mobileControlPrimaryFull: {
    flex: 1,
    width: '100%',
    minHeight: 60,
  },
});
