import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  contentMaxWidth,
  fonts,
  getLayoutSize,
  pageGutter,
  radii,
  shadowSoft,
  spacing,
  typography,
  type LayoutSize,
} from '@/constants/theme';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const size = getLayoutSize(width);
  const gutter = pageGutter(size);
  const maxWidth = contentMaxWidth(size);
  return {
    width,
    height,
    size,
    gutter,
    maxWidth,
    isCompact: size === 'phone',
    isWide: size !== 'phone',
  };
}

export function Screen({
  children,
  style,
  edges = ['left', 'right'],
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? Math.max(insets.left, 0) : 0,
    paddingRight: edges.includes('right') ? Math.max(insets.right, 0) : 0,
  };

  return (
    <View style={[styles.screenRoot, style]}>
      <LinearGradient
        colors={['#0B1020', '#121A33', '#0E1528', '#0B1020']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      <View style={[styles.screenInner, pad]}>{children}</View>
    </View>
  );
}

export function ScreenScroll({
  children,
  contentContainerStyle,
  ...rest
}: ScrollViewProps & { children: React.ReactNode }) {
  const { gutter, maxWidth } = useLayout();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...rest}
      contentContainerStyle={[
        {
          paddingHorizontal: gutter,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl,
          width: '100%',
          maxWidth,
          alignSelf: 'center',
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <View style={styles.brandWrap}>
      <Text style={size === 'lg' ? typography.brandLg : typography.brand}>Asto</Text>
      {size === 'lg' ? <Text style={styles.brandTag}>Astroloji · AI</Text> : null}
    </View>
  );
}

export function Title({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return <Text style={[typography.title, style]}>{children}</Text>;
}

export function Subtitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

export function Body({
  children,
  muted,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: TextStyle;
}) {
  return <Text style={[muted ? typography.bodyMuted : typography.body, style]}>{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={[typography.section, styles.sectionTitle]}>{children}</Text>;
}

export function HeaderRow({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { isCompact } = useLayout();
  return (
    <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
      <View style={styles.headerCopy}>
        <Title style={styles.headerTitle}>{title}</Title>
        {subtitle ? <Subtitle style={styles.headerSubtitle}>{subtitle}</Subtitle> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  elevated,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}) {
  return (
    <View style={[styles.card, elevated && styles.cardElevated, style]}>{children}</View>
  );
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
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        (disabled || loading) && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.accent} />
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
  const { label, style, multiline, ...rest } = props;
  return (
    <View style={styles.fieldWrap}>
      <Text style={typography.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMultiline, style]}
        {...rest}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && onPress ? styles.chipPressed : null,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TokenBadge({ balance }: { balance: number }) {
  return (
    <View style={styles.tokenBadge}>
      <Text style={styles.tokenGlyph}>◆</Text>
      <Text style={styles.tokenText}>{balance}</Text>
    </View>
  );
}

export function SignTrio({
  sun,
  moon,
  rising,
}: {
  sun: string;
  moon: string;
  rising: string;
}) {
  const { isCompact } = useLayout();
  return (
    <View style={[styles.signTrio, isCompact && styles.signTrioCompact]}>
      <SignPill label="Güneş" value={sun} />
      <SignPill label="Ay" value={moon} />
      <SignPill label="Yükselen" value={rising} />
    </View>
  );
}

export function SignPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.signPill}>
      <Text style={styles.signLabel}>{label}</Text>
      <Text style={styles.signValue}>{value}</Text>
    </View>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? colors.success : score >= 55 ? colors.teal : colors.accent;
  return (
    <View style={[styles.scoreBadge, { borderColor: tone }]}>
      <Text style={[styles.scoreValue, { color: tone }]}>{score}</Text>
      <Text style={styles.scoreUnit}>/100</Text>
    </View>
  );
}

export function MessageBubble({
  role,
  content,
}: {
  role: 'user' | 'assistant';
  content: string;
}) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      <Text style={[styles.bubbleRole, isUser && styles.bubbleRoleUser]}>
        {isUser ? 'Sen' : 'Asto'}
      </Text>
      <Body>{content}</Body>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyGlyph}>✦</Text>
      <Title style={typography.titleSm}>{title}</Title>
      {body ? <Subtitle style={{ marginBottom: spacing.md }}>{body}</Subtitle> : null}
      {action}
    </Card>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.error}>{children}</Text>
    </View>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { gutter, maxWidth, size } = useLayout();
  const wide = size !== 'phone';

  return (
    <View
      style={[
        styles.authShell,
        {
          paddingHorizontal: gutter,
          maxWidth: wide ? Math.min(maxWidth, 480) : maxWidth,
          width: '100%',
          alignSelf: 'center',
        },
      ]}
    >
      {children}
    </View>
  );
}

export function useResponsiveColumns(minColumnWidth = 260) {
  const { width, gutter, maxWidth } = useLayout();
  return useMemo(() => {
    const usable = Math.min(width - gutter * 2, maxWidth);
    const cols = Math.max(1, Math.floor(usable / minColumnWidth));
    return { cols, usable };
  }, [width, gutter, maxWidth, minColumnWidth]);
}

export type { LayoutSize };

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: colors.bg },
  screenInner: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(107,181,176,0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(212,197,160,0.05)',
  },
  brandWrap: { marginBottom: spacing.md },
  brandTag: {
    ...typography.caption,
    marginTop: 4,
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerRowCompact: {
    flexWrap: 'wrap',
  },
  headerCopy: { flex: 1, minWidth: 180 },
  headerTitle: { marginBottom: 0 },
  headerSubtitle: { marginBottom: 0, marginTop: spacing.xs },
  headerRight: { paddingTop: 4 },
  card: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardElevated: {
    ...shadowSoft,
    backgroundColor: colors.bgSoft,
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
    borderColor: colors.borderStrong,
  },
  btnDanger: {
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  btnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.bg,
  },
  btnTextGhost: { color: colors.accentStrong },
  btnTextDanger: { color: colors.danger },
  fieldWrap: { marginBottom: spacing.md },
  input: {
    marginTop: 6,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    minHeight: 50,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.bgSoft,
    maxWidth: '100%',
  },
  chipActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealDim,
  },
  chipPressed: { opacity: 0.85 },
  chipText: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  chipTextActive: { color: colors.teal },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,197,160,0.12)',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tokenGlyph: { color: colors.accent, fontSize: 11 },
  tokenText: {
    color: colors.accentStrong,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  signTrio: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  signTrioCompact: {
    flexWrap: 'wrap',
  },
  signPill: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  signLabel: {
    ...typography.caption,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  signValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    backgroundColor: colors.bgSoft,
  },
  scoreValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
  },
  scoreUnit: {
    ...typography.caption,
    marginTop: 1,
  },
  bubble: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: colors.userBubble,
    borderColor: colors.borderStrong,
    marginLeft: spacing.xl,
  },
  bubbleAssistant: {
    backgroundColor: colors.assistantBubble,
    borderColor: colors.border,
    marginRight: spacing.xl,
  },
  bubbleRole: {
    fontFamily: fonts.bodyBold,
    color: colors.teal,
    marginBottom: 6,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  bubbleRoleUser: { color: colors.accentStrong },
  emptyCard: {
    alignItems: 'flex-start',
    paddingVertical: spacing.lg,
  },
  emptyGlyph: {
    fontSize: 28,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.dangerDim,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  authShell: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
