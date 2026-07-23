import { nanoid } from 'nanoid';
import type { Conversation } from '@asto/shared';
import { store } from '../store';

export async function ensureDailyConversation(
  userId: string,
  date: string,
  conversationId?: string,
): Promise<Conversation> {
  if (conversationId) {
    const existing = await store.getConversation(conversationId, userId);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: nanoid(),
    userId,
    kind: 'daily',
    title: `Öngörü ${date}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  await store.saveConversation(conv);
  return conv;
}

export async function ensureSynastryConversation(
  userId: string,
  partnerId: string,
  partnerName: string,
  conversationId?: string,
): Promise<Conversation> {
  if (conversationId) {
    const existing = await store.getConversation(conversationId, userId);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: nanoid(),
    userId,
    kind: 'synastry',
    partnerId,
    title: `Sinastri · ${partnerName}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  await store.saveConversation(conv);
  return conv;
}

export async function partnerConversationFor(
  userId: string,
  partner: { id: string; birth: { name: string }; conversationId?: string; analysis?: string },
): Promise<Conversation | null> {
  if (!partner.analysis) return null;
  const conv = await ensureSynastryConversation(
    userId,
    partner.id,
    partner.birth.name,
    partner.conversationId,
  );
  if (!partner.conversationId) {
    await store.updatePartner(partner.id, { conversationId: conv.id });
  }
  return conv;
}

export function stripUser<T extends { password?: string; passwordHash?: string; updatedAt?: string }>(
  user: T,
): Omit<T, 'password' | 'passwordHash' | 'updatedAt'> {
  const { password: _, passwordHash: __, updatedAt: ___, ...rest } = user;
  return rest;
}
