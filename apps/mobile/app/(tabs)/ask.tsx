import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import type { Conversation, Partner } from '@asto/shared';
import { AiChatPanel } from '@/components/AiChatPanel';
import { BackBar } from '@/components/BackBar';
import {
  Body,
  Button,
  EmptyState,
  ErrorText,
  HeaderRow,
  Screen,
  ScreenScroll,
  tabScrollStyle,
} from '@/components/ui';
import {
  getSelectedPartnerId,
  isPartnerReportUnlocked,
  setSelectedPartnerId,
} from '@/lib/analysis-draft';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { spacing } from '@/constants/theme';

const SUGGESTIONS = [
  'Bu ilişkide en güçlü uyum nerede?',
  'Tartışma anında nelere dikkat etmeliyiz?',
  'Uzun vadeli potansiyelimiz nasıl?',
];

export default function AskScreen() {
  const { profile, token, setProfile } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!profile?.id || !token) return;
        setError(null);
        try {
          const id = await getSelectedPartnerId();
          const { partners } = await aiService.listPartners(profile.id);
          const selected =
            (id && partners.find((p) => p.id === id)) ||
            partners.find((p) => p.analysis) ||
            null;
          if (!alive) return;
          setPartner(selected);
          if (!selected?.analysis) {
            setConversation(null);
            return;
          }
          await setSelectedPartnerId(selected.id);
          const res = await aiService.loadPartnerConversation(profile.id, selected);
          if (!alive) return;
          setPartner(res.partner);
          setConversation(res.conversation);
        } catch (e) {
          if (alive) setError((e as Error).message);
        }
      })();
      return () => {
        alive = false;
      };
    }, [profile?.id, token]),
  );

  const unlocked = isPartnerReportUnlocked(partner, profile?.isSubscribed);

  const send = async (text?: string) => {
    const q = (text ?? question).trim();
    if (!token || !partner || !q || asking) return;
    setPending(q);
    setAsking(true);
    setError(null);
    try {
      const res = await aiService.askPartnerQuestion(token, partner.id, q, conversation?.id);
      setConversation(res.conversation);
      setProfile(res.profile);
      setQuestion('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(false);
      setPending('');
    }
  };

  if (!partner?.analysis) {
    return (
      <Screen>
        <ScreenScroll contentContainerStyle={tabScrollStyle()}>
          <BackBar
            label="BN Astro'ya Sor"
            fallbackHref="/(tabs)/relationship"
            onPress={() => router.replace('/(tabs)/relationship')}
          />
          <HeaderRow title="Sor" />
          <EmptyState
            title="Önce bir analiz seç"
            body="Rapora bağlı sorular için Analizler’den bir bağ seç veya yeni analiz başlat."
          />
          <Button label="Analize başla" onPress={() => router.push('/(analysis)/type')} />
          <Button
            label="Analizler"
            variant="ghost"
            onPress={() => router.push('/(tabs)/relationship')}
          />
        </ScreenScroll>
      </Screen>
    );
  }

  if (!unlocked) {
    return (
      <Screen>
        <ScreenScroll contentContainerStyle={tabScrollStyle()}>
          <BackBar
            label="BN Astro'ya Sor"
            fallbackHref="/(tabs)/relationship"
            onPress={() => router.replace('/(tabs)/relationship')}
          />
          <HeaderRow title="Sor" />
          <Body muted>
            {partner.birth.name} analizine sorabilmek için tam raporu açman gerekir.
          </Body>
          <ErrorText>{error}</ErrorText>
          <View style={styles.gap}>
            <Button
              label="Tam analizi aç"
              onPress={() =>
                router.push({
                  pathname: '/(analysis)/paywall',
                  params: { partnerId: partner.id },
                })
              }
            />
            <Button
              label="Ön izleme"
              variant="ghost"
              onPress={() =>
                router.push({
                  pathname: '/(analysis)/preview',
                  params: { partnerId: partner.id },
                })
              }
            />
          </View>
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={tabScrollStyle()}>
        <BackBar
          label={`${partner.birth.name}`}
          fallbackHref="/(tabs)/relationship"
          onPress={() => router.replace('/(tabs)/relationship')}
        />
        <HeaderRow title={`Sor · ${partner.birth.name}`} />
        <ErrorText>{error}</ErrorText>
        <AiChatPanel
          messages={conversation?.messages ?? []}
          suggestions={SUGGESTIONS}
          value={question}
          onChangeText={setQuestion}
          onSend={() => void send()}
          onSuggestion={(t) => void send(t)}
          asking={asking}
          pendingUserText={pending || undefined}
          placeholder="Bu ilişki hakkında bir soru sorun…"
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm, marginTop: spacing.md },
});
