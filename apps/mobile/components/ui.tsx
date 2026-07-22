import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '@/constants/theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={['#0B1020', '#121A33', '#0E1528']} style={[styles.screen, style]}>
      {children}
    </LinearGradient>
  );
}

export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <Text style={[styles.brand, size === 'lg' && styles.brandLg]}>Asto</Text>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        (disabled || loading) && styles.btnDisabled,
        pressed && { opacity: 0.88 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.accent : colors.bg} />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'ghost' && styles.btnTextGhost,
            variant === 'danger' && styles.btnTextDanger,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function TokenBadge({ balance }: { balance: number }) {
  return (
    <View style={styles.tokenBadge}>
      <Text style={styles.tokenText}>{balance} jeton</Text>
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  brand: {
    fontFamily: 'Syne_700Bold',
    fontSize: 36,
    color: colors.accentStrong,
    letterSpacing: 1,
  },
  brandLg: { fontSize: 56, lineHeight: 64 },
  title: {
    fontFamily: 'Syne_700Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  body: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  muted: { color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  btn: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDanger: { backgroundColor: 'rgba(224,122,109,0.15)', borderWidth: 1, borderColor: colors.danger },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.bg,
  },
  btnTextGhost: { color: colors.accentStrong },
  btnTextDanger: { color: colors.danger },
  fieldWrap: { marginBottom: spacing.md },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.bgSoft,
  },
  chipActive: { borderColor: colors.teal, backgroundColor: 'rgba(95,168,163,0.15)' },
  chipText: { color: colors.textMuted, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
  chipTextActive: { color: colors.teal },
  tokenBadge: {
    backgroundColor: 'rgba(212,197,160,0.12)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tokenText: { color: colors.accentStrong, fontFamily: 'Manrope_700Bold', fontSize: 13 },
  error: {
    color: colors.danger,
    fontFamily: 'Manrope_400Regular',
    marginBottom: spacing.sm,
  },
});
