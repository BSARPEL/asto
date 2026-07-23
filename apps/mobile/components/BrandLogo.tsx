import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BreathingOrbs } from '@/components/HarmonyOrbs';
import { SoftPulse, FadeIn } from '@/components/motion';
import { colors, fonts, splashGradient, spacing, typography } from '@/constants/theme';

/** Kullanıcının resmi BN Astro logosu */
const brandLogo = require('../assets/images/brand-mark.png');

type MarkSize = 'sm' | 'md' | 'lg' | 'hero';

const MARK_DIM: Record<MarkSize, number> = {
  sm: 56,
  md: 88,
  lg: 128,
  hero: 168,
};

/** Tam logo (∞ + BN ASTRO) */
export function BrandLogoMark({
  size = 'md',
  style,
}: {
  size?: MarkSize;
  style?: StyleProp<ImageStyle>;
}) {
  const dim = MARK_DIM[size];
  return (
    <Image
      source={brandLogo}
      style={[{ width: dim, height: dim, borderRadius: dim * 0.18 }, style]}
      resizeMode="cover"
      accessibilityLabel="BN Astro"
    />
  );
}

/** Auth / onboarding — logoda zaten BN ASTRO yazısı var */
export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const large = size === 'lg';
  return (
    <FadeIn from="down" delayMs={40}>
      <View style={styles.brandWrap}>
        <SoftPulse>
          <View style={[styles.brandFrame, large && styles.brandFrameLg]}>
            <Image
              source={brandLogo}
              style={large ? styles.brandImageLg : styles.brandImage}
              resizeMode="cover"
              accessibilityLabel="BN Astro"
            />
          </View>
        </SoftPulse>
        {large ? (
          <Text style={styles.brandTag}>Natal · Sinastri · Sonsuz bağ</Text>
        ) : null}
      </View>
    </FadeIn>
  );
}

/** Native splash sonrası / auth yüklenirken — krem Harmony açılışı */
export function BrandSplash({ message }: { message?: string }) {
  return (
    <View style={styles.splashRoot}>
      <StatusBar style="dark" />
      <LinearGradient colors={[...splashGradient]} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowMoon} pointerEvents="none" />

      <FadeIn from="up" delayMs={60}>
        <View style={styles.splashInner}>
          <Text style={styles.splashBrand}>BN Astro</Text>
          <BreathingOrbs size={118} />
          <SoftPulse>
            <View style={styles.splashMarkFrame}>
              <BrandLogoMark size="hero" style={styles.splashMark} />
            </View>
          </SoftPulse>
          <Text style={styles.splashTag}>Aranızdaki bağı daha iyi anlayın</Text>
          {message ? <Text style={styles.splashMsg}>{message}</Text> : null}
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  brandWrap: { marginBottom: spacing.lg, alignItems: 'flex-start' },
  brandFrame: {
    width: 112,
    height: 112,
    borderRadius: 24,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.splash,
  },
  brandFrameLg: {
    width: 148,
    height: 148,
    borderRadius: 28,
  },
  brandImage: { width: 112, height: 112 },
  brandImageLg: { width: 148, height: 148 },
  brandTag: {
    ...typography.caption,
    marginTop: 4,
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  splashRoot: {
    flex: 1,
    backgroundColor: colors.splashBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.glowTeal,
  },
  glowMoon: {
    position: 'absolute',
    bottom: -70,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.glowMoon,
  },
  splashInner: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  splashBrand: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    letterSpacing: 2.4,
    color: colors.text,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  splashMarkFrame: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.splash,
  },
  splashMark: {
    borderRadius: 36,
  },
  splashTag: {
    marginTop: spacing.xs,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 280,
  },
  splashMsg: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
