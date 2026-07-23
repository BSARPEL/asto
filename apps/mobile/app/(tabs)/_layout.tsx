import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';
import { glyphTextStyle } from '@/constants/astro';

const TAB_ICONS = {
  chart: '✦',
  forecast: '☽',
  relationship: '◎',
  tokens: '◆',
  profile: '○',
} as const;

function TabIcon({
  glyph,
  focused,
}: {
  glyph: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {focused ? <View style={styles.iconGlow} /> : null}
      <Text style={[styles.icon, glyphTextStyle, focused && styles.iconActive]}>{glyph}</Text>
    </View>
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
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.96)' : colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + bottom,
          paddingBottom: bottom,
          paddingTop: 6,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 -4px 20px rgba(28, 36, 54, 0.06)' } as object)
            : {}),
        },
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemi,
          fontSize: 10,
          marginTop: 2,
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
          title: 'İlişki',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={TAB_ICONS.relationship} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tokens"
        options={{
          title: 'Jeton',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={TAB_ICONS.tokens} focused={focused} />
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
    backgroundColor: 'rgba(196, 165, 122, 0.15)',
  },
  iconGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(196, 165, 122, 0.2)',
  },
  icon: {
    color: colors.textMuted,
    fontSize: 15,
  },
  iconActive: {
    color: colors.accentStrong,
  },
});
