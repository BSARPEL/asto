import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import type { Conversation, DailyReading } from '@asto/shared';
import {
  Body,
  Button,
  Card,
  Chip,
  ErrorText,
  Field,
  HeaderRow,
  MessageBubble,
  Screen,
  ScreenScroll,
  SectionTitle,
  TokenBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { spacing } from '@/constants/theme';

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScreenScroll>
          <HeaderRow
            title="Öngörü"
            subtitle="Bugünün enerjisi ve haritana özel sorular."
            right={<TokenBadge balance={profile?.tokenBalance ?? 0} />}
          />

          <Card elevated>
            <SectionTitle>Bugün</SectionTitle>
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

          <SectionTitle>Sorunu sor</SectionTitle>
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

          {conversation?.messages.length ? (
            <View style={styles.thread}>
              <SectionTitle>Sohbet</SectionTitle>
              {conversation.messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
            </View>
          ) : null}
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  themes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  thread: {
    marginTop: spacing.lg,
  },
});
