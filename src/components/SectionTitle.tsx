import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

interface Props {
  children: string;
  error?: boolean;
  errorSuffix?: string;
}

/**
 * Título de sección en mayúsculas con estilo uniforme en toda la app.
 * Acepta `error` para cambiar el color y `errorSuffix` para añadir
 * el mensaje de error inline (patrón que usan NuevaOrden y NuevoVehiculo).
 */
export default function SectionTitle({ children, error, errorSuffix }: Props) {
  return (
    <Text style={[styles.base, error && styles.error]}>
      {children}
      {error && errorSuffix ? ` — ${errorSuffix}` : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontWeight: '700',
  },
  error: {
    color: COLORS.danger,
  },
});
