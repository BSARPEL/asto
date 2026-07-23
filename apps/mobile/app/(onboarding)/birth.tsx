import { router } from 'expo-router';
import { BirthForm } from '@/components/BirthForm';
import { HeroCard, Screen, ScreenScroll, Subtitle, Title } from '@/components/ui';
import { saveUserBirth } from '@/lib/birth-service';
import { useAuth } from '@/lib/auth';
import { colors } from '@/constants/theme';

export default function BirthOnboarding() {
  const { setProfile, profile } = useAuth();

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
            const next = await saveUserBirth(profile.id, birth, profile.displayName);
            setProfile(next);
            router.replace('/(tabs)/chart');
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}
