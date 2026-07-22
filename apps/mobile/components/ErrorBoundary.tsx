import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

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
    fontFamily: 'Syne_700Bold',
    color: colors.accentStrong,
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: 'Manrope_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  link: {
    fontFamily: 'Manrope_600SemiBold',
    color: colors.teal,
    fontSize: 16,
  },
});
