import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IAP_PRODUCTS, TOKEN_COSTS } from '@asto/shared';
import type { Partner } from '@asto/shared';
import { BackBar } from '@/components/BackBar';
import {
  Body,
  Button,
  Card,
  ErrorText,
  Screen,
  ScreenScroll,
  Subtitle,
  Title,
  TokenBadge,
} from '@/components/ui';
import { getSelectedPartnerId } from '@/lib/analysis-draft';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

const PERKS = [
  'Detaylı sinastri yorumu',
  'Güçlü ve hassas alanlar',
  'Çatışma tetikleyicileri',
  'Uzun vadeli potansiyel',
  'Kişisel öneriler',
  'Rapora özel sohbet',
];

export default function PaywallScreen() {
  const { partnerId: paramId } = useLocalSearchParams<{ partnerId?: string }>();
  const { profile, token, setProfile } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      const id = paramId || (await getSelectedPartnerId());
      if (!id) return;
      const { partners } = await aiService.listPartners(profile.id);
      setPartner(partners.find((p) => p.id === id) ?? null);
    })();
  }, [profile?.id, paramId]);

  const goSuccess = (id: string) => {
    router.replace({ pathname: '/(analysis)/success', params: { partnerId: id } });
  };

  const unlock = async (method: 'tokens' | 'iap' | 'plus') => {
    if (!partner || !token) return;
    setError(null);
    setLoading(method);
    try {
      if (method === 'plus' && !profile?.isSubscribed) {
        router.push('/tokens');
        return;
      }
      const res = await aiService.unlockPartnerReport(token, partner.id, method);
      setProfile(res.profile);
      goSuccess(partner.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const names = partner
    ? `${profile?.displayName?.split(' ')[0] || 'Sen'} & ${partner.birth.name}`
    : 'Analiz';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <BackBar
          label={names}
          fallbackHref="/(analysis)/preview"
          onPress={() =>
            router.replace({
              pathname: '/(analysis)/preview',
              params: { partnerId: partner?.id || paramId || '' },
            })
          }
        />
        <Title>Tam analizi açın</Title>
        <Subtitle>
          {names} analizinin tamamı: derinlemesine yorum ve size özel öneriler.
        </Subtitle>

        <Card elevated>
          {PERKS.map((item) => (
            <View key={item} style={styles.perkRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.perk}>{item}</Text>
            </View>
          ))}
        </Card>

        {profile ? <TokenBadge balance={profile.tokenBalance} /> : null}
        <ErrorText>{error}</ErrorText>

        <Button
          label={
            profile?.isSubscribed
              ? 'Plus ile aç'
              : `Jetonla aç (${TOKEN_COSTS.fullRelationshipReport} jeton)`
          }
          onPress={() => unlock(profile?.isSubscribed ? 'plus' : 'tokens')}
          loading={loading === 'tokens' || loading === 'plus'}
          disabled={!partner}
        />
        <Button
          label={`Tek analiz · ${IAP_PRODUCTS.fullReport.priceLabel}`}
          variant="ghost"
          onPress={() => unlock('iap')}
          loading={loading === 'iap'}
          disabled={!partner}
        />
        {!profile?.isSubscribed ? (
          <Button
            label="Plus aboneliğine bak"
            variant="ghost"
            onPress={() => router.push('/tokens')}
          />
        ) : null}

        <Button
          label="Şimdilik ön izlemeye dön"
          variant="ghost"
          onPress={() =>
            router.replace({
              pathname: '/(analysis)/preview',
              params: { partnerId: partner?.id || paramId || '' },
            })
          }
        />

        <View style={styles.foot}>
          <Body muted>Tek seferlik satın alma. Abonelik değildir.</Body>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md, paddingTop: spacing.sm },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  check: { color: colors.teal, fontFamily: fonts.bodySemi, fontSize: 15 },
  perk: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    flex: 1,
  },
  foot: { marginTop: spacing.xs },
});
