import type { Conversation, DailyReading, Profile, SynastryResult } from '@asto/shared';
import { AI_API_URL, IS_PRODUCTION, isAiApiConfigured } from './config';

export class AiApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Kullanıcıya gösterilen AI bağlantı hatası (mağaza sürümü). */
export function aiApiUnavailableMessage(): string {
  if (!isAiApiConfigured()) {
    return IS_PRODUCTION
      ? 'Öngörü servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
      : 'AI sunucusu tanımlı değil. EXPO_PUBLIC_AI_API_URL veya yerel "npm run api" gerekir.';
  }
  if (IS_PRODUCTION) {
    return 'Öngörü servisine bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
  }
  return `AI sunucusuna bağlanılamadı (${AI_API_URL}). "npm run api" çalışıyor mu?`;
}

async function aiRequest<T>(
  path: string,
  options: RequestInit & { firebaseIdToken?: string | null; timeoutMs?: number } = {},
): Promise<T> {
  if (!isAiApiConfigured()) {
    throw new AiApiError(aiApiUnavailableMessage(), 0);
  }

  const { firebaseIdToken, headers, timeoutMs = 30_000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${AI_API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(firebaseIdToken ? { Authorization: `Bearer ${firebaseIdToken}` } : {}),
        ...(headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const serverError = (data as { error?: string }).error;
      if (IS_PRODUCTION) {
        throw new AiApiError(
          serverError && !serverError.includes('deploy')
            ? serverError
            : 'Öngörü alınamadı. Lütfen biraz sonra tekrar deneyin.',
          res.status,
        );
      }
      if (res.status === 404) {
        throw new AiApiError(
          'AI sunucusu bulunamadı (404). Önce: firebase login && npm run deploy:ai-api',
          res.status,
        );
      }
      throw new AiApiError(serverError || 'AI isteği başarısız', res.status);
    }
    return data as T;
  } catch (e) {
    if (e instanceof AiApiError) throw e;
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new AiApiError(
          IS_PRODUCTION
            ? 'İstek zaman aşımına uğradı. Tekrar deneyin.'
            : 'AI yanıtı zaman aşımına uğradı. Tekrar deneyin.',
          0,
        );
      }
      const msg = e.message.toLowerCase();
      if (msg.includes('fetch failed') || msg.includes('network request failed')) {
        throw new AiApiError(aiApiUnavailableMessage(), 0);
      }
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const AI_TIMEOUT_MS = 120_000;

/**
 * Production AI API — Cloud Functions + Gemini.
 * Tüm kullanıcılar aynı HTTPS endpoint'e bağlanır; kimlik Firebase ID token.
 */
export const aiApi = {
  health: () => aiRequest<{ ok: boolean; ai: boolean; model?: string }>('/health'),

  generateDailyReading: (firebaseIdToken: string, force = false) =>
    aiRequest<{
      reading: DailyReading;
      conversation: Conversation;
      cached: boolean;
      cost: number;
      today: string;
      profile: Profile;
    }>('/readings/daily', {
      method: 'POST',
      firebaseIdToken,
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ force }),
    }),

  chartNarrative: (firebaseIdToken: string, force = false) =>
    aiRequest<{ text: string; cost: number; profile: Profile; cached: boolean }>(
      '/readings/chart-narrative',
      {
        method: 'POST',
        firebaseIdToken,
        timeoutMs: AI_TIMEOUT_MS,
        body: JSON.stringify({ force }),
      },
    ),

  ask: (firebaseIdToken: string, question: string, conversationId?: string) =>
    aiRequest<{ conversation: Conversation; profile: Profile; cost: number }>(
      '/conversations/ask',
      {
        method: 'POST',
        firebaseIdToken,
        timeoutMs: AI_TIMEOUT_MS,
        body: JSON.stringify({ question, conversationId }),
      },
    ),

  analyzePartner: (firebaseIdToken: string, partnerId: string, force = false) =>
    aiRequest<{
      partner: import('@asto/shared').Partner;
      synastry: SynastryResult;
      conversation: Conversation | null;
      profile: Profile;
      cost: number;
      cached: boolean;
    }>(`/partners/${partnerId}/analyze`, {
      method: 'POST',
      firebaseIdToken,
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ force }),
    }),

  askPartner: (
    firebaseIdToken: string,
    partnerId: string,
    question: string,
    conversationId?: string,
  ) =>
    aiRequest<{ conversation: Conversation; profile: Profile; cost: number }>(
      `/partners/${partnerId}/ask`,
      {
        method: 'POST',
        firebaseIdToken,
        timeoutMs: AI_TIMEOUT_MS,
        body: JSON.stringify({ question, conversationId }),
      },
    ),
};
