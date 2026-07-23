import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ConvergingOrbs } from '@/components/HarmonyOrbs';
import { FadeIn } from '@/components/motion';
import {
  clearAnalysisDraft,
  loadAnalysisDraft,
  saveAnalysisDraft,
  setSelectedPartnerId,
} from '@/lib/analysis-draft';
import * as aiService from '@/lib/ai-service';
import { useAuth } from '@/lib/auth';
import { brand, colors, fonts, spacing } from '@/constants/theme';

const CHECKLIST = [
  'Doğum haritaları hesaplanıyor',
  'Sinastri karşılaştırması yapılıyor',
  'İlişki ritmi çıkarılıyor',
];

export default function AnalysisLoadingScreen() {
  const { profile, token, setProfile } = useAuth();
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const started = useRef(false);
  const progress = Math.min(96, 18 + doneCount * 28);

  useEffect(() => {
    const id = setInterval(() => {
      setDoneCount((c) => (c < CHECKLIST.length ? c + 1 : c));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Wait for auth — do not mark started until session is ready (avoids one-shot fail).
    if (!profile?.id || !token) return;
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        if (!profile.natalChart) {
          router.replace('/(onboarding)/birth');
          return;
        }

        const draft = await loadAnalysisDraft();
        if (!draft.personB) throw new Error('İkinci kişi bilgisi eksik');
        if (!draft.relationshipType) {
          throw new Error('İlişki türü seçilmedi. Lütfen baştan devam et.');
        }

        let partnerId = draft.partnerId;
        let existing =
          partnerId != null
            ? (await aiService.listPartners(profile.id)).partners.find((p) => p.id === partnerId)
            : undefined;

        // Missing or deleted partner → create fresh (stale draft partnerId).
        if (!partnerId || !existing) {
          const { partner } = await aiService.addPartner(profile.id, draft.personB, {
            relationshipType: draft.relationshipType,
            analysisFocus: draft.focus,
            fullUnlocked: false,
          });
          partnerId = partner.id;
          existing = partner;
          await saveAnalysisDraft({ partnerId });
        } else {
          // Compare BEFORE writing meta — otherwise typeChanged is always false.
          const typeChanged =
            (existing.relationshipType || 'love') !== draft.relationshipType;
          const focusChanged =
            (existing.analysisFocus || '') !== (draft.focus?.trim() || '');

          await aiService.updatePartnerMeta(profile.id, partnerId, {
            relationshipType: draft.relationshipType,
            ...(draft.focus?.trim() ? { analysisFocus: draft.focus.trim() } : {}),
          });

          let profileNext = profile;
          if (existing.analysis) {
            if (typeChanged || focusChanged) {
              const res = await aiService.analyzePartner(token, partnerId, true);
              profileNext = res.profile;
            }
            setProfile(profileNext);
            await setSelectedPartnerId(partnerId);
            await clearAnalysisDraft();
            setDoneCount(CHECKLIST.length);
            await new Promise((r) => setTimeout(r, 700));
            router.replace({ pathname: '/(analysis)/reveal', params: { partnerId } });
            return;
          }
        }

        const res = await aiService.analyzePartner(token, partnerId, false);
        const profileNext = res.profile;

        setProfile(profileNext);
        await setSelectedPartnerId(partnerId);
        await clearAnalysisDraft();
        setDoneCount(CHECKLIST.length);
        await new Promise((r) => setTimeout(r, 700));
        router.replace({ pathname: '/(analysis)/reveal', params: { partnerId } });
      } catch (e) {
        started.current = false;
        setError((e as Error).message);
      }
    })();
  }, [profile, token, setProfile, retryTick]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1C1826', '#12101A', '#0C0A12']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <FadeIn from="up">
        <Text style={styles.brand}>BN Astro</Text>
      </FadeIn>
      <ConvergingOrbs size={150} />
      <Text style={styles.title}>Analiziniz hazırlanıyor</Text>
      <Text style={styles.sub}>
        Doğum haritaları karşılaştırılıyor ve ilişki içgörüleri hazırlanıyor.
      </Text>

      <View style={styles.list}>
        {CHECKLIST.map((label, i) => {
          const done = i < doneCount;
          const active = i === doneCount;
          return (
            <View key={label} style={styles.row}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                <Text style={styles.dotText}>{done ? '✓' : ''}</Text>
              </View>
              <Text style={[styles.item, done && styles.itemDone, active && styles.itemActive]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.progress}>İlerleme %{progress}</Text>
      <Text style={styles.trust}>
        Doğum bilgileriniz güvenle işlenir ve yalnızca analiz için kullanılır.
      </Text>

      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Text
            style={styles.retry}
            onPress={() => {
              started.current = false;
              setError(null);
              setDoneCount(0);
              setRetryTick((n) => n + 1);
            }}
          >
            Tekrar dene
          </Text>
          <Text
            style={styles.retrySecondary}
            onPress={() => {
              started.current = false;
              setError(null);
              router.replace('/(analysis)/type');
            }}
          >
            Baştan seç
          </Text>
          <Text
            style={styles.retrySecondary}
            onPress={() => {
              started.current = false;
              setError(null);
              router.replace('/(analysis)/person-b');
            }}
          >
            Bilgilere dön
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: '#0C0A12',
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(241,237,229,0.7)',
    marginBottom: spacing.md,
  },
  title: {
    marginTop: spacing.lg,
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.nightCardText,
    textAlign: 'center',
  },
  sub: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(241,237,229,0.68)',
    textAlign: 'center',
    maxWidth: 300,
  },
  list: { marginTop: spacing.xl, gap: 12, alignSelf: 'stretch', maxWidth: 320 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(241,237,229,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: brand.harmonyRose, borderColor: brand.harmonyRose },
  dotActive: { borderColor: colors.accent },
  dotText: { color: '#0C0A12', fontSize: 12, fontFamily: fonts.bodySemi },
  item: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(241,237,229,0.45)' },
  itemDone: { color: 'rgba(241,237,229,0.88)' },
  itemActive: { color: colors.nightCardText },
  progress: {
    marginTop: spacing.xl,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(241,237,229,0.55)',
  },
  trust: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(241,237,229,0.4)',
    textAlign: 'center',
    maxWidth: 280,
  },
  error: {
    marginTop: spacing.md,
    color: '#E8A0A0',
    textAlign: 'center',
    fontFamily: fonts.body,
  },
  retry: {
    marginTop: spacing.sm,
    color: colors.accent,
    fontFamily: fonts.bodySemi,
  },
  retrySecondary: {
    marginTop: spacing.xs,
    color: 'rgba(241,237,229,0.55)',
    fontFamily: fonts.bodySemi,
  },
});
