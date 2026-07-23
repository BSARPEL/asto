import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  useFonts as useCormorant,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInter,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, fonts } from '@/constants/theme';

export { ErrorBoundary };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [cormorantLoaded, cormorantError] = useCormorant({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });
  const [interLoaded, interError] = useInter({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const loaded = cormorantLoaded && interLoaded;
  const error = cormorantError || interError;

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.display },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Giriş' }} />
        <Stack.Screen name="(auth)/register" options={{ title: 'Kayıt' }} />
        <Stack.Screen name="(auth)/forgot" options={{ title: 'Şifremi unuttum' }} />
        <Stack.Screen name="(onboarding)/birth" options={{ title: 'Doğum bilgisi', headerBackVisible: false }} />
        <Stack.Screen name="(analysis)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tokens" options={{ title: 'Jeton' }} />
        <Stack.Screen name="forecast" options={{ title: 'Öngörü' }} />
        <Stack.Screen name="legal/privacy" options={{ title: 'Gizlilik' }} />
        <Stack.Screen name="legal/terms" options={{ title: 'Kullanım şartları' }} />
      </Stack>
    </AuthProvider>
  );
}
