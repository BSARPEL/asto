import { router } from 'expo-router';
import { BirthForm } from '@/components/BirthForm';
import { HeroCard, Screen, ScreenScroll, Subtitle, Title } from '@/components/ui';
import { saveBirthProfile } from '@/lib/birth-service';
import { useAuth } from '@/lib/auth';
import { colors } from '@/constants/theme';

export default function BirthOnboarding() {
  const { profile, setProfile } = useAuth();

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
            if (!profile?.id) throw new Error('Oturum yok');
            const next = await saveBirthProfile(profile.id, profile.displayName, birth);
            setProfile(next);
            router.replace('/(tabs)/chart');
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}
