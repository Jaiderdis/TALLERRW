export const COLORS = {
  // Fondos (design handoff tokens)
  bg:     '#0a0f14',   // oklch(0.175 0.012 250)
  bg2:    '#121820',   // oklch(0.215 0.015 250)
  bg3:    '#1a2030',   // oklch(0.26  0.015 250)

  // Alias legacy (mantener compatibilidad)
  bgCard:    '#121820',
  bgCardAlt: '#1a2030',
  bgInput:   '#1a2030',

  // Bordes
  line:     '#253040',              // oklch(0.32 0.015 250)
  lineSoft: 'rgba(37,48,64,0.6)',   // oklch(0.28 0.012 250 / 0.6)
  border:      '#253040',
  borderLight: '#2a3a50',

  // Textos
  text:       '#f0f4f8',  // oklch(0.97 0.005 250)
  textDim:    '#8a9db5',  // oklch(0.72 0.01  250)
  textMuted:  '#5a7090',  // oklch(0.55 0.012 250)
  // legacy aliases
  textPrimary:   '#f0f4f8',
  textSecondary: '#5a7090',
  textDark:      '#03131b',

  // Azul (primary / focus / existente)
  blue:      '#00c8ff',              // oklch(0.72 0.16 230)
  blueDeep:  '#0076a8',              // oklch(0.55 0.14 230)
  blueSoft:  'rgba(0,200,255,0.14)', // oklch(0.72 0.16 230 / 0.14)
  // legacy alias
  accent:    '#00c8ff',
  accentDim: '#0076a8',
  accentBg:  'rgba(0,200,255,0.14)',

  // Naranja (pendiente / urgente / placa nueva)
  orange:     '#ff9500',              // oklch(0.74 0.17 45)
  orangeSoft: 'rgba(255,149,0,0.14)', // oklch(0.74 0.17 45 / 0.14)

  // Verde (completada / normal)
  green:     '#2ed573',               // oklch(0.72 0.14 150)
  greenSoft: 'rgba(46,213,115,0.14)',
  success:   '#2ed573',

  // Rojo (inmediato / danger)
  red:     '#e53935',               // oklch(0.64 0.18 25)
  redSoft: 'rgba(229,57,53,0.14)',
  danger:  '#e53935',
  error:   '#e53935',

  // Misc
  warning:   '#ffb800',
  white:     '#ffffff',
  black:     '#000000',
} as const;

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
} as const;

export const RADIUS = {
  sm:     8,
  md:     10,
  lg:     12,
  xl:     14,
  xxl:    16,
  round:  20,
  circle: 999,
} as const;

export const FONT = {
  mono: {
    fontFamily: 'monospace' as const,
    letterSpacing: -0.5,
  },
  monoUI: {
    fontFamily: 'monospace' as const,
  },
} as const;

export const SECTION_TITLE_STYLE = {
  fontSize: 10,
  letterSpacing: 3,
  textTransform: 'uppercase' as const,
  color: COLORS.textMuted,
  marginBottom: 10,
  fontWeight: '700' as const,
};

export const CARD_STYLE = {
  backgroundColor: COLORS.bg2,
  borderWidth: 1,
  borderColor: COLORS.line,
  borderRadius: RADIUS.xl,
  padding: SPACING.lg,
  marginBottom: SPACING.lg,
};

export const BTN_PRIMARY_STYLE = {
  backgroundColor: COLORS.blue,
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
