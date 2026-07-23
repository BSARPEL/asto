import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PLANET_LABELS_TR, ASPECT_LABELS_TR } from '@asto/shared';
import {
  Body,
  Button,
  Card,
  EmptyState,
  ErrorText,
  HeaderRow,
  PlanetRow,
  PlanetTableHeader,
  PlusBadge,
  ResponsiveSplit,
  Screen,
  ScreenScroll,
  SectionTitle,
  SignTrio,
  Skeleton,
  TokenBadge,
  tabScrollStyle,
} from '@/components/ui';
import { AstroGlyph } from '@/components/AstroGlyph';
import { planetLabel } from '@/constants/astro';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';

export default function ChartScreen() {
  const { token, profile, setProfile, refresh } = useAuth();
  const chart = profile?.natalChart;
  const [narrative, setNarrative] = useState<string | null>(profile?.chartNarrative ?? null);
  const [narrativeCached, setNarrativeCached] = useState(Boolean(profile?.chartNarrative));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.chartNarrative) {
      setNarrative(profile.chartNarrative);
      setNarrativeCached(true);
    }
  }, [profile?.chartNarrative]);

  const onNarrative = useCallback(
    async (force = false) => {
      if (!token) return;
      setError(null);
      setLoading(true);
      try {
        const res = await api.chartNarrative(token, force);
        setNarrative(res.text);
        setNarrativeCached(res.cached);
        setProfile(res.profile);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [token, setProfile],
  );

  if (!chart) {
    return (
      <Screen>
        <ScreenScroll contentContainerStyle={tabScrollStyle()}>
          <EmptyState
            compact
            title="Harita yok"
            body="Doğum bilgilerini tamamladığında natal haritan burada görünecek."
            planetKey="Moon"
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

  const narrativeLabel = profile?.isSubscribed
    ? narrative
      ? 'Yeniden anlat'
      : 'Haritamı anlat'
    : narrative
      ? 'Yeniden anlat (2 jeton)'
      : 'Haritamı anlat (2 jeton)';

  const planetsCard = (
    <Card compact accent={colors.teal}>
      <SectionTitle compact>Gezegenler</SectionTitle>
      <PlanetTableHeader />
      {planets.map((p, idx) => (
        <PlanetRow
          key={p.name}
          compact
          planetKey={p.name}
          label={PLANET_LABELS_TR[p.name] ?? p.name}
          sign={p.sign}
          degree={p.signDegree}
          house={p.house}
          retrograde={p.retrograde}
          isLast={idx === planets.length - 1}
        />
      ))}
    </Card>
  );

  const anglesCard = (
    <Card compact>
      <SectionTitle compact>Açılar & düğümler</SectionTitle>
      <PlanetTableHeader showHouse={false} firstColumnLabel="Nokta" />
      {angles.map((p, idx) => (
        <PlanetRow
          key={p.name}
          compact
          showHouseColumn={false}
          planetKey={p.name}
          label={PLANET_LABELS_TR[p.name] ?? p.name}
          sign={p.sign}
          degree={p.signDegree}
          isLast={idx === angles.length - 1 && chart.aspects.length === 0}
        />
      ))}
      {chart.aspects.slice(0, 8).map((a, i) => (
        <View key={`${a.planetA}-${a.planetB}-${i}`} style={styles.aspectRow}>
          <View style={styles.aspectGlyphs}>
            <AstroGlyph planetKey={a.planetA} size="sm" color={colors.accentStrong} />
            <Text style={styles.aspectDash}>–</Text>
            <AstroGlyph planetKey={a.planetB} size="sm" color={colors.teal} />
          </View>
          <Text style={styles.aspectText}>
            {planetLabel(a.planetA)} – {planetLabel(a.planetB)} ·{' '}
            {ASPECT_LABELS_TR[a.type]} ({a.orb}°)
          </Text>
        </View>
      ))}
    </Card>
  );

  return (
    <Screen>
      <ScreenScroll
        contentContainerStyle={tabScrollStyle()}
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
          compact
          eyebrow="Natal harita"
          title={profile?.displayName ?? 'Haritam'}
          right={
            <View style={styles.headerRight}>
              <TokenBadge compact balance={profile?.tokenBalance ?? 0} />
              {profile?.isSubscribed ? <PlusBadge /> : null}
            </View>
          }
        />

        <Card compact>
          <SectionTitle compact>Büyük üçlü</SectionTitle>
          <SignTrio sun={chart.sunSign} moon={chart.moonSign} rising={chart.risingSign} compact />
        </Card>

        <ResponsiveSplit leading={planetsCard} trailing={anglesCard} />

        {narrative ? (
          <Card compact style={styles.narrativeCard}>
            <SectionTitle compact>AI yorum{narrativeCached ? ' · kayıtlı' : ''}</SectionTitle>
            <Body style={styles.narrativeBody}>{narrative}</Body>
          </Card>
        ) : loading ? (
          <Card compact>
            <Skeleton height={12} width="90%" />
            <Skeleton height={12} width="75%" style={{ marginTop: 6 }} />
            <Skeleton height={12} width="85%" style={{ marginTop: 6 }} />
          </Card>
        ) : null}

        <Button
          compact
          label={narrativeLabel}
          onPress={() => onNarrative(Boolean(narrative))}
          loading={loading}
          variant={narrative ? 'ghost' : 'primary'}
          icon="✦"
        />
        <ErrorText>{error}</ErrorText>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRight: { alignItems: 'flex-end', gap: 4 },
  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  aspectGlyphs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 44,
  },
  aspectDash: { color: colors.textMuted, fontSize: 11 },
  aspectText: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  narrativeCard: { marginBottom: spacing.sm },
  narrativeBody: { fontSize: 14, lineHeight: 21 },
});
