import { Dimensions, Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * BN Astro UI — Harmony akış dili + BN Astro markası.
 * Sıcak krem zemin, serif başlık, mor/rose aksan, logo splash koyu kalır.
 */
export const brand = {
  cosmic: '#280F5F',
  nebula: '#6B3AA8',
  magenta: '#C73892',
  harmonyPurple: '#6B4E7A',
  harmonyRose: '#C98B9B',
  light: '#FBF8F4',
} as const;

export const colors = {
  bg: '#FBF8F4',
  bgMid: '#F1ECE3',
  bgElevated: '#FFFFFF',
  bgSoft: 'rgba(255,255,255,0.72)',
  bgHighlight: '#F1E9E1',
  border: 'rgba(34, 30, 40, 0.08)',
  borderStrong: 'rgba(34, 30, 40, 0.14)',
  text: '#221E28',
  textMuted: '#8A8494',
  textSoft: '#5B5462',
  accent: '#C98B9B',
  accentStrong: '#4A3556',
  accentLight: 'rgba(201, 139, 155, 0.16)',
  onAccent: '#FFFFFF',
  /** CTA / etkileşim — Harmony mor (token adı teal korunur) */
  teal: '#6B4E7A',
  tealDim: 'rgba(107, 78, 122, 0.12)',
  danger: '#D15A4F',
  dangerDim: 'rgba(209, 90, 79, 0.12)',
  success: '#3D9A68',
  successDim: 'rgba(61, 154, 104, 0.12)',
  overlay: 'rgba(34, 30, 40, 0.48)',
  userBubble: '#F3E8F0',
  assistantBubble: '#F4F0EA',
  star: 'rgba(107, 78, 122, 0.35)',
  glowTeal: 'rgba(107, 78, 122, 0.07)',
  glowMoon: 'rgba(201, 139, 155, 0.08)',
  splash: '#280F5F',
  nightCard: '#221E28',
  nightCardText: '#F1EDE5',
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
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const fonts = {
  display: 'CormorantGaramond_600SemiBold',
  displaySemi: 'CormorantGaramond_500Medium',
  displayExtra: 'CormorantGaramond_700Bold',
  body: 'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
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
    ? ({ boxShadow: '0 8px 28px rgba(34, 30, 40, 0.08)' } as ViewStyle)
    : {
        shadowColor: '#221E28',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      };

export const screenGradient = ['#FBF8F4', '#F6F0EA', '#F1E9E1', '#FBF8F4'] as const;

export const accentGradient = ['#7A5A8C', '#6B4E7A', '#C98B9B'] as const;

export const splashGradient = ['#1A083F', '#280F5F', '#3A1878', '#280F5F'] as const;

export const nightCardGradient = ['#2A2433', '#221E28', '#1A1620'] as const;

export const typography = {
  brandLg: {
    fontFamily: fonts.displayExtra,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: 0.6,
    color: colors.text,
  } satisfies TextStyle,
  brand: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.4,
    color: colors.text,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.2,
    color: colors.text,
  } satisfies TextStyle,
  titleSm: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  } satisfies TextStyle,
  section: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
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
    letterSpacing: 0.1,
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    letterSpacing: 0.12,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,
};
