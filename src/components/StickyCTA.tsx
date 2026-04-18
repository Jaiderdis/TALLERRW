import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Contenedor "pegado al fondo" para barras de acción.
 * En RN no existe `position: sticky`, así que lo tratamos como una
 * sección inferior con borde superior sutil dentro del scroll
 * (el padre debería usar `marginTop: 'auto'` si va al final de una
 *  Flex column o simplemente renderizarlo debajo del contenido).
 */
export default function StickyCTA({ children, style }: Props) {
  return <View style={[styles.wrap, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
});
