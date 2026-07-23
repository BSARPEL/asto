import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

type Props = {
  error: Error;
  retry: () => void;
};

export function ErrorBoundary({ error, retry }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bir şeyler ters gitti</Text>
      <Text style={styles.body}>{error?.message || 'Beklenmeyen bir hata oluştu.'}</Text>
      <Pressable onPress={retry}>
        <Text style={styles.link}>Tekrar dene</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    color: colors.accentStrong,
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  link: {
    fontFamily: fonts.bodySemi,
    color: colors.teal,
    fontSize: 16,
  },
});
