import { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PLANET_LABELS_TR, ASPECT_LABELS_TR } from '@asto/shared';
import {
  Body,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorText,
  HeaderRow,
  Screen,
  ScreenScroll,
  SectionTitle,
  SignTrio,
  TokenBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

export default function ChartScreen() {
  const { token, profile, setProfile, refresh } = useAuth();
  const chart = profile?.natalChart;
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onNarrative = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.chartNarrative(token);
      setNarrative(res.text);
      setProfile(res.profile);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!chart) {
    return (
      <Screen>
        <ScreenScroll>
          <EmptyState
            title="Harita yok"
            body="Doğum bilgilerini tamamladığında natal haritan burada görünecek."
          />
        </ScreenScroll>
      </Screen>
    );
  }

  const planets = chart.planets.filter(
    (p) => !['Ascendant', 'Descendant', 'Midheaven'].includes(p.name),
  );
  const angles = chart.planets.filter((p) =>
    ['Ascendant', 'Descendant', 'Midheaven', 'NorthNode', 'SouthNode'].includes(p.name),
  );

  return (
    <Screen>
      <ScreenScroll
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await refresh();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
      >
        <HeaderRow
          title={profile?.displayName ?? 'Haritam'}
          subtitle="Natal haritanın özeti"
          right={<TokenBadge balance={profile?.tokenBalance ?? 0} />}
        />

        <SignTrio sun={chart.sunSign} moon={chart.moonSign} rising={chart.risingSign} />

        <Card elevated>
          <SectionTitle>Gezegenler</SectionTitle>
          {planets.map((p, idx) => (
            <View key={p.name}>
              {idx > 0 ? <Divider /> : null}
              <View style={styles.planetRow}>
                <Text style={styles.planetName}>{PLANET_LABELS_TR[p.name] ?? p.name}</Text>
                <Text style={styles.planetVal}>
                  {p.sign} {p.signDegree.toFixed(1)}°
                </Text>
                <Text style={styles.planetHouse}>
                  Ev {p.house}
                  {p.retrograde ? ' · R' : ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <SectionTitle>Açılar & düğümler</SectionTitle>
          {angles.map((p) => (
            <View key={p.name} style={styles.planetRow}>
              <Text style={styles.planetName}>{PLANET_LABELS_TR[p.name] ?? p.name}</Text>
              <Text style={styles.planetVal}>
                {p.sign} {p.signDegree.toFixed(1)}°
              </Text>
            </View>
          ))}
          <Divider />
          {chart.aspects.slice(0, 8).map((a, i) => (
            <Body key={`${a.planetA}-${a.planetB}-${i}`} muted style={styles.aspectLine}>
              {PLANET_LABELS_TR[a.planetA]} – {PLANET_LABELS_TR[a.planetB]} ·{' '}
              {ASPECT_LABELS_TR[a.type]} ({a.orb}°)
            </Body>
          ))}
        </Card>

        <Button
          label={profile?.isSubscribed ? 'Haritamı anlat' : 'Haritamı anlat (2 jeton)'}
          onPress={onNarrative}
          loading={loading}
        />
        <ErrorText>{error}</ErrorText>

        {narrative ? (
          <Card elevated>
            <SectionTitle>AI yorum</SectionTitle>
            <Body>{narrative}</Body>
          </Card>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  planetName: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    flexGrow: 1,
    flexBasis: 110,
    minWidth: 100,
  },
  planetVal: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    flexGrow: 1,
    flexBasis: 120,
  },
  planetHouse: {
    color: colors.teal,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  aspectLine: {
    marginBottom: spacing.xs,
  },
});
