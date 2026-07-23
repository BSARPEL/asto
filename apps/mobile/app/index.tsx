import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { BrandSplash } from '@/components/BrandLogo';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { loading, profile } = useAuth();

  useEffect(() => {}, [loading, profile]);

  if (loading) {
    return <BrandSplash message="Haritan hazırlanıyor…" />;
  }

  // Oturum: Firebase Auth kalıcı (AsyncStorage) — çıkış yapılana kadar açık kalır
  if (!profile) return <Redirect href="/(auth)/login" />;
  if (!profile.natalChart) return <Redirect href="/(onboarding)/birth" />;
  return <Redirect href="/(tabs)/chart" />;
}
