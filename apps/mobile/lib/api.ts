import type {
  BirthInput,
  Conversation,
  DailyReading,
  Partner,
  Profile,
  SynastryResult,
} from '@asto/shared';
import { API_URL } from './config';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null; timeoutMs?: number } = {},
): Promise<T> {
  const { token, headers, timeoutMs = 30_000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(data.error || 'İstek başarısız', res.status);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new ApiError(
          'İstek zaman aşımına uğradı. AI yanıtı gecikmiş olabilir; tekrar deneyin.',
          0,
        );
      }
      const msg = e.message.toLowerCase();
      if (msg.includes('fetch failed') || msg.includes('network request failed')) {
        throw new ApiError(
          `Sunucuya bağlanılamadı (${API_URL}). Terminalde "npm run api" çalıştığından emin olun.`,
          0,
        );
      }
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const AI_TIMEOUT_MS = 120_000;

export const api = {
  health: () => request<{ ok: boolean; ai: boolean }>('/health'),

  register: (email: string, password: string, displayName: string) =>
    request<{ token: string; profile: Profile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; profile: Profile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<{
      profile: Profile;
      adClaimsToday: number;
      maxAdsPerDay: number;
      tokenCosts: Record<string, number>;
      products: Record<string, unknown>;
    }>('/me', { token }),

  saveBirth: (token: string, birth: BirthInput) =>
    request<{ profile: Profile }>('/me/birth', {
      method: 'PUT',
      token,
      body: JSON.stringify(birth),
    }),

  dailyReading: (token: string) =>
    request<{
      reading: DailyReading | null;
      conversation: Conversation | null;
      cached: boolean;
      today: string;
    }>('/readings/daily', { token }),

  fetchDailyReading: (token: string, force = false) =>
    request<{
      reading: DailyReading;
      conversation: Conversation;
      cached: boolean;
      cost: number;
      today: string;
      profile: Profile;
    }>('/readings/daily', {
      method: 'POST',
      token,
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ force }),
    }),

  chartNarrative: (token: string, force = false) =>
    request<{ text: string; cost: number; profile: Profile; cached: boolean }>(
      '/readings/chart-narrative',
      {
        method: 'POST',
        token,
        timeoutMs: AI_TIMEOUT_MS,
        body: JSON.stringify({ force }),
      },
    ),

  ask: (token: string, question: string, conversationId?: string) =>
    request<{ conversation: Conversation; profile: Profile; cost: number }>(
      '/conversations/ask',
      {
        method: 'POST',
        token,
        timeoutMs: AI_TIMEOUT_MS,
        body: JSON.stringify({ question, conversationId }),
      },
    ),

  conversations: (token: string) =>
    request<{ conversations: Conversation[] }>('/conversations', { token }),

  partners: (token: string) => request<{ partners: Partner[] }>('/partners', { token }),

  addPartner: (token: string, birth: BirthInput) =>
    request<{ partner: Partner }>('/partners', {
      method: 'POST',
      token,
      body: JSON.stringify(birth),
    }),

  updatePartner: (token: string, partnerId: string, birth: BirthInput) =>
    request<{ partner: Partner }>(`/partners/${partnerId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(birth),
    }),

  analyzePartner: (token: string, partnerId: string, force = false) =>
    request<{
      partner: Partner;
      synastry: SynastryResult;
      conversation: Conversation | null;
      profile: Profile;
      cost: number;
      cached: boolean;
    }>(`/partners/${partnerId}/analyze`, {
      method: 'POST',
      token,
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ force }),
    }),

  partnerConversation: (token: string, partnerId: string) =>
    request<{ partner: Partner; conversation: Conversation }>(`/partners/${partnerId}/conversation`, {
      token,
    }),

  askPartner: (token: string, partnerId: string, question: string, conversationId?: string) =>
    request<{ conversation: Conversation; profile: Profile; cost: number }>(
      `/partners/${partnerId}/ask`,
      {
        method: 'POST',
        token,
        timeoutMs: AI_TIMEOUT_MS,
        body: JSON.stringify({ question, conversationId }),
      },
    ),

  ledger: (token: string) => request<{ ledger: Array<{ id: string; delta: number; reason: string; createdAt: string }> }>('/tokens/ledger', { token }),

  rewardedAd: (token: string) =>
    request<{ profile: Profile; count: number; reward: number; maxPerDay: number }>(
      '/tokens/rewarded-ad',
      { method: 'POST', token },
    ),

  purchase: (token: string, productId: string) =>
    request<{ profile: Profile; granted: number | string }>('/tokens/purchase', {
      method: 'POST',
      token,
      body: JSON.stringify({ productId }),
    }),
};
