import type { BirthInput, Conversation, DailyReading, Partner, Profile } from '@asto/shared';
import { AiApiError } from './ai-api';
import * as directAi from './ai-direct';
import { usesDirectGemini } from './config';
import {
  firebaseAddPartner,
  firebaseGetConversation,
  firebaseGetReading,
  firebaseListPartners,
  firebaseUpdatePartner,
} from './firebase-data';
import { localTodayKey } from './dates';

export { AiApiError };

export function aiApiUnavailableMessage(): string {
  return 'AI yapılandırılmamış. apps/mobile/.env içinde EXPO_PUBLIC_GEMINI_API_KEY gerekli (git\'e commit etmeyin).';
}

/**
 * AI katmanı: doğrudan Google Gemini (Cloud Functions / astoApi yok).
 */

function aiUnavailable(): never {
  throw new AiApiError(aiApiUnavailableMessage(), 0);
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
  if (!usesDirectGemini()) aiUnavailable();
  return directAi.directGenerateDailyReading(force);
}

export async function generateChartNarrative(_firebaseIdToken: string, force = false) {
  if (!usesDirectGemini()) aiUnavailable();
  return directAi.directGenerateChartNarrative(force);
}

export async function generateSoulmateReading(_firebaseIdToken: string, force = false) {
  if (!usesDirectGemini()) aiUnavailable();
  return directAi.directGenerateSoulmateReading(force);
}

export async function askDailyQuestion(
  _firebaseIdToken: string,
  question: string,
  conversationId?: string,
) {
  if (!usesDirectGemini()) aiUnavailable();
  return directAi.directAskDailyQuestion(question, conversationId);
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
  if (!partner.conversationId) return { partner, conversation: null as Conversation | null };
  const conversation = await firebaseGetConversation(partner.conversationId, userId);
  return { partner, conversation };
}

export async function analyzePartner(_firebaseIdToken: string, partnerId: string, force = false) {
  if (!usesDirectGemini()) aiUnavailable();
  return directAi.directAnalyzePartner(partnerId, force);
}

export async function askPartnerQuestion(
  _firebaseIdToken: string,
  partnerId: string,
  question: string,
  conversationId?: string,
) {
  if (!usesDirectGemini()) aiUnavailable();
  return directAi.directAskPartnerQuestion(partnerId, question, conversationId);
}

export function mergeProfile(current: Profile | null, next: Profile): Profile {
  return next ?? current!;
}
