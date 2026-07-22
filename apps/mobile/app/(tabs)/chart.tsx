import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PLANET_LABELS_TR, ASPECT_LABELS_TR } from '@asto/shared';
import { Body, Button, Card, ErrorText, Screen, Subtitle, Title, TokenBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';

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
        <View style={styles.pad}>
          <Title>Harita yok</Title>
          <Subtitle>Doğum bilgilerini tamamla.</Subtitle>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.pad}
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
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Title>{profile?.displayName}</Title>
            <Subtitle>
              Güneş {chart.sunSign} · Ay {chart.moonSign} · Yükselen {chart.risingSign}
            </Subtitle>
          </View>
          <TokenBadge balance={profile?.tokenBalance ?? 0} />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Gezegenler</Text>
          {chart.planets.map((p) => (
            <View key={p.name} style={styles.planetRow}>
              <Text style={styles.planetName}>{PLANET_LABELS_TR[p.name] ?? p.name}</Text>
              <Text style={styles.planetVal}>
                {p.sign} {p.signDegree.toFixed(1)}° · Ev {p.house}
                {p.retrograde ? ' R' : ''}
              </Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Öne çıkan açılar</Text>
          {chart.aspects.slice(0, 8).map((a, i) => (
            <Body key={`${a.planetA}-${a.planetB}-${i}`} muted>
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
          <Card>
            <Text style={styles.cardTitle}>AI yorum</Text>
            <Body>{narrative}</Body>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: {
    fontFamily: 'Syne_700Bold',
    color: colors.accentStrong,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  planetName: { color: colors.text, fontFamily: 'Manrope_600SemiBold', flex: 1 },
  planetVal: { color: colors.textMuted, fontFamily: 'Manrope_400Regular', flex: 1.4, textAlign: 'right' },
});
