import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fonts } from '@/constants/theme';
import { glyphTextStyle } from '@/constants/astro';
import { SoftPulse } from '@/components/motion';

const TAB_ICONS = {
  chart: '☉',
  forecast: '☽',
  relationship: '☍',
  tokens: '◆',
  profile: '✧',
} as const;

function TabIcon({
  glyph,
  focused,
  soft,
}: {
  glyph: string;
  focused: boolean;
  soft?: boolean;
}) {
  const scale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 14, stiffness: 220 });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        focused && styles.iconWrapActive,
        soft && styles.iconWrapSoft,
        animStyle,
      ]}
    >
      {focused ? (
        <SoftPulse active style={styles.iconGlowHost}>
          <View style={styles.iconGlow} />
        </SoftPulse>
      ) : null}
      <Text
        style={[
          styles.icon,
          glyphTextStyle,
          focused && styles.iconActive,
          soft && styles.iconSoft,
        ]}
      >
        {glyph}
      </Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 17, letterSpacing: 0.3 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(11, 15, 22, 0.96)' : colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + bottom,
          paddingBottom: bottom,
          paddingTop: 6,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 -6px 24px rgba(0, 0, 0, 0.35)' } as object)
            : {}),
        },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemi,
          fontSize: 10,
          marginTop: 2,
          letterSpacing: 0.15,
        },
      }}
    >
      <Tabs.Screen
        name="chart"
        options={{
          title: 'Haritam',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={TAB_ICONS.chart} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Öngörü',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={TAB_ICONS.forecast} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="relationship"
        options={{
          title: 'Sinastri',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={TAB_ICONS.relationship} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tokens"
        options={{
          title: 'Jeton',
          tabBarLabelStyle: {
            fontFamily: fonts.body,
            fontSize: 10,
            marginTop: 2,
            letterSpacing: 0.1,
            opacity: 0.85,
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={TAB_ICONS.tokens} focused={focused} soft />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={TAB_ICONS.profile} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapActive: {
    backgroundColor: colors.tealDim,
  },
  iconWrapSoft: {
    opacity: 0.88,
  },
  iconGlowHost: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(98, 189, 181, 0.18)',
  },
  icon: {
    color: colors.textMuted,
    fontSize: 15,
  },
  iconActive: {
    color: colors.teal,
  },
  iconSoft: {
    fontSize: 13,
  },
});
