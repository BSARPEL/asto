import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { RELATIONSHIP_TYPES, type Partner } from '@asto/shared';
import { scoreBandLabel } from '@/components/HarmonyOrbs';
import { BackBar } from '@/components/BackBar';
import {
  Body,
  Button,
  Card,
  Screen,
  ScreenScroll,
  Subtitle,
  Title,
} from '@/components/ui';
import {
  getSelectedPartnerId,
  isPartnerReportUnlocked,
  setSelectedPartnerId,
} from '@/lib/analysis-draft';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

const LOCKED = [
  'Detaylı sinastri yorumu',
  'Çatışma tetikleyicileri',
  'Uzun vadeli potansiyel',
  'Kişisel öneriler',
];

export default function PreviewScreen() {
  const { partnerId: paramId } = useLocalSearchParams<{ partnerId?: string }>();
  const { profile } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      const id = paramId || (await getSelectedPartnerId());
      if (!id) return;
      await setSelectedPartnerId(id);
      const { partners } = await aiService.listPartners(profile.id);
      setPartner(partners.find((p) => p.id === id) ?? null);
    })();
  }, [profile?.id, paramId]);

  const unlocked = isPartnerReportUnlocked(partner, profile?.isSubscribed);
  const teaser =
    partner?.previewSummary ||
    (partner?.analysis ? partner.analysis.slice(0, 280) : 'Ön izleme hazırlanıyor…');
  const score = partner?.synastryScore ?? 0;
  const typeLabel =
    RELATIONSHIP_TYPES.find((t) => t.id === partner?.relationshipType)?.title || 'İlişki';
  const names = partner
    ? `${profile?.displayName?.split(' ')[0] || 'Sen'} & ${partner.birth.name}`
    : '…';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <BackBar
          label={names}
          fallbackHref="/(tabs)/relationship"
          onPress={() => router.replace('/(tabs)/relationship')}
        />
        <Title>{typeLabel}</Title>
        <Subtitle>İki haritanın kesişimi — ücretsiz ön izleme</Subtitle>

        <Card elevated style={styles.scoreCard}>
          <Text style={styles.score}>{partner ? score : '—'}</Text>
          <Text style={styles.pct}>%</Text>
          <View style={styles.scoreMeta}>
            <Text style={styles.band}>{scoreBandLabel(score)}</Text>
            <Body muted>İlk içgörü hazır</Body>
          </View>
        </Card>

        <Card elevated>
          <Text style={styles.section}>İlk içgörü</Text>
          <Body>{teaser}</Body>
        </Card>

        {!unlocked ? (
          <Card elevated>
            <Text style={styles.section}>Tam analizde</Text>
            {LOCKED.map((item) => (
              <View key={item} style={styles.lockRow}>
                <View style={styles.lockDot} />
                <Text style={styles.lockText}>{item}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {unlocked ? (
          <Button
            label="Tam raporu aç"
            onPress={() =>
              router.push({
                pathname: '/(analysis)/report',
                params: { partnerId: partner!.id },
              })
            }
          />
        ) : (
          <Button
            label="Tam Analizi Aç"
            onPress={() =>
              router.push({
                pathname: '/(analysis)/paywall',
                params: { partnerId: partner?.id || '' },
              })
            }
            disabled={!partner}
          />
        )}
        <Button
          label="Yeni Analiz Oluştur"
          variant="ghost"
          onPress={() => router.push('/(analysis)/type')}
        />
        <Button
          label="Analizler"
          variant="ghost"
          onPress={() => router.replace('/(tabs)/relationship')}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md, paddingTop: spacing.sm },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  score: {
    fontFamily: fonts.displayExtra,
    fontSize: 56,
    lineHeight: 60,
    color: colors.text,
  },
  pct: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textMuted,
    marginBottom: 10,
  },
  scoreMeta: { marginLeft: spacing.md, flex: 1, paddingBottom: 8 },
  band: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.teal,
    marginBottom: 4,
  },
  section: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  lockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  lockText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSoft,
  },
});
