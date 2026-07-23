import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { RELATIONSHIP_TYPES, type Partner } from '@asto/shared';
import { AiMarkdown } from '@/components/AiMarkdown';
import { BackBar } from '@/components/BackBar';
import { scoreBandLabel } from '@/components/HarmonyOrbs';
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

function splitSections(analysis: string): Array<{ title: string; body: string }> {
  const parts = analysis
    .split(/\n(?=#{1,3}\s|(?:\d+)[.)]\s)/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return [{ title: 'Genel bakış', body: analysis }];
  }
  return parts.map((part, i) => {
    const lines = part.split('\n');
    const first = lines[0]?.replace(/^#+\s*/, '').replace(/^\d+[.)]\s*/, '') || `Bölüm ${i + 1}`;
    const body = lines.slice(1).join('\n').trim() || part;
    return { title: `${i + 1}. ${first}`, body };
  });
}

export default function ReportScreen() {
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
  const sections = useMemo(
    () => (partner?.analysis ? splitSections(partner.analysis) : []),
    [partner?.analysis],
  );

  const names = partner
    ? `${profile?.displayName?.split(' ')[0] || 'Sen'} & ${partner.birth.name}`
    : 'Detaylı rapor';

  const goAnalizler = () => router.replace('/(tabs)/relationship');

  if (partner && !unlocked) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <ScreenScroll contentContainerStyle={styles.scroll}>
          <BackBar label={names} fallbackHref="/(tabs)/relationship" onPress={goAnalizler} />
          <Title>Rapor kilitli</Title>
          <Subtitle>Tam analizi açarak numaralı bölümleri görüntüle.</Subtitle>
          <Button
            label="Kilidi aç"
            onPress={() =>
              router.push({
                pathname: '/(analysis)/paywall',
                params: { partnerId: partner.id },
              })
            }
          />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <BackBar label={names} fallbackHref="/(tabs)/relationship" onPress={goAnalizler} />
        <Title>{names}</Title>
        <Subtitle>
          {(RELATIONSHIP_TYPES.find((t) => t.id === partner?.relationshipType)?.title ||
            'İlişki') + ' · Tam rapor'}
          {partner?.analysisFocus ? ` · Odak: ${partner.analysisFocus}` : ''}
        </Subtitle>

        {partner?.synastryScore != null ? (
          <Card elevated style={styles.scoreCard}>
            <Text style={styles.score}>{partner.synastryScore}</Text>
            <Text style={styles.pct}>%</Text>
            <View style={styles.scoreMeta}>
              <Text style={styles.band}>{scoreBandLabel(partner.synastryScore)}</Text>
              <Body muted>{partner.synastryScoreNote || 'İki haritanın kesişimi'}</Body>
            </View>
          </Card>
        ) : null}

        {sections.map((section, index) => (
          <Card key={section.title} elevated>
            <Text style={styles.sectionIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.sectionTitle}>{section.title.replace(/^\d+\.\s*/, '')}</Text>
            <AiMarkdown content={section.body} />
          </Card>
        ))}

        <View style={styles.actions}>
          <Button
            label="BN Astro'ya Sor"
            onPress={() => {
              if (partner) void setSelectedPartnerId(partner.id);
              router.push('/(tabs)/ask');
            }}
          />
          <Button
            label="Skor kartını paylaş"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/(analysis)/share-card',
                params: { partnerId: partner?.id || '' },
              })
            }
          />
          <Button label="Analizler" variant="ghost" onPress={goAnalizler} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md, paddingTop: spacing.sm },
  scoreCard: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
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
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.teal,
    marginBottom: 4,
  },
  sectionIndex: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
