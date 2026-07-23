import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackBar } from '@/components/BackBar';
import { FadeIn } from '@/components/motion';
import { Body, Button, Screen } from '@/components/ui';
import { colors, fonts, spacing } from '@/constants/theme';

export default function SuccessScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId?: string }>();

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.wrap}>
        <BackBar
          label="Tamam"
          fallbackHref="/(tabs)/relationship"
          onPress={() =>
            router.replace({
              pathname: '/(analysis)/report',
              params: { partnerId: partnerId || '' },
            })
          }
        />
        <FadeIn from="up">
          <View style={styles.checkWrap}>
            <Text style={styles.check}>✓</Text>
          </View>
          <Text style={styles.title}>Satın alma başarılı</Text>
          <Body style={styles.note}>
            Tam analiz açıldı. Detaylı rapor, sohbet ve skor kartı artık senin.
          </Body>
        </FadeIn>
        <FadeIn delayMs={120} from="up">
          <View style={styles.actions}>
            <Button
              label="Raporu gör"
              onPress={() =>
                router.replace({
                  pathname: '/(analysis)/report',
                  params: { partnerId: partnerId || '' },
                })
              }
            />
            <Button
              label="Skor kartını paylaş"
              variant="ghost"
              onPress={() =>
                router.push({
                  pathname: '/(analysis)/share-card',
                  params: { partnerId: partnerId || '' },
                })
              }
            />
          </View>
        </FadeIn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  checkWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    marginBottom: spacing.md,
  },
  check: {
    fontSize: 28,
    color: colors.onAccent,
    fontFamily: fonts.bodySemi,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  note: { textAlign: 'center', color: colors.textSoft },
  actions: { gap: spacing.sm },
});
