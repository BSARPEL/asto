import type {
  Conversation,
  DailyReading,
  Partner,
  Profile,
  TokenLedgerEntry,
} from './types';
import type { RelationshipType } from './constants';

/**
 * Bump when collection shapes or required fields change.
 * v2 — Harmony funnel partner fields: relationshipType, analysisFocus,
 * previewSummary, fullUnlocked (+ existing synastry cache fields).
 */
export const FIRESTORE_SCHEMA_VERSION = 2;

export const FIRESTORE_DATABASE_ID = 'bnastro';

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  usersByEmail: 'users_by_email',
  sessions: 'sessions',
  partners: 'partners',
  conversations: 'conversations',
  readings: 'readings',
  ledger: 'ledger',
  adClaims: 'adClaims',
  meta: '_meta',
} as const;

export type FirestoreCollection = (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

/** Allowed `partners.relationshipType` values (rules + clients). */
export const PARTNER_RELATIONSHIP_TYPES = ['love', 'friendship', 'family', 'work'] as const satisfies readonly RelationshipType[];

/** Stored in `users/{userId}` — password never returned to clients. */
export interface FirestoreUserRecord extends Profile {
  passwordHash: string;
  updatedAt: string;
}

/** Legacy plain-text password field (migrated on next login). */
export interface FirestoreUserRecordLegacy extends Profile {
  password: string;
}

/** Stored in `users_by_email/{email}`. */
export interface FirestoreEmailIndexRecord {
  userId: string;
  createdAt: string;
}

/** Stored in `sessions/{token}`. */
export interface FirestoreSessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

/** Stored in `readings/{userId}_{date}`. */
export type FirestoreReadingRecord = DailyReading;

/**
 * Stored in `partners/{partnerId}`.
 *
 * Harmony funnel fields (v2):
 * - relationshipType: love | friendship | family | work
 * - analysisFocus: optional user focus question
 * - previewSummary: free teaser text
 * - fullUnlocked: true after IAP / tokens / Plus unlock
 */
export type FirestorePartnerRecord = Partner;

/** Stored in `conversations/{conversationId}`. */
export type FirestoreConversationRecord = Conversation;

/** Stored in `ledger/{entryId}`. */
export type FirestoreLedgerRecord = TokenLedgerEntry;

/** Stored in `adClaims/{userId}_{date}`. */
export interface FirestoreAdClaimRecord {
  userId: string;
  date: string;
  count: number;
}

/** Stored in `_meta/schema`. */
export interface FirestoreMetaSchemaRecord {
  schemaVersion: number;
  databaseId: string;
  collections: FirestoreCollection[];
  description: string;
  updatedAt: string;
  partnerFields?: Record<string, string>;
}

/** Field map written to `_meta/collections` for Console / agents. */
export const FIRESTORE_PARTNER_FIELDS: Record<string, string> = {
  id: 'string — document id',
  userId: 'string — owner uid (immutable after create)',
  birth: 'BirthInput — partner birth data',
  natalChart: 'ChartData — computed on device',
  relationshipType: 'love | friendship | family | work',
  analysisFocus: 'string? — optional focus question',
  synastryScore: 'number? — 0–100 AI/engine score',
  synastryScoreNote: 'string? — short score rationale',
  analysis: 'string? — full AI report (gated by fullUnlocked in app)',
  previewSummary: 'string? — free teaser (~280 chars)',
  analysisAt: 'ISO string? — last analysis time',
  conversationId: 'string? — synastry chat id',
  fullUnlocked: 'boolean? — full report purchased/unlocked',
  createdAt: 'ISO string',
};

export function readingDocId(userId: string, date: string): string {
  return `${userId}_${date}`;
}

export function adClaimDocId(userId: string, date: string): string {
  return `${userId}_${date}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
