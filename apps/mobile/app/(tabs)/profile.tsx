import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { BirthForm } from '@/components/BirthForm';
import {
  Body,
  Button,
  Card,
  Screen,
  Subtitle,
  Title,
  TokenBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { profile, token, setProfile, logout } = useAuth();
  const [editBirth, setEditBirth] = useState(false);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Title>{profile?.displayName}</Title>
            <Subtitle>{profile?.email}</Subtitle>
          </View>
          <TokenBadge balance={profile?.tokenBalance ?? 0} />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Hesap</Text>
          <Body muted>
            Abonelik: {profile?.isSubscribed ? 'Asto Plus' : 'Ücretsiz'}
          </Body>
          {profile?.birth ? (
            <Body muted>
              Doğum: {profile.birth.birthDate} {profile.birth.birthTime} · {profile.birth.city}
            </Body>
          ) : null}
          <Button label="Doğum bilgisini düzenle" variant="ghost" onPress={() => setEditBirth(true)} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Yasal</Text>
          <Link href="/legal/privacy" style={styles.link}>
            Gizlilik politikası
          </Link>
          <Link href="/legal/terms" style={styles.link}>
            Kullanım şartları
          </Link>
        </Card>

        <Button
          label="Çıkış yap"
          variant="danger"
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        />
      </ScrollView>

      <Modal visible={editBirth} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={styles.pad}>
            <Title>Doğum bilgisini güncelle</Title>
            <BirthForm
              initial={profile?.birth}
              submitLabel="Kaydet"
              onSubmit={async (birth) => {
                if (!token) throw new Error('Oturum yok');
                const res = await api.saveBirth(token, birth);
                setProfile(res.profile);
                setEditBirth(false);
              }}
            />
            <Button label="Kapat" variant="ghost" onPress={() => setEditBirth(false)} />
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: 12 },
  cardTitle: {
    fontFamily: 'Syne_700Bold',
    color: colors.accentStrong,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  link: {
    color: colors.teal,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    marginBottom: 10,
  },
});
