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
 * 1. Google AI Studio (Gemini) — doğrudan mobil (varsayılan, EXPO_PUBLIC_GEMINI_API_KEY)
 * 2. HTTPS AI API — yedek (Cloud Functions / Express)
 * Firebase = yalnızca veri (profil, harita, jeton, önbellek)
 */

function geminiUnavailable(): never {
  throw new AiApiError(
    'AI yapılandırılmamış. EXPO_PUBLIC_GEMINI_API_KEY ekleyin (Google AI Studio).',
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
  // Mağaza sürümünde ölü Cloud Functions URL'sine düşme — Gemini zorunlu
  if (IS_PRODUCTION) geminiUnavailable();
  if (isAiApiConfigured()) return aiApi.generateDailyReading(_firebaseIdToken, force);
  geminiUnavailable();
}

export async function generateChartNarrative(_firebaseIdToken: string, force = false) {
  if (usesDirectGemini()) return directAi.directGenerateChartNarrative(force);
  if (IS_PRODUCTION) geminiUnavailable();
  if (isAiApiConfigured()) return aiApi.chartNarrative(_firebaseIdToken, force);
  geminiUnavailable();
}

export async function askDailyQuestion(
  _firebaseIdToken: string,
  question: string,
  conversationId?: string,
) {
  if (usesDirectGemini()) return directAi.directAskDailyQuestion(question, conversationId);
  if (IS_PRODUCTION) geminiUnavailable();
  if (isAiApiConfigured()) return aiApi.ask(_firebaseIdToken, question, conversationId);
  geminiUnavailable();
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
  if (!partner.conversationId) return { partner, conversation: null as Conversation | null };
  const conversation = await firebaseGetConversation(partner.conversationId, userId);
  return { partner, conversation };
}

export async function analyzePartner(_firebaseIdToken: string, partnerId: string, force = false) {
  if (usesDirectGemini()) return directAi.directAnalyzePartner(partnerId, force);
  if (IS_PRODUCTION) geminiUnavailable();
  if (isAiApiConfigured()) return aiApi.analyzePartner(_firebaseIdToken, partnerId, force);
  geminiUnavailable();
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
  if (IS_PRODUCTION) geminiUnavailable();
  if (isAiApiConfigured()) return aiApi.askPartner(_firebaseIdToken, partnerId, question, conversationId);
  geminiUnavailable();
}

export function mergeProfile(current: Profile | null, next: Profile): Profile {
  return next ?? current!;
}
