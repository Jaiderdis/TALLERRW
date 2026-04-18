import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

interface Props {
  onBack?: () => void;
  title: string;
  eyebrow?: string;
  meta?: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Header compartido de pantallas del módulo taller.
 * Botón back 42×42, eyebrow "TALLER", título 20px y meta mono a la derecha.
 */
export default function ScreenHeader({
  onBack,
  title,
  eyebrow = 'TALLER',
  meta,
  accent = COLORS.blue,
  style,
}: Props) {
  return (
    <View style={[styles.header, style]}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={accent} />
        </TouchableOpacity>
      )}
      <View style={styles.titleBox}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
    paddingBottom: 18,
    marginBottom: 22,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    flex: 1,
    minWidth: 120,
  },
  eyebrow: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
});
