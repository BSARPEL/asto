import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { formatBirthPlace } from '@asto/shared';
import { BirthForm } from '@/components/BirthForm';
import {
  Avatar,
  Body,
  Button,
  Card,
  HeaderRow,
  HeroCard,
  InfoRow,
  PlusBadge,
  ResponsiveSplit,
  Screen,
  ScreenScroll,
  SectionTitle,
  SheetModal,
  SignTrio,
  TokenBadge,
  TrustNote,
  tabScrollStyle,
} from '@/components/ui';
import { saveUserBirth } from '@/lib/birth-service';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { profile, setProfile, logout } = useAuth();
  const [editBirth, setEditBirth] = useState(false);
  const chart = profile?.natalChart;

  const identityCard = (
    <HeroCard>
      <View style={styles.profileRow}>
        <Avatar name={profile?.displayName ?? 'A'} size="md" />
        <View style={styles.profileMeta}>
          <Text style={styles.profileName}>{profile?.displayName}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {profile?.isSubscribed ? (
            <View style={styles.badgeRow}>
              <PlusBadge />
            </View>
          ) : null}
        </View>
      </View>
      {chart ? (
        <>
          <SignTrio sun={chart.sunSign} moon={chart.moonSign} rising={chart.risingSign} compact />
          <Body muted style={styles.natalHint}>
            Natal kimliğin — Güneş, Ay ve yükselen.
          </Body>
        </>
      ) : (
        <Body muted>Doğum bilgisi tamamlanınca burç üçlün burada görünür.</Body>
      )}
    </HeroCard>
  );

  const accountCard = (
    <Card compact>
      <SectionTitle compact>Hesap</SectionTitle>
      <InfoRow compact label="Abonelik" value={profile?.isSubscribed ? 'BN Astro Plus' : 'Ücretsiz'} />
      {profile?.birth ? (
        <>
          <InfoRow compact label="Doğum tarihi" value={profile.birth.birthDate} />
          <InfoRow compact label="Doğum saati" value={profile.birth.birthTime} />
          <InfoRow compact label="Doğum yeri" value={formatBirthPlace(profile.birth)} />
        </>
      ) : null}
      <Button
        compact
        label="Doğum bilgisini düzenle"
        variant="ghost"
        onPress={() => setEditBirth(true)}
      />
      <TrustNote>
        Harita cihazında hesaplanır; yorumlar rehberlik amaçlıdır.
      </TrustNote>
    </Card>
  );

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={tabScrollStyle()}>
        <HeaderRow
          compact
          eyebrow="Natal kimlik"
          title={profile?.displayName ?? 'Profil'}
          subtitle="Doğum verisi ve hesap"
          right={<TokenBadge compact balance={profile?.tokenBalance ?? 0} />}
        />

        <ResponsiveSplit leading={identityCard} trailing={accountCard} />

        <Card compact>
          <SectionTitle compact>Keşfet</SectionTitle>
          <Link href="/tokens" style={styles.link}>
            Jeton & Plus
          </Link>
          <Link href="/forecast" style={styles.link}>
            Kişisel öngörü
          </Link>
          <Link href="/(analysis)/type" style={styles.link}>
            Yeni ilişki analizi
          </Link>
        </Card>

        <Card compact>
          <SectionTitle compact>Yasal</SectionTitle>
          <Link href="/legal/privacy" style={styles.link}>
            Gizlilik politikası
          </Link>
          <Link href="/legal/terms" style={styles.link}>
            Kullanım şartları
          </Link>
        </Card>

        <Button
          compact
          label="Çıkış yap"
          variant="danger"
          onPress={async () => {
            await logout();
            router.replace('/(auth)/welcome');
          }}
        />
      </ScreenScroll>

      <SheetModal
        visible={editBirth}
        onClose={() => setEditBirth(false)}
        title="Doğum bilgisini güncelle"
      >
        <BirthForm
          initial={profile?.birth}
          submitLabel="Kaydet"
          onSubmit={async (birth) => {
            if (!profile?.id) throw new Error('Oturum yok');
            const next = await saveUserBirth(profile.id, birth, profile.displayName);
            setProfile(next);
            setEditBirth(false);
          }}
        />
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    width: '100%',
  },
  profileMeta: { flex: 1, minWidth: 0 },
  profileName: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
  },
  profileEmail: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
    flexShrink: 1,
  },
  badgeRow: { marginTop: 6 },
  natalHint: { fontSize: 13, marginTop: spacing.sm },
  link: {
    color: colors.teal,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    marginBottom: 8,
  },
});
