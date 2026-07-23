import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SoftPulse, FadeIn } from '@/components/motion';
import { colors, fonts, splashGradient, spacing, typography } from '@/constants/theme';

/** Kullanıcının resmi BN Astro logosu */
const brandLogo = require('../assets/images/brand-mark.png');

type MarkSize = 'sm' | 'md' | 'lg' | 'hero';

const MARK_DIM: Record<MarkSize, number> = {
  sm: 56,
  md: 88,
  lg: 128,
  hero: 220,
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

/** Native splash sonrası / yüklenirken */
export function BrandSplash({ message }: { message?: string }) {
  return (
    <View style={styles.splashRoot}>
      <StatusBar style="light" />
      <LinearGradient colors={[...splashGradient]} style={StyleSheet.absoluteFill} />
      <FadeIn from="up" delayMs={80}>
        <View style={styles.splashInner}>
          <SoftPulse>
            <BrandLogoMark size="hero" style={styles.splashMark} />
          </SoftPulse>
          <Text style={styles.splashTag}>Sonsuz bağ · Natal stüdyo</Text>
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
    backgroundColor: colors.splash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashInner: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  splashMark: {
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  splashTag: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 0.6,
    color: 'rgba(230, 225, 241, 0.72)',
  },
  splashMsg: {
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(230, 225, 241, 0.55)',
  },
});
