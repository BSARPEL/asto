/**
 * Subtle motion primitives for BN Astro UI.
 * Prefer presence (fade/slide) and feedback (press/pulse) — avoid noisy loops.
 */
import { useEffect } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const easeOut = Easing.out(Easing.cubic);

export const enterSoft = FadeInDown.duration(420).easing(easeOut).springify().damping(18);
export const enterUp = FadeInUp.duration(380).easing(easeOut);
export const enterChatUser = FadeInUp.duration(280).easing(easeOut);
export const enterChatAssistant = FadeInUp.duration(340).delay(40).easing(easeOut);
export const enterChip = FadeInRight.duration(320).easing(easeOut);

type FadeInProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delayMs?: number;
  /** 'down' | 'up' | 'none' */
  from?: 'down' | 'up' | 'none';
};

/** One-shot mount fade for screen sections / empty states. */
export function FadeIn({ children, style, delayMs = 0, from = 'down' }: FadeInProps) {
  const entering =
    from === 'none'
      ? undefined
      : from === 'up'
        ? FadeInUp.duration(400).delay(delayMs).easing(easeOut)
        : FadeInDown.duration(420).delay(delayMs).easing(easeOut);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

/** Soft press scale — use on cards / chips / icon buttons. */
export function PressableScale({
  children,
  style,
  disabled,
  ...rest
}: Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      {...rest}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Twinkling star for Starfield background. */
export function TwinkleDot({
  left,
  top,
  size,
  baseOpacity,
  delayMs,
}: {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  baseOpacity: number;
  delayMs: number;
}) {
  const pulse = useSharedValue(baseOpacity);

  useEffect(() => {
    pulse.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(Math.min(0.55, baseOpacity + 0.22), {
            duration: 1400 + (delayMs % 700),
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(baseOpacity * 0.55, {
            duration: 1600 + (delayMs % 900),
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [baseOpacity, delayMs, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          top,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: 'rgba(139, 111, 71, 0.45)',
        },
        style,
      ]}
    />
  );
}

/** Score bar fill 0 → score (pixel width; pass trackWidth from onLayout). */
export function AnimatedScoreFill({
  score,
  color,
  trackWidth,
  style,
}: {
  score: number;
  color: string;
  trackWidth: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      120,
      withTiming(Math.max(0, Math.min(100, score)) / 100, {
        duration: 700,
        easing: easeOut,
      }),
    );
  }, [progress, score]);

  const animStyle = useAnimatedStyle(() => ({
    width: trackWidth > 0 ? progress.value * trackWidth : 0,
    backgroundColor: color,
  }));

  return <Animated.View style={[style, animStyle]} />;
}

/** Skeleton shimmer pulse. */
export function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[style, animStyle]} />;
}

/** Soft breathing glow for brand orb / tab focus. */
export function SoftPulse({
  children,
  style,
  active = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(1, { duration: 200 });
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [active, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

export const MotionView = Animated.View;
