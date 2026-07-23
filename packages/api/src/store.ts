import type {
  Conversation,
  DailyReading,
  Partner,
  Profile,
  TokenLedgerEntry,
} from '@asto/shared';
import { isFirebaseConfigured } from './firebase';
import { firestoreStore } from './store-firestore';
import { jsonStore } from './store-json';

export type StoreBackend = 'json' | 'firestore';

export interface Store {
  reload(): Promise<void>;
  createUser(email: string, password: string, displayName: string): Promise<Profile>;
  authenticate(email: string, password: string): Promise<{ profile: Profile; token: string }>;
  userFromToken(token?: string | null): Promise<Profile | null>;
  getUser(id: string): Promise<(Profile & { passwordHash?: string; password?: string }) | null>;
  updateUser(id: string, patch: Partial<Profile>): Promise<Profile>;
  adjustTokens(userId: string, delta: number, reason: string): Promise<Profile>;
  getLedger(userId: string): Promise<TokenLedgerEntry[]>;
  getReading(userId: string, date: string): Promise<DailyReading | null>;
  saveReading(reading: DailyReading): Promise<void>;
  listPartners(userId: string): Promise<Partner[]>;
  savePartner(partner: Partner): Promise<void>;
  updatePartner(id: string, patch: Partial<Partner>): Promise<Partner>;
  getPartner(id: string, userId: string): Promise<Partner | null>;
  listConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string, userId: string): Promise<Conversation | null>;
  saveConversation(conv: Conversation): Promise<void>;
  deleteConversation(id: string, userId: string): Promise<void>;
  claimAdReward(userId: string): Promise<{ count: number; profile: Profile }>;
  getAdCount(userId: string): Promise<number>;
}

function wrapJsonStore(): Store {
  return {
    reload: async () => jsonStore.reload(),
    createUser: async (...args) => jsonStore.createUser(...args),
    authenticate: async (...args) => jsonStore.authenticate(...args),
    userFromToken: async (token) => jsonStore.userFromToken(token),
    getUser: async (id) => jsonStore.getUser(id),
    updateUser: async (...args) => jsonStore.updateUser(...args),
    adjustTokens: async (...args) => jsonStore.adjustTokens(...args),
    getLedger: async (userId) => jsonStore.getLedger(userId),
    getReading: async (...args) => jsonStore.getReading(...args),
    saveReading: async (reading) => jsonStore.saveReading(reading),
    listPartners: async (userId) => jsonStore.listPartners(userId),
    savePartner: async (partner) => jsonStore.savePartner(partner),
    updatePartner: async (...args) => jsonStore.updatePartner(...args),
    getPartner: async (...args) => jsonStore.getPartner(...args),
    listConversations: async (userId) => jsonStore.listConversations(userId),
    getConversation: async (...args) => jsonStore.getConversation(...args),
    saveConversation: async (conv) => jsonStore.saveConversation(conv),
    deleteConversation: async (...args) => jsonStore.deleteConversation(...args),
    claimAdReward: async (userId) => jsonStore.claimAdReward(userId),
    getAdCount: async (userId) => jsonStore.getAdCount(userId),
  };
}

function resolveBackend(): StoreBackend {
  const configured = (process.env.STORE_BACKEND || 'auto').toLowerCase();
  if (configured === 'json') return 'json';
  if (configured === 'firestore') return 'firestore';
  return isFirebaseConfigured() ? 'firestore' : 'json';
}

export const storeBackend: StoreBackend = resolveBackend();
export const store: Store = storeBackend === 'firestore' ? firestoreStore : wrapJsonStore();
