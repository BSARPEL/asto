import { router } from 'expo-router';
import { BirthForm } from '@/components/BirthForm';
import { BrandMark, HeroCard, Screen, ScreenScroll, Subtitle, Title } from '@/components/ui';
import { saveUserBirth } from '@/lib/birth-service';
import { useAuth } from '@/lib/auth';
import { colors } from '@/constants/theme';

export default function BirthOnboarding() {
  const { setProfile, profile } = useAuth();

  return (
    <Screen>
      <ScreenScroll>
        <BrandMark />
        <HeroCard accent={colors.accent}>
          <Title>Doğum haritan</Title>
          <Subtitle style={{ marginBottom: 0 }}>
            Tarih, saat ve şehir ile gökyüzündeki konumunu hesaplarız. Saat
            hassasiyeti yükseleni belirler; bilmiyorsan 12:00 kullanabilirsin.
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
