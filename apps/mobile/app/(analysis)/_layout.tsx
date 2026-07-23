import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

/**
 * Harmony funnel: in-content ‹ BackBar (not native stack header).
 * Native back disappears after router.replace — BackBar always stays top-left.
 */
export default function AnalysisLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="type" />
      <Stack.Screen name="person-a" />
      <Stack.Screen name="person-b" />
      <Stack.Screen name="loading" options={{ gestureEnabled: false }} />
      <Stack.Screen name="reveal" options={{ gestureEnabled: false }} />
      <Stack.Screen name="preview" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      <Stack.Screen name="report" />
      <Stack.Screen name="share-card" />
    </Stack>
  );
}
