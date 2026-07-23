import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOKEN_COSTS, formatBirthPlace, type BirthInput } from '@asto/shared';
import type { Conversation, Partner } from '@asto/shared';
import { AiChatPanel } from '@/components/AiChatPanel';
import { AiMarkdown } from '@/components/AiMarkdown';
import { BirthForm } from '@/components/BirthForm';
import {
  Avatar,
  Body,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorText,
  HeaderRow,
  Screen,
  ScreenScroll,
  ScoreBadge,
  ScoreBar,
  SectionTitle,
  SheetModal,
  SynastryBond,
  TokenBadge,
  TrustNote,
  tabScrollStyle,
  useLayout,
} from '@/components/ui';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radii, spacing } from '@/constants/theme';

const SYNASTRY_SUGGESTIONS = [
  'Bu ilişkide en güçlü uyum nerede?',
  'Tartışma anında nelere dikkat etmeliyiz?',
  'Uzun vadeli potansiyelimiz nasıl?',
];

function analyzeLabel(isSubscribed: boolean, hasAnalysis: boolean) {
  if (isSubscribed) return hasAnalysis ? 'Yeniden yorumla' : 'Sinastri yorumu al';
  return hasAnalysis ? `Yeniden yorumla (${TOKEN_COSTS.relationshipAnalysis} jeton)` : `Sinastri yorumu al (${TOKEN_COSTS.relationshipAnalysis} jeton)`;
}

function formatHistoryDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function analysisPreview(text?: string, max = 140) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function PartnerCard({
  partner,
  active,
  loading,
  isSubscribed,
  selfSun,
  selfMoon,
  onSelect,
  onAnalyze,
  onEdit,
  onOpenReading,
}: {
  partner: Partner;
  active: boolean;
  loading: boolean;
  isSubscribed: boolean;
  selfSun?: string;
  selfMoon?: string;
  onSelect: () => void;
  onAnalyze: (force: boolean) => void;
  onEdit: () => void;
  onOpenReading: () => void;
}) {
  const hasAnalysis = Boolean(partner.analysis);

  return (
    <Card compact elevated={active} accent={active ? colors.teal : undefined} style={active ? styles.cardActive : undefined}>
      <Pressable onPress={onSelect}>
        <View style={styles.partnerTop}>
          <Avatar name={partner.birth.name} size="sm" />
          <View style={styles.partnerMain}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{partner.birth.name}</Text>
              {active ? <Chip label="Seçili" active compact /> : null}
            </View>
            <Text style={styles.meta} numberOfLines={2}>
              {partner.birth.birthDate} · {partner.birth.birthTime} ·{' '}
              {formatBirthPlace(partner.birth)}
            </Text>
            {partner.synastryScore == null ? (
              <Text style={styles.hint}>Henüz sinastri analizi yok</Text>
            ) : null}
          </View>
          {partner.synastryScore != null ? (
            <ScoreBadge score={partner.synastryScore} compact />
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Yeni</Text>
            </View>
          )}
        </View>
        <SynastryBond
          compact
          selfSun={selfSun}
          selfMoon={selfMoon}
          partnerSun={partner.natalChart.sunSign}
          partnerMoon={partner.natalChart.moonSign}
          partnerName={partner.birth.name}
        />
        {partner.synastryScore != null ? (
          <ScoreBar score={partner.synastryScore} compact />
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        {hasAnalysis ? (
          <Button compact label="Yorumu aç" onPress={onOpenReading} variant="primary" />
        ) : (
          <Button
            compact
            label={analyzeLabel(isSubscribed, false)}
            onPress={() => onAnalyze(false)}
            loading={loading}
            variant="primary"
          />
        )}
        {hasAnalysis ? (
          <Button
            compact
            label={analyzeLabel(isSubscribed, true)}
            onPress={() => onAnalyze(true)}
            loading={loading}
            variant="ghost"
          />
        ) : null}
        <Button compact label="Düzenle" variant="ghost" onPress={onEdit} />
      </View>
    </Card>
  );
}

function HistoryCard({
  partner,
  selfSun,
  selfMoon,
  onOpen,
}: {
  partner: Partner;
  selfSun?: string;
  selfMoon?: string;
  onOpen: () => void;
}) {
  const dateLabel = formatHistoryDate(partner.analysisAt ?? partner.createdAt);
  const preview = analysisPreview(partner.analysis);

  return (
    <Card compact elevated style={styles.historyCard}>
      <View style={styles.partnerTop}>
        <Avatar name={partner.birth.name} size="sm" />
        <View style={styles.partnerMain}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{partner.birth.name}</Text>
            {dateLabel ? <Chip label={dateLabel} compact /> : null}
          </View>
          <Text style={styles.meta} numberOfLines={2}>
            {partner.birth.birthDate} · {partner.birth.birthTime} ·{' '}
            {formatBirthPlace(partner.birth)}
          </Text>
        </View>
        {partner.synastryScore != null ? (
          <ScoreBadge score={partner.synastryScore} compact />
        ) : null}
      </View>
      <SynastryBond
        compact
        selfSun={selfSun}
        selfMoon={selfMoon}
        partnerSun={partner.natalChart.sunSign}
        partnerMoon={partner.natalChart.moonSign}
        partnerName={partner.birth.name}
      />
      {partner.synastryScore != null ? (
        <ScoreBar score={partner.synastryScore} compact />
      ) : null}
      {preview ? (
        <Text style={styles.historyPreview} numberOfLines={3}>
          {preview}
          {partner.analysis && partner.analysis.length > preview.length ? '…' : ''}
        </Text>
      ) : null}
      <Button compact label="Yorumu aç" onPress={onOpen} variant="primary" />
    </Card>
  );
}

export default function RelationshipScreen() {
  const { token, profile, setProfile } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isSplitLayout, gutter } = useLayout();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'hub' | 'detail'>('hub');
  const [hubTab, setHubTab] = useState<'partners' | 'history'>('partners');
  const [detailTab, setDetailTab] = useState<'analysis' | 'chat'>('analysis');
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [loadingConversation, setLoadingConversation] = useState(false);
  const partnersRef = useRef(partners);
  partnersRef.current = partners;

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const res = await aiService.listPartners(profile.id);
    setPartners(res.partners);
    setSelectedId((prev) => {
      if (prev && res.partners.some((p) => p.id === prev)) return prev;
      return res.partners[0]?.id ?? null;
    });
  }, [profile?.id]);

  const historyPartners = useMemo(
    () =>
      partners
        .filter((p) => p.analysis)
        .sort((a, b) => {
          const aTs = a.analysisAt ?? a.createdAt;
          const bTs = b.analysisAt ?? b.createdAt;
          return bTs.localeCompare(aTs);
        }),
    [partners],
  );

  const openDetail = (partnerId: string, from: 'partners' | 'history' = 'partners') => {
    setSelectedId(partnerId);
    if (from === 'history') setHubTab('history');
    setDetailTab('analysis');
    setError(null);
    setQuestion('');
    setPendingQuestion('');
    setConversation(null);
    setView('detail');
  };

  const goBack = useCallback(() => {
    setView('hub');
    setQuestion('');
    setPendingQuestion('');
    setError(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => {
        if (view !== 'detail') setError(e.message);
      });
    }, [load, view]),
  );

  const selected = partners.find((p) => p.id === selectedId) ?? null;

  useLayoutEffect(() => {
    const inDetailView = view === 'detail' && Boolean(selected);
    navigation.setOptions({
      headerShown: true,
      title: inDetailView ? selected!.birth.name : 'Sinastri',
      headerBackVisible: false,
      headerLeft: inDetailView
        ? () => (
            <Pressable onPress={goBack} hitSlop={8} style={styles.headerBackBtn}>
              <Text style={styles.backText}>← Geri</Text>
            </Pressable>
          )
        : undefined,
      headerRight: () =>
        inDetailView && selected?.synastryScore != null ? (
          <View style={styles.headerRightPad}>
            <ScoreBadge score={selected.synastryScore} compact />
          </View>
        ) : !inDetailView ? (
          <View style={styles.headerRightPad}>
            <TokenBadge compact balance={profile?.tokenBalance ?? 0} />
          </View>
        ) : null,
    });
  }, [navigation, view, selected, profile?.tokenBalance, goBack]);

  // Sohbet yalnızca detay ekranında ve partner değişince yüklenir
  useEffect(() => {
    if (view !== 'detail' || !selectedId || !profile?.id) {
      if (view !== 'detail') {
        setConversation(null);
        setQuestion('');
      }
      return;
    }

    const partnerHint = partnersRef.current.find((p) => p.id === selectedId);
    if (!partnerHint?.analysis) {
      setLoadingConversation(false);
      return;
    }

    const needsLoad =
      !conversation ||
      (partnerHint.conversationId
        ? conversation.id !== partnerHint.conversationId
        : conversation.messages.length === 0);

    let cancelled = false;
    if (needsLoad) {
      setLoadingConversation(true);
      setError(null);
    } else {
      return;
    }

    aiService
      .loadPartnerConversation(profile.id, partnerHint)
      .then((res) => {
        if (cancelled) return;
        setPartners((prev) => {
          const exists = prev.some((p) => p.id === res.partner.id);
          if (!exists) return [...prev, res.partner];
          return prev.map((p) => (p.id === res.partner.id ? res.partner : p));
        });
        setConversation(res.conversation);
        if (!res.partner.analysis) {
          setError('Bu partner için kayıtlı sinastri yorumu bulunamadı.');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError((e as Error).message);
        setConversation(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingConversation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, selectedId, profile?.id]);

  const analyze = async (partner: Partner, force = false) => {
    if (!token) return;
    setError(null);
    setLoadingId(partner.id);
    setSelectedId(partner.id);
    try {
      const res = await aiService.analyzePartner(token, partner.id, force);
      setProfile(res.profile);
      setPartners((prev) => prev.map((p) => (p.id === res.partner.id ? res.partner : p)));
      if (res.conversation) setConversation(res.conversation);
      setDetailTab('analysis');
      setView('detail');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  const addPartner = async (birth: BirthInput) => {
    if (!profile?.id) throw new Error('Oturum yok');
    const res = await aiService.addPartner(profile.id, birth);
    setShowForm(false);
    await load();
    setSelectedId(res.partner.id);
  };

  const savePartnerEdit = async (birth: BirthInput) => {
    if (!profile?.id || !editingPartner) throw new Error('Oturum yok');
    const res = await aiService.updatePartner(profile.id, editingPartner.id, birth);
    setEditingPartner(null);
    setPartners((prev) => prev.map((p) => (p.id === res.partner.id ? res.partner : p)));
    setSelectedId(res.partner.id);
  };

  const closePartnerSheet = () => {
    setShowForm(false);
    setEditingPartner(null);
  };

  const openEdit = (partner: Partner) => {
    setShowForm(false);
    setEditingPartner(partner);
  };

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!token || !selected || !q || asking) return;
    setPendingQuestion(q);
    setAsking(true);
    setError(null);
    try {
      const res = await aiService.askPartnerQuestion(token, selected.id, q, conversation?.id);
      setConversation(res.conversation);
      setProfile(res.profile);
      setQuestion('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(false);
      setPendingQuestion('');
    }
  };

  const inDetail = view === 'detail';
  const messageCount = conversation?.messages?.length ?? 0;
  const keyboardOffset = Platform.OS === 'ios' ? insets.top + 44 : 0;

  const detailMetaLine = selected
    ? `${selected.birth.birthDate} · ${formatBirthPlace(selected.birth)}`
    : '';

  const chatPanel = selected ? (
    <AiChatPanel
      messages={conversation?.messages ?? []}
      loading={loadingConversation}
      asking={asking}
      pendingUserText={pendingQuestion}
      value={question}
      onChangeText={setQuestion}
      onSend={() => ask(question)}
      suggestions={SYNASTRY_SUGGESTIONS}
      onSuggestion={ask}
      placeholder="Sinastri hakkında mesaj yaz…"
      emptyTitle="Sinastri sohbeti"
      emptyBody={`${selected.birth.name} ile ilişkinize dair sorularını sor.`}
    />
  ) : null;

  const natalChart = profile?.natalChart;

  const analysisContent = selected?.analysis ? (
    <>
      <SynastryBond
        compact
        selfSun={natalChart?.sunSign}
        selfMoon={natalChart?.moonSign}
        partnerSun={selected.natalChart.sunSign}
        partnerMoon={selected.natalChart.moonSign}
        partnerName={selected.birth.name}
      />
      {selected.analysisAt || selected.createdAt ? (
        <Text style={styles.analysisDate}>
          {formatHistoryDate(selected.analysisAt ?? selected.createdAt)}
        </Text>
      ) : null}
      {selected.synastryScoreNote ? (
        <Text style={styles.scoreNote}>{selected.synastryScoreNote}</Text>
      ) : null}
      <AiMarkdown content={selected.analysis} compact />
      <TrustNote>
        Sinastri bir rehberliktir; ilişki dinamiklerini yansıtır, kesin yargı değildir.
      </TrustNote>
      <Button
        compact
        label={analyzeLabel(profile?.isSubscribed ?? false, true)}
        onPress={() => analyze(selected, true)}
        loading={loadingId === selected.id}
        variant="ghost"
      />
    </>
  ) : null;

  const renderDetailBody = () => {
    if (!selected) {
      return (
        <View style={styles.detailLoading}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.detailLoadingText}>Partner yükleniyor…</Text>
        </View>
      );
    }

    if (!selected.analysis) {
      return (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.detailEmptyContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card compact style={styles.promptCard}>
            <SectionTitle compact>Sinastri yorumu yok</SectionTitle>
            <Body muted style={styles.promptBody}>
              Bu partner için kayıtlı yorum bulunamadı.
            </Body>
            <Button
              compact
              label={analyzeLabel(profile?.isSubscribed ?? false, false)}
              onPress={() => analyze(selected, false)}
              loading={loadingId === selected.id}
            />
            <Button compact label="Listeye dön" variant="ghost" onPress={goBack} />
          </Card>
        </ScrollView>
      );
    }

    if (isSplitLayout) {
      return (
        <View style={styles.detailSplit}>
          <View style={styles.detailSplitCol}>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.analysisScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Card compact accent={colors.teal}>
                <View style={styles.analysisHeader}>
                  <SectionTitle compact>Sinastri yorumu</SectionTitle>
                  <Button
                    compact
                    label="Düzenle"
                    variant="ghost"
                    onPress={() => openEdit(selected)}
                  />
                </View>
                {analysisContent}
              </Card>
            </ScrollView>
          </View>
          <View style={styles.detailSplitCol}>
            <View style={styles.chatShell}>
              <Text style={styles.chatShellTitle}>
                Sohbet{messageCount > 0 ? ` · ${messageCount}` : ''}
              </Text>
              <View style={styles.chatShellBody}>{chatPanel}</View>
            </View>
          </View>
        </View>
      );
    }

    if (detailTab === 'analysis') {
      return (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.analysisScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <Card compact accent={colors.teal}>
            <View style={styles.analysisHeader}>
              <SectionTitle compact>Sinastri yorumu</SectionTitle>
              <Button
                compact
                label="Düzenle"
                variant="ghost"
                onPress={() => openEdit(selected)}
              />
            </View>
            {analysisContent}
          </Card>
          <Button
            compact
            label="Sohbete geç"
            onPress={() => setDetailTab('chat')}
          />
        </ScrollView>
      );
    }

    return (
      <View style={styles.chatShell}>
        <View style={styles.chatShellBody}>{chatPanel}</View>
      </View>
    );
  };

  const synastryDetailView = (
    <View style={[styles.detailScreen, { paddingHorizontal: gutter }]}>
      <View style={styles.detailChrome}>
        {selected ? (
          <Text style={styles.detailMetaLine} numberOfLines={2}>
            {detailMetaLine}
          </Text>
        ) : null}
        {selected?.analysis && !isSplitLayout ? (
          <View style={styles.detailTabs}>
            <Chip
              label="Yorum"
              active={detailTab === 'analysis'}
              onPress={() => setDetailTab('analysis')}
              compact
            />
            <Chip
              label={messageCount > 0 ? `Sohbet (${messageCount})` : 'Sohbet'}
              active={detailTab === 'chat'}
              onPress={() => setDetailTab('chat')}
              compact
            />
          </View>
        ) : null}
        <ErrorText>{error}</ErrorText>
      </View>

      <KeyboardAvoidingView
        style={styles.detailBody}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        {renderDetailBody()}
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <Screen>
      {inDetail ? (
        synastryDetailView
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
        >
          <ScreenScroll contentContainerStyle={tabScrollStyle()}>
          <HeaderRow
            compact
            eyebrow="İki harita · bir bağ"
            title="Sinastri"
            subtitle="Güneş–Ay karşılaştırması ve ilişki dinamiği"
            right={<TokenBadge compact balance={profile?.tokenBalance ?? 0} />}
          />

        <View style={styles.hubTabs}>
          <Chip
            label={`Partnerler (${partners.length})`}
            active={hubTab === 'partners'}
            onPress={() => setHubTab('partners')}
            compact
          />
          <Chip
            label={`Geçmiş (${historyPartners.length})`}
            active={hubTab === 'history'}
            onPress={() => setHubTab('history')}
            compact
          />
        </View>

        {hubTab === 'partners' ? (
          <>
        <Pressable onPress={() => { setEditingPartner(null); setShowForm(true); }}>
          <Card compact accent={colors.teal} style={styles.addCard}>
            <View style={styles.addRow}>
              <View style={styles.addIcon}>
                <Text style={styles.addIconGlyph}>☍</Text>
              </View>
              <View style={styles.addCopy}>
                <Text style={styles.addTitle}>Partner ekle</Text>
                <Text style={styles.addSubtitle}>
                  Doğum bilgisiyle iki haritayı yan yana oku
                </Text>
              </View>
              <View style={styles.addPlus}>
                <Text style={styles.addPlusText}>+</Text>
              </View>
            </View>
          </Card>
        </Pressable>

        <ErrorText>{error}</ErrorText>

        {partners.length === 0 ? (
          <EmptyState
            compact
            title="Sinastriye hazır"
            body="Partnerinin doğum bilgisini ekleyerek Güneş–Ay bağını ve ilişki yorumunu aç."
            glyph="☍"
          />
        ) : (
          <>
            <SectionTitle compact>
              Partnerlerim · {partners.length}
            </SectionTitle>
            <View style={styles.list}>
              {partners.map((p) => (
                <PartnerCard
                  key={p.id}
                  partner={p}
                  active={selectedId === p.id}
                  loading={loadingId === p.id}
                  isSubscribed={profile?.isSubscribed ?? false}
                  selfSun={natalChart?.sunSign}
                  selfMoon={natalChart?.moonSign}
                  onSelect={() => setSelectedId(p.id)}
                  onAnalyze={(force) => analyze(p, force)}
                  onEdit={() => openEdit(p)}
                  onOpenReading={() => openDetail(p.id, 'partners')}
                />
              ))}
            </View>
          </>
        )}

        {selected && !selected.analysis && hubTab === 'partners' ? (
            <Card compact style={styles.promptCard}>
              <SectionTitle compact>{selected.birth.name} için sinastri</SectionTitle>
              <Body muted style={styles.promptBody}>
                Partner kaydedildi. İki haritayı karşılaştırıp ilişki dinamiğini okumak için yorumu aç.
              </Body>
              <Button
                compact
                label={analyzeLabel(profile?.isSubscribed ?? false, false)}
                onPress={() => analyze(selected, false)}
                loading={loadingId === selected.id}
              />
              <Button
                compact
                label="Bilgileri düzenle"
                variant="ghost"
                onPress={() => openEdit(selected)}
              />
            </Card>
        ) : null}
          </>
        ) : historyPartners.length === 0 ? (
          <EmptyState
            compact
            title="Henüz sinastri geçmişi yok"
            body="Partner ekleyip sinastri yorumu aldığında yorumlar ve sohbetler burada listelenir."
            glyph="☍"
          />
        ) : (
          <>
            <ErrorText>{error}</ErrorText>
            <SectionTitle compact>Sinastri geçmişi · {historyPartners.length}</SectionTitle>
            <Body muted style={styles.historyHint}>
              Geçmiş yorumları açıp ilişki dinamiği hakkında sorular sorabilirsin.
            </Body>
            <View style={styles.list}>
              {historyPartners.map((p) => (
                <HistoryCard
                  key={p.id}
                  partner={p}
                  selfSun={natalChart?.sunSign}
                  selfMoon={natalChart?.moonSign}
                  onOpen={() => openDetail(p.id, 'history')}
                />
              ))}
            </View>
          </>
        )}
          </ScreenScroll>
        </KeyboardAvoidingView>
      )}

      <SheetModal
        visible={showForm || Boolean(editingPartner)}
        onClose={closePartnerSheet}
        title={editingPartner ? 'Partneri düzenle' : 'Yeni partner'}
        showClose={false}
      >
        <BirthForm
          key={editingPartner?.id ?? 'new-partner'}
          variant="partner"
          embedded
          compact
          initial={editingPartner?.birth}
          submitLabel={editingPartner ? 'Değişiklikleri kaydet' : 'Partneri kaydet'}
          onCancel={closePartnerSheet}
          onSubmit={editingPartner ? savePartnerEdit : addPartner}
        />
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  detailScreen: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  detailChrome: {
    flexShrink: 0,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  detailMetaLine: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  detailBody: {
    flex: 1,
    minHeight: 0,
    paddingTop: spacing.sm,
  },
  detailEmptyContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerBackBtn: {
    paddingHorizontal: 4,
  },
  headerRightPad: {
    paddingRight: 4,
  },
  detailTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailSplit: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailSplitCol: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  chatShell: {
    flex: 1,
    minHeight: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chatShellTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.text,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexShrink: 0,
  },
  chatShellBody: {
    flex: 1,
    minHeight: 0,
  },
  analysisScrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  analysisDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  addCard: {
    marginBottom: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  addIconGlyph: {
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.teal,
  },
  addCopy: { flex: 1, minWidth: 0 },
  addTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  addSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  addPlus: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlusText: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.teal,
    lineHeight: 20,
  },
  list: { gap: spacing.sm },
  cardActive: {
    backgroundColor: 'rgba(98, 189, 181, 0.06)',
  },
  partnerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    width: '100%',
  },
  partnerMain: { flex: 1, minWidth: 0, flexShrink: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
    width: '100%',
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
    minWidth: 0,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.bgHighlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: { marginTop: 2, gap: 4 },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  analysisHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  scoreNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.teal,
    marginBottom: spacing.xs,
  },
  promptCard: {
    backgroundColor: colors.bgSoft,
  },
  promptBody: { fontSize: 13, marginBottom: 8 },
  hubTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  detailLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  detailLoadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  backText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.teal,
  },
  historyCard: {
    gap: 8,
  },
  historyPreview: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 6,
  },
  historyHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
});
