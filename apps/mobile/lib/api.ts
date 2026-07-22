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
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
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
}

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
    request<{ reading: DailyReading; cached: boolean }>('/readings/daily', { token }),

  chartNarrative: (token: string) =>
    request<{ text: string; cost: number; profile: Profile }>('/readings/chart-narrative', {
      method: 'POST',
      token,
    }),

  ask: (token: string, question: string, conversationId?: string) =>
    request<{ conversation: Conversation; profile: Profile; cost: number }>(
      '/conversations/ask',
      {
        method: 'POST',
        token,
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

  analyzePartner: (token: string, partnerId: string) =>
    request<{
      partner: Partner;
      synastry: SynastryResult;
      profile: Profile;
      cost: number;
    }>(`/partners/${partnerId}/analyze`, { method: 'POST', token }),

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
