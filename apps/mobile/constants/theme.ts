import { Dimensions, Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Gündüz / aydınlık tema — sıcak krem zemin, koyu metin */
export const colors = {
  bg: '#FAF8F4',
  bgMid: '#F3F0E8',
  bgElevated: '#FFFFFF',
  bgSoft: '#F5F2EB',
  bgHighlight: '#EDE8DD',
  border: 'rgba(44, 38, 30, 0.1)',
  borderStrong: 'rgba(44, 38, 30, 0.18)',
  text: '#1C2436',
  textMuted: '#6B6570',
  textSoft: '#4A4550',
  accent: '#C4A57A',
  accentStrong: '#8B6F47',
  accentLight: '#E8D9C0',
  onAccent: '#FFFCF7',
  teal: '#3D9A94',
  tealDim: 'rgba(61, 154, 148, 0.12)',
  danger: '#C45A4E',
  dangerDim: 'rgba(196, 90, 78, 0.1)',
  success: '#3D8B62',
  successDim: 'rgba(61, 139, 98, 0.1)',
  overlay: 'rgba(28, 36, 54, 0.35)',
  userBubble: '#E8EEF8',
  assistantBubble: '#F5F2EB',
  star: 'rgba(139, 111, 71, 0.35)',
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
    ? ({ boxShadow: '0 8px 28px rgba(28, 36, 54, 0.08)' } as ViewStyle)
    : {
        shadowColor: '#1C2436',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
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
