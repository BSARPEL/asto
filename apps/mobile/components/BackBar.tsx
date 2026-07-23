import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors, fonts, spacing } from '@/constants/theme';

type Props = {
  /** Optional label next to chevron (Harmony: names / “PAYLAŞ”) */
  label?: string;
  /** Explicit handler; otherwise smart back */
  onPress?: () => void;
  /** Used when navigation stack has no history (e.g. after replace) */
  fallbackHref?: Href;
  style?: StyleProp<ViewStyle>;
  /** Light text for dark screens (loading / share) */
  light?: boolean;
};

/** Harmony-style top-left back control (‹). Always visible in content. */
export function BackBar({
  label,
  onPress,
  fallbackHref = '/(tabs)/relationship',
  style,
  light,
}: Props) {
  const go = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  };

  return (
    <Pressable
      onPress={go}
      hitSlop={14}
      accessibilityRole="button"
      accessibilityLabel={label ? `Geri, ${label}` : 'Geri'}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      <Text style={[styles.chevron, light && styles.light]}>{'‹'}</Text>
      {label ? (
        <Text style={[styles.label, light && styles.light]} numberOfLines={1}>
          {label}
        </Text>
      ) : (
        <Text style={[styles.labelMuted, light && styles.lightMuted]}>Geri</Text>
      )}
    </Pressable>
  );
}

/** Compact top chrome: back + optional trailing action */
export function BackChrome({
  label,
  onPress,
  fallbackHref,
  right,
  light,
  style,
}: Props & { right?: React.ReactNode }) {
  return (
    <View style={[styles.chrome, style]}>
      <BackBar label={label} onPress={onPress} fallbackHref={fallbackHref} light={light} />
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    minHeight: 36,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '88%',
    paddingVertical: 4,
    paddingRight: spacing.sm,
  },
  pressed: { opacity: 0.65 },
  chevron: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: colors.text,
    marginTop: -2,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
    flexShrink: 1,
  },
  labelMuted: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textMuted,
  },
  light: { color: colors.nightCardText },
  lightMuted: { color: 'rgba(241,237,229,0.65)' },
  right: { marginLeft: spacing.sm },
});
