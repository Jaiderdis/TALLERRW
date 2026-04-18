import React, { useMemo, useRef, useState } from 'react';
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
  StatusBar,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { buscarPorPlaca } from '../api/vehiculos';
import { llamarApi } from '../api/apiHelper';

// ─── tipos ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BuscarPlaca'>;
};

// ─── teclado custom ───────────────────────────────────────────────────────────

/** Layout QWERTY de 4 filas — la última incluye el backspace */
const KEY_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

const MAX_PLATE_LENGTH = 6;

// ─── componente ───────────────────────────────────────────────────────────────

export default function BuscarPlacaScreen({ navigation }: Props) {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);

  const { width, height } = useWindowDimensions();

  // Breakpoints
  const shortestSide  = Math.min(width, height);
  const longestSide   = Math.max(width, height);
  const isTablet      = shortestSide >= 600 && longestSide >= 900;
  const isSplitLayout = isTablet && width >= 1080;       // panel izq + panel der lado a lado
  const canSearch     = placa.trim().length === MAX_PLATE_LENGTH;
  const inputRef      = useRef<TextInput>(null);

  // Escalado tipográfico y de targets táctiles
  const titleSize   = isSplitLayout ? 42 : isTablet ? 36 : 28;
  const slotHeight  = isSplitLayout ? 110 : isTablet ? 92 : 76;
  const slotFontSz  = isSplitLayout ? 46 : isTablet ? 36 : 28;
  const ctrlHeight  = isTablet      ? 72  : 66;
  const ctrlFontSz  = isTablet      ? 20  : 17;

  // Slots de placa
  const plateSlots = useMemo(
    () => Array.from({ length: MAX_PLATE_LENGTH }, (_, i) => placa[i] ?? ''),
    [placa],
  );

  // ── lógica de negocio (sin cambios) ────────────────────────────────────────

  // Mensaje exacto que apiHelper pone cuando captura un error de red
  const RED_CAIDA_MSG = 'No se pudo conectar con el servidor. Verifica tu conexión.';

  const buscar = async () => {
    const placaNormalizada = placa.toUpperCase().trim();

    if (placaNormalizada.length !== MAX_PLATE_LENGTH) {
      Alert.alert('Error', 'Ingresa una placa completa de 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = await llamarApi(() => buscarPorPlaca(placaNormalizada));

      if (result.success) {
        navigation.navigate('Vehiculo', { vehiculo: result.data });
        return;
      }

      // Distinguir error de red vs placa no encontrada
      const esErrorDeRed = result.message === RED_CAIDA_MSG;

      if (esErrorDeRed) {
        Toast.show({
          type: 'error',
          text1: 'Sin conexión',
          text2: 'No se pudo conectar al servidor. Verifica la red.',
        });
        // No navegar — dejar al usuario reintentar
        return;
      }

      // Placa no encontrada (404 u otro error controlado del API)
      Toast.show({
        type: 'info',
        text1: 'Vehículo no encontrado',
        text2: `La placa ${placaNormalizada} no está registrada. Puedes crearla.`,
      });
      navigation.navigate('NuevoVehiculo', { placa: placaNormalizada });

    } catch {
      // Salvaguarda: si llamarApi rechazara la promesa en el futuro
      Toast.show({
        type: 'error',
        text1: 'Sin conexión',
        text2: 'No se pudo conectar al servidor. Verifica la red.',
      });
    } finally {
      setLoading(false);
    }
  };

  const agregarCaracter = (char: string) => {
    if (loading || placa.length >= MAX_PLATE_LENGTH) return;
    setPlaca(cur => `${cur}${char}`);
  };

  const borrarUltimo = () => {
    if (loading) return;
    setPlaca(cur => cur.slice(0, -1));
  };

  const limpiar = () => {
    if (loading) return;
    setPlaca('');
  };

  const actualizarPlaca = (texto: string) => {
    const limpia = texto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, MAX_PLATE_LENGTH);
    setPlaca(limpia);
  };

  // ── sub-componentes internos ───────────────────────────────────────────────

  /** Encabezado con logo/título */
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeText}>TALLER</Text>
      </View>
      <Text style={[styles.title, { fontSize: titleSize }]}>
        BUSCAR{'\n'}VEHICULO
      </Text>
      <Text style={styles.subtitle}>Ingresa la placa — 6 caracteres</Text>
    </View>
  );

  /** Seis slots de placa */
  const PlateDisplay = () => (
    <View style={styles.plateSection}>
      <Text style={styles.plateLabel}>PLACA</Text>

      <View style={styles.slotRow}>
        {plateSlots.map((char, index) => {
          const isFilled  = index < placa.length;
          const isCurrent = index === placa.length;
          return (
            <View
              key={`slot-${index}`}
              style={[
                styles.slot,
                { minHeight: slotHeight },
                index === 3 && styles.slotSeparator,
                isFilled  && styles.slotFilled,
                isCurrent && styles.slotCurrent,
              ]}
            >
              <Text style={[styles.slotText, { fontSize: slotFontSz }, isFilled && styles.slotTextFilled]}>
                {char || (isCurrent ? '_' : '·')}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(placa.length / MAX_PLATE_LENGTH) * 100}%` }]} />
      </View>
    </View>
  );

  /** Panel de teclado custom + controles */
  const KeyboardPanel = () => (
    <View style={styles.keyboardPanel}>
      {KEY_ROWS.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={styles.keyRow}>
          {row.map(key => {
            const isBackspace = key === '⌫';
            const disabled = isBackspace
              ? loading || placa.length === 0
              : loading || placa.length >= MAX_PLATE_LENGTH;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.keyButton,
                  isBackspace && styles.keyButtonBackspace,
                  disabled && styles.keyButtonDisabled,
                ]}
                onPress={() => (isBackspace ? borrarUltimo() : agregarCaracter(key))}
                disabled={disabled}
                activeOpacity={0.65}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Fila de acciones del teclado */}
      <View style={styles.keyActionsRow}>
        <TouchableOpacity
          style={[styles.keyActionBtn, styles.keyActionDanger, { minHeight: ctrlHeight }]}
          onPress={limpiar}
          disabled={loading || placa.length === 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.keyActionDangerText, { fontSize: ctrlFontSz }]}>Limpiar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.keyActionBtn,
            styles.keyActionPrimary,
            { minHeight: ctrlHeight },
            (!canSearch || loading) && styles.keyActionPrimaryDisabled,
          ]}
          onPress={() => void buscar()}
          disabled={!canSearch || loading}
          activeOpacity={0.75}
        >
          {loading ? (
            <ActivityIndicator color="#03131b" size="small" />
          ) : (
            <Text style={[styles.keyActionPrimaryText, { fontSize: ctrlFontSz }]}>
              Buscar  →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );


  /** Accesos rápidos de navegación */
  const Shortcuts = () => (
    <View style={styles.shortcutsSection}>
      <Text style={styles.shortcutsLabel}>ACCESOS RÁPIDOS</Text>

      <TouchableOpacity
        style={[styles.shortcutBtn, styles.shortcutBtnHighlight]}
        onPress={() => navigation.navigate('OrdenesHoy')}
        activeOpacity={0.8}
      >
        <Text style={styles.shortcutBtnHighlightText}>Órdenes del día  →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.shortcutBtn, styles.shortcutBtnMuted]} disabled>
        <Text style={styles.shortcutBtnMutedText}>Revisiones pendientes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.shortcutBtn, styles.shortcutBtnMuted]} disabled>
        <Text style={styles.shortcutBtnMutedText}>Ficha de revisión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.shortcutBtn, styles.shortcutBtnMuted]} disabled>
        <Text style={styles.shortcutBtnMutedText}>Cotizaciones</Text>
      </TouchableOpacity>
    </View>
  );

  // ── render ─────────────────────────────────────────────────────────────────

  if (isSplitLayout) {
    // ── TABLET HORIZONTAL: dos columnas ──────────────────────────────────────
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />

        <View style={styles.splitRoot}>
          {/* Columna izquierda — lookup */}
          <View style={styles.splitLeft}>
            <ScrollView
              contentContainerStyle={styles.splitLeftScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Header />
              <PlateDisplay />
              <Shortcuts />
            </ScrollView>
          </View>

          {/* Divisor */}
          <View style={styles.splitDivider} />

          {/* Columna derecha — teclado */}
          <View style={styles.splitRight}>
            <ScrollView
              contentContainerStyle={styles.splitRightScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <KeyboardPanel />
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  if (isTablet) {
    // ── TABLET VERTICAL / ESTRECHO: columna única con teclado custom ─────────
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />

        <ScrollView
          contentContainerStyle={styles.singleScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header />
          <PlateDisplay />
          <KeyboardPanel />
          <Shortcuts />
        </ScrollView>
      </View>
    );
  }

  // ── MÓVIL: slots táctiles + input oculto + botón buscar ──────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />

      {/* Input oculto — captura el teclado del SO sin mostrarse */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={placa}
        onChangeText={actualizarPlaca}
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        maxLength={MAX_PLATE_LENGTH}
        editable={!loading}
        returnKeyType="search"
        onSubmitEditing={() => { if (canSearch) void buscar(); }}
        caretHidden
      />

      <ScrollView
        contentContainerStyle={styles.singleScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header />

        {/* Slots táctiles — tocar abre el teclado */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => inputRef.current?.focus()}
          style={styles.plateSection}
        >
          <Text style={styles.plateLabel}>
            {placa.length === 0 ? 'TOCA PARA INGRESAR PLACA' : `PLACA  ·  ${placa.length} / ${MAX_PLATE_LENGTH}`}
          </Text>
          <View style={styles.slotRow}>
            {plateSlots.map((char, index) => {
              const isFilled  = index < placa.length;
              const isCurrent = index === placa.length;
              return (
                <View
                  key={`slot-${index}`}
                  style={[
                    styles.slot,
                    { minHeight: slotHeight },
                    index === 3 && styles.slotSeparator,
                    isFilled  && styles.slotFilled,
                    isCurrent && styles.slotCurrent,
                  ]}
                >
                  <Text style={[styles.slotText, { fontSize: slotFontSz }, isFilled && styles.slotTextFilled]}>
                    {char || (isCurrent ? '|' : '·')}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(placa.length / MAX_PLATE_LENGTH) * 100}%` }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mobileBuscarBtn,
            (!canSearch || loading) && styles.mobileBuscarBtnDisabled,
          ]}
          onPress={() => void buscar()}
          disabled={!canSearch || loading}
          activeOpacity={0.75}
        >
          {loading ? (
            <ActivityIndicator color="#03131b" />
          ) : (
            <Text style={styles.mobileBuscarBtnText}>
              {canSearch ? 'Buscar vehículo  →' : `Faltan ${MAX_PLATE_LENGTH - placa.length} caracteres`}
            </Text>
          )}
        </TouchableOpacity>

        <Shortcuts />
      </ScrollView>
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const C = {
  bg:        '#0a0f14',
  card:      '#111920',
  input:     '#1a2332',
  border:    '#1e2d3d',
  accent:    '#00c8ff',
  accentDim: '#0098c4',
  text:      '#e8eef4',
  secondary: '#7a9bb5',
  muted:     '#3a5a72',
  error:     '#ff4757',
  dark:      '#03131b',
} as const;

const styles = StyleSheet.create({
  // ── contenedores raíz ────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // layout split (tablet horizontal)
  splitRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  splitLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  splitLeftScroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  splitDivider: {
    width: 1,
    backgroundColor: C.border,
  },
  splitRight: {
    flex: 1.2,
  },
  splitRightScroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  // layout columna única
  singleScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 40,
  },

  // ── cabecera ─────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  headerBadge: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  headerBadgeText: {
    color: C.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    color: C.accent,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: undefined,   // deja que el SO calcule por fontSize
  },
  subtitle: {
    color: C.secondary,
    fontSize: 14,
    letterSpacing: 1.5,
    marginTop: 10,
    textAlign: 'center',
  },

  // ── display de placa ─────────────────────────────────────────────────────
  plateSection: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 22,
    marginBottom: 16,
  },
  plateLabel: {
    color: C.secondary,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  slot: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: C.input,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSeparator: {
    marginLeft: 14,      // separación visual entre bloques ABC | 123
  },
  slotFilled: {
    backgroundColor: '#162130',
    borderColor: '#2a4a62',
  },
  slotCurrent: {
    borderColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  slotText: {
    color: C.muted,
    fontWeight: '900',
    letterSpacing: 1,
  },
  slotTextFilled: {
    color: C.text,
  },

  // barra de progreso
  progressBar: {
    height: 3,
    backgroundColor: C.border,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 2,
  },

  // ── teclado custom ────────────────────────────────────────────────────────
  keyboardPanel: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
    gap: 6,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  keyButton: {
    flex: 1,
    backgroundColor: '#1e2433',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  keyButtonBackspace: {
    backgroundColor: '#2d1a1a',
  },
  keyButtonDisabled: {
    opacity: 0.35,
  },
  keyText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },

  // fila de acciones del teclado
  keyActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  keyActionBtn: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    flex: 1,
  },
  keyActionSecondary: {
    backgroundColor: '#1e2433',
  },
  keyActionSecondaryText: {
    color: C.text,
    fontWeight: '700',
  },
  keyActionDanger: {
    backgroundColor: '#1f0d10',
    borderWidth: 1,
    borderColor: '#4a1020',
  },
  keyActionDangerText: {
    color: C.error,
    fontWeight: '700',
  },
  keyActionPrimary: {
    backgroundColor: C.accent,
    flex: 1.6,
  },
  keyActionPrimaryDisabled: {
    opacity: 0.4,
  },
  keyActionPrimaryText: {
    color: C.dark,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── input nativo (móvil) ──────────────────────────────────────────────────
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  mobileBuscarBtn: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 24,
  },
  mobileBuscarBtnDisabled: {
    opacity: 0.4,
  },
  mobileBuscarBtnText: {
    color: C.dark,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── accesos rápidos ───────────────────────────────────────────────────────
  shortcutsSection: {
    gap: 10,
    paddingTop: 4,
  },
  shortcutsLabel: {
    color: C.secondary,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  shortcutBtn: {
    minHeight: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  shortcutBtnHighlight: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.accent,
  },
  shortcutBtnHighlightText: {
    color: C.accent,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shortcutBtnMuted: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    opacity: 0.55,
  },
  shortcutBtnMutedText: {
    color: C.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
