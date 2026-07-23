import { router } from 'expo-router';
import { BirthForm } from '@/components/BirthForm';
import { HeroCard, Screen, ScreenScroll, Subtitle, Title } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/constants/theme';

export default function BirthOnboarding() {
  const { token, setProfile, profile } = useAuth();

  return (
    <Screen>
      <ScreenScroll>
        <HeroCard accent={colors.teal}>
          <Title>Doğum haritan</Title>
          <Subtitle style={{ marginBottom: 0 }}>
            Tarih, saat ve şehir ile natal haritanı hesaplarız. Saat bilinmiyorsa 12:00
            kullanabilirsin.
          </Subtitle>
        </HeroCard>
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
