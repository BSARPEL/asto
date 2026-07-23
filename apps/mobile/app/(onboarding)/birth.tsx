import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BirthForm } from '@/components/BirthForm';
import { Screen, ScreenScroll, Subtitle, Title } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { spacing } from '@/constants/theme';

export default function BirthOnboarding() {
  const { token, setProfile, profile } = useAuth();

  return (
    <Screen>
      <ScreenScroll>
        <Title>Doğum haritan</Title>
        <Subtitle>
          Tarih, saat ve şehir ile natal haritanı hesaplarız. Saat bilinmiyorsa 12:00 kullanabilirsin.
        </Subtitle>
        <BirthForm
          initial={{ name: profile?.displayName }}
          submitLabel="Haritamı oluştur"
          onSubmit={async (birth) => {
            if (!token) throw new Error('Oturum yok');
            const { profile: next } = await api.saveBirth(token, birth);
            setProfile(next);
            router.replace('/(tabs)/chart');
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // kept for potential local tweaks
  spacer: { height: spacing.md },
});
