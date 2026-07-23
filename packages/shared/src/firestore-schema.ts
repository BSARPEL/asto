import type {
  Conversation,
  DailyReading,
  Partner,
  Profile,
  TokenLedgerEntry,
} from './types';

/** Bump when collection shapes or required fields change. */
export const FIRESTORE_SCHEMA_VERSION = 1;

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

/** Stored in `partners/{partnerId}`. */
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
}

export function readingDocId(userId: string, date: string): string {
  return `${userId}_${date}`;
}

export function adClaimDocId(userId: string, date: string): string {
  return `${userId}_${date}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
