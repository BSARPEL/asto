import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IAP_PRODUCTS, TOKEN_REWARDS } from '@asto/shared';
import {
  Body,
  Button,
  Card,
  ErrorText,
  Screen,
  Subtitle,
  Title,
  TokenBadge,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { monetization } from '@/lib/monetization';
import { colors, spacing } from '@/constants/theme';

export default function TokensScreen() {
  const { token, profile, setProfile, adClaimsToday, maxAdsPerDay, refresh } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (!token) return;
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Title>Jeton & abonelik</Title>
            <Subtitle>Soru sor, ilişki analizi al veya reklam izleyerek jeton kazan.</Subtitle>
          </View>
          <TokenBadge balance={profile?.tokenBalance ?? 0} />
        </View>

        {profile?.isSubscribed ? (
          <Card>
            <Text style={styles.cardTitle}>Asto Plus aktif</Text>
            <Body>Abonelik süresince soru ve analizler jeton düşmez.</Body>
          </Card>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>Aylık abonelik</Text>
            <Body muted>{IAP_PRODUCTS.monthly.priceLabel} — sınırsız öngörü soruları ve analiz</Body>
            <Button
              label="Abone ol"
              loading={loading === 'sub'}
              onPress={() =>
                run('sub', async () => {
                  const res = await monetization.purchaseProduct(token!, IAP_PRODUCTS.monthly.id);
                  setProfile(res.profile);
                  setInfo('Abonelik etkinleştirildi (geliştirme modu).');
                })
              }
            />
          </Card>
        )}

        <Text style={styles.cardTitle}>Jeton paketleri</Text>
        {[IAP_PRODUCTS.tokens5, IAP_PRODUCTS.tokens10, IAP_PRODUCTS.tokens50].map((p) => (
          <Card key={p.id}>
            <Text style={styles.packTitle}>
              +{p.tokens} jeton · {p.priceLabel}
            </Text>
            <Button
              label="Satın al"
              variant="ghost"
              loading={loading === p.id}
              onPress={() =>
                run(p.id, async () => {
                  const res = await monetization.purchaseProduct(token!, p.id);
                  setProfile(res.profile);
                  setInfo(`+${p.tokens} jeton eklendi.`);
                })
              }
            />
          </Card>
        ))}

        <Card>
          <Text style={styles.cardTitle}>Reklam izle</Text>
          <Body muted>
            Bugün {adClaimsToday}/{maxAdsPerDay} · her izlemede +{TOKEN_REWARDS.rewardedAd} jeton
            {!monetization.isAdMobConfigured() ? ' (simülasyon)' : ''}
          </Body>
          <Button
            label="Ödüllü reklam izle"
            loading={loading === 'ad'}
            onPress={() =>
              run('ad', async () => {
                const res = await monetization.showRewardedAd(token!);
                setProfile(res.profile);
                setInfo(`+${res.reward} jeton kazandın.`);
              })
            }
          />
        </Card>

        <ErrorText>{error}</ErrorText>
        {info ? <Body muted>{info}</Body> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: 12 },
  cardTitle: {
    fontFamily: 'Syne_700Bold',
    color: colors.accentStrong,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  packTitle: {
    fontFamily: 'Manrope_700Bold',
    color: colors.text,
    fontSize: 16,
    marginBottom: 4,
  },
});
