import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { Partner } from '@asto/shared';
import { BirthForm } from '@/components/BirthForm';
import {
  Body,
  Button,
  Card,
  ErrorText,
  Screen,
  Subtitle,
  Title,
  TokenBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';

export default function RelationshipScreen() {
  const { token, profile, setProfile } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await api.partners(token);
    setPartners(res.partners);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => setError(e.message));
    }, [load]),
  );

  const analyze = async (partner: Partner) => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.analyzePartner(token, partner.id);
      setProfile(res.profile);
      setSelected(res.partner);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Title>İlişki</Title>
            <Subtitle>Karşı tarafın doğum bilgisiyle sinastri ve AI yorumu.</Subtitle>
          </View>
          <TokenBadge balance={profile?.tokenBalance ?? 0} />
        </View>

        <Button label="Partner ekle" onPress={() => setShowForm(true)} variant="ghost" />
        <ErrorText>{error}</ErrorText>

        {partners.map((p) => (
          <Pressable key={p.id} onPress={() => setSelected(p)}>
            <Card>
              <Text style={styles.name}>{p.birth.name}</Text>
              <Body muted>
                {p.birth.birthDate} · {p.natalChart.sunSign} Güneş · {p.natalChart.moonSign} Ay
              </Body>
              {p.synastryScore != null ? (
                <Text style={styles.score}>Uyum: {p.synastryScore}/100</Text>
              ) : (
                <Body muted>Henüz analiz yok</Body>
              )}
              <Button
                label={
                  profile?.isSubscribed
                    ? 'İlişkiyi yorumla'
                    : p.analysis
                      ? 'Yeniden yorumla (3 jeton)'
                      : 'İlişkiyi yorumla (3 jeton)'
                }
                onPress={() => analyze(p)}
                loading={loading && selected?.id === p.id}
              />
            </Card>
          </Pressable>
        ))}

        {selected?.analysis ? (
          <Card>
            <Text style={styles.cardTitle}>
              {selected.birth.name} — analiz
              {selected.synastryScore != null ? ` (${selected.synastryScore}/100)` : ''}
            </Text>
            <Body>{selected.analysis}</Body>
          </Card>
        ) : null}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <Screen>
          <ScrollView contentContainerStyle={styles.pad}>
            <Title>Partner ekle</Title>
            <Subtitle>Doğum tarihi ve saati ne kadar doğruysa yorum o kadar isabetli olur.</Subtitle>
            <BirthForm
              submitLabel="Kaydet"
              onSubmit={async (birth) => {
                if (!token) throw new Error('Oturum yok');
                await api.addPartner(token, birth);
                setShowForm(false);
                await load();
              }}
            />
            <Button label="Kapat" variant="ghost" onPress={() => setShowForm(false)} />
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: 12 },
  name: { fontFamily: 'Syne_700Bold', color: colors.text, fontSize: 20, marginBottom: 4 },
  score: {
    marginTop: 8,
    fontFamily: 'Manrope_700Bold',
    color: colors.teal,
    fontSize: 16,
  },
  cardTitle: {
    fontFamily: 'Syne_700Bold',
    color: colors.accentStrong,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
});
