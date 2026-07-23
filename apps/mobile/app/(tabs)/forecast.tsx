import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Conversation, DailyReading } from '@asto/shared';
import { TOKEN_COSTS } from '@asto/shared';
import {
  Body,
  Button,
  Card,
  Chip,
  ErrorText,
  Field,
  HeaderRow,
  MessageBubble,
  ResponsiveSplit,
  Screen,
  ScreenScroll,
  SectionTitle,
  Skeleton,
  TokenBadge,
  tabScrollStyle,
} from '@/components/ui';
import { AstroGlyph } from '@/components/AstroGlyph';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { localTodayKey, userTimezone } from '@/lib/dates';
import { colors, fonts, spacing } from '@/constants/theme';

const SUGGESTIONS = [
  'Bugün aşk hayatımda nelere dikkat etmeliyim?',
  'Kariyerimde bu hafta nasıl bir enerji var?',
  'İçimde tekrar eden döngünün haritamdaki karşılığı ne?',
];

function todayLabel() {
  try {
    return format(new Date(), 'd MMMM yyyy, EEEE', { locale: tr });
  } catch {
    return 'Bugün';
  }
}

function updatedLabel(iso: string) {
  try {
    return format(new Date(iso), 'HH:mm', { locale: tr });
  } catch {
    return '';
  }
}

export default function ForecastScreen() {
  const { token, profile, setProfile } = useAuth();
  const tz = userTimezone(profile?.birth);
  const todayKey = useMemo(() => localTodayKey(tz), [tz]);

  const [reading, setReading] = useState<DailyReading | null>(null);
  const [readingCached, setReadingCached] = useState(false);
  const [serverToday, setServerToday] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [fetchingDaily, setFetchingDaily] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastDayRef = useRef(todayKey);

  const applyDaily = useCallback(
    (res: Awaited<ReturnType<typeof aiService.loadCachedDailyReading>>) => {
      if (res.today !== localTodayKey(tz)) {
        setReading(null);
        setConversation(null);
        setReadingCached(false);
        return false;
      }
      setServerToday(res.today);
      lastDayRef.current = res.today;
      if (!res.reading || res.reading.date !== res.today) {
        setReading(null);
        setConversation(null);
        setReadingCached(false);
        return false;
      }
      setReading(res.reading);
      setReadingCached(res.cached);
      setConversation(res.conversation);
      return true;
    },
    [tz],
  );

  const loadDaily = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!token || !profile?.id) return;
      if (!opts?.silent) setLoadingDaily(true);
      setError(null);
      try {
        const res = await aiService.loadCachedDailyReading(profile.id, tz);
        applyDaily(res);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (!opts?.silent) setLoadingDaily(false);
      }
    },
    [token, profile?.id, tz, applyDaily],
  );

  useFocusEffect(
    useCallback(() => {
      loadDaily();
    }, [loadDaily]),
  );

  useEffect(() => {
    if (todayKey === lastDayRef.current) return;
    lastDayRef.current = todayKey;
    setReading(null);
    setConversation(null);
    loadDaily();
  }, [todayKey, loadDaily]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const nowDay = localTodayKey(tz);
      if (nowDay !== lastDayRef.current) {
        setReading(null);
        setConversation(null);
      }
      loadDaily({ silent: true });
    });
    return () => sub.remove();
  }, [loadDaily, tz]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDaily({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDaily = async (force = false) => {
    if (!token) return;
    setError(null);
    setFetchingDaily(true);
    try {
      const res = await aiService.generateDailyReading(token, force);
      if (res.today === localTodayKey(tz) && res.reading.date === res.today) {
        setReading(res.reading);
        setReadingCached(res.cached);
        setServerToday(res.today);
        setConversation(res.conversation);
        setProfile(res.profile);
        lastDayRef.current = res.today;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFetchingDaily(false);
    }
  };

  const ask = async (q: string) => {
    if (!token || !q.trim()) return;
    setError(null);
    setAsking(true);
    try {
      const res = await aiService.askDailyQuestion(token, q.trim(), conversation?.id);
      setConversation(res.conversation);
      setProfile(res.profile);
      setQuestion('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(false);
    }
  };

  const isTodayReading = reading?.date === todayKey && serverToday === todayKey;

  const fetchLabel = !isTodayReading
    ? 'Öngörü al'
    : profile?.isSubscribed
      ? 'Yeni öngörü al'
      : `Yeni öngörü al (${TOKEN_COSTS.dailyReadingRefresh} jeton)`;

  const dailyCard = (
    <Card compact accent={colors.teal}>
      <View style={styles.dailyTop}>
        <AstroGlyph planetKey="Moon" size="sm" color={colors.teal} />
        <View style={styles.dailyMeta}>
          <View style={styles.dailyTitleRow}>
            <SectionTitle compact>Bugünün öngörüsü</SectionTitle>
            {isTodayReading && !loadingDaily ? (
              <Chip
                label={readingCached ? 'Güncel' : 'Yeni'}
                active={readingCached}
                compact
              />
            ) : null}
          </View>
          <Text style={styles.dailyDate}>{todayLabel()}</Text>
          {reading?.createdAt && isTodayReading ? (
            <Text style={styles.dailyUpdated}>
              {readingCached ? 'Kayıtlı' : 'Üretildi'} · {updatedLabel(reading.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>
      {loadingDaily && !reading ? (
        <View style={styles.skeletons}>
          <Skeleton height={12} width="100%" />
          <Skeleton height={12} width="92%" />
          <Skeleton height={12} width="78%" />
        </View>
      ) : isTodayReading && reading ? (
        <>
          <Body style={styles.dailySummary}>{reading.summary}</Body>
          <View style={styles.themes}>
            {reading.themes.map((t) => (
              <Chip key={t} label={t} active compact />
            ))}
          </View>
        </>
      ) : loadingDaily ? (
        <View style={styles.skeletons}>
          <Skeleton height={12} width="88%" />
          <Skeleton height={12} width="70%" />
        </View>
      ) : (
        <Body muted>Bugünün öngörüsünü almak için aşağıdaki butona dokun. İlk öngörü gün içinde ücretsiz.</Body>
      )}
      <View style={styles.fetchBtn}>
        <Button
          compact
          label={fetchLabel}
          onPress={() => fetchDaily(isTodayReading)}
          loading={fetchingDaily}
          variant={isTodayReading ? 'ghost' : 'primary'}
          icon="✦"
        />
      </View>
    </Card>
  );

  const askCard = (
    <Card compact>
      <SectionTitle compact>Sorunu sor</SectionTitle>
      <Body muted style={styles.askHint}>
        Günlük öngörüyle aynı sohbette devam eder.
      </Body>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <Chip key={s} label={s} onPress={() => ask(s)} compact />
        ))}
      </View>
      <Field
        compact
        label={profile?.isSubscribed ? 'Mesajın' : 'Mesajın (1 jeton)'}
        value={question}
        onChangeText={setQuestion}
        placeholder="Haritana özel bir soru yaz…"
        multiline
      />
      <Button compact label="Gönder" onPress={() => ask(question)} loading={asking} icon="→" />
    </Card>
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScreenScroll
          contentContainerStyle={tabScrollStyle()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
          }
        >
          <HeaderRow
            compact
            eyebrow="Günlük"
            title="Öngörü"
            right={<TokenBadge compact balance={profile?.tokenBalance ?? 0} />}
          />

          <ResponsiveSplit leading={dailyCard} trailing={askCard} />

          <ErrorText>{error}</ErrorText>

          {conversation?.messages.length ? (
            <Card compact style={styles.thread}>
              <SectionTitle compact>Bugünkü sohbet</SectionTitle>
              {conversation.messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} compact />
              ))}
            </Card>
          ) : null}
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dailyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8, width: '100%' },
  dailyMeta: { flex: 1, minWidth: 0 },
  dailyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  dailyDate: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
  },
  dailyUpdated: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  dailySummary: { fontSize: 14, lineHeight: 21, flexShrink: 1 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, width: '100%' },
  fetchBtn: { marginTop: 10 },
  askHint: { fontSize: 13, marginBottom: 6 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  skeletons: { gap: 6 },
  thread: { marginBottom: spacing.sm },
});
