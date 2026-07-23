import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RELATIONSHIP_TYPES, type RelationshipType } from '@asto/shared';
import { BackBar } from '@/components/BackBar';
import { Body, Button, Card, Screen, ScreenScroll, Title } from '@/components/ui';
import { FadeIn } from '@/components/motion';
import { saveAnalysisDraft } from '@/lib/analysis-draft';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AnalysisTypeScreen() {
  const [selected, setSelected] = useState<RelationshipType | null>(null);

  const continueNext = async () => {
    if (!selected) return;
    // Clear partnerId so a failed prior run cannot reuse a stale partner/analysis.
    await saveAnalysisDraft({
      relationshipType: selected,
      partnerId: undefined,
    });
    router.push('/(analysis)/person-a');
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <BackBar
          label="Adım 1 / 3"
          fallbackHref="/(tabs)/home"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/home');
          }}
        />
        <Text style={styles.step}>İlişki türü</Text>
        <FadeIn>
          <Title>Ne tür bir ilişkiyi analiz etmek istiyorsunuz?</Title>
        </FadeIn>
        <View style={styles.list}>
          {RELATIONSHIP_TYPES.map((item, index) => {
            const active = selected === item.id;
            return (
              <FadeIn key={item.id} delayMs={80 + index * 60}>
                <Pressable onPress={() => setSelected(item.id)}>
                  <Card elevated style={active ? { ...styles.card, ...styles.cardActive } : styles.card}>
                    <View style={styles.row}>
                      <View style={styles.copy}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Body muted>{item.subtitle}</Body>
                      </View>
                      <View style={[styles.check, active && styles.checkOn]}>
                        <Text style={[styles.checkMark, active && styles.checkMarkOn]}>
                          {active ? '✓' : ''}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </FadeIn>
            );
          })}
        </View>
      </ScreenScroll>
      <View style={styles.footer}>
        <Button label="Devam Et" onPress={continueNext} disabled={!selected} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.sm, paddingTop: spacing.sm },
  step: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  list: { gap: spacing.sm, marginTop: spacing.md },
  card: { marginBottom: 0 },
  cardActive: {
    borderColor: colors.teal,
    borderWidth: 1.5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  checkMark: { color: 'transparent', fontFamily: fonts.bodySemi },
  checkMarkOn: { color: colors.onAccent },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
