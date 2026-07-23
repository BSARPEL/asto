import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { RELATIONSHIP_TYPES } from '@asto/shared';
import { BrandLogoMark } from '@/components/BrandLogo';
import { BreathingOrbs } from '@/components/HarmonyOrbs';
import { FadeIn } from '@/components/motion';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts, splashGradient, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const { profile } = useAuth();

  const start = () => {
    if (!profile) {
      router.push('/(auth)/register');
      return;
    }
    if (!profile.natalChart) {
      router.push('/(onboarding)/birth');
      return;
    }
    router.push('/(analysis)/type');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <LinearGradient colors={[...splashGradient]} style={StyleSheet.absoluteFill} />
      <View style={styles.root}>
        <View style={styles.hero}>
          <FadeIn from="up" delayMs={60}>
            <View style={styles.logoFrame}>
              <BrandLogoMark size="md" />
            </View>
          </FadeIn>
          <FadeIn from="up" delayMs={120}>
            <Text style={styles.brand}>BN Astro</Text>
          </FadeIn>
          <FadeIn from="up" delayMs={180}>
            <BreathingOrbs size={132} />
          </FadeIn>
          <FadeIn from="up" delayMs={260}>
            <Text style={styles.headline}>Aranızdaki bağı daha iyi anlayın.</Text>
            <Text style={styles.line}>
              İki doğum haritası karşılaştırılır; ilişkinizin dinamiği anlaşılır içgörülere dönüşür.
            </Text>
          </FadeIn>
          <FadeIn from="up" delayMs={340}>
            <View style={styles.chips}>
              {RELATIONSHIP_TYPES.map((t) => (
                <View key={t.id} style={styles.chip}>
                  <Text style={styles.chipText}>{t.title}</Text>
                </View>
              ))}
            </View>
          </FadeIn>
        </View>

        <FadeIn from="up" delayMs={420}>
          <View style={styles.cta}>
            <Button label="Analize Başla" onPress={start} />
            {!profile ? (
              <Link href="/(auth)/login" style={styles.link}>
                Giriş Yap
              </Link>
            ) : (
              <Link href="/(tabs)/home" style={styles.link}>
                Ana sayfaya git
              </Link>
            )}
            <Text style={styles.trust}>Kesin hüküm yok — sadece farkındalık.</Text>
          </View>
        </FadeIn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  logoFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.splash,
  },
  brand: {
    fontFamily: fonts.displayExtra,
    fontSize: 34,
    letterSpacing: 2.4,
    color: colors.text,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 300,
  },
  line: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textSoft,
  },
  cta: { gap: spacing.sm, alignItems: 'center' },
  link: {
    fontFamily: fonts.bodySemi,
    color: colors.teal,
    fontSize: 15,
    paddingVertical: spacing.xs,
  },
  trust: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
