import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  title: string;
  icon?: IoniconsName;
  iconColor?: string;
  meta?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  error?: boolean;
  errorSuffix?: string;
}

/**
 * Sección con label header (icono azul + uppercase + línea divisoria)
 * y card interior bg2/radius 14/padding 20. Patrón del design handoff.
 */
export default function Section({
  title,
  icon,
  iconColor = COLORS.blue,
  meta,
  children,
  style,
  cardStyle,
  error,
  errorSuffix,
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.labelRow}>
        {icon && (
          <Ionicons
            name={icon}
            size={13}
            color={error ? COLORS.danger : iconColor}
            style={styles.labelIcon}
          />
        )}
        <Text style={[styles.label, error && styles.labelError]}>
          {title}
          {error && errorSuffix ? ` — ${errorSuffix}` : ''}
        </Text>
        <View style={styles.divider} />
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <View style={[styles.card, cardStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  labelIcon: {
    marginRight: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: COLORS.textDim,
    textTransform: 'uppercase',
  },
  labelError: {
    color: COLORS.danger,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lineSoft,
    marginLeft: 6,
  },
  meta: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  card: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 20,
  },
});
