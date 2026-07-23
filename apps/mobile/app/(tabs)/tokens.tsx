import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IAP_PRODUCTS, TOKEN_REWARDS } from '@asto/shared';
import {
  Body,
  Button,
  Card,
  ErrorText,
  HeaderRow,
  PlusBadge,
  ResponsiveGrid,
  ResponsiveSplit,
  Screen,
  ScreenScroll,
  SectionTitle,
  SuccessBanner,
  TokenBadge,
  TrustNote,
  tabScrollStyle,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { monetization } from '@/lib/monetization';
import { colors, fonts, spacing } from '@/constants/theme';

export default function TokensScreen() {
  const { token, profile, setProfile, adClaimsToday, maxAdsPerDay, refresh } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (!profile?.id) return;
    setError(null);
    setInfo(null);
    setLoading(key);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const packs = [IAP_PRODUCTS.tokens5, IAP_PRODUCTS.tokens10, IAP_PRODUCTS.tokens50];
  const adPct = Math.min(100, (adClaimsToday / Math.max(1, maxAdsPerDay)) * 100);

  const subscriptionCard = profile?.isSubscribed ? (
    <Card compact accent={colors.success}>
      <View style={styles.plusRow}>
        <PlusBadge />
        <SectionTitle compact>BN Astro Plus aktif</SectionTitle>
      </View>
      <Body style={styles.mutedSm}>Soru ve sinastri analizlerinde jeton düşmez.</Body>
    </Card>
  ) : (
    <Card compact accent={colors.accent}>
      <SectionTitle compact>BN Astro Plus</SectionTitle>
      <Text style={styles.price}>{IAP_PRODUCTS.monthly.priceLabel}</Text>
      <Text style={styles.mutedSm}>Sınırsız soru ve ilişki analizi — stüdyo erişimi</Text>
      <View style={styles.perks}>
        {['Sınırsız soru', 'Sınırsız sinastri', 'Öncelikli yorum'].map((p) => (
          <Text key={p} style={styles.perk}>
            · {p}
          </Text>
        ))}
      </View>
      <Button
        compact
        label="Abone ol"
        loading={loading === 'sub'}
        onPress={() =>
          run('sub', async () => {
            const res = await monetization.purchaseProduct(profile!.id, IAP_PRODUCTS.monthly.id);
            setProfile(res.profile);
            setInfo('Abonelik etkinleştirildi (geliştirme modu).');
          })
        }
      />
    </Card>
  );

  const adCard = (
    <Card compact>
      <SectionTitle compact>Reklam izle</SectionTitle>
      <Text style={styles.mutedSm}>
        Bugün {adClaimsToday}/{maxAdsPerDay} · +{TOKEN_REWARDS.rewardedAd} jeton
        {!monetization.isAdMobConfigured() ? ' (simülasyon)' : ''}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${adPct}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{Math.round(adPct)}% günlük limit</Text>
      <Button
        compact
        label="Ödüllü reklam izle"
        loading={loading === 'ad'}
        variant="ghost"
        onPress={() =>
          run('ad', async () => {
            const res = await monetization.showRewardedAd(profile!.id);
            setProfile(res.profile);
            setInfo(`+${res.reward} jeton kazandın.`);
          })
        }
      />
    </Card>
  );

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={tabScrollStyle()}>
        <HeaderRow
          eyebrow="Stüdyo bakiyesi"
          title="Jeton"
          subtitle="Öngörü, soru ve sinastri için"
          right={<TokenBadge compact balance={profile?.tokenBalance ?? 0} />}
        />

        <TrustNote>
          Jetonlar yorum üretimi içindir; harita hesabı her zaman ücretsiz kalır.
        </TrustNote>

        <ResponsiveSplit leading={subscriptionCard} trailing={adCard} />

        <SectionTitle compact>Jeton paketleri</SectionTitle>
        <ResponsiveGrid minColumnWidth={200}>
          {packs.map((p, i) => (
            <Card key={p.id} compact elevated={i === 1}>
              {i === 1 ? <Text style={styles.popular}>Popüler</Text> : null}
              <Text style={styles.packAmount}>+{p.tokens}</Text>
              <Text style={styles.packLabel}>jeton</Text>
              <Text style={styles.packPrice}>{p.priceLabel}</Text>
              <Button
                compact
                label="Satın al"
                variant="ghost"
                loading={loading === p.id}
                onPress={() =>
                  run(p.id, async () => {
                    const res = await monetization.purchaseProduct(profile!.id, p.id);
                    setProfile(res.profile);
                    setInfo(`+${p.tokens} jeton eklendi.`);
                  })
                }
              />
            </Card>
          ))}
        </ResponsiveGrid>

        <ErrorText>{error}</ErrorText>
        {info ? <SuccessBanner>{info}</SuccessBanner> : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  plusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  price: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.accentStrong,
    marginVertical: 4,
  },
  mutedSm: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  perks: { marginVertical: 8, gap: 2 },
  perk: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft },
  popular: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  packAmount: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
    lineHeight: 28,
  },
  packLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  packPrice: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.accentStrong,
    marginBottom: 4,
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.bgHighlight,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 999,
  },
  progressLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 4,
  },
});
