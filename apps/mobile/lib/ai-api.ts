import type { Conversation, DailyReading, Profile, SynastryResult } from '@asto/shared';
import { AI_API_URL, IS_PRODUCTION, isAiApiConfigured } from './config';

export class AiApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** AI sunucusu (Gemini proxy) yapılandırılmamış. */
export function aiApiUnavailableMessage(): string {
  if (!isAiApiConfigured()) {
    return IS_PRODUCTION
      ? 'AI sunucusu henüz aktif değil. Yönetici Cloud Functions deploy etmeli (npm run deploy:ai-api).'
      : 'AI sunucusu tanımlı değil. EXPO_PUBLIC_AI_API_URL veya yerel "npm run api" gerekir.';
  }
  if (IS_PRODUCTION) {
    return 'AI sunucusuna bağlanılamadı. İnternet bağlantınızı kontrol edin.';
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
      throw new AiApiError((data as { error?: string }).error || 'AI isteği başarısız', res.status);
    }
    return data as T;
  } catch (e) {
    if (e instanceof AiApiError) throw e;
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new AiApiError('AI yanıtı zaman aşımına uğradı. Tekrar deneyin.', 0);
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
 * Gemini AI sunucusu — yalnızca üretim uçları.
 * Veri okuma/yazma Firebase'de (lib/firebase-data.ts).
 * Kimlik: Firebase Auth ID token (Firestore oturumu ile aynı).
 */
export const aiApi = {
  health: () => aiRequest<{ ok: boolean; ai: boolean; model?: string }>('/health'),

  /** Günlük öngörü üret (Gemini) — sonuç Firestore'a sunucu yazar */
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

  /** Natal harita AI yorumu */
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

  /** Günlük sohbet sorusu */
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

  /** Sinastri analizi (Gemini) */
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

  /** Partner sinastri sohbeti */
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
