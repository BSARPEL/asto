import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { RELATIONSHIP_TYPES, type Partner } from '@asto/shared';
import { scoreBandLabel } from '@/components/HarmonyOrbs';
import { FadeIn } from '@/components/motion';
import {
  Body,
  Button,
  Card,
  HeaderRow,
  NightCard,
  Screen,
  ScreenScroll,
  TokenBadge,
  tabScrollStyle,
} from '@/components/ui';
import {
  getSelectedPartnerId,
  isPartnerReportUnlocked,
  setSelectedPartnerId,
} from '@/lib/analysis-draft';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

const MOODS = ['Yakın', 'İyi', 'Kararsız', 'Uzak', 'Kırgın', 'Endişeli'] as const;

function moodStorageKey(): string {
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `asto_home_mood_${day}`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).toLocaleUpperCase('tr-TR');
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [mood, setMood] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!profile?.id) return;
        const [id, savedMood] = await Promise.all([
          getSelectedPartnerId(),
          AsyncStorage.getItem(moodStorageKey()),
        ]);
        const { partners } = await aiService.listPartners(profile.id);
        if (!alive) return;
        const selected = (id && partners.find((p) => p.id === id)) || partners[0] || null;
        if (selected) await setSelectedPartnerId(selected.id);
        setPartner(selected);
        if (savedMood) setMood(savedMood);
      })();
      return () => {
        alive = false;
      };
    }, [profile?.id]),
  );

  const insight =
    partner?.previewSummary ||
    partner?.analysis?.slice(0, 220) ||
    profile?.soulmateReading?.summary ||
    'Bugün bir bağ seç veya yeni analiz başlat — gökyüzü senin için konuşsun.';

  const typeLabel =
    RELATIONSHIP_TYPES.find((t) => t.id === partner?.relationshipType)?.title || 'İlişki';
  const unlocked = isPartnerReportUnlocked(partner, profile?.isSubscribed);
  const names = partner
    ? `${profile?.displayName?.split(' ')[0] || 'Sen'} & ${partner.birth.name}`
    : null;

  const pickMood = async (m: string) => {
    setMood(m);
    await AsyncStorage.setItem(moodStorageKey(), m);
  };

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={tabScrollStyle()}>
        <HeaderRow
          eyebrow={todayLabel()}
          title={`${greeting()}, ${profile?.displayName?.split(' ')[0] || ''}`}
          right={profile ? <TokenBadge balance={profile.tokenBalance} compact /> : null}
        />

        <FadeIn>
          <NightCard>
            <Text style={styles.kicker}>Bugünün içgörüsü</Text>
            <Body style={styles.insight}>{insight}</Body>
            {names ? (
              <Text style={styles.insightMeta}>{names} analizine göre</Text>
            ) : null}
          </NightCard>
        </FadeIn>

        {partner ? (
          <FadeIn delayMs={80}>
            <Card elevated>
              <Text style={styles.moodQ}>Bugün bu ilişki hakkında nasıl hissediyorsunuz?</Text>
              <View style={styles.moods}>
                {MOODS.map((m) => {
                  const active = mood === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => void pickMood(m)}
                      style={[styles.moodChip, active && styles.moodChipOn]}
                    >
                      <Text style={[styles.moodText, active && styles.moodTextOn]}>{m}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </FadeIn>
        ) : null}

        {partner ? (
          <FadeIn delayMs={120}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: unlocked ? '/(analysis)/report' : '/(analysis)/preview',
                  params: { partnerId: partner.id },
                })
              }
            >
              <Card elevated>
                <Text style={styles.cardNames}>{names}</Text>
                <Text style={styles.cardMeta}>
                  {typeLabel}
                  {partner.synastryScore != null
                    ? ` · %${partner.synastryScore} · ${scoreBandLabel(partner.synastryScore)}`
                    : ''}
                  {unlocked ? ' · Tam rapor' : ' · Ön izleme'}
                </Text>
                <Text style={styles.cardCta}>{unlocked ? 'Raporu Aç ›' : 'Ön izlemeyi aç ›'}</Text>
              </Card>
            </Pressable>
          </FadeIn>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="BN Astro'ya Sor"
            variant="ghost"
            onPress={() => router.push('/(tabs)/ask')}
          />
          <Button label="+ Yeni Analiz Oluştur" onPress={() => router.push('/(analysis)/type')} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(241,237,229,0.65)',
    marginBottom: spacing.sm,
  },
  insight: { color: colors.nightCardText },
  insightMeta: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(241,237,229,0.55)',
  },
  moodQ: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.bgHighlight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  moodChipOn: {
    backgroundColor: colors.tealDim,
    borderColor: colors.teal,
  },
  moodText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSoft },
  moodTextOn: { color: colors.teal },
  cardNames: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  cardMeta: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  cardCta: {
    marginTop: spacing.md,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.teal,
  },
  actions: { gap: spacing.sm },
});
