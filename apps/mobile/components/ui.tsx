import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signColor, glyphTextStyle } from '@/constants/astro';
import { AstroGlyph } from '@/components/AstroGlyph';
import { BrandMark } from '@/components/BrandLogo';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  AnimatedScoreFill,
  FadeIn,
  Shimmer,
  TwinkleDot,
  enterChatAssistant,
  enterChatUser,
} from '@/components/motion';
import {
  accentGradient,
  colors,
  contentMaxWidth,
  fonts,
  getLayoutSize,
  pageGutter,
  radii,
  screenGradient,
  shadowSoft,
  spacing,
  splitLayoutMinWidth,
  typography,
  type LayoutSize,
} from '@/constants/theme';

// ─── Layout ───────────────────────────────────────────────────────────────────

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const size = getLayoutSize(width);
  const gutter = pageGutter(size);
  const maxWidth = contentMaxWidth(size, width);
  return {
    width,
    height,
    size,
    gutter,
    maxWidth,
    isCompact: size === 'phone',
    isWide: size !== 'phone',
    isSplitLayout: width >= splitLayoutMinWidth,
  };
}

export function useResponsiveColumns(minColumnWidth = 260) {
  const { width, gutter, maxWidth } = useLayout();
  return useMemo(() => {
    const usable = Math.min(width - gutter * 2, maxWidth);
    const cols = Math.max(1, Math.floor(usable / minColumnWidth));
    const colWidth = cols > 1 ? (usable - spacing.sm * (cols - 1)) / cols : usable;
    return { cols, usable, colWidth, gap: spacing.sm };
  }, [width, gutter, maxWidth, minColumnWidth]);
}

/** Tablet/desktop: yan yana; telefon: alt alta */
export function ResponsiveSplit({
  leading,
  trailing,
  leadingFlex = 1,
  trailingFlex = 1,
}: {
  leading: React.ReactNode;
  trailing: React.ReactNode;
  leadingFlex?: number;
  trailingFlex?: number;
}) {
  const { isSplitLayout } = useLayout();
  if (!isSplitLayout) {
    return (
      <View style={styles.splitStack}>
        {leading}
        {trailing}
      </View>
    );
  }
  return (
    <View style={styles.splitRow}>
      <View style={[styles.splitCol, { flex: leadingFlex }]}>{leading}</View>
      <View style={[styles.splitCol, { flex: trailingFlex }]}>{trailing}</View>
    </View>
  );
}

/** Responsive sütun ızgarası */
export function ResponsiveGrid({
  children,
  minColumnWidth = 280,
}: {
  children: React.ReactNode;
  minColumnWidth?: number;
}) {
  const { cols, gap, colWidth } = useResponsiveColumns(minColumnWidth);
  const items = React.Children.toArray(children);
  if (cols <= 1) {
    return <View style={styles.gridStack}>{children}</View>;
  }
  return (
    <View style={[styles.gridRow, { gap }]}>
      {items.map((child, i) => (
        <View key={i} style={{ width: colWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}

/** Tüm tab ekranları için ortak üst boşluk */
export function tabScrollStyle() {
  return styles.tabScroll;
}

// ─── Screen shell ─────────────────────────────────────────────────────────────

function Starfield() {
  const dots = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 11) % 100}%` as `${number}%`,
        top: `${(i * 53 + 7) % 100}%` as `${number}%`,
        size: i % 7 === 0 ? 2.8 : i % 4 === 0 ? 2 : 1.3,
        opacity: 0.22 + (i % 5) * 0.1,
        delayMs: (i * 97) % 2800,
      })),
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map((d) => (
        <TwinkleDot
          key={d.id}
          left={d.left}
          top={d.top}
          size={d.size}
          baseOpacity={d.opacity}
          delayMs={d.delayMs}
        />
      ))}
    </View>
  );
}

export function Screen({
  children,
  style,
  edges = ['left', 'right'],
  stars = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  stars?: boolean;
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
        colors={[...screenGradient]}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {stars ? <Starfield /> : null}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowMoon} />
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
      style={styles.screenScroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      horizontal={false}
      bounces
      alwaysBounceHorizontal={false}
      {...rest}
      contentContainerStyle={[
        styles.screenScrollContent,
        {
          paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl,
        },
        contentContainerStyle,
      ]}
    >
      <View
        style={[
          styles.screenContent,
          {
            paddingHorizontal: gutter,
            paddingTop: spacing.md,
            maxWidth,
          },
        ]}
      >
        {children}
      </View>
    </ScrollView>
  );
}

// ─── Typography ───────────────────────────────────────────────────────────────

export { BrandMark, BrandLogoMark, BrandSplash } from '@/components/BrandLogo';

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[typography.title, styles.textShrink, style]}>{children}</Text>
  );
}

export function Subtitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.subtitle, styles.textShrink, style]}>{children}</Text>;
}

export function Body({
  children,
  muted,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[muted ? typography.bodyMuted : typography.body, styles.textShrink, style]}>
      {children}
    </Text>
  );
}

export function SectionTitle({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <Text style={[typography.section, styles.sectionTitle, styles.textShrink, compact && styles.sectionTitleCompact]}>
      {children}
    </Text>
  );
}

// ─── Headers & cards ──────────────────────────────────────────────────────────

export function HeaderRow({
  title,
  subtitle,
  right,
  eyebrow,
  compact,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  eyebrow?: string;
  compact?: boolean;
}) {
  const { isCompact } = useLayout();
  return (
    <FadeIn from="down" delayMs={20}>
      <View style={[styles.headerRow, compact && styles.headerRowTight, isCompact && styles.headerRowCompact]}>
        <View style={styles.headerCopy}>
          {eyebrow ? <Text style={[styles.eyebrow, styles.textShrink]}>{eyebrow}</Text> : null}
          <Title style={compact ? [styles.headerTitle, styles.headerTitleCompact] : styles.headerTitle}>
            {title}
          </Title>
          {subtitle ? (
            <Subtitle
              style={
                compact ? [styles.headerSubtitle, styles.headerSubtitleCompact] : styles.headerSubtitle
              }
            >
              {subtitle}
            </Subtitle>
          ) : null}
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
    </FadeIn>
  );
}

export function HeroCard({
  children,
  accent = colors.teal,
  style,
}: {
  children: React.ReactNode;
  accent?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.heroCard, style]}>
      <LinearGradient
        colors={[`${accent}22`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.heroAccent, { backgroundColor: accent }]} />
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
  elevated,
  accent,
  compact,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  accent?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.card, compact && styles.cardCompact, elevated && styles.cardElevated, style]}>
      {accent ? <View style={[styles.cardAccent, { backgroundColor: accent }]} /> : null}
      {children}
    </View>
  );
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

/** İki harita birleşimi — sinastri metaforu */
export function SynastryBond({
  selfSun,
  selfMoon,
  partnerSun,
  partnerMoon,
  partnerName,
  compact,
}: {
  selfSun?: string;
  selfMoon?: string;
  partnerSun: string;
  partnerMoon: string;
  partnerName?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.bondRow, compact && styles.bondRowCompact]}>
      <View style={[styles.bondSide, compact && styles.bondSideCompact]}>
        {selfSun ? (
          <View style={[styles.bondGlyphPair, compact && styles.bondGlyphPairCompact]}>
            <AstroGlyph planetKey="Sun" size="sm" color={signColor(selfSun)} />
            <AstroGlyph planetKey="Moon" size="sm" color={signColor(selfMoon || selfSun)} />
          </View>
        ) : (
          <Text style={[styles.bondYou, compact && styles.bondYouCompact, glyphTextStyle]}>☉</Text>
        )}
        <Text style={[styles.bondLabel, styles.bondLabelStatic, compact && styles.bondLabelCompact]} numberOfLines={1}>
          Sen
        </Text>
      </View>
      <View style={[styles.bondCenter, compact && styles.bondCenterCompact]}>
        <View style={[styles.bondLine, compact && styles.bondLineCompact]} />
        <Text style={[styles.bondAspect, compact && styles.bondAspectCompact, glyphTextStyle]}>∞</Text>
        <View style={[styles.bondLine, compact && styles.bondLineCompact]} />
      </View>
      <View style={[styles.bondSide, compact && styles.bondSideCompact]}>
        <View style={[styles.bondGlyphPair, compact && styles.bondGlyphPairCompact]}>
          <AstroGlyph planetKey="Sun" size="sm" color={signColor(partnerSun)} />
          <AstroGlyph planetKey="Moon" size="sm" color={signColor(partnerMoon)} />
        </View>
        <Text style={[styles.bondLabel, compact && styles.bondLabelCompact]} numberOfLines={1}>
          {partnerName || 'Partner'}
        </Text>
      </View>
    </View>
  );
}

/** Güven / kehanet değil notu */
export function TrustNote({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.trustNote, style]}>{children}</Text>;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  compact,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  compact?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const blocked = Boolean(disabled || loading);

  const onPressIn = () => {
    if (!blocked) scale.value = withSpring(0.97, { damping: 16, stiffness: 340 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
  };

  if (isPrimary) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={blocked}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.btn,
          compact && styles.btnCompact,
          blocked && styles.btnDisabled,
          pressed && styles.btnPressed,
        ]}
      >
        <Animated.View style={animStyle}>
          <LinearGradient
            colors={[...accentGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.btnGradient, compact && styles.btnGradientCompact]}
          >
            {loading ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <View style={styles.btnInner}>
                {icon ? (
                  <Text style={[styles.btnIcon, compact && styles.btnIconCompact, glyphTextStyle]}>
                    {icon}
                  </Text>
                ) : null}
                <Text style={[styles.btnText, compact && styles.btnTextCompact]}>{label}</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={blocked}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        blocked && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      <Animated.View style={animStyle}>
        {loading ? (
          <ActivityIndicator color={variant === 'danger' ? colors.danger : colors.teal} />
        ) : (
          <View style={styles.btnInner}>
            {icon ? (
              <Text
                style={[
                  styles.btnIcon,
                  compact && styles.btnIconCompact,
                  glyphTextStyle,
                  variant === 'ghost' && styles.btnTextGhost,
                ]}
              >
                {icon}
              </Text>
            ) : null}
            <Text
              style={[
                styles.btnText,
                compact && styles.btnTextCompact,
                styles.btnTextOutline,
                variant === 'ghost' && styles.btnTextGhost,
                variant === 'danger' && styles.btnTextDanger,
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function Field(
  props: TextInputProps & { label: string; hint?: string; compact?: boolean },
) {
  const { label, hint, style, multiline, compact, ...rest } = props;
  return (
    <View style={[styles.fieldWrap, compact && styles.fieldWrapCompact]}>
      <Text style={[typography.label, compact && styles.fieldLabelCompact]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          compact && styles.inputCompact,
          multiline && styles.inputMultiline,
          multiline && compact && styles.inputMultilineCompact,
          style,
        ]}
        {...rest}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  compact,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        active && styles.chipActive,
        pressed && onPress ? styles.chipPressed : null,
      ]}
    >
      <Text
        style={[styles.chipText, compact && styles.chipTextCompact, active && styles.chipTextActive]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Astro-specific ───────────────────────────────────────────────────────────

export function TokenBadge({ balance, compact }: { balance: number; compact?: boolean }) {
  return (
    <View style={[styles.tokenBadge, compact && styles.tokenBadgeCompact]}>
      <LinearGradient
        colors={[colors.accentLight, 'rgba(168, 146, 94, 0.04)']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.tokenGlyph, compact && styles.tokenGlyphCompact]}>◆</Text>
      <Text style={[styles.tokenText, compact && styles.tokenTextCompact]}>{balance}</Text>
    </View>
  );
}

export function PlusBadge() {
  return (
    <View style={styles.plusBadge}>
      <Text style={styles.plusText}>Plus</Text>
    </View>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const dim = size === 'lg' ? 56 : size === 'md' ? 44 : size === 'sm' ? 36 : 30;
  return (
    <View style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <LinearGradient
        colors={[colors.tealDim, colors.accentLight]}
        style={StyleSheet.absoluteFill}
      />
      <Text
        style={[
          styles.avatarText,
          size === 'lg' && styles.avatarTextLg,
          size === 'xs' && styles.avatarTextXs,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

export function SignTrio({
  sun,
  moon,
  rising,
  compact,
}: {
  sun: string;
  moon: string;
  rising: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.signTrio, compact && styles.signTrioCompact]}>
      <SignPill label="Güneş" value={sun} signKey={sun} color={signColor(sun)} compact={compact} />
      <SignPill label="Ay" value={moon} signKey={moon} color={signColor(moon)} compact={compact} />
      <SignPill
        label="Yükselen"
        value={rising}
        signKey={rising}
        color={signColor(rising)}
        compact={compact}
      />
    </View>
  );
}

export function SignPill({
  label,
  value,
  color: accent,
  signKey,
  compact,
}: {
  label: string;
  value: string;
  color?: string;
  signKey: string;
  compact?: boolean;
}) {
  const c = accent ?? colors.teal;
  return (
    <View
      style={[
        styles.signPill,
        compact && styles.signPillCompact,
        { borderColor: `${c}55`, backgroundColor: compact ? `${c}14` : colors.bgElevated },
      ]}
    >
      {!compact ? <View style={[styles.signPillGlow, { backgroundColor: `${c}22` }]} /> : null}
      <AstroGlyph
        sign={signKey}
        size={compact ? 'sm' : 'lg'}
        color={c}
        style={compact ? styles.signGlyphWrapCompact : styles.signGlyphWrap}
      />
      <Text style={[styles.signLabel, compact && styles.signLabelCompact]}>{label}</Text>
      <Text style={[styles.signValue, compact && styles.signValueCompact]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function PlanetTableHeader({
  showHouse = true,
  firstColumnLabel = 'Gezegen',
}: {
  showHouse?: boolean;
  firstColumnLabel?: string;
}) {
  return (
    <View style={styles.planetTableHeader}>
      <Text style={[styles.planetTableHeadText, styles.planetColPlanet]}>{firstColumnLabel}</Text>
      <Text
        style={[
          styles.planetTableHeadText,
          styles.planetColSign,
          !showHouse && styles.planetColSignWide,
        ]}
      >
        Burç
      </Text>
      {showHouse ? (
        <Text style={[styles.planetTableHeadText, styles.planetColHouse]}>Ev</Text>
      ) : null}
    </View>
  );
}

export function PlanetRow({
  label,
  planetKey,
  sign,
  degree,
  house,
  retrograde,
  isLast,
  compact,
  showHouseColumn = true,
}: {
  /** Türkçe görünen ad */
  label: string;
  /** Sun, Moon, NorthNode… — sembol lookup için */
  planetKey: string;
  sign: string;
  degree: number;
  house?: number;
  retrograde?: boolean;
  isLast?: boolean;
  compact?: boolean;
  /** Tablo görünümünde Ev sütunu */
  showHouseColumn?: boolean;
}) {
  const c = signColor(sign);

  if (compact) {
    return (
      <View style={[styles.planetTableRow, !isLast && styles.planetRowBorder]}>
        <View style={[styles.planetColCell, styles.planetColPlanet]}>
          <AstroGlyph planetKey={planetKey} size="sm" color={c} />
          <Text style={styles.planetTableName} numberOfLines={1}>
            {label}
            {retrograde ? (
              <Text style={styles.planetRetroInline}> R</Text>
            ) : null}
          </Text>
        </View>
        <View style={[styles.planetColCell, styles.planetColSign, !showHouseColumn && styles.planetColSignWide]}>
          <AstroGlyph sign={sign} size="sm" color={c} />
          <Text style={styles.planetTableSign} numberOfLines={1}>
            {sign} {degree.toFixed(1)}°
          </Text>
        </View>
        {showHouseColumn ? (
          <View style={styles.planetColHouse}>
            <Text style={styles.planetTableHouse}>
              {house != null ? String(house) : '—'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.planetRow, !isLast && styles.planetRowBorder]}>
      <View
        style={[
          styles.planetIcon,
          { backgroundColor: `${c}18`, borderColor: `${c}44` },
        ]}
      >
        <AstroGlyph planetKey={planetKey} size="md" color={c} />
      </View>
      <View style={styles.planetCopy}>
        <Text style={styles.planetName}>{label}</Text>
        <View style={styles.planetSignRow}>
          <AstroGlyph sign={sign} size="sm" color={c} />
          <Text style={styles.planetSign}>
            {sign} {degree.toFixed(1)}°
          </Text>
        </View>
      </View>
      {house != null ? (
        <View style={styles.planetMeta}>
          <Text style={styles.planetHouse}>Ev {house}</Text>
          {retrograde ? <Text style={styles.planetRetro}>R</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export function ScoreBadge({ score, compact }: { score: number; compact?: boolean }) {
  const tone = score >= 75 ? colors.success : score >= 55 ? colors.teal : colors.accent;
  const label = score >= 75 ? 'Güçlü' : score >= 55 ? 'Dengeli' : 'Gelişen';
  return (
    <FadeIn from="up" delayMs={80}>
      <View style={[styles.scoreBadge, compact && styles.scoreBadgeCompact, { borderColor: tone }]}>
        <Text style={[styles.scoreValue, compact && styles.scoreValueCompact, { color: tone }]}>
          {score}
        </Text>
        {!compact ? <Text style={styles.scoreUnit}>/100</Text> : null}
        <Text style={[styles.scoreLabel, compact && styles.scoreLabelCompact, { color: tone }]}>
          {compact ? '/100' : label}
        </Text>
      </View>
    </FadeIn>
  );
}

export function ScoreBar({ score, compact }: { score: number; compact?: boolean }) {
  const tone = score >= 75 ? colors.success : score >= 55 ? colors.teal : colors.accent;
  const [trackWidth, setTrackWidth] = React.useState(0);
  return (
    <View
      style={[styles.scoreBarTrack, compact && styles.scoreBarTrackCompact]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <AnimatedScoreFill
        score={score}
        color={tone}
        trackWidth={trackWidth}
        style={styles.scoreBarFill}
      />
    </View>
  );
}

export function MessageBubble({
  role,
  content,
  compact,
  showRole = true,
}: {
  role: 'user' | 'assistant';
  content: string;
  compact?: boolean;
  showRole?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <Animated.View
      entering={isUser ? enterChatUser : enterChatAssistant}
      style={[
        styles.bubble,
        compact && styles.bubbleCompact,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
        compact && (isUser ? styles.bubbleUserCompact : styles.bubbleAssistantCompact),
        !showRole && styles.bubbleChat,
        !showRole && (isUser ? styles.bubbleChatUser : styles.bubbleChatAssistant),
      ]}
    >
      {showRole ? (
        <View style={[styles.bubbleHeader, compact && styles.bubbleHeaderCompact]}>
          <View style={[styles.bubbleDot, isUser ? styles.bubbleDotUser : styles.bubbleDotAssistant]} />
          <Text style={[styles.bubbleRole, compact && styles.bubbleRoleCompact, isUser && styles.bubbleRoleUser]}>
            {isUser ? 'Sen' : 'BN Astro'}
          </Text>
        </View>
      ) : null}
      <Body style={[styles.bubbleBody, compact && styles.bubbleBodyCompact, styles.textShrink]}>{content}</Body>
    </Animated.View>
  );
}

export function NarrativeCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card elevated accent={colors.teal}>
      <View style={styles.narrativeHeader}>
        <Text style={[styles.narrativeIcon, glyphTextStyle]}>✦</Text>
        <SectionTitle>{title}</SectionTitle>
      </View>
      {children}
    </Card>
  );
}

export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: ViewStyle }) {
  return <Shimmer style={[styles.skeleton, { height, width }, style]} />;
}

export function EmptyState({
  title,
  body,
  action,
  glyph = '✦',
  planetKey,
  sign,
  compact,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  glyph?: string;
  planetKey?: string;
  sign?: string;
  compact?: boolean;
}) {
  const content = (
    <>
      {planetKey || sign ? (
        <AstroGlyph
          planetKey={planetKey}
          sign={sign}
          size={compact ? 'md' : 'lg'}
          color={colors.accent}
          style={compact ? styles.emptyGlyphCompact : styles.emptyGlyph}
        />
      ) : (
        <Text style={[compact ? styles.emptyGlyphCompact : styles.emptyGlyph, glyphTextStyle]}>
          {glyph}
        </Text>
      )}
      <Title style={compact ? styles.emptyTitleCompact : typography.titleSm}>{title}</Title>
      {body ? (
        <Subtitle style={compact ? styles.emptyBodyCompact : { marginBottom: spacing.md }}>
          {body}
        </Subtitle>
      ) : null}
      {action}
    </>
  );

  if (compact) {
    return (
      <FadeIn from="down">
        <Card compact style={styles.emptyStateCompact}>
          {content}
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn from="down">
      <HeroCard accent={colors.accent}>{content}</HeroCard>
    </FadeIn>
  );
}

export function InfoRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={[styles.infoRow, compact && styles.infoRowCompact]}>
      <Text style={[styles.infoLabel, compact && styles.infoLabelCompact]} numberOfLines={2}>
        {label}
      </Text>
      <Text
        style={[styles.infoValue, compact && styles.infoValueCompact]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <FadeIn from="up" delayMs={0}>
      <View style={styles.errorBox}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.error}>{children}</Text>
      </View>
    </FadeIn>
  );
}

export function SuccessBanner({ children }: { children: string }) {
  return (
    <FadeIn from="up">
      <View style={styles.successBox}>
        <Text style={styles.success}>{children}</Text>
      </View>
    </FadeIn>
  );
}

// ─── Auth & modals ────────────────────────────────────────────────────────────

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { gutter, maxWidth, size, isWide } = useLayout();

  if (isWide) {
    return (
      <View style={[styles.authWide, { paddingHorizontal: gutter }]}>
        <View style={styles.authWideLeft}>
          <BrandMark size="lg" />
          <Title style={styles.authWideTitle}>Kişisel gökyüzü rehberin</Title>
          <Subtitle style={styles.authWideSubtitle}>
            Natal harita, günlük gökyüzü ve sinastri — sonsuz bağın stüdyosu.
          </Subtitle>
          <View style={styles.authFeatures}>
            <View style={styles.authFeatureRow}>
              <AstroGlyph planetKey="Sun" size="sm" color={colors.accentStrong} />
              <Text style={styles.authFeature}>Doğum haritan</Text>
            </View>
            <View style={styles.authFeatureRow}>
              <AstroGlyph planetKey="Moon" size="sm" color={colors.teal} />
              <Text style={styles.authFeature}>Günlük gökyüzü</Text>
            </View>
            <View style={styles.authFeatureRow}>
              <Text style={[styles.authFeatureGlyph, glyphTextStyle]}>∞</Text>
              <Text style={styles.authFeature}>İlişki sinastrisi</Text>
            </View>
          </View>
        </View>
        <GlassCard style={StyleSheet.flatten([styles.authWideForm, { maxWidth: Math.min(maxWidth, 420) }])}>
          {children}
        </GlassCard>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.authShell,
        {
          paddingHorizontal: gutter,
          maxWidth,
          width: '100%',
          alignSelf: 'center',
        },
      ]}
    >
      {children}
    </View>
  );
}

export function SheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  showClose = true,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showClose?: boolean;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen edges={['top', 'left', 'right', 'bottom']} stars={false}>
        <View style={styles.sheetHandle} />
        <ScreenScroll contentContainerStyle={styles.sheetScroll}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderCopy}>
              <SectionTitle compact>{title}</SectionTitle>
              {subtitle ? <Body muted style={styles.sheetSubtitle}>{subtitle}</Body> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.sheetClose}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </Pressable>
          </View>
          {children}
          {showClose ? (
            <Button compact label="Kapat" variant="ghost" onPress={onClose} />
          ) : null}
        </ScreenScroll>
      </Screen>
    </Modal>
  );
}

export type { LayoutSize };

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenRoot: { flex: 1, width: '100%', backgroundColor: colors.bg, overflow: 'hidden' },
  screenInner: { flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' },
  screenScroll: { flex: 1, width: '100%' },
  screenScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
  },
  screenContent: {
    width: '100%',
    alignSelf: 'center',
  },
  textShrink: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowTeal,
  },
  glowMoon: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.glowMoon,
  },

  brandWrap: { marginBottom: spacing.lg, alignItems: 'flex-start' },
  brandOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgSoft,
  },
  brandOrbLg: { width: 68, height: 68, borderRadius: 34 },
  brandOrbGlyph: { fontSize: 26, color: colors.accentStrong },
  brandTag: {
    ...typography.caption,
    marginTop: 8,
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  subtitle: { ...typography.bodyMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.xs },
  sectionTitleCompact: { marginBottom: 6, marginTop: 0, fontSize: 15, lineHeight: 20 },
  eyebrow: {
    ...typography.caption,
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRowTight: { marginBottom: spacing.sm, gap: spacing.sm },
  headerRowCompact: { flexWrap: 'wrap' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { marginBottom: 0, fontSize: 28, lineHeight: 34 },
  headerTitleCompact: { fontSize: 22, lineHeight: 28 },
  headerSubtitle: { marginBottom: 0, marginTop: spacing.xs },
  headerSubtitleCompact: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  headerRight: { paddingTop: 6, flexShrink: 0 },

  heroCard: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadowSoft,
  },
  heroAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: radii.xl,
    borderBottomLeftRadius: radii.xl,
  },

  card: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
  },
  cardElevated: { ...shadowSoft, backgroundColor: colors.bgElevated, borderColor: colors.borderStrong },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  glassCard: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadowSoft,
  },

  bondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    alignSelf: 'stretch',
  },
  bondRowCompact: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 6,
    gap: 4,
  },
  bondSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  bondSideCompact: {
    gap: 2,
  },
  bondGlyphPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bondGlyphPairCompact: {
    gap: 4,
  },
  bondYou: {
    fontSize: 16,
    color: colors.accentStrong,
  },
  bondYouCompact: {
    fontSize: 14,
  },
  bondLabel: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.textMuted,
    maxWidth: '100%',
    textAlign: 'center',
  },
  bondLabelStatic: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bondLabelCompact: {
    fontSize: 9,
    letterSpacing: 0.2,
  },
  bondCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  bondCenterCompact: {
    gap: 4,
    paddingHorizontal: 2,
  },
  bondLine: {
    width: 14,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  bondLineCompact: {
    width: 10,
  },
  bondAspect: {
    fontSize: 18,
    color: colors.accent,
  },
  bondAspectCompact: {
    fontSize: 14,
  },
  trustNote: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: spacing.xs,
    opacity: 0.9,
  },

  btn: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  btnCompact: { minHeight: 40, marginTop: 6 },
  btnGradient: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnGradientCompact: { minHeight: 40, paddingHorizontal: spacing.md },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnDanger: {
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnIcon: { fontSize: 16, color: colors.onAccent },
  btnIconCompact: { fontSize: 14 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onAccent },
  btnTextCompact: { fontSize: 14 },
  btnTextOutline: { color: colors.text },
  btnTextGhost: { color: colors.teal },
  btnTextDanger: { color: colors.danger },

  fieldWrap: { marginBottom: spacing.md, width: '100%', maxWidth: '100%' },
  fieldWrapCompact: { marginBottom: spacing.sm },
  fieldLabelCompact: { fontSize: 11 },
  fieldHint: { ...typography.caption, marginTop: 4 },
  input: {
    width: '100%',
    maxWidth: '100%',
    marginTop: 6,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    minHeight: 50,
  },
  inputCompact: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 40,
    marginTop: 4,
  },
  inputMultiline: { minHeight: 100, paddingTop: 14 },
  inputMultilineCompact: { minHeight: 72, paddingTop: 10 },

  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.bgSoft,
    maxWidth: '100%',
  },
  chipCompact: { paddingVertical: 7, paddingHorizontal: 12 },
  chipActive: { borderColor: colors.teal, backgroundColor: colors.tealDim },
  chipPressed: { opacity: 0.85 },
  chipText: { color: colors.textSoft, fontFamily: fonts.bodySemi, fontSize: 13 },
  chipTextCompact: { fontSize: 12 },
  chipTextActive: { color: colors.teal },

  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
    backgroundColor: colors.bgSoft,
  },
  tokenBadgeCompact: { paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  tokenGlyph: { color: colors.accent, fontSize: 11 },
  tokenGlyphCompact: { fontSize: 9 },
  tokenText: { color: colors.accentStrong, fontFamily: fonts.bodyBold, fontSize: 13 },
  tokenTextCompact: { fontSize: 12 },

  plusBadge: {
    backgroundColor: colors.successDim,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  plusText: {
    color: colors.success,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.accentStrong },
  avatarTextLg: { fontSize: 20 },
  avatarTextXs: { fontSize: 11 },

  signTrio: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg, width: '100%' },
  signTrioCompact: { gap: 6, marginBottom: 0 },
  signPill: {
    flexGrow: 1,
    flexBasis: '30%',
    flexShrink: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  signPillCompact: {
    minWidth: 0,
    flexBasis: '31%',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
  },
  signPillGlow: {
    ...StyleSheet.absoluteFill,
  },
  signGlyphWrap: { marginBottom: 6 },
  signGlyphWrapCompact: { marginBottom: 2 },
  signLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
    textAlign: 'center',
  },
  signLabelCompact: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  signValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  signValueCompact: {
    fontSize: 12,
    lineHeight: 16,
  },

  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 11,
  },
  planetRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  planetTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
    width: '100%',
  },
  planetTableHeadText: {
    ...typography.caption,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: colors.textMuted,
  },
  planetTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 36,
    width: '100%',
  },
  planetColPlanet: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  planetColSign: {
    flex: 1.15,
    minWidth: 0,
    paddingRight: 6,
  },
  planetColSignWide: {
    flex: 1.35,
    minWidth: 0,
    paddingRight: 0,
  },
  planetColHouse: {
    width: 32,
    flexShrink: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  planetColCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    minWidth: 0,
    flexShrink: 1,
  },
  planetTableName: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.text,
    textAlign: 'left',
  },
  planetTableSign: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'left',
  },
  planetTableHouse: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.teal,
    textAlign: 'left',
    fontVariant: ['tabular-nums'],
  },
  planetRetroInline: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.accent,
  },
  planetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  planetIconCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  planetCopy: { flex: 1, minWidth: 100 },
  planetName: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text },
  planetSignRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  planetSign: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, flex: 1 },
  planetMeta: { alignItems: 'flex-end' },
  planetHouse: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.teal },
  planetRetro: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.accent, marginTop: 2 },

  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 76,
    backgroundColor: colors.bgSoft,
  },
  scoreBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  scoreValue: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  scoreValueCompact: { fontSize: 16, lineHeight: 18 },
  scoreUnit: { ...typography.caption, marginTop: 0 },
  scoreLabel: { ...typography.caption, marginTop: 2, fontSize: 10 },
  scoreLabelCompact: { marginTop: 0, fontSize: 9 },
  scoreBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.bgHighlight,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  scoreBarTrackCompact: { height: 4, marginVertical: 4 },
  scoreBarFill: { height: '100%', borderRadius: 999 },

  bubble: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    maxWidth: '100%',
  },
  bubbleCompact: {
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 6,
  },
  bubbleUser: {
    backgroundColor: colors.userBubble,
    borderColor: colors.tealDim,
    marginLeft: spacing.lg,
  },
  bubbleUserCompact: { marginLeft: spacing.sm },
  bubbleAssistant: {
    backgroundColor: colors.assistantBubble,
    borderColor: colors.borderStrong,
    marginRight: spacing.lg,
  },
  bubbleAssistantCompact: { marginRight: spacing.sm },
  bubbleChat: {
    maxWidth: '88%',
    marginLeft: 0,
    marginRight: 0,
  },
  bubbleChatUser: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: radii.sm,
  },
  bubbleChatAssistant: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radii.sm,
  },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bubbleHeaderCompact: { marginBottom: 4 },
  bubbleDot: { width: 6, height: 6, borderRadius: 3 },
  bubbleDotUser: { backgroundColor: colors.accent },
  bubbleDotAssistant: { backgroundColor: colors.teal },
  bubbleRole: { fontFamily: fonts.bodyBold, color: colors.teal, fontSize: 12, letterSpacing: 0.3 },
  bubbleRoleCompact: { fontSize: 10 },
  bubbleRoleUser: { color: colors.accentStrong },
  bubbleBody: { lineHeight: 24 },
  bubbleBodyCompact: { fontSize: 14, lineHeight: 20 },

  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xs },
  narrativeIcon: { fontSize: 16, color: colors.teal },

  skeleton: {
    backgroundColor: colors.bgHighlight,
    borderRadius: radii.sm,
    opacity: 0.85,
  },

  emptyGlyph: { fontSize: 32, color: colors.accent, marginBottom: spacing.sm },
  emptyGlyphCompact: { fontSize: 22, marginBottom: 6 },
  emptyStateCompact: { alignItems: 'center' },
  emptyTitleCompact: { fontSize: 17, lineHeight: 22, marginBottom: 4, textAlign: 'center' },
  emptyBodyCompact: { fontSize: 13, lineHeight: 18, marginBottom: spacing.sm, textAlign: 'center' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    width: '100%',
  },
  infoRowCompact: { paddingVertical: 7 },
  infoLabel: { ...typography.bodyMuted, flex: 1, minWidth: 0, flexShrink: 1 },
  infoLabelCompact: { fontSize: 13 },
  infoValue: {
    fontFamily: fonts.bodySemi,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  infoValueCompact: { fontSize: 13 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.dangerDim,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorIcon: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    marginTop: 1,
  },
  error: { flex: 1, color: colors.danger, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },

  successBox: {
    backgroundColor: colors.successDim,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  success: { color: colors.success, fontFamily: fonts.bodySemi, fontSize: 14 },

  authShell: { paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  authWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  authWideLeft: { flex: 1, maxWidth: 380 },
  authWideTitle: { fontSize: 32, lineHeight: 38, marginTop: spacing.md },
  authWideSubtitle: { marginBottom: spacing.lg },
  authFeatures: { gap: spacing.sm },
  authFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authFeatureGlyph: { fontSize: 14, color: colors.accentStrong, width: 18, textAlign: 'center' },
  authFeature: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textSoft,
  },
  authWideForm: { flex: 1 },

  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetScroll: { paddingBottom: spacing.lg },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetHeaderCopy: { flex: 1 },
  sheetSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetCloseText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 16,
  },

  tabScroll: { paddingTop: spacing.sm, flexGrow: 1, width: '100%' },
  splitStack: { gap: spacing.sm, width: '100%' },
  splitRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: '100%',
  },
  splitCol: { flex: 1, minWidth: 0, maxWidth: '100%' },
  gridStack: { gap: spacing.sm, width: '100%' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
});
