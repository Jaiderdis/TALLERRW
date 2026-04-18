import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  plate: string;
  color?: string;
  size?: Size;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<Size, { h: number; fs: number; gap: number; minW: number }> = {
  sm: { h: 44, fs: 22, gap: 5, minW: 33 },
  md: { h: 56, fs: 28, gap: 6, minW: 42 },
  lg: { h: 72, fs: 38, gap: 8, minW: 54 },
};

/**
 * Bloque de placa: 6 slots mono con borde de color.
 * Los slots vacíos quedan con borde sutil; los rellenos con glow del color.
 */
export default function PlateBlock({
  plate,
  color = COLORS.orange,
  size = 'md',
  label,
  style,
}: Props) {
  const s = SIZES[size];
  const chars = plate.padEnd(6, ' ').slice(0, 6).split('');

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, { gap: s.gap }]}>
        {chars.map((c, i) => {
          const filled = c !== ' ';
          return (
            <View
              key={i}
              style={[
                styles.slot,
                {
                  height: s.h,
                  minWidth: s.minW,
                  borderColor: filled ? color : COLORS.lineSoft,
                },
                filled && {
                  shadowColor: color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.char,
                  { fontSize: s.fs, color },
                ]}
              >
                {c.trim()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
  },
  slot: {
    backgroundColor: '#0b0b0d',
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  char: {
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: -0.6,
  },
});
