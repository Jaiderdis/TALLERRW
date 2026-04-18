import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../theme';

const SWATCH_MAP: Record<string, string> = {
  Blanco: '#f1f1f1',
  Gris: '#9aa0a6',
  Plata: '#c0c4c8',
  Negro: '#1a1a1a',
  Azul: '#2d6ee0',
  Rojo: '#d94a3c',
  Verde: '#4a9d5a',
  Amarillo: '#e8c44a',
  Naranja: '#e8934a',
  Beige: '#d4c6a8',
};

interface Props {
  items: string[];
  value?: string;
  onPick: (value: string) => void;
  mono?: boolean;
  withSwatch?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fila de chips tipo pill. Activa = blueSoft/blue.
 * `withSwatch` añade un círculo de color (map para colores de pintura).
 * `mono` aplica fuente monoespaciada al texto (para años / placas).
 */
export default function ChipRow({
  items,
  value,
  onPick,
  mono = false,
  withSwatch = false,
  style,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      {items.map((item) => {
        const active = value?.toLowerCase() === item.toLowerCase();
        return (
          <TouchableOpacity
            key={item}
            activeOpacity={0.75}
            onPress={() => onPick(item)}
            style={[styles.chip, active && styles.chipActive]}
          >
            {withSwatch && (
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: SWATCH_MAP[item] ?? '#888' },
                ]}
              />
            )}
            <Text
              style={[
                styles.chipText,
                mono && styles.chipTextMono,
                active && styles.chipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  chipActive: {
    backgroundColor: COLORS.blueSoft,
    borderColor: COLORS.blue,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextMono: {
    fontFamily: 'monospace',
  },
  chipTextActive: {
    color: COLORS.blue,
    fontWeight: '700',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
