/**
 * Gemini (Google AI Studio) — doğrudan mobil.
 * Firebase yalnızca veri; Cloud Functions gerekmez.
 */
import { getAuth } from 'firebase/auth';
import {
  TOKEN_COSTS,
  answerQuestion,
  answerSynastryQuestion,
  computeNatalChart,
  computeSynastry,
  generateChartNarrative,
  generateDailyReading,
  generateRelationshipAnalysis,
  type Conversation,
  type DailyReading,
  type Partner,
  type Profile,
} from '@asto/shared';
import { collection, doc } from 'firebase/firestore';
import { getGeminiRuntime } from './config';
import {
  firebaseAdjustTokens,
  firebaseGetConversation,
  firebaseGetPartner,
  firebaseGetReading,
  firebaseGetUserProfile,
  firebaseSaveConversation,
  firebaseSaveReading,
  firebaseUpdatePartnerFields,
  firebaseUpdateUserProfile,
} from './firebase-data';
import { getFirebaseDb } from './firebase';
import { localTodayKey, userTimezone } from './dates';

function newId(): string {
  return doc(collection(getFirebaseDb(), '_meta')).id;
}

async function requireProfile(): Promise<{ userId: string; profile: Profile }> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Oturum gerekli');
  const profile = await firebaseGetUserProfile(user.uid);
  if (!profile) throw new Error('Kullanıcı profili bulunamadı');
  if (!profile.natalChart) throw new Error('Önce doğum haritası kaydedin');
  return { userId: user.uid, profile };
}

async function ensureDailyConversation(
  userId: string,
  date: string,
  conversationId?: string,
): Promise<Conversation> {
  if (conversationId) {
    const existing = await firebaseGetConversation(conversationId, userId);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: newId(),
    userId,
    kind: 'daily',
    title: `Öngörü ${date}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  await firebaseSaveConversation(conv);
  return conv;
}

async function ensureSynastryConversation(
  userId: string,
  partnerId: string,
  partnerName: string,
  conversationId?: string,
): Promise<Conversation> {
  if (conversationId) {
    const existing = await firebaseGetConversation(conversationId, userId);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: newId(),
    userId,
    kind: 'synastry',
    partnerId,
    title: `Sinastri · ${partnerName}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  await firebaseSaveConversation(conv);
  return conv;
}

export async function directGenerateDailyReading(force = false) {
  const { userId, profile } = await requireProfile();
  const tz = userTimezone(profile.birth);
  const today = localTodayKey(tz);
  const existing = await firebaseGetReading(userId, today);

  if (existing && existing.date === today && !force) {
    const conv = await ensureDailyConversation(userId, today, existing.conversationId);
    return {
      reading: existing,
      conversation: conv,
      cached: true,
      cost: 0,
      today,
      profile,
    };
  }

  let cost = 0;
  let currentProfile = profile;
  if (existing && force && !profile.isSubscribed) {
    cost = TOKEN_COSTS.dailyReadingRefresh;
    currentProfile = await firebaseAdjustTokens(userId, -cost, 'daily_reading_refresh');
  }

  const runtime = getGeminiRuntime();
  const { summary, themes } = await generateDailyReading(
    profile.natalChart!,
    profile.displayName,
    runtime,
  );
  const conv = await ensureDailyConversation(userId, today);
  const reading: DailyReading = {
    id: newId(),
    userId,
    date: today,
    summary,
    themes,
    conversationId: conv.id,
    createdAt: new Date().toISOString(),
  };
  await firebaseSaveReading(reading);

  return {
    reading,
    conversation: conv,
    cached: false,
    cost,
    today,
    profile: currentProfile,
  };
}

export async function directGenerateChartNarrative(force = false) {
  const { userId, profile } = await requireProfile();

  if (profile.chartNarrative && !force) {
    return { text: profile.chartNarrative, profile, cost: 0, cached: true };
  }

  const cost = profile.isSubscribed ? 0 : TOKEN_COSTS.chartNarrative;
  if (cost > 0) await firebaseAdjustTokens(userId, -cost, 'chart_narrative');

  const text = await generateChartNarrative(
    profile.natalChart!,
    profile.displayName,
    getGeminiRuntime(),
  );
  const updated = await firebaseUpdateUserProfile(userId, { chartNarrative: text });
  return { text, profile: updated, cost, cached: false };
}

export async function directAskDailyQuestion(question: string, conversationId?: string) {
  const { userId, profile } = await requireProfile();
  const cost = profile.isSubscribed ? 0 : TOKEN_COSTS.askQuestion;
  if (cost > 0) await firebaseAdjustTokens(userId, -cost, 'ask_question');

  const tz = userTimezone(profile.birth);
  const today = localTodayKey(tz);
  const todayReading = await firebaseGetReading(userId, today);

  let conv: Conversation | null = conversationId
    ? await firebaseGetConversation(conversationId, userId)
    : null;
  if (!conv && todayReading?.conversationId) {
    conv = await firebaseGetConversation(todayReading.conversationId, userId);
  }
  if (!conv) {
    conv = await ensureDailyConversation(userId, today, todayReading?.conversationId);
    if (todayReading && !todayReading.conversationId) {
      await firebaseSaveReading({ ...todayReading, conversationId: conv.id });
    }
  }

  const now = new Date().toISOString();
  conv.messages.push({ id: newId(), role: 'user', content: question, createdAt: now });

  const answer = await answerQuestion(
    profile.natalChart!,
    question,
    conv.messages.map((m) => ({ role: m.role, content: m.content })),
    getGeminiRuntime(),
  );

  conv.messages.push({
    id: newId(),
    role: 'assistant',
    content: answer,
    createdAt: new Date().toISOString(),
  });
  conv.updatedAt = new Date().toISOString();
  await firebaseSaveConversation(conv);

  const updatedProfile = (await firebaseGetUserProfile(userId))!;
  return { conversation: conv, profile: updatedProfile, cost };
}

export async function directAnalyzePartner(partnerId: string, force = false) {
  const { userId, profile } = await requireProfile();
  const partner = await firebaseGetPartner(userId, partnerId);
  if (!partner) throw new Error('Partner bulunamadı');

  const selfChart = profile.birth ? computeNatalChart(profile.birth) : profile.natalChart!;
  const partnerChart = computeNatalChart(partner.birth);
  const synastry = computeSynastry(selfChart, partnerChart, {
    selfGender: profile.birth?.gender,
    partnerGender: partner.birth.gender,
  });

  if (partner.analysis && !force) {
    const conv = await ensureSynastryConversation(
      userId,
      partner.id,
      partner.birth.name,
      partner.conversationId,
    );
    if (!partner.conversationId || partner.conversationId !== conv.id) {
      const linked = await firebaseUpdatePartnerFields(userId, partner.id, {
        conversationId: conv.id,
      });
      return {
        partner: linked,
        synastry,
        conversation: conv,
        profile,
        cost: 0,
        cached: true,
      };
    }
    return {
      partner,
      synastry,
      conversation: conv,
      profile,
      cost: 0,
      cached: true,
    };
  }

  const result = await generateRelationshipAnalysis(
    profile.displayName,
    selfChart,
    partner.birth.name,
    partnerChart,
    synastry,
    getGeminiRuntime(),
    {
      selfGender: profile.birth?.gender,
      partnerGender: partner.birth.gender,
    },
  );

  if (!result.analysis?.trim()) {
    throw new Error('Sinastri yorumu üretilemedi. Lütfen tekrar dene.');
  }

  const conv = await ensureSynastryConversation(
    userId,
    partner.id,
    partner.birth.name,
    partner.conversationId,
  );

  const updated = await firebaseUpdatePartnerFields(userId, partner.id, {
    synastryScore: result.score,
    synastryScoreNote: result.scoreNote || undefined,
    analysis: result.analysis,
    analysisAt: new Date().toISOString(),
    conversationId: conv.id,
    natalChart: partnerChart,
  });

  // Charge after successful save so failed AI/save does not eat tokens
  const cost = profile.isSubscribed ? 0 : TOKEN_COSTS.relationshipAnalysis;
  let updatedProfile = profile;
  if (cost > 0) {
    updatedProfile = await firebaseAdjustTokens(userId, -cost, 'relationship_analysis');
  } else {
    updatedProfile = (await firebaseGetUserProfile(userId))!;
  }

  return {
    partner: updated,
    synastry,
    conversation: conv,
    profile: updatedProfile,
    cost,
    cached: false,
  };
}

/** Firestore'dan partner + sohbeti taze yükler; conversation yoksa oluşturur. */
export async function directLoadPartnerReading(partnerId: string) {
  const { userId, profile } = await requireProfile();
  const partner = await firebaseGetPartner(userId, partnerId);
  if (!partner) throw new Error('Partner bulunamadı');
  if (!partner.analysis) {
    return { partner, conversation: null as Conversation | null, profile };
  }

  const conv = await ensureSynastryConversation(
    userId,
    partner.id,
    partner.birth.name,
    partner.conversationId,
  );

  let fresh = partner;
  if (!partner.conversationId || partner.conversationId !== conv.id) {
    fresh = await firebaseUpdatePartnerFields(userId, partner.id, { conversationId: conv.id });
  }

  return { partner: fresh, conversation: conv, profile };
}

export async function directAskPartnerQuestion(
  partnerId: string,
  question: string,
  conversationId?: string,
) {
  const { userId, profile } = await requireProfile();
  const partner = await firebaseGetPartner(userId, partnerId);
  if (!partner?.analysis) throw new Error('Önce sinastri yorumu alın');

  let conv: Conversation | null = conversationId
    ? await firebaseGetConversation(conversationId, userId)
    : null;
  if (!conv && partner.conversationId) {
    conv = await firebaseGetConversation(partner.conversationId, userId);
  }
  if (!conv) {
    conv = await ensureSynastryConversation(
      userId,
      partner.id,
      partner.birth.name,
      partner.conversationId,
    );
    if (!partner.conversationId) {
      await firebaseUpdatePartnerFields(userId, partner.id, { conversationId: conv.id });
    }
  }

  const selfChart = profile.birth ? computeNatalChart(profile.birth) : profile.natalChart!;
  const partnerChart = computeNatalChart(partner.birth);
  const now = new Date().toISOString();
  const userMsg = { id: newId(), role: 'user' as const, content: question, createdAt: now };
  const historyForPrompt = [
    ...conv.messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: question },
  ];

  const answer = await answerSynastryQuestion(
    profile.displayName,
    selfChart,
    partner.birth.name,
    partnerChart,
    partner.analysis,
    partner.synastryScore,
    question,
    historyForPrompt,
    getGeminiRuntime(),
    {
      selfGender: profile.birth?.gender,
      partnerGender: partner.birth.gender,
      selfBirth: profile.birth,
      partnerBirth: partner.birth,
    },
  );

  conv.messages.push(userMsg);
  conv.messages.push({
    id: newId(),
    role: 'assistant',
    content: answer,
    createdAt: new Date().toISOString(),
  });
  conv.updatedAt = new Date().toISOString();
  await firebaseSaveConversation(conv);

  const cost = profile.isSubscribed ? 0 : TOKEN_COSTS.askQuestion;
  let updatedProfile = profile;
  if (cost > 0) {
    updatedProfile = await firebaseAdjustTokens(userId, -cost, 'synastry_ask');
  } else {
    updatedProfile = (await firebaseGetUserProfile(userId))!;
  }

  return { conversation: conv, profile: updatedProfile, cost };
}
