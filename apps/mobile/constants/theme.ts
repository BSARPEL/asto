import { Dimensions, Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  bg: '#0B1020',
  bgMid: '#10182C',
  bgElevated: '#151D34',
  bgSoft: '#1B243F',
  bgHighlight: '#222C4A',
  border: 'rgba(212, 197, 160, 0.16)',
  borderStrong: 'rgba(212, 197, 160, 0.28)',
  text: '#F4F0E6',
  textMuted: '#A39B8C',
  textSoft: '#C9C0B0',
  accent: '#D4C5A0',
  accentStrong: '#E8D9B0',
  teal: '#6BB5B0',
  tealDim: 'rgba(107, 181, 176, 0.14)',
  danger: '#E07A6D',
  dangerDim: 'rgba(224, 122, 109, 0.14)',
  success: '#7CB89A',
  successDim: 'rgba(124, 184, 154, 0.14)',
  overlay: 'rgba(11, 16, 32, 0.78)',
  userBubble: '#1A2744',
  assistantBubble: '#151D34',
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
  lg: 20,
  xl: 28,
  pill: 999,
};

export const fonts = {
  display: 'Syne_700Bold',
  displaySemi: 'Syne_600SemiBold',
  displayExtra: 'Syne_800ExtraBold',
  body: 'Manrope_400Regular',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
};

/** Breakpoints for phone / tablet / desktop web */
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

export function contentMaxWidth(size: LayoutSize): number {
  if (size === 'desktop') return 720;
  if (size === 'tablet') return 640;
  return 560;
}

export function pageGutter(size: LayoutSize): number {
  if (size === 'desktop') return spacing.xl;
  if (size === 'tablet') return spacing.lg;
  return spacing.md;
}

export const shadowSoft: ViewStyle =
  Platform.OS === 'web'
    ? { boxShadow: '0 12px 40px rgba(0,0,0,0.28)' }
    : {
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      };

export const typography = {
  brandLg: {
    fontFamily: fonts.displayExtra,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: 0.5,
    color: colors.accentStrong,
  } satisfies TextStyle,
  brand: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0.4,
    color: colors.accentStrong,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
  } satisfies TextStyle,
  titleSm: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  } satisfies TextStyle,
  section: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 22,
    color: colors.accentStrong,
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
    letterSpacing: 0.2,
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  } satisfies TextStyle,
};
