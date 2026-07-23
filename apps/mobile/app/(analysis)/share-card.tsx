import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { RELATIONSHIP_TYPES, type Partner } from '@asto/shared';
import { BackBar } from '@/components/BackBar';
import { scoreBandLabel } from '@/components/HarmonyOrbs';
import { Button, Screen, ScreenScroll } from '@/components/ui';
import { getSelectedPartnerId } from '@/lib/analysis-draft';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

export default function ShareCardScreen() {
  const { partnerId: paramId } = useLocalSearchParams<{ partnerId?: string }>();
  const { profile } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [sharing, setSharing] = useState(false);
  const shotRef = useRef<ViewShot>(null);

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      const id = paramId || (await getSelectedPartnerId());
      if (!id) return;
      const { partners } = await aiService.listPartners(profile.id);
      setPartner(partners.find((p) => p.id === id) ?? null);
    })();
  }, [profile?.id, paramId]);

  const share = async () => {
    if (!shotRef.current?.capture) return;
    setSharing(true);
    try {
      const uri = await shotRef.current.capture();
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Paylaşım', 'Bu cihazda paylaşım kullanılamıyor.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'BN Astro skor kartı' });
    } catch (e) {
      Alert.alert('Paylaşım', (e as Error).message);
    } finally {
      setSharing(false);
    }
  };

  const score = partner?.synastryScore ?? 0;
  const typeLabel =
    RELATIONSHIP_TYPES.find((t) => t.id === partner?.relationshipType)?.title || 'İlişki';
  const quote =
    partner?.previewSummary ||
    partner?.synastryScoreNote ||
    'İki haritanın ortak ritmi';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <BackBar
          label="Paylaş"
          fallbackHref="/(analysis)/report"
          onPress={() =>
            router.replace({
              pathname: '/(analysis)/report',
              params: { partnerId: partner?.id || paramId || '' },
            })
          }
        />
        <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.shot}>
          <LinearGradient colors={['#151219', '#0C0B0F']} style={styles.card}>
            <Text style={styles.brand}>BN Astro</Text>
            <Text style={styles.score}>{partner ? score : '—'}</Text>
            <Text style={styles.pct}>%</Text>
            <Text style={styles.names}>
              {profile?.displayName?.split(' ')[0] || 'Sen'} & {partner?.birth.name || '…'}
            </Text>
            <Text style={styles.band}>
              {scoreBandLabel(score)} · {typeLabel}
            </Text>
            <Text style={styles.quote}>“{quote}”</Text>
            <Text style={styles.footer}>bn astro ile hesaplandı</Text>
          </LinearGradient>
        </ViewShot>
        <Button label="Paylaş" onPress={share} loading={sharing} disabled={!partner} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md, paddingTop: spacing.sm },
  shot: { borderRadius: 24, overflow: 'hidden' },
  card: {
    padding: spacing.xl,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(241,237,229,0.55)',
    marginBottom: spacing.lg,
  },
  score: {
    fontFamily: fonts.displayExtra,
    fontSize: 84,
    lineHeight: 90,
    color: colors.nightCardText,
  },
  pct: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: 'rgba(241,237,229,0.55)',
    marginTop: -8,
  },
  names: {
    marginTop: spacing.md,
    fontFamily: fonts.bodySemi,
    fontSize: 18,
    color: colors.nightCardText,
  },
  band: {
    marginTop: spacing.xs,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(201,139,155,0.9)',
  },
  quote: {
    marginTop: spacing.lg,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 28,
    color: 'rgba(241,237,229,0.88)',
    textAlign: 'center',
    maxWidth: 280,
  },
  footer: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(241,237,229,0.35)',
    letterSpacing: 0.4,
  },
});
