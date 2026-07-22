import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Conversation, DailyReading } from '@asto/shared';
import {
  Body,
  Button,
  Card,
  Chip,
  ErrorText,
  Field,
  Screen,
  Subtitle,
  Title,
  TokenBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';

const SUGGESTIONS = [
  'Bugün aşk hayatımda nelere dikkat etmeliyim?',
  'Kariyerimde bu hafta nasıl bir enerji var?',
  'İçimde tekrar eden döngünün haritamdaki karşılığı ne?',
];

export default function ForecastScreen() {
  const { token, profile, setProfile } = useAuth();
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoadingDaily(true);
    api
      .dailyReading(token)
      .then((res) => setReading(res.reading))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingDaily(false));
  }, [token]);

  const ask = async (q: string) => {
    if (!token || !q.trim()) return;
    setError(null);
    setAsking(true);
    try {
      const res = await api.ask(token, q.trim(), conversation?.id);
      setConversation(res.conversation);
      setProfile(res.profile);
      setQuestion('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Title>Öngörü</Title>
              <Subtitle>Bugünün enerjisi ve haritana özel sorular.</Subtitle>
            </View>
            <TokenBadge balance={profile?.tokenBalance ?? 0} />
          </View>

          <Card>
            <Text style={styles.cardTitle}>Bugün</Text>
            {loadingDaily ? (
              <Body muted>Yükleniyor…</Body>
            ) : reading ? (
              <>
                <Body>{reading.summary}</Body>
                <View style={styles.themes}>
                  {reading.themes.map((t) => (
                    <Chip key={t} label={t} active />
                  ))}
                </View>
              </>
            ) : (
              <Body muted>Günlük öngörü alınamadı.</Body>
            )}
          </Card>

          <Text style={styles.cardTitle}>Sorunu sor</Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} onPress={() => ask(s)} />
            ))}
          </View>

          <Field
            label={profile?.isSubscribed ? 'Mesajın' : 'Mesajın (1 jeton)'}
            value={question}
            onChangeText={setQuestion}
            placeholder="Örn. Evlilik zamanlaması haritamda nasıl görünüyor?"
            multiline
          />
          <Button label="Gönder" onPress={() => ask(question)} loading={asking} />
          <ErrorText>{error}</ErrorText>

          {conversation?.messages.map((m) => (
            <Card key={m.id} style={m.role === 'user' ? styles.userBubble : undefined}>
              <Text style={styles.role}>{m.role === 'user' ? 'Sen' : 'Asto'}</Text>
              <Body>{m.content}</Body>
            </Card>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
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
  themes: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  role: {
    fontFamily: 'Manrope_700Bold',
    color: colors.teal,
    marginBottom: 6,
    fontSize: 12,
  },
  userBubble: { backgroundColor: '#1A243F' },
});
