import type { BirthInput, Conversation, DailyReading, Partner, Profile } from '@asto/shared';
import { aiApi, aiApiUnavailableMessage, AiApiError } from './ai-api';
import { isAiApiConfigured } from './config';
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
 * Uygulama servis katmanı — Firebase veri + AI üretimini birleştirir.
 *
 * | İşlem              | Katman    |
 * |--------------------|-----------|
 * | Oturum, profil     | Firebase  |
 * | Harita, partner    | Firebase  |
 * | Önbellek okuma     | Firebase  |
 * | Jeton, reklam      | Firebase  |
 * | Öngörü, soru, AI   | AI API    |
 */

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

export async function generateDailyReading(firebaseIdToken: string, force = false) {
  if (!isAiApiConfigured()) throw new AiApiError(aiApiUnavailableMessage(), 0);
  return aiApi.generateDailyReading(firebaseIdToken, force);
}

export async function generateChartNarrative(firebaseIdToken: string, force = false) {
  if (!isAiApiConfigured()) throw new AiApiError(aiApiUnavailableMessage(), 0);
  return aiApi.chartNarrative(firebaseIdToken, force);
}

export async function askDailyQuestion(
  firebaseIdToken: string,
  question: string,
  conversationId?: string,
) {
  if (!isAiApiConfigured()) throw new AiApiError(aiApiUnavailableMessage(), 0);
  return aiApi.ask(firebaseIdToken, question, conversationId);
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

export async function analyzePartner(firebaseIdToken: string, partnerId: string, force = false) {
  if (!isAiApiConfigured()) throw new AiApiError(aiApiUnavailableMessage(), 0);
  return aiApi.analyzePartner(firebaseIdToken, partnerId, force);
}

export async function askPartnerQuestion(
  firebaseIdToken: string,
  partnerId: string,
  question: string,
  conversationId?: string,
) {
  if (!isAiApiConfigured()) throw new AiApiError(aiApiUnavailableMessage(), 0);
  return aiApi.askPartner(firebaseIdToken, partnerId, question, conversationId);
}

/** Profil güncellemesi — AI yanıtından sonra */
export function mergeProfile(current: Profile | null, next: Profile): Profile {
  return next ?? current!;
}
