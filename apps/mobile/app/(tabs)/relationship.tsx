import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TOKEN_COSTS, formatBirthPlace, type BirthInput } from '@asto/shared';
import type { Conversation, Partner } from '@asto/shared';
import { AiChatPanel } from '@/components/AiChatPanel';
import { AiMarkdown } from '@/components/AiMarkdown';
import { BirthForm } from '@/components/BirthForm';
import { AstroGlyph } from '@/components/AstroGlyph';
import {
  Avatar,
  Body,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorText,
  HeaderRow,
  ResponsiveSplit,
  Screen,
  ScreenScroll,
  ScoreBadge,
  ScoreBar,
  SectionTitle,
  SheetModal,
  TokenBadge,
  tabScrollStyle,
  useLayout,
} from '@/components/ui';
import { signColor } from '@/constants/astro';
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
  onSelect,
  onAnalyze,
  onEdit,
  onOpenReading,
}: {
  partner: Partner;
  active: boolean;
  loading: boolean;
  isSubscribed: boolean;
  onSelect: () => void;
  onAnalyze: (force: boolean) => void;
  onEdit: () => void;
  onOpenReading: () => void;
}) {
  const sunC = signColor(partner.natalChart.sunSign);
  const moonC = signColor(partner.natalChart.moonSign);
  const hasAnalysis = Boolean(partner.analysis);

  return (
    <Pressable onPress={onSelect}>
      <Card compact elevated={active} accent={active ? colors.teal : undefined} style={active ? styles.cardActive : undefined}>
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
            <View style={styles.signRow}>
              <View style={styles.signItem}>
                <AstroGlyph planetKey="Sun" size="sm" color={sunC} />
                <Text style={[styles.signText, { color: sunC }]}>{partner.natalChart.sunSign}</Text>
              </View>
              <View style={styles.signItem}>
                <AstroGlyph planetKey="Moon" size="sm" color={moonC} />
                <Text style={[styles.signText, { color: moonC }]}>{partner.natalChart.moonSign}</Text>
              </View>
            </View>
            {partner.synastryScore != null ? (
              <ScoreBar score={partner.synastryScore} compact />
            ) : (
              <Text style={styles.hint}>Henüz sinastri analizi yok</Text>
            )}
          </View>
          {partner.synastryScore != null ? (
            <ScoreBadge score={partner.synastryScore} compact />
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Yeni</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {hasAnalysis ? (
            <Button
              compact
              label="Yorumu ve sohbeti aç"
              onPress={onOpenReading}
              variant="primary"
              icon="◉"
            />
          ) : null}
          <Button
            compact
            label={analyzeLabel(isSubscribed, hasAnalysis)}
            onPress={() => onAnalyze(hasAnalysis)}
            loading={loading}
            variant={hasAnalysis ? 'ghost' : 'primary'}
            icon="◎"
          />
          <Button compact label="Düzenle" variant="ghost" onPress={onEdit} icon="✎" />
        </View>
      </Card>
    </Pressable>
  );
}

function HistoryCard({ partner, onOpen }: { partner: Partner; onOpen: () => void }) {
  const sunC = signColor(partner.natalChart.sunSign);
  const moonC = signColor(partner.natalChart.moonSign);
  const dateLabel = formatHistoryDate(partner.analysisAt ?? partner.createdAt);
  const preview = analysisPreview(partner.analysis);

  return (
    <Pressable onPress={onOpen}>
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
            <View style={styles.signRow}>
              <View style={styles.signItem}>
                <AstroGlyph planetKey="Sun" size="sm" color={sunC} />
                <Text style={[styles.signText, { color: sunC }]}>{partner.natalChart.sunSign}</Text>
              </View>
              <View style={styles.signItem}>
                <AstroGlyph planetKey="Moon" size="sm" color={moonC} />
                <Text style={[styles.signText, { color: moonC }]}>{partner.natalChart.moonSign}</Text>
              </View>
            </View>
            {partner.synastryScore != null ? (
              <ScoreBar score={partner.synastryScore} compact />
            ) : null}
            {preview ? (
              <Text style={styles.historyPreview} numberOfLines={3}>
                {preview}
                {partner.analysis && partner.analysis.length > preview.length ? '…' : ''}
              </Text>
            ) : null}
          </View>
          {partner.synastryScore != null ? (
            <ScoreBadge score={partner.synastryScore} compact />
          ) : null}
        </View>
        <Button compact label="Yorumu ve sohbeti aç" onPress={onOpen} icon="◉" />
      </Card>
    </Pressable>
  );
}

export default function RelationshipScreen() {
  const { token, profile, setProfile } = useAuth();
  const { isSplitLayout, gutter } = useLayout();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'hub' | 'detail'>('hub');
  const [hubTab, setHubTab] = useState<'partners' | 'history'>('partners');
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
    setView('detail');
  };

  const goBack = () => {
    setView('hub');
    setQuestion('');
  };

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => setError(e.message));
    }, [load]),
  );

  const selected = partners.find((p) => p.id === selectedId) ?? null;

  // Sohbet yalnızca detay ekranında ve partner değişince yüklenir
  useEffect(() => {
    if (view !== 'detail' || !selectedId || !profile?.id) {
      if (view !== 'detail') {
        setConversation(null);
        setQuestion('');
      }
      return;
    }

    const partner = partnersRef.current.find((p) => p.id === selectedId);
    if (!partner?.analysis) {
      setConversation(null);
      setQuestion('');
      return;
    }

    let cancelled = false;
    setLoadingConversation(true);
    setError(null);

    aiService
      .loadPartnerConversation(profile.id, partner)
      .then((res) => {
        if (cancelled) return;
        setConversation(res.conversation);
        setPartners((prev) => prev.map((p) => (p.id === res.partner.id ? res.partner : p)));
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

  const inDetail = view === 'detail' && Boolean(selected?.analysis);

  const analysisCard = selected?.analysis ? (
    <Card compact accent={colors.teal} style={styles.analysisCard}>
      <View style={styles.analysisHeader}>
        <SectionTitle compact>Sinastri yorumu</SectionTitle>
        <View style={styles.analysisHeaderRight}>
          {selected.synastryScore != null ? (
            <Chip label={`${selected.synastryScore}/100`} active compact />
          ) : null}
          <Button
            compact
            label="Düzenle"
            variant="ghost"
            onPress={() => openEdit(selected)}
            icon="✎"
          />
        </View>
      </View>
      {selected.synastryScoreNote ? (
        <Text style={styles.scoreNote}>{selected.synastryScoreNote}</Text>
      ) : null}
      <AiMarkdown content={selected.analysis} compact />
      <Button
        compact
        label={analyzeLabel(profile?.isSubscribed ?? false, true)}
        onPress={() => analyze(selected, true)}
        loading={loadingId === selected.id}
        variant="ghost"
        icon="◎"
      />
    </Card>
  ) : null;

  const chatCard = selected ? (
    <Card compact style={styles.chatCard}>
      <SectionTitle compact>Sinastri sohbeti</SectionTitle>
      <View style={isSplitLayout ? styles.chatHostWide : styles.chatHostPhone}>
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
          emptyBody={`${selected.birth.name} ile ilişkinize dair sorularını sor. Doğum bilgileriniz, partner bilgileri ve sinastri yorumu sohbete dahil edilir.`}
        />
      </View>
    </Card>
  ) : null;

  const synastryDetailView = selected?.analysis ? (
    <View style={[styles.detailRoot, { paddingHorizontal: gutter }]}>
      <Pressable onPress={goBack} style={styles.backRow}>
        <Text style={styles.backText}>← Geri</Text>
      </Pressable>

      <HeaderRow
        compact
        eyebrow="Sinastri geçmişi"
        title={selected.birth.name}
        subtitle={`${selected.birth.birthDate} · ${formatBirthPlace(selected.birth)}`}
        right={<TokenBadge compact balance={profile?.tokenBalance ?? 0} />}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.partnerStrip}
        keyboardShouldPersistTaps="handled"
      >
        {partners.map((p) => (
          <Chip
            key={p.id}
            label={p.birth.name}
            active={selectedId === p.id}
            onPress={() => {
              setSelectedId(p.id);
              if (!p.analysis) setView('hub');
            }}
            compact
          />
        ))}
        <Chip
          label="+ Partner"
          onPress={() => {
            goBack();
            setEditingPartner(null);
            setShowForm(true);
          }}
          compact
        />
      </ScrollView>

      <ErrorText>{error}</ErrorText>

      {isSplitLayout ? (
        <ResponsiveSplit
          leading={
            <ScrollView
              style={styles.analysisScrollWide}
              contentContainerStyle={styles.analysisScrollContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {analysisCard}
            </ScrollView>
          }
          trailing={chatCard}
        />
      ) : (
        <View style={styles.detailBody}>
          <ScrollView
            style={styles.analysisScrollPhone}
            contentContainerStyle={styles.analysisScrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {analysisCard}
          </ScrollView>
          {chatCard}
        </View>
      )}
    </View>
  ) : null;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {inDetail ? synastryDetailView : (
          <ScreenScroll contentContainerStyle={tabScrollStyle()}>
        <HeaderRow
          compact
          eyebrow="Sinastri"
          title="İlişki"
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
                <Text style={styles.addIconGlyph}>◎</Text>
              </View>
              <View style={styles.addCopy}>
                <Text style={styles.addTitle}>Partner ekle</Text>
                <Text style={styles.addSubtitle}>
                  Doğum bilgisiyle sinastri skoru ve AI ilişki yorumu al
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
            title="Henüz partner yok"
            body="Yukarıdaki karttan partner ekleyerek sinastri analizine başla."
            glyph="◎"
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
              <SectionTitle compact>{selected.birth.name} için analiz</SectionTitle>
              <Body muted style={styles.promptBody}>
                Partner kaydedildi. Sinastri yorumunu almak için karttaki butona dokun.
              </Body>
              <Button
                compact
                label={analyzeLabel(profile?.isSubscribed ?? false, false)}
                onPress={() => analyze(selected, false)}
                loading={loadingId === selected.id}
                icon="◎"
              />
              <Button
                compact
                label="Bilgileri düzenle"
                variant="ghost"
                onPress={() => openEdit(selected)}
                icon="✎"
              />
            </Card>
        ) : null}
          </>
        ) : historyPartners.length === 0 ? (
          <EmptyState
            compact
            title="Henüz sinastri geçmişi yok"
            body="Partner ekleyip sinastri yorumu aldığında yorumlar ve sohbetler burada listelenir."
            glyph="◎"
          />
        ) : (
          <>
            <ErrorText>{error}</ErrorText>
            <SectionTitle compact>Sinastri geçmişi · {historyPartners.length}</SectionTitle>
            <Body muted style={styles.historyHint}>
              Geçmiş yorumları açıp AI ile sohbet edebilirsin; doğum bilgilerin ve partner verileri
              sohbete otomatik eklenir.
            </Body>
            <View style={styles.list}>
              {historyPartners.map((p) => (
                <HistoryCard key={p.id} partner={p} onOpen={() => openDetail(p.id, 'history')} />
              ))}
            </View>
          </>
        )}
          </ScreenScroll>
        )}
      </KeyboardAvoidingView>

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
  detailRoot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    paddingBottom: spacing.sm,
  },
  detailBody: {
    flex: 1,
    minHeight: 0,
    gap: spacing.sm,
  },
  analysisScrollPhone: {
    maxHeight: 220,
    marginBottom: spacing.sm,
  },
  analysisScrollWide: {
    flex: 1,
    minHeight: 0,
    marginBottom: spacing.sm,
  },
  analysisScrollContent: {
    paddingBottom: spacing.xs,
  },
  partnerStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  analysisCard: {
    marginBottom: spacing.sm,
  },
  chatCard: {
    flex: 1,
    minHeight: 320,
    marginBottom: spacing.sm,
  },
  chatHostPhone: {
    flex: 1,
    minHeight: 300,
    marginTop: spacing.xs,
  },
  chatHostWide: {
    flex: 1,
    minHeight: 360,
    marginTop: spacing.xs,
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
    borderColor: 'rgba(61, 154, 148, 0.25)',
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
    backgroundColor: 'rgba(61, 154, 148, 0.04)',
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
    marginBottom: 6,
  },
  signRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  signItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 4,
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
  actions: { marginTop: 2, gap: 6 },
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
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
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
    marginTop: 4,
  },
  historyHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
});
