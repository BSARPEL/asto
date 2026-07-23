import { Dimensions, Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Gözlemevi — güven veren premium natal stüdyo.
 * Gece mürekkebi + ay ışığı + gökyüzü aquası. Mor glow / krem wellness yok.
 */
export const colors = {
  bg: '#090D14',
  bgMid: '#0E1520',
  bgElevated: '#141C2A',
  bgSoft: '#182233',
  bgHighlight: '#222C40',
  border: 'rgba(232, 220, 200, 0.08)',
  borderStrong: 'rgba(232, 220, 200, 0.16)',
  text: '#F0EBE3',
  textMuted: '#8E96A8',
  textSoft: '#BCC3CE',
  /** Ay ışığı */
  accent: '#D9C9A5',
  accentStrong: '#EDE0C4',
  accentLight: 'rgba(217, 201, 165, 0.12)',
  onAccent: '#090D14',
  /** Gökyüzü aquası — etkileşim */
  teal: '#62BDB5',
  tealDim: 'rgba(98, 189, 181, 0.14)',
  danger: '#E07A6E',
  dangerDim: 'rgba(224, 122, 110, 0.14)',
  success: '#6BB88A',
  successDim: 'rgba(107, 184, 138, 0.14)',
  overlay: 'rgba(4, 7, 12, 0.66)',
  userBubble: '#1A2738',
  assistantBubble: '#162030',
  star: 'rgba(237, 224, 196, 0.38)',
  glowTeal: 'rgba(98, 189, 181, 0.07)',
  glowMoon: 'rgba(217, 201, 165, 0.06)',
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
    ? ({ boxShadow: '0 10px 32px rgba(0, 0, 0, 0.35)' } as ViewStyle)
    : {
        shadowColor: '#000000',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      };

/** Ekran arka plan — derin gece, yumuşak horizon */
export const screenGradient = ['#090D14', '#111927', '#0C121C', '#090D14'] as const;

/** Primary button — ay ışığı */
export const accentGradient = ['#EDE0C4', '#D9C9A5', '#C9B892'] as const;

export const typography = {
  brandLg: {
    fontFamily: fonts.displayExtra,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: 0.6,
    color: colors.accentStrong,
  } satisfies TextStyle,
  brand: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.4,
    color: colors.accentStrong,
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
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.3,
    color: colors.accent,
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
