/**
 * Harmony-style dual-orb motion (landing / loading / reveal).
 */
import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { brand, colors, fonts } from '@/constants/theme';

const easeInOut = Easing.inOut(Easing.sin);
const revealEase = Easing.bezier(0.22, 1, 0.36, 1);

function Orb({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size > 90 ? 2.2 : 1.8,
          borderColor: color,
          backgroundColor: `${color}14`,
        },
        style,
      ]}
    />
  );
}

/** Landing: two circles breathing toward each other + soft halo. */
export function BreathingOrbs({ size = 120 }: { size?: number }) {
  const t = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 6500, easing: easeInOut }), -1, true);
    glow.value = withRepeat(withTiming(1, { duration: 6500, easing: easeInOut }), -1, true);
  }, [t, glow]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [0, 6]) }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [0, -6]) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.55, 0.95]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.06]) }],
  }));

  return (
    <View style={[styles.stage, { width: size * 1.55, height: size * 1.15 }]}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: size,
            backgroundColor: 'rgba(201,139,155,0.16)',
          },
          haloStyle,
        ]}
      />
      <Animated.View style={[styles.orbLeft, leftStyle]}>
        <Orb color={brand.harmonyPurple} size={size * 0.72} />
      </Animated.View>
      <Animated.View style={[styles.orbRight, rightStyle]}>
        <Orb color={brand.harmonyRose} size={size * 0.72} />
      </Animated.View>
    </View>
  );
}

/** Loading ritual: orbs converge gently + slow orbit rings. */
export function ConvergingOrbs({ size = 140 }: { size?: number }) {
  const t = useSharedValue(0);
  const spin = useSharedValue(0);
  const spin2 = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 5000, easing: easeInOut }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
    spin2.value = withRepeat(withTiming(1, { duration: 22000, easing: Easing.linear }), -1, false);
  }, [t, spin, spin2]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [0, 16]) },
      { translateY: interpolate(t.value, [0, 1], [0, 8]) },
    ],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [0, -16]) },
      { translateY: interpolate(t.value, [0, 1], [0, -8]) },
    ],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const orbit2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-spin2.value * 360}deg` }],
  }));

  return (
    <View style={[styles.stage, { width: size * 1.6, height: size * 1.35 }]}>
      <Animated.View
        style={[
          styles.ring,
          { width: size * 1.45, height: size * 1.45, borderRadius: size, borderColor: 'rgba(201,139,155,0.22)' },
          orbitStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { width: size * 1.2, height: size * 1.2, borderRadius: size, borderColor: 'rgba(107,78,122,0.28)' },
          orbit2Style,
        ]}
      />
      <Animated.View style={[styles.orbLeft, leftStyle]}>
        <Orb color="#A78BBE" size={size * 0.55} />
      </Animated.View>
      <Animated.View style={[styles.orbRight, rightStyle]}>
        <Orb color="#E0A4B4" size={size * 0.55} />
      </Animated.View>
    </View>
  );
}

/** Reveal: orbs slide in, glow, then score appears. */
export function RevealScoreMoment({
  score,
  band,
  names,
  ready,
}: {
  score: number;
  band: string;
  names: string;
  ready: boolean;
}) {
  const leftX = useSharedValue(-52);
  const rightX = useSharedValue(52);
  const glow = useSharedValue(0);
  const scorePop = useSharedValue(0);
  const after = useSharedValue(0);

  useEffect(() => {
    if (!ready) return;
    leftX.value = withTiming(0, { duration: 1600, easing: revealEase });
    rightX.value = withTiming(0, { duration: 1600, easing: revealEase });
    glow.value = withDelay(1300, withTiming(1, { duration: 1200 }));
    scorePop.value = withDelay(
      1800,
      withTiming(1, { duration: 1000, easing: revealEase }),
    );
    after.value = withDelay(2500, withTiming(1, { duration: 800 }));
  }, [ready, leftX, rightX, glow, scorePop, after]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightX.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scorePop.value,
    transform: [{ scale: interpolate(scorePop.value, [0, 1], [0.82, 1]) }],
  }));
  const afterStyle = useAnimatedStyle(() => ({
    opacity: after.value,
    transform: [{ translateY: interpolate(after.value, [0, 1], [10, 0]) }],
  }));

  return (
    <View style={styles.revealRoot}>
      <View style={styles.revealStage}>
        <Animated.View style={[styles.revealGlow, glowStyle]} />
        <Animated.View style={[styles.revealOrbL, leftStyle]}>
          <Orb color={brand.harmonyPurple} size={108} />
        </Animated.View>
        <Animated.View style={[styles.revealOrbR, rightStyle]}>
          <Orb color={brand.harmonyRose} size={108} />
        </Animated.View>
        <Animated.View style={[styles.scoreBubble, scoreStyle]}>
          <Animated.Text style={styles.scoreNum}>{ready ? score : '—'}</Animated.Text>
          <Animated.Text style={styles.scorePct}>%</Animated.Text>
        </Animated.View>
      </View>
      <Animated.View style={afterStyle}>
        <Animated.Text style={styles.band}>{band}</Animated.Text>
        <Animated.Text style={styles.names}>{names}</Animated.Text>
      </Animated.View>
    </View>
  );
}

export function scoreBandLabel(score: number): string {
  if (score >= 85) return 'Yüksek uyum';
  if (score >= 72) return 'Güçlü uyum';
  if (score >= 58) return 'Dengeli uyum';
  if (score >= 40) return 'Gelişen bağ';
  return 'Keşfedilecek bağ';
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  halo: {
    position: 'absolute',
  },
  orbLeft: {
    position: 'absolute',
    left: '8%',
  },
  orbRight: {
    position: 'absolute',
    right: '8%',
  },
  ring: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  revealRoot: {
    alignItems: 'center',
    gap: 18,
  },
  revealStage: {
    width: 220,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(201,139,155,0.18)',
  },
  revealOrbL: {
    position: 'absolute',
    left: 18,
  },
  revealOrbR: {
    position: 'absolute',
    right: 18,
  },
  scoreBubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreNum: {
    fontSize: 56,
    lineHeight: 62,
    fontFamily: fonts.displayExtra,
    color: colors.text,
  },
  scorePct: {
    fontSize: 22,
    marginTop: 14,
    fontFamily: fonts.display,
    color: colors.textMuted,
  },
  band: {
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: fonts.bodySemi,
    color: brand.harmonyPurple,
  },
  names: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: fonts.bodySemi,
    color: colors.text,
  },
});
