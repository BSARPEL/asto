import { FieldValue, type Transaction } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { nanoid } from 'nanoid';
import {
  FIRESTORE_COLLECTIONS,
  adClaimDocId,
  normalizeEmail,
  readingDocId,
  type Conversation,
  type DailyReading,
  type FirestoreAdClaimRecord,
  type FirestoreEmailIndexRecord,
  type FirestoreSessionRecord,
  type FirestoreUserRecord,
  type FirestoreUserRecordLegacy,
  type Partner,
  type Profile,
  type TokenLedgerEntry,
} from '@asto/shared';
import { TOKEN_REWARDS } from '@asto/shared';
import { hashPassword, verifyPassword } from './auth/password';
import { getFirebaseApp, getFirestore } from './firebase';

const db = () => getFirestore();

type StoredUser = FirestoreUserRecord | FirestoreUserRecordLegacy;

function strip(user: StoredUser): Profile {
  const { password: _p, passwordHash: _h, updatedAt: _u, ...rest } = user as FirestoreUserRecord &
    FirestoreUserRecordLegacy & { updatedAt?: string };
  return rest;
}

function patchWithoutUndefined<T extends Record<string, unknown>>(patch: Partial<T>) {
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
}

async function verifyStoredPassword(user: StoredUser, password: string): Promise<boolean> {
  if ('passwordHash' in user && user.passwordHash) {
    return verifyPassword(password, user.passwordHash);
  }
  if ('password' in user && user.password) {
    return user.password === password;
  }
  return false;
}

async function migrateLegacyPassword(userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  await db()
    .collection(FIRESTORE_COLLECTIONS.users)
    .doc(userId)
    .update({
      passwordHash,
      password: FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });
}

export const firestoreStore = {
  async reload() {
    // no-op for Firestore
  },

  async createUser(email: string, password: string, displayName: string): Promise<Profile> {
    const normalizedEmail = normalizeEmail(email);
    const emailRef = db().collection(FIRESTORE_COLLECTIONS.usersByEmail).doc(normalizedEmail);
    const existing = await emailRef.get();
    if (existing.exists) throw new Error('Bu e-posta zaten kayıtlı');

    const now = new Date().toISOString();
    const userId = nanoid();
    const passwordHash = await hashPassword(password);
    const user: FirestoreUserRecord = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      displayName,
      tokenBalance: TOKEN_REWARDS.signupBonus,
      isSubscribed: false,
      createdAt: now,
      updatedAt: now,
    };

    const emailIndex: FirestoreEmailIndexRecord = { userId, createdAt: now };
    const ledgerId = nanoid();
    const ledgerEntry: TokenLedgerEntry = {
      id: ledgerId,
      userId,
      delta: TOKEN_REWARDS.signupBonus,
      reason: 'signup_bonus',
      createdAt: now,
    };

    const batch = db().batch();
    batch.set(db().collection(FIRESTORE_COLLECTIONS.users).doc(userId), user);
    batch.set(emailRef, emailIndex);
    batch.set(db().collection(FIRESTORE_COLLECTIONS.ledger).doc(ledgerId), ledgerEntry);
    await batch.commit();
    return strip(user);
  },

  async authenticate(email: string, password: string): Promise<{ profile: Profile; token: string }> {
    const normalizedEmail = normalizeEmail(email);
    const emailSnap = await db().collection(FIRESTORE_COLLECTIONS.usersByEmail).doc(normalizedEmail).get();
    if (!emailSnap.exists) throw new Error('E-posta veya şifre hatalı');

    const userId = (emailSnap.data() as FirestoreEmailIndexRecord).userId;
    const userRef = db().collection(FIRESTORE_COLLECTIONS.users).doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error('E-posta veya şifre hatalı');

    const user = userSnap.data() as StoredUser;
    if (!(await verifyStoredPassword(user, password))) {
      throw new Error('E-posta veya şifre hatalı');
    }
    if ('password' in user && user.password && !('passwordHash' in user && user.passwordHash)) {
      await migrateLegacyPassword(userId, password);
    }

    const token = nanoid(32);
    const session: FirestoreSessionRecord = {
      token,
      userId,
      createdAt: new Date().toISOString(),
    };
    await db().collection(FIRESTORE_COLLECTIONS.sessions).doc(token).set(session);
    return { profile: strip(user), token };
  },

  async userFromToken(token?: string | null): Promise<Profile | null> {
    if (!token) return null;

    // Mobil Firebase Auth ID token (standalone uygulama)
    try {
      const decoded = await getAuth(getFirebaseApp()).verifyIdToken(token);
      const userSnap = await db().collection(FIRESTORE_COLLECTIONS.users).doc(decoded.uid).get();
      if (userSnap.exists) return strip(userSnap.data() as StoredUser);
    } catch {
      // session token'a düş
    }

    const sessionSnap = await db().collection(FIRESTORE_COLLECTIONS.sessions).doc(token).get();
    if (!sessionSnap.exists) return null;
    const userId = (sessionSnap.data() as FirestoreSessionRecord).userId;
    const userSnap = await db().collection(FIRESTORE_COLLECTIONS.users).doc(userId).get();
    if (!userSnap.exists) return null;
    return strip(userSnap.data() as StoredUser);
  },

  async getUser(id: string): Promise<StoredUser | null> {
    const snap = await db().collection(FIRESTORE_COLLECTIONS.users).doc(id).get();
    return snap.exists ? (snap.data() as StoredUser) : null;
  },

  async updateUser(id: string, patch: Partial<Profile>): Promise<Profile> {
    const ref = db().collection(FIRESTORE_COLLECTIONS.users).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Kullanıcı bulunamadı');
    const updates = {
      ...patchWithoutUndefined(patch),
      updatedAt: new Date().toISOString(),
    };
    await ref.update(updates);
    const merged = { ...(snap.data() as StoredUser), ...updates };
    return strip(merged);
  },

  async adjustTokens(userId: string, delta: number, reason: string): Promise<Profile> {
    const userRef = db().collection(FIRESTORE_COLLECTIONS.users).doc(userId);
    return db().runTransaction(async (tx: Transaction) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error('Kullanıcı bulunamadı');
      const user = userSnap.data() as StoredUser;
      if (user.tokenBalance + delta < 0) throw new Error('Yetersiz jeton');
      const tokenBalance = user.tokenBalance + delta;
      const now = new Date().toISOString();
      tx.update(userRef, { tokenBalance, updatedAt: now });
      const entry: TokenLedgerEntry = {
        id: nanoid(),
        userId,
        delta,
        reason,
        createdAt: now,
      };
      tx.set(db().collection(FIRESTORE_COLLECTIONS.ledger).doc(entry.id), entry);
      return strip({ ...user, tokenBalance, updatedAt: now });
    });
  },

  async getLedger(userId: string): Promise<TokenLedgerEntry[]> {
    const snap = await db().collection(FIRESTORE_COLLECTIONS.ledger).where('userId', '==', userId).get();
    return snap.docs
      .map((d) => d.data() as TokenLedgerEntry)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
  },

  async getReading(userId: string, date: string): Promise<DailyReading | null> {
    const snap = await db().collection(FIRESTORE_COLLECTIONS.readings).doc(readingDocId(userId, date)).get();
    return snap.exists ? (snap.data() as DailyReading) : null;
  },

  async saveReading(reading: DailyReading) {
    await db()
      .collection(FIRESTORE_COLLECTIONS.readings)
      .doc(readingDocId(reading.userId, reading.date))
      .set(reading);
  },

  async listPartners(userId: string): Promise<Partner[]> {
    const snap = await db().collection(FIRESTORE_COLLECTIONS.partners).where('userId', '==', userId).get();
    return snap.docs.map((d) => d.data() as Partner);
  },

  async savePartner(partner: Partner) {
    await db().collection(FIRESTORE_COLLECTIONS.partners).doc(partner.id).set(partner);
  },

  async updatePartner(id: string, patch: Partial<Partner>): Promise<Partner> {
    const ref = db().collection(FIRESTORE_COLLECTIONS.partners).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Partner bulunamadı');
    const updates: Record<string, unknown> = { ...patchWithoutUndefined(patch) };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) updates[key] = FieldValue.delete();
    }
    await ref.update(updates);
    const merged = { ...(snap.data() as Partner), ...patch };
    for (const key of Object.keys(patch)) {
      if (patch[key as keyof Partner] === undefined) {
        delete (merged as Record<string, unknown>)[key];
      }
    }
    return merged;
  },

  async getPartner(id: string, userId: string): Promise<Partner | null> {
    const snap = await db().collection(FIRESTORE_COLLECTIONS.partners).doc(id).get();
    if (!snap.exists) return null;
    const partner = snap.data() as Partner;
    return partner.userId === userId ? partner : null;
  },

  async listConversations(userId: string): Promise<Conversation[]> {
    const snap = await db()
      .collection(FIRESTORE_COLLECTIONS.conversations)
      .where('userId', '==', userId)
      .get();
    return snap.docs
      .map((d) => d.data() as Conversation)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getConversation(id: string, userId: string): Promise<Conversation | null> {
    const snap = await db().collection(FIRESTORE_COLLECTIONS.conversations).doc(id).get();
    if (!snap.exists) return null;
    const conv = snap.data() as Conversation;
    return conv.userId === userId ? conv : null;
  },

  async saveConversation(conv: Conversation) {
    await db().collection(FIRESTORE_COLLECTIONS.conversations).doc(conv.id).set(conv);
  },

  async deleteConversation(id: string, userId: string) {
    const ref = db().collection(FIRESTORE_COLLECTIONS.conversations).doc(id);
    const snap = await ref.get();
    if (snap.exists && (snap.data() as Conversation).userId === userId) {
      await ref.delete();
    }
  },

  async claimAdReward(userId: string): Promise<{ count: number; profile: Profile }> {
    const date = new Date().toISOString().slice(0, 10);
    const claimRef = db().collection(FIRESTORE_COLLECTIONS.adClaims).doc(adClaimDocId(userId, date));
    const userRef = db().collection(FIRESTORE_COLLECTIONS.users).doc(userId);

    return db().runTransaction(async (tx: Transaction) => {
      const [claimSnap, userSnap] = await Promise.all([tx.get(claimRef), tx.get(userRef)]);
      if (!userSnap.exists) throw new Error('Kullanıcı bulunamadı');

      const currentCount = claimSnap.exists
        ? ((claimSnap.data() as FirestoreAdClaimRecord).count ?? 0)
        : 0;
      if (currentCount >= TOKEN_REWARDS.maxRewardedAdsPerDay) {
        throw new Error(`Günlük reklam limiti (${TOKEN_REWARDS.maxRewardedAdsPerDay}) doldu`);
      }

      const user = userSnap.data() as StoredUser;
      const tokenBalance = user.tokenBalance + TOKEN_REWARDS.rewardedAd;
      const count = currentCount + 1;
      const now = new Date().toISOString();

      const claim: FirestoreAdClaimRecord = { userId, date, count };
      tx.set(claimRef, claim, { merge: true });
      tx.update(userRef, { tokenBalance, updatedAt: now });
      const ledgerId = nanoid();
      tx.set(db().collection(FIRESTORE_COLLECTIONS.ledger).doc(ledgerId), {
        id: ledgerId,
        userId,
        delta: TOKEN_REWARDS.rewardedAd,
        reason: 'rewarded_ad',
        createdAt: now,
      });

      return { count, profile: strip({ ...user, tokenBalance, updatedAt: now }) };
    });
  },

  async getAdCount(userId: string): Promise<number> {
    const date = new Date().toISOString().slice(0, 10);
    const snap = await db()
      .collection(FIRESTORE_COLLECTIONS.adClaims)
      .doc(adClaimDocId(userId, date))
      .get();
    return snap.exists ? ((snap.data() as FirestoreAdClaimRecord).count ?? 0) : 0;
  },
};
