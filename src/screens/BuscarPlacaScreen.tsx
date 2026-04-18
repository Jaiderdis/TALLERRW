import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  useWindowDimensions,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { buscarPorPlaca } from '../api/vehiculos';
import { llamarApi } from '../api/apiHelper';
import { Vehiculo } from '../types';

// ─── tipos ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BuscarPlaca'>;
};

type LookupStatus = 'idle' | 'typing' | 'searching' | 'found' | 'new';

// ─── constantes ───────────────────────────────────────────────────────────────

const MAX_PLATE_LENGTH = 6;

const KEY_ROWS: readonly string[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const RED_CAIDA_MSG = 'No se pudo conectar con el servidor. Verifica tu conexión.';

// ─── paleta (mapeo tokens del handoff a la paleta oscura del proyecto) ──────
//
// Handoff usa oklch ~#1e2028 / #2a2d37 / #4fa3d9. Aquí respetamos el
// dark-theme oficial del proyecto (#0a0f14 / #00c8ff) manteniendo el
// mismo significado semántico: blue = primario, orange = registrar,
// green = encontrado.

const C = {
  bg: '#0a0f14',
  bg2: '#111920',          // superficies / card
  bg3: '#1a2332',           // raised / tecla
  bgSlot: '#0b0f14',        // fondo de slots de placa (más oscuro que bg)
  line: '#1e2d3d',
  lineSoft: '#17222e',
  text: '#e8eef4',
  textDim: '#a8b4c3',
  textMuted: '#7a8998',
  textMutedDim: '#4a5a6c',
  blue: '#00c8ff',
  blueDeep: '#0098c4',
  blueSoft: 'rgba(0,200,255,0.12)',
  orange: '#ffa502',
  orangeSoft: 'rgba(255,165,2,0.14)',
  red: '#ff4757',
  green: '#2ed573',
  dark: '#03131b',
} as const;

// ─── componente ───────────────────────────────────────────────────────────────

export default function BuscarPlacaScreen({ navigation }: Props) {
  const [placa, setPlaca] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<LookupStatus>('idle');
  const [preview, setPreview] = useState<Vehiculo | null>(null);

  const { width, height } = useWindowDimensions();

  // Breakpoints del handoff: 820px para split a 2 columnas
  const shortestSide = Math.min(width, height);
  const longestSide = Math.max(width, height);
  const isTablet = shortestSide >= 600 && longestSide >= 900;
  const isSplitLayout = width >= 820;
  const canSearch = placa.trim().length === MAX_PLATE_LENGTH;

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, Vehiculo | null>>(new Map());
  const lastReqRef = useRef(0);

  // Cursor parpadeante para el slot activo
  const caretAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(caretAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(caretAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [caretAnim]);

  // Al volver a la pantalla, reset (como pide el handoff: "al volver desde
  // cualquiera, resetea plate = ''")
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setPlaca('');
        setPreview(null);
        setStatus('idle');
      };
    }, []),
  );

  // Preview en vivo con debounce. Solo consulta cuando la placa está completa
  // (6 caracteres). Mientras tanto el status es 'typing' o 'idle'.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (placa.length === 0) {
      setStatus('idle');
      setPreview(null);
      return;
    }

    if (placa.length < MAX_PLATE_LENGTH) {
      setStatus('typing');
      setPreview(null);
      return;
    }

    // Caché hit — responde sincrónicamente
    if (cacheRef.current.has(placa)) {
      const cached = cacheRef.current.get(placa)!;
      setPreview(cached);
      setStatus(cached ? 'found' : 'new');
      return;
    }

    setStatus('searching');
    const reqId = ++lastReqRef.current;

    debounceRef.current = setTimeout(async () => {
      const result = await llamarApi(() => buscarPorPlaca(placa));

      // Si el usuario siguió tecleando, descarta resultados viejos
      if (reqId !== lastReqRef.current) return;

      if (result.success) {
        cacheRef.current.set(placa, result.data);
        setPreview(result.data);
        setStatus('found');
        return;
      }

      const esErrorDeRed = result.message === RED_CAIDA_MSG;
      if (esErrorDeRed) {
        // No cacheamos; el usuario podrá reintentar al pulsar "Buscar"
        setPreview(null);
        setStatus('new'); // fallback: permite avanzar manualmente
        return;
      }

      // 404 u otro error controlado: placa no registrada
      cacheRef.current.set(placa, null);
      setPreview(null);
      setStatus('new');
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [placa]);

  // ── acciones ───────────────────────────────────────────────────────────────

  const submit = async () => {
    const placaNorm = placa.toUpperCase().trim();
    if (placaNorm.length !== MAX_PLATE_LENGTH) return;

    // Ruta rápida: ya tenemos preview → navegar sin esperar
    if (status === 'found' && preview) {
      navigation.navigate('Vehiculo', { vehiculo: preview });
      return;
    }
    if (status === 'new') {
      navigation.navigate('NuevoVehiculo', { placa: placaNorm });
      return;
    }

    // Sin preview (ej. error de red anterior) → consulta definitiva
    setSubmitting(true);
    try {
      const result = await llamarApi(() => buscarPorPlaca(placaNorm));
      if (result.success) {
        navigation.navigate('Vehiculo', { vehiculo: result.data });
        return;
      }

      if (result.message === RED_CAIDA_MSG) {
        Toast.show({
          type: 'error',
          text1: 'Sin conexión',
          text2: 'No se pudo conectar al servidor. Verifica la red.',
        });
        return;
      }

      Toast.show({
        type: 'info',
        text1: 'Vehículo no encontrado',
        text2: `La placa ${placaNorm} no está registrada. Puedes crearla.`,
      });
      navigation.navigate('NuevoVehiculo', { placa: placaNorm });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Sin conexión',
        text2: 'No se pudo conectar al servidor. Verifica la red.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const agregarCaracter = (char: string) => {
    if (submitting || placa.length >= MAX_PLATE_LENGTH) return;
    setPlaca((cur) => `${cur}${char}`);
  };

  const borrarUltimo = () => {
    if (submitting) return;
    setPlaca((cur) => cur.slice(0, -1));
  };

  const limpiar = () => {
    if (submitting) return;
    setPlaca('');
  };

  const actualizarPlaca = (texto: string) => {
    const limpia = texto
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, MAX_PLATE_LENGTH);
    setPlaca(limpia);
  };

  // ── textos derivados ───────────────────────────────────────────────────────

  const statusMeta = useMemo(() => {
    switch (status) {
      case 'idle':
        return { color: C.textMuted, label: 'Esperando placa' };
      case 'typing':
        return { color: C.blue, label: `Escribiendo — ${placa.length}/6` };
      case 'searching':
        return { color: C.blue, label: 'Buscando…' };
      case 'found':
        return { color: C.green, label: 'Vehículo encontrado' };
      case 'new':
        return { color: C.orange, label: 'No registrado — registrar' };
    }
  }, [status, placa.length]);

  const accentForPlate =
    status === 'found' ? C.green : status === 'new' ? C.orange : C.blue;

  const ctaLabel =
    status === 'found'
      ? 'Abrir ficha'
      : status === 'new'
      ? 'Registrar vehículo'
      : 'Buscar';

  const ctaVariant: 'primary' | 'orange' | 'default' =
    status === 'found' ? 'primary' : status === 'new' ? 'orange' : 'default';

  const ctaDisabled = !canSearch || submitting;

  // ── sub-componentes internos ───────────────────────────────────────────────

  /** Card izquierda: preview en vivo tipo "Ficha técnica". */
  const LiveFichaCard = () => (
    <View style={styles.card}>
      {/* Header: dot + label + FICHA # */}
      <View style={styles.statusHeader}>
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusMeta.color,
                shadowColor: statusMeta.color,
              },
            ]}
          />
          <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
            {statusMeta.label}
          </Text>
          {status === 'searching' && (
            <ActivityIndicator
              size="small"
              color={C.blue}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <Text style={styles.fichaMeta}>
          FICHA #{placa || '------'}
        </Text>
      </View>

      {/* Plate display */}
      <View
        style={[
          styles.plateBox,
          { borderColor: accentForPlate, opacity: placa.length === 0 ? 0.85 : 1 },
        ]}
      >
        {Array.from({ length: MAX_PLATE_LENGTH }, (_, i) => {
          const char = placa[i];
          const filled = !!char;
          const active = i === placa.length;
          return (
            <View
              key={`slot-${i}`}
              style={[
                styles.plateSlot,
                active && {
                  borderColor: accentForPlate,
                  backgroundColor: 'rgba(0,200,255,0.05)',
                  shadowColor: accentForPlate,
                  shadowOpacity: 0.6,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 4,
                },
                filled && {
                  borderColor: accentForPlate,
                  backgroundColor: 'rgba(11,15,20,0.9)',
                },
              ]}
            >
              {filled ? (
                <Text
                  style={[
                    styles.plateSlotText,
                    { color: status === 'new' ? C.orange : status === 'found' ? C.green : C.text },
                  ]}
                >
                  {char}
                </Text>
              ) : active ? (
                <Animated.View
                  style={[
                    styles.caret,
                    { backgroundColor: accentForPlate, opacity: caretAnim },
                  ]}
                />
              ) : (
                <View style={styles.caretIdle} />
              )}
            </View>
          );
        })}
      </View>

      {/* Vehicle data grid 2x3 */}
      <View style={styles.dataGrid}>
        {(
          [
            { label: 'MARCA', value: preview?.marca, mono: false },
            { label: 'MODELO', value: preview?.modelo, mono: false },
            { label: 'AÑO', value: preview?.anio?.toString(), mono: true },
            { label: 'COLOR', value: preview?.color, mono: false },
            {
              label: 'VISITAS',
              value:
                preview?.totalVisitas != null
                  ? preview.totalVisitas.toString()
                  : undefined,
              mono: true,
            },
            {
              label: 'ÚLTIMA VISITA',
              value: preview?.ultimaVisita
                ? preview.ultimaVisita.slice(0, 10)
                : undefined,
              mono: true,
            },
          ] as const
        ).map((d) => (
          <View key={d.label} style={styles.dataCell}>
            <Text style={styles.dataLabel}>{d.label}</Text>
            <Text
              style={[
                styles.dataValue,
                d.mono && styles.mono,
                !d.value && styles.dataValueMuted,
              ]}
              numberOfLines={1}
            >
              {d.value ?? '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* Cliente info cuando hay match */}
      {preview?.cliente && (
        <View style={styles.clienteStrip}>
          <Ionicons
            name="person-outline"
            size={14}
            color={C.textDim}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.clienteText} numberOfLines={1}>
            {preview.cliente.nombre}
          </Text>
          {preview.cliente.telefono ? (
            <>
              <Text style={styles.clienteDot}>·</Text>
              <Text style={[styles.clienteText, styles.mono]} numberOfLines={1}>
                {preview.cliente.telefono}
              </Text>
            </>
          ) : null}
        </View>
      )}

      {/* CTA adaptativo */}
      <TouchableOpacity
        style={[
          styles.cta,
          ctaVariant === 'primary' && styles.ctaPrimary,
          ctaVariant === 'orange' && styles.ctaOrange,
          ctaVariant === 'default' && styles.ctaDefault,
          ctaDisabled && styles.ctaDisabled,
        ]}
        onPress={() => void submit()}
        disabled={ctaDisabled}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator
            color={ctaVariant === 'default' ? C.text : C.dark}
            size="small"
          />
        ) : (
          <>
            {ctaVariant === 'orange' && (
              <Ionicons
                name="add"
                size={20}
                color={C.dark}
                style={{ marginRight: 6 }}
              />
            )}
            {ctaVariant === 'default' && (
              <Ionicons
                name="search"
                size={18}
                color={C.text}
                style={{ marginRight: 8 }}
              />
            )}
            <Text
              style={[
                styles.ctaText,
                ctaVariant === 'primary' && { color: C.dark },
                ctaVariant === 'orange' && { color: C.dark },
                ctaVariant === 'default' && { color: C.text },
              ]}
            >
              {ctaLabel}
            </Text>
            {ctaVariant === 'primary' && (
              <Ionicons
                name="arrow-forward"
                size={18}
                color={C.dark}
                style={{ marginLeft: 6 }}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  /** Card derecha: teclado QWERTY + fila Borrar / Limpiar / Buscar. */
  const KeyboardCard = () => (
    <View style={[styles.card, styles.keyboardCard]}>
      <View style={styles.keyboardInner}>
        {KEY_ROWS.map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} style={styles.keyRow}>
            {row.map((k) => {
              const disabled = submitting || placa.length >= MAX_PLATE_LENGTH;
              return (
                <TouchableOpacity
                  key={k}
                  style={[styles.key, disabled && styles.keyDisabled]}
                  onPress={() => agregarCaracter(k)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.keyActionsRow}>
          <TouchableOpacity
            style={[
              styles.keyAction,
              placa.length === 0 && styles.keyActionDisabled,
            ]}
            onPress={borrarUltimo}
            disabled={submitting || placa.length === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="backspace-outline" size={18} color={C.text} />
            <Text style={styles.keyActionText}>Borrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.keyAction,
              styles.keyActionDanger,
              placa.length === 0 && styles.keyActionDisabled,
            ]}
            onPress={limpiar}
            disabled={submitting || placa.length === 0}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-outline" size={18} color={C.red} />
            <Text style={[styles.keyActionText, { color: C.red }]}>Limpiar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.keyAction,
              styles.keyActionPrimary,
              ctaDisabled && styles.keyActionPrimaryDisabled,
            ]}
            onPress={() => void submit()}
            disabled={ctaDisabled}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={C.dark} size="small" />
            ) : (
              <>
                <Text style={styles.keyActionPrimaryText}>{ctaLabel}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={C.dark}
                  style={{ marginLeft: 4 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /** Encabezado de pantalla. */
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>TALLER</Text>
        </View>
        <TouchableOpacity
          style={styles.headerShortcut}
          onPress={() => navigation.navigate('OrdenesHoy')}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={14} color={C.blue} />
          <Text style={styles.headerShortcutText}>Órdenes del día</Text>
          <Ionicons name="arrow-forward" size={14} color={C.blue} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Buscar vehículo</Text>
      <Text style={styles.subtitle}>
        Ingresa la placa — la ficha se completa en vivo.
      </Text>
    </View>
  );

  // ── render principal ──────────────────────────────────────────────────────

  if (isSplitLayout) {
    // Tablet / desktop: dos columnas 1.1fr / 1fr como el handoff
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView
          contentContainerStyle={styles.splitScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header />
          <View style={styles.splitGrid}>
            <View style={styles.splitColLeft}>
              <LiveFichaCard />
            </View>
            <View style={styles.splitColRight}>
              <KeyboardCard />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (isTablet) {
    // Tablet vertical / pantalla estrecha pero grande: una columna,
    // teclado en pantalla sigue siendo útil
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView
          contentContainerStyle={styles.singleScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header />
          <LiveFichaCard />
          <KeyboardCard />
        </ScrollView>
      </View>
    );
  }

  // ── Móvil: input nativo + CTA ──────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={placa}
        onChangeText={actualizarPlaca}
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        maxLength={MAX_PLATE_LENGTH}
        editable={!submitting}
        returnKeyType="search"
        onSubmitEditing={() => {
          if (canSearch) void submit();
        }}
        caretHidden
      />

      <ScrollView
        contentContainerStyle={styles.singleScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => inputRef.current?.focus()}
        >
          <LiveFichaCard />
        </TouchableOpacity>

        <Text style={styles.mobileHint}>
          Toca la ficha para abrir el teclado.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── contenedores raíz ────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  splitScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 32,
    maxWidth: 1220,
    alignSelf: 'center',
    width: '100%',
  },
  singleScroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 32,
  },
  splitGrid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'stretch',
  },
  splitColLeft: {
    flex: 1.1,
  },
  splitColRight: {
    flex: 1,
  },

  // ── header ───────────────────────────────────────────────────────────────
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerBadge: {
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  headerShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
  },
  headerShortcutText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 14,
    marginTop: 4,
  },

  // ── card base ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 20,
    gap: 18,
  },

  // ── status header ────────────────────────────────────────────────────────
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fichaMeta: {
    fontSize: 11,
    color: C.textMuted,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },

  // ── plate display ────────────────────────────────────────────────────────
  plateBox: {
    backgroundColor: C.bgSlot,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
  },
  plateSlot: {
    flex: 1,
    aspectRatio: 2 / 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateSlotText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  caret: {
    width: 3,
    height: '35%',
    borderRadius: 2,
  },
  caretIdle: {
    width: 3,
    height: '30%',
    borderRadius: 2,
    backgroundColor: C.line,
  },

  // ── data grid ────────────────────────────────────────────────────────────
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataCell: {
    width: '50%',
    paddingTop: 10,
    paddingRight: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: C.lineSoft,
  },
  dataLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 15,
    color: C.text,
    fontWeight: '600',
  },
  dataValueMuted: {
    color: C.textMutedDim,
    fontWeight: '400',
  },
  mono: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },

  // cliente strip
  clienteStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.bg3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.lineSoft,
  },
  clienteText: {
    color: C.textDim,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  clienteDot: {
    color: C.textMutedDim,
    paddingHorizontal: 8,
  },

  // ── CTA ──────────────────────────────────────────────────────────────────
  cta: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ctaPrimary: {
    backgroundColor: C.blue,
  },
  ctaOrange: {
    backgroundColor: C.orange,
  },
  ctaDefault: {
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.line,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── keyboard card ────────────────────────────────────────────────────────
  keyboardCard: {
    padding: 14,
    justifyContent: 'center',
  },
  keyboardInner: {
    gap: 8,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  key: {
    flex: 1,
    minHeight: 54,
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: {
    opacity: 0.5,
  },
  keyText: {
    color: C.text,
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  keyActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  keyAction: {
    flex: 1,
    minHeight: 54,
    backgroundColor: C.bg3,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  keyActionDanger: {
    borderColor: 'rgba(255,71,87,0.35)',
    backgroundColor: 'rgba(255,71,87,0.08)',
  },
  keyActionDisabled: {
    opacity: 0.4,
  },
  keyActionText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },
  keyActionPrimary: {
    flex: 1.6,
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  keyActionPrimaryDisabled: {
    backgroundColor: C.bg3,
    borderColor: C.line,
    opacity: 0.55,
  },
  keyActionPrimaryText: {
    color: C.dark,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── móvil ────────────────────────────────────────────────────────────────
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  mobileHint: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.3,
  },
});
