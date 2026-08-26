/**
 * 18 Cricket Network — global design tokens.
 *
 * Dark-first, premium, athletic identity built on the existing red/black brand.
 * Prefer importing `theme` here over ad-hoc per-screen colors. The legacy
 * `Colors` export in ./Colors.ts remains for older screens and maps onto the
 * same palette.
 */

export const palette = {
  // Backgrounds (dark-first)
  background: '#0A0B0D', // app background
  surface: '#141619', // cards
  surfaceElevated: '#1C1F24', // elevated cards / sheets
  glass: 'rgba(255,255,255,0.06)', // translucent surface
  glassBorder: 'rgba(255,255,255,0.10)',

  // Brand red
  primary: '#E11D2A', // 18 Cricket red
  primaryMuted: '#B3121D',
  secondary: '#FF3B44',
  accent: '#7A0E15',

  // Text
  textPrimary: '#F5F7FA',
  textSecondary: '#A2AAB5',
  textTertiary: '#6B7480',
  textInverse: '#0A0B0D',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  live: '#FF2D55',

  // Lines
  border: '#23272E',
  borderStrong: '#333941',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const gradients = {
  brand: ['#E11D2A', '#7A0E15'] as [string, string],
  brandBright: ['#FF3B44', '#E11D2A'] as [string, string],
  dark: ['#1C1F24', '#0A0B0D'] as [string, string],
  glow: ['#FF3B44', '#E11D2A', '#7A0E15'] as [string, string, string],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: 0.2 },
  h1: { fontSize: 24, fontWeight: '800' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  glow: {
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const theme = {
  palette,
  gradients,
  spacing,
  radius,
  typography,
  shadow,
  motion,
};

export default theme;
