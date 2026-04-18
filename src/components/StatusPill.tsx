import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface Props {
  label: string;
  color: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill con dot (con glow) + label. Estilo outline con el color del estado.
 * Usado en OrdenesHoy para indicar "En proceso / Pendiente / Completada".
 */
export default function StatusPill({ label, color, style }: Props) {
  return (
    <View style={[styles.pill, { borderColor: color }, style]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOpacity: 0.95,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
