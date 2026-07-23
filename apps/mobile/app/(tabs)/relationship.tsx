import { useCallback, useEffect, useState } from 'react';
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
import { TOKEN_COSTS, formatBirthPlace } from '@asto/shared';
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
import { api } from '@/lib/api';
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

function PartnerCard({
  partner,
  active,
  loading,
  isSubscribed,
  onSelect,
  onAnalyze,
  onEdit,
}: {
  partner: Partner;
  active: boolean;
  loading: boolean;
  isSubscribed: boolean;
  onSelect: () => void;
  onAnalyze: (force: boolean) => void;
  onEdit: () => void;
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
            <Text style={styles.meta}>
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

export default function RelationshipScreen() {
  const { token, profile, setProfile } = useAuth();
  const { gutter } = useLayout();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await api.partners(token);
    setPartners(res.partners);
    setSelectedId((prev) => {
      if (prev && res.partners.some((p) => p.id === prev)) return prev;
      const withAnalysis = res.partners.find((p) => p.analysis);
      return withAnalysis?.id ?? res.partners[0]?.id ?? null;
    });
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => setError(e.message));
    }, [load]),
  );

  const selected = partners.find((p) => p.id === selectedId) ?? null;

  const loadConversation = useCallback(
    async (partnerId: string) => {
      if (!token) return;
      setLoadingConversation(true);
      setError(null);
      try {
        const res = await api.partnerConversation(token, partnerId);
        setConversation(res.conversation);
        setPartners((prev) => prev.map((p) => (p.id === res.partner.id ? res.partner : p)));
      } catch (e) {
        setError((e as Error).message);
        setConversation(null);
      } finally {
        setLoadingConversation(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (selected?.analysis) {
      loadConversation(selected.id);
    } else {
      setConversation(null);
      setQuestion('');
    }
  }, [selected?.id, selected?.analysis, loadConversation]);

  const analyze = async (partner: Partner, force = false) => {
    if (!token) return;
    setError(null);
    setLoadingId(partner.id);
    setSelectedId(partner.id);
    try {
      const res = await api.analyzePartner(token, partner.id, force);
      setProfile(res.profile);
      setPartners((prev) => prev.map((p) => (p.id === res.partner.id ? res.partner : p)));
      if (res.conversation) setConversation(res.conversation);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  const addPartner = async (birth: Parameters<typeof api.addPartner>[1]) => {
    if (!token) throw new Error('Oturum yok');
    const res = await api.addPartner(token, birth);
    setShowForm(false);
    await load();
    setSelectedId(res.partner.id);
  };

  const savePartnerEdit = async (birth: Parameters<typeof api.updatePartner>[2]) => {
    if (!token || !editingPartner) throw new Error('Oturum yok');
    const res = await api.updatePartner(token, editingPartner.id, birth);
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
    if (!token || !selected || !q) return;
    setAsking(true);
    setError(null);
    try {
      const res = await api.askPartner(token, selected.id, q, conversation?.id);
      setConversation(res.conversation);
      setProfile(res.profile);
      setQuestion('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(false);
    }
  };

  const inSynastryDetail = Boolean(selected?.analysis);

  const synastryDetailView = selected?.analysis ? (
    <View style={[styles.detailRoot, { paddingHorizontal: gutter }]}>
      <HeaderRow
        compact
        eyebrow="Sinastri"
        title={selected.birth.name}
        right={<TokenBadge compact balance={profile?.tokenBalance ?? 0} />}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.partnerStrip}
      >
        {partners.map((p) => (
          <Chip
            key={p.id}
            label={p.birth.name}
            active={selectedId === p.id}
            onPress={() => setSelectedId(p.id)}
            compact
          />
        ))}
        <Chip label="+ Partner" onPress={() => { setEditingPartner(null); setShowForm(true); }} compact />
      </ScrollView>

      <ErrorText>{error}</ErrorText>

      <View style={styles.splitPane}>
        <View style={styles.pane}>
          <Card compact accent={colors.teal} style={styles.paneCard}>
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
            <ScrollView
              style={styles.paneScroll}
              contentContainerStyle={styles.paneScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <AiMarkdown content={selected.analysis} compact />
            </ScrollView>
          </Card>
        </View>

        <View style={styles.pane}>
          <Card compact style={styles.paneCard}>
            <AiChatPanel
              messages={conversation?.messages ?? []}
              loading={loadingConversation}
              asking={asking}
              value={question}
              onChangeText={setQuestion}
              onSend={() => ask(question)}
              suggestions={SYNASTRY_SUGGESTIONS}
              onSuggestion={ask}
              placeholder="Sinastri hakkında mesaj yaz…"
              emptyTitle="Sinastri sohbeti"
              emptyBody={`${selected.birth.name} ile ilişkinize dair sorularını sor; geçmiş mesajlar kayıtlı kalır.`}
            />
          </Card>
        </View>
      </View>
    </View>
  ) : null;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
      {inSynastryDetail ? (
        synastryDetailView
      ) : (
      <ScreenScroll contentContainerStyle={tabScrollStyle()}>
        <HeaderRow
          compact
          eyebrow="Sinastri"
          title="İlişki"
          right={<TokenBadge compact balance={profile?.tokenBalance ?? 0} />}
        />

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
                />
              ))}
            </View>
          </>
        )}

        {selected && !selected.analysis ? (
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  partnerStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: spacing.sm,
  },
  splitPane: {
    flex: 1,
    minHeight: 0,
    gap: spacing.sm,
  },
  pane: {
    flex: 1,
    minHeight: 0,
  },
  paneCard: {
    flex: 1,
    marginBottom: 0,
    overflow: 'hidden',
  },
  paneScroll: {
    flex: 1,
    minHeight: 0,
  },
  paneScrollContent: {
    paddingBottom: spacing.sm,
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
  addCopy: { flex: 1 },
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
  },
  partnerMain: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
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
});
