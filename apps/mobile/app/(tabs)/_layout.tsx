import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.accentStrong : colors.textMuted, fontSize: 11, fontFamily: 'Manrope_700Bold' }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: 'Syne_700Bold' },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: 'Manrope_600SemiBold', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="chart"
        options={{
          title: 'Haritam',
          tabBarIcon: ({ focused }) => <TabIcon label="✦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Öngörü',
          tabBarIcon: ({ focused }) => <TabIcon label="☽" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="relationship"
        options={{
          title: 'İlişki',
          tabBarIcon: ({ focused }) => <TabIcon label="◎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tokens"
        options={{
          title: 'Jeton',
          tabBarIcon: ({ focused }) => <TabIcon label="◆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon label="○" focused={focused} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
