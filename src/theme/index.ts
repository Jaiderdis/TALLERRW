/**
 * Constantes de tema globales para TallerRW.
 * Usa estas constantes en todos los StyleSheet para evitar colores y
 * valores de espaciado duplicados entre pantallas.
 */

export const COLORS = {
  // Fondos
  bg: '#0a0f14',
  bgCard: '#0d1826',
  bgInput: '#182635',
  bgCardAlt: '#182030',

  // Bordes
  border: '#1e2d40',
  borderLight: '#274055',

  // Acento principal
  accent: '#00c8ff',
  accentDim: '#0098c4',
  accentBg: 'rgba(0,200,255,0.1)',

  // Textos
  textPrimary: '#e8f0f8',
  textSecondary: '#5a7a99',
  textMuted: '#7f9bb4',
  textDark: '#03131b',

  // Estados / semáforo
  success: '#00e096',
  warning: '#ffb800',
  danger: '#ff6b2b',
  error: '#ff3b30',
  errorSoft: '#ff8b7a',

  // Especiales
  orange: '#ff6b2b',
  white: '#ffffff',
  black: '#000000',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const RADIUS = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  round: 20,
  circle: 999,
} as const;

/** Estilo de sectionTitle reutilizado en todas las pantallas */
export const SECTION_TITLE_STYLE = {
  fontSize: 10,
  letterSpacing: 3,
  textTransform: 'uppercase' as const,
  color: COLORS.textSecondary,
  marginBottom: 10,
  fontWeight: '700' as const,
};

/** Estilo de card reutilizado en todas las pantallas */
export const CARD_STYLE = {
  backgroundColor: COLORS.bgCard,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: RADIUS.xl,
  padding: SPACING.lg,
  marginBottom: SPACING.lg,
};

/** Estilo de botón primario */
export const BTN_PRIMARY_STYLE = {
  backgroundColor: COLORS.accent,
  borderRadius: RADIUS.lg,
  padding: SPACING.lg,
  alignItems: 'center' as const,
  marginBottom: SPACING.sm,
};

export const BTN_PRIMARY_TEXT_STYLE = {
  color: COLORS.black,
  fontWeight: '700' as const,
  fontSize: 15,
  letterSpacing: 1,
};
