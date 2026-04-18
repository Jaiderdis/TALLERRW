import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

export type Priority = 'normal' | 'urgente' | 'inmediato';

interface Props {
  priority: Priority;
  style?: StyleProp<ViewStyle>;
}

const META: Record<Exclude<Priority, 'normal'>, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  urgente:   { label: 'URGENTE',   color: COLORS.orange, icon: 'sparkles' },
  inmediato: { label: 'INMEDIATO', color: COLORS.red,    icon: 'warning' },
};

/**
 * Badge inline de prioridad. Solo se muestra cuando la prioridad no es normal.
 * - Urgente  → naranja ✦
 * - Inmediato → rojo ⚠
 */
export default function PriorityBadge({ priority, style }: Props) {
  if (priority === 'normal') return null;
  const m = META[priority];
  return (
    <View style={[styles.row, style]}>
      <Ionicons name={m.icon} size={11} color={m.color} />
      <Text style={[styles.text, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
