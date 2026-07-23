import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { BirthInput } from '@asto/shared';
import { BirthForm } from '@/components/BirthForm';
import { BackBar } from '@/components/BackBar';
import { Field, Screen, ScreenScroll, Subtitle, Title } from '@/components/ui';
import { loadAnalysisDraft, saveAnalysisDraft } from '@/lib/analysis-draft';
import { spacing } from '@/constants/theme';

export default function PersonBScreen() {
  const [initial, setInitial] = useState<BirthInput | undefined>();
  const [focus, setFocus] = useState('');

  useEffect(() => {
    loadAnalysisDraft().then((d) => {
      if (d.personB) setInitial(d.personB);
      if (d.focus) setFocus(d.focus);
    });
  }, []);

  const onSubmit = async (birth: BirthInput) => {
    await saveAnalysisDraft({ personB: birth, focus: focus.trim() || undefined });
    router.push('/(analysis)/loading');
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenScroll contentContainerStyle={styles.scroll}>
        <BackBar
          label="Adım 3 / 3"
          fallbackHref="/(analysis)/person-a"
          onPress={() => router.replace('/(analysis)/person-a')}
        />
        <Title>İkinci kişi</Title>
        <Subtitle>
          Karşı tarafın doğum bilgilerini gir. İstersen tek bir odak sorusu ekle — yorum o dile
          yaklaşır.
        </Subtitle>
        <Field
          label="Odak (isteğe bağlı)"
          value={focus}
          onChangeText={setFocus}
          placeholder="Örn. Uzun vadede uyumumuz nasıl?"
        />
        <BirthForm
          variant="partner"
          initial={initial}
          submitLabel="Analizi başlat"
          onSubmit={onSubmit}
          embedded
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md, paddingTop: spacing.sm },
});
