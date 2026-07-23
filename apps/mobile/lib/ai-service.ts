import type { BirthInput, Conversation, DailyReading, Partner, Profile } from '@asto/shared';
import { aiApi, aiApiUnavailableMessage, AiApiError } from './ai-api';
import * as directAi from './ai-direct';
import { IS_PRODUCTION, isAiApiConfigured, usesDirectGemini } from './config';
import {
  firebaseAddPartner,
  firebaseGetConversation,
  firebaseGetReading,
  firebaseListPartners,
  firebaseUpdatePartner,
} from './firebase-data';
import { localTodayKey } from './dates';

export { AiApiError, aiApiUnavailableMessage };

/**
 * AI katmanı:
 * 1. Doğrudan Gemini — EXPO_PUBLIC_GEMINI_API_KEY (yerel .env, gitignore)
 * 2. HTTPS AI API — Cloud Functions (deploy:ai-api)
 */

function aiUnavailable(): never {
  throw new AiApiError(
    IS_PRODUCTION
      ? 'AI yapılandırılmamış. EXPO_PUBLIC_AI_API_URL gerekli — npm run deploy:ai-api'
      : 'AI yapılandırılmamış. Yerel: npm run api veya EXPO_PUBLIC_GEMINI_API_KEY (git\'e commit etmeyin).',
    0,
  );
}

export async function loadCachedDailyReading(
  userId: string,
  tz: string,
): Promise<{
  reading: DailyReading | null;
  conversation: Conversation | null;
  cached: boolean;
  today: string;
}> {
  const today = localTodayKey(tz);
  const reading = await firebaseGetReading(userId, today);
  if (!reading || reading.date !== today) {
    return { reading: null, conversation: null, cached: false, today };
  }
  const conversation = reading.conversationId
    ? await firebaseGetConversation(reading.conversationId, userId)
    : null;
  return { reading, conversation, cached: true, today };
}

export async function generateDailyReading(_firebaseIdToken: string, force = false) {
  if (usesDirectGemini()) return directAi.directGenerateDailyReading(force);
  if (isAiApiConfigured()) return aiApi.generateDailyReading(_firebaseIdToken, force);
  aiUnavailable();
}

export async function generateChartNarrative(_firebaseIdToken: string, force = false) {
  if (usesDirectGemini()) return directAi.directGenerateChartNarrative(force);
  if (isAiApiConfigured()) return aiApi.chartNarrative(_firebaseIdToken, force);
  aiUnavailable();
}

export async function askDailyQuestion(
  _firebaseIdToken: string,
  question: string,
  conversationId?: string,
) {
  if (usesDirectGemini()) return directAi.directAskDailyQuestion(question, conversationId);
  if (isAiApiConfigured()) return aiApi.ask(_firebaseIdToken, question, conversationId);
  aiUnavailable();
}

export async function listPartners(userId: string) {
  const partners = await firebaseListPartners(userId);
  return { partners };
}

export async function addPartner(userId: string, birth: BirthInput) {
  const partner = await firebaseAddPartner(userId, birth);
  return { partner };
}

export async function updatePartner(userId: string, partnerId: string, birth: BirthInput) {
  const partner = await firebaseUpdatePartner(userId, partnerId, birth);
  return { partner };
}

export async function loadPartnerConversation(userId: string, partner: Partner) {
  if (usesDirectGemini()) {
    return directAi.directLoadPartnerReading(partner.id);
  }
  // Offline-friendly fallback: list path already has partner; only fetch conversation
  if (!partner.conversationId) return { partner, conversation: null as Conversation | null };
  const conversation = await firebaseGetConversation(partner.conversationId, userId);
  return { partner, conversation };
}

export async function analyzePartner(_firebaseIdToken: string, partnerId: string, force = false) {
  if (usesDirectGemini()) return directAi.directAnalyzePartner(partnerId, force);
  if (isAiApiConfigured()) return aiApi.analyzePartner(_firebaseIdToken, partnerId, force);
  aiUnavailable();
}

export async function askPartnerQuestion(
  _firebaseIdToken: string,
  partnerId: string,
  question: string,
  conversationId?: string,
) {
  if (usesDirectGemini()) {
    return directAi.directAskPartnerQuestion(partnerId, question, conversationId);
  }
  if (isAiApiConfigured()) return aiApi.askPartner(_firebaseIdToken, partnerId, question, conversationId);
  aiUnavailable();
}

export function mergeProfile(current: Profile | null, next: Profile): Profile {
  return next ?? current!;
}
