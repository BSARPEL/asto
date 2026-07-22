import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/constants/theme';

export default function Index() {
  const { loading, token, profile } = useAuth();

  useEffect(() => {}, [loading, token, profile]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!token || !profile) return <Redirect href="/(auth)/login" />;
  if (!profile.natalChart) return <Redirect href="/(onboarding)/birth" />;
  return <Redirect href="/(tabs)/chart" />;
}
