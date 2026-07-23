import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { Partner } from '@asto/shared';
import { BackBar } from '@/components/BackBar';
import { RevealScoreMoment, scoreBandLabel } from '@/components/HarmonyOrbs';
import { Button, Screen } from '@/components/ui';
import { getSelectedPartnerId } from '@/lib/analysis-draft';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

export default function RevealScreen() {
  const { partnerId: paramId } = useLocalSearchParams<{ partnerId?: string }>();
  const { profile } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    ctaOpacity.value = withDelay(2900, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [ctaOpacity]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!profile?.id) return;
        const id = paramId || (await getSelectedPartnerId());
        if (!id) {
          router.replace('/(tabs)/relationship');
          return;
        }
        const { partners } = await aiService.listPartners(profile.id);
        if (!alive) return;
        const found = partners.find((p) => p.id === id) ?? null;
        if (!found) {
          setLoadError('Analiz bulunamadı');
          return;
        }
        setPartner(found);
      } catch (e) {
        if (alive) setLoadError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [profile?.id, paramId]);

  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));
  const score = partner?.synastryScore ?? 0;
  const names = partner
    ? `${profile?.displayName?.split(' ')[0] || 'Sen'} & ${partner.birth.name}`
    : '…';

  const goPreview = () => {
    router.replace({
      pathname: '/(analysis)/preview',
      params: { partnerId: partner?.id || paramId || '' },
    });
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.wrap}>
        <BackBar
          label="BN Astro"
          fallbackHref="/(tabs)/relationship"
          onPress={() => router.replace('/(tabs)/relationship')}
        />
        <Text style={styles.brand}>Sonuç anı</Text>
        <RevealScoreMoment
          ready={Boolean(partner && partner.synastryScore != null)}
          score={score}
          band={scoreBandLabel(score)}
          names={names}
        />
        <Animated.View style={[styles.after, ctaStyle]}>
          <Text style={styles.copy}>
            {partner?.synastryScoreNote ||
              'Sonucunuz hazır. İki haritanın kesişimi ilişkinizin ritmini gösteriyor.'}
          </Text>
          {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
          <Button label="Sonucu Gör" onPress={goPreview} disabled={!partner} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  brand: {
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  after: { gap: spacing.md },
  copy: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSoft,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.body,
    color: colors.danger,
    textAlign: 'center',
  },
});
