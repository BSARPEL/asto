import { Dimensions, Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * BN Astro — marka paleti + açık güven arayüzü.
 * Icon/splash: Deep Cosmic Violet. UI: Astro Light zemin + Nebula/Magenta aksan.
 * Eternal synastry (∞ + moons).
 */
export const brand = {
  cosmic: '#280F5F',
  nebula: '#6B3AA8',
  magenta: '#C73892',
  light: '#E6E1F1',
} as const;

export const colors = {
  bg: '#F6F3FA',
  bgMid: '#E6E1F1',
  bgElevated: '#FFFFFF',
  bgSoft: '#EDE8F5',
  bgHighlight: '#E0D9EF',
  border: 'rgba(40, 15, 95, 0.10)',
  borderStrong: 'rgba(40, 15, 95, 0.18)',
  text: '#280F5F',
  textMuted: '#6B6280',
  textSoft: '#4A3F66',
  /** Stellar Magenta — brand vurgu */
  accent: '#C73892',
  accentStrong: '#280F5F',
  accentLight: 'rgba(199, 56, 146, 0.12)',
  onAccent: '#FFFFFF',
  /** Nebula Purple — CTA / etkileşim (token adı teal: mevcut UI API) */
  teal: '#6B3AA8',
  tealDim: 'rgba(107, 58, 168, 0.12)',
  danger: '#D15A4F',
  dangerDim: 'rgba(209, 90, 79, 0.12)',
  success: '#3D9A68',
  successDim: 'rgba(61, 154, 104, 0.12)',
  overlay: 'rgba(40, 15, 95, 0.48)',
  userBubble: '#F6E8F3',
  assistantBubble: '#F0ECF7',
  star: 'rgba(199, 56, 146, 0.35)',
  glowTeal: 'rgba(107, 58, 168, 0.07)',
  glowMoon: 'rgba(199, 56, 146, 0.05)',
  /** Splash / native chrome */
  splash: '#280F5F',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const fonts = {
  display: 'Poppins_700Bold',
  displaySemi: 'Poppins_600SemiBold',
  displayExtra: 'Poppins_800ExtraBold',
  body: 'Poppins_400Regular',
  bodySemi: 'Poppins_600SemiBold',
  bodyBold: 'Poppins_700Bold',
};

export const breakpoints = {
  phone: 0,
  tablet: 600,
  desktop: 900,
} as const;

export type LayoutSize = 'phone' | 'tablet' | 'desktop';

export function getLayoutSize(width = Dimensions.get('window').width): LayoutSize {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

export function contentMaxWidth(size: LayoutSize, screenWidth?: number): number {
  const cap = size === 'desktop' ? 720 : size === 'tablet' ? 640 : 560;
  if (screenWidth != null) return Math.min(screenWidth, cap);
  return cap;
}

export const splitLayoutMinWidth = 720;

export function pageGutter(size: LayoutSize): number {
  if (size === 'desktop') return spacing.xl;
  if (size === 'tablet') return spacing.lg;
  return spacing.md;
}

export const shadowSoft: ViewStyle =
  Platform.OS === 'web'
    ? ({ boxShadow: '0 8px 28px rgba(40, 15, 95, 0.10)' } as ViewStyle)
    : {
        shadowColor: '#280F5F',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      };

/** Açık UI — Astro Light gökyüzü */
export const screenGradient = ['#F6F3FA', '#E6E1F1', '#F3EFF8', '#F6F3FA'] as const;

/** Primary CTA — Nebula → Magenta */
export const accentGradient = ['#8B4FC4', '#6B3AA8', '#C73892'] as const;

/** Splash / brand moment */
export const splashGradient = ['#1A083F', '#280F5F', '#3A1878', '#280F5F'] as const;

export const typography = {
  brandLg: {
    fontFamily: fonts.displayExtra,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: 1.2,
    color: colors.accentStrong,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,
  brand: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0.8,
    color: colors.accentStrong,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0.2,
    color: colors.text,
  } satisfies TextStyle,
  titleSm: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  } satisfies TextStyle,
  section: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.3,
    color: colors.teal,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  } satisfies TextStyle,
  bodyMuted: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  } satisfies TextStyle,
  caption: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    letterSpacing: 0.4,
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    letterSpacing: 0.3,
  } satisfies TextStyle,
};
