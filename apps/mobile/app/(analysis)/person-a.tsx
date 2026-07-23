import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BackBar } from '@/components/BackBar';
import { Body, Button, Card, Screen, ScreenScroll, Subtitle, Title } from '@/components/ui';
import { loadAnalysisDraft, saveAnalysisDraft } from '@/lib/analysis-draft';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

/**
 * Person A is always the signed-in user's natal chart (engine constraint).
 * Editing another person's data here would not affect synastry — so we don't offer that.
 */
export default function PersonAScreen() {
  const { profile } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAnalysisDraft().then(() => setReady(true));
  }, []);

  const continueWithSelf = async () => {
    if (!profile?.birth) {
      router.push('/(onboarding)/birth');
      return;
    }
    await saveAnalysisDraft({ personA: profile.birth });
    router.push('/(analysis)/person-b');
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <BackBar
          label="Adım 2 / 3"
          fallbackHref="/(analysis)/type"
          onPress={() => router.replace('/(analysis)/type')}
        />
        <Title>Birinci kişi — sen</Title>
        <Subtitle>
          Analiz her zaman senin natal haritanla yapılır. Karşı tarafı sonraki adımda gireceksin.
        </Subtitle>

        {profile?.birth ? (
          <Card elevated>
            <Text style={styles.name}>{profile.birth.name}</Text>
            <Body muted>
              {profile.birth.birthDate} · {profile.birth.birthTime} · {profile.birth.city}
            </Body>
            <View style={styles.row}>
              <Button label="Devam Et" onPress={continueWithSelf} disabled={!ready} />
            </View>
            <Button
              label="Doğum bilgimi düzenle"
              variant="ghost"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </Card>
        ) : (
          <Card elevated>
            <Body muted>Önce kendi doğum bilgilerini kaydetmen gerekiyor.</Body>
            <View style={styles.row}>
              <Button label="Doğum bilgisi ekle" onPress={() => router.push('/(onboarding)/birth')} />
            </View>
          </Card>
        )}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md, paddingTop: spacing.sm },
  name: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: { marginTop: spacing.md, marginBottom: spacing.xs },
});
