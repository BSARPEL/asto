import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  deleteField,
  where,
} from 'firebase/firestore';
import {
  FIRESTORE_COLLECTIONS,
  IAP_PRODUCTS,
  TOKEN_REWARDS,
  adClaimDocId,
  computeNatalChart,
  normalizeBirthInput,
  readingDocId,
  type BirthInput,
  type Conversation,
  type DailyReading,
  type Partner,
  type Profile,
  type TokenLedgerEntry,
} from '@asto/shared';
import { getFirebaseDb } from './firebase';
import { forFirestore } from './firestore-write';

/**
 * Firebase Firestore veri katmanı — oturum, profil, partner, okuma önbelleği, jeton.
 * AI / Gemini çağrıları burada YOK (bkz. lib/ai-api.ts).
 */

function db() {
  return getFirebaseDb();
}

export async function firebaseListPartners(userId: string): Promise<Partner[]> {
  const snap = await getDocs(
    query(collection(db(), FIRESTORE_COLLECTIONS.partners), where('userId', '==', userId)),
  );
  return snap.docs.map((d) => d.data() as Partner);
}

export async function firebaseAddPartner(userId: string, birthInput: BirthInput): Promise<Partner> {
  const birth = normalizeBirthInput(birthInput);
  if (!birth?.name || !birth?.birthDate) throw new Error('Partner doğum bilgileri eksik');
  if (!birth.country || !birth.countryName || !birth.city) throw new Error('Ülke ve şehir gerekli');

  const ref = doc(collection(db(), FIRESTORE_COLLECTIONS.partners));
  const partner: Partner = {
    id: ref.id,
    userId,
    birth,
    natalChart: computeNatalChart(birth),
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, forFirestore(partner));
  return partner;
}

export async function firebaseUpdatePartner(
  userId: string,
  partnerId: string,
  birthInput: BirthInput,
): Promise<Partner> {
  const ref = doc(db(), FIRESTORE_COLLECTIONS.partners, partnerId);
  const snap = await getDoc(ref);
  if (!snap.exists() || (snap.data() as Partner).userId !== userId) {
    throw new Error('Partner bulunamadı');
  }

  const birth = normalizeBirthInput(birthInput);
  if (!birth?.name || !birth?.birthDate) throw new Error('Partner doğum bilgileri eksik');

  await setDoc(
    ref,
    forFirestore({
      ...(snap.data() as Partner),
      birth,
      natalChart: computeNatalChart(birth),
      analysis: deleteField(),
      analysisAt: deleteField(),
      synastryScore: deleteField(),
      synastryScoreNote: deleteField(),
      conversationId: deleteField(),
    }),
    { merge: true },
  );

  const updatedSnap = await getDoc(ref);
  return updatedSnap.data() as Partner;
}

export async function firebaseGetReading(userId: string, date: string): Promise<DailyReading | null> {
  const snap = await getDoc(doc(db(), FIRESTORE_COLLECTIONS.readings, readingDocId(userId, date)));
  return snap.exists() ? (snap.data() as DailyReading) : null;
}

export async function firebaseSaveReading(reading: DailyReading): Promise<void> {
  await setDoc(
    doc(db(), FIRESTORE_COLLECTIONS.readings, readingDocId(reading.userId, reading.date)),
    forFirestore(reading),
  );
}

export async function firebaseSaveConversation(conversation: Conversation): Promise<void> {
  await setDoc(
    doc(db(), FIRESTORE_COLLECTIONS.conversations, conversation.id),
    forFirestore(conversation),
  );
}

export async function firebaseGetUserProfile(userId: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db(), FIRESTORE_COLLECTIONS.users, userId));
  if (!snap.exists()) return null;
  const { updatedAt: _, ...profile } = snap.data() as Profile & { updatedAt?: string };
  return profile;
}

export async function firebaseUpdateUserProfile(
  userId: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  const ref = doc(db(), FIRESTORE_COLLECTIONS.users, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Kullanıcı bulunamadı');
  const now = new Date().toISOString();
  const merged = { ...snap.data(), ...patch, updatedAt: now };
  await setDoc(ref, forFirestore(merged), { merge: true });
  const { updatedAt: _, ...profile } = merged as Profile & { updatedAt?: string };
  return profile;
}

export async function firebaseAdjustTokens(
  userId: string,
  delta: number,
  reason: string,
): Promise<Profile> {
  const userRef = doc(db(), FIRESTORE_COLLECTIONS.users, userId);
  return runTransaction(db(), async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error('Kullanıcı bulunamadı');
    const user = userSnap.data() as Profile & { updatedAt?: string };
    const tokenBalance = user.tokenBalance + delta;
    if (tokenBalance < 0) throw new Error('Yetersiz jeton');
    const now = new Date().toISOString();
    tx.set(userRef, { ...user, tokenBalance, updatedAt: now }, { merge: true });
    const ledgerRef = doc(collection(db(), FIRESTORE_COLLECTIONS.ledger));
    tx.set(ledgerRef, {
      id: ledgerRef.id,
      userId,
      delta,
      reason,
      createdAt: now,
    });
    const { updatedAt: _, ...profile } = { ...user, tokenBalance, updatedAt: now };
    return profile;
  });
}

export async function firebaseGetPartner(userId: string, partnerId: string): Promise<Partner | null> {
  const snap = await getDoc(doc(db(), FIRESTORE_COLLECTIONS.partners, partnerId));
  if (!snap.exists()) return null;
  const partner = snap.data() as Partner;
  return partner.userId === userId ? partner : null;
}

export async function firebaseUpdatePartnerFields(
  userId: string,
  partnerId: string,
  patch: Partial<Partner>,
): Promise<Partner> {
  const ref = doc(db(), FIRESTORE_COLLECTIONS.partners, partnerId);
  const snap = await getDoc(ref);
  if (!snap.exists() || (snap.data() as Partner).userId !== userId) {
    throw new Error('Partner bulunamadı');
  }
  const updated = { ...(snap.data() as Partner), ...patch };
  await setDoc(ref, forFirestore(updated), { merge: true });
  return updated;
}

export async function firebaseGetConversation(
  conversationId: string,
  userId: string,
): Promise<Conversation | null> {
  const snap = await getDoc(doc(db(), FIRESTORE_COLLECTIONS.conversations, conversationId));
  if (!snap.exists()) return null;
  const conv = snap.data() as Conversation;
  return conv.userId === userId ? conv : null;
}

export async function firebaseGetLedger(userId: string): Promise<TokenLedgerEntry[]> {
  const snap = await getDocs(
    query(collection(db(), FIRESTORE_COLLECTIONS.ledger), where('userId', '==', userId)),
  );
  return snap.docs
    .map((d) => d.data() as TokenLedgerEntry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

export async function firebaseClaimAdReward(userId: string): Promise<{ profile: Profile; count: number }> {
  const date = new Date().toISOString().slice(0, 10);
  const claimRef = doc(db(), FIRESTORE_COLLECTIONS.adClaims, adClaimDocId(userId, date));
  const userRef = doc(db(), FIRESTORE_COLLECTIONS.users, userId);

  return runTransaction(db(), async (tx) => {
    const [claimSnap, userSnap] = await Promise.all([tx.get(claimRef), tx.get(userRef)]);
    if (!userSnap.exists()) throw new Error('Kullanıcı bulunamadı');

    const currentCount = claimSnap.exists() ? ((claimSnap.data().count as number) ?? 0) : 0;
    if (currentCount >= TOKEN_REWARDS.maxRewardedAdsPerDay) {
      throw new Error(`Günlük reklam limiti (${TOKEN_REWARDS.maxRewardedAdsPerDay}) doldu`);
    }

    const user = userSnap.data() as Profile & { updatedAt?: string };
    const tokenBalance = user.tokenBalance + TOKEN_REWARDS.rewardedAd;
    const count = currentCount + 1;
    const now = new Date().toISOString();

    tx.set(claimRef, { userId, date, count }, { merge: true });
    tx.set(
      userRef,
      { ...user, tokenBalance, updatedAt: now },
      { merge: true },
    );
    const ledgerRef = doc(collection(db(), FIRESTORE_COLLECTIONS.ledger));
    tx.set(ledgerRef, {
      id: ledgerRef.id,
      userId,
      delta: TOKEN_REWARDS.rewardedAd,
      reason: 'rewarded_ad',
      createdAt: now,
    });

    const { updatedAt: _, ...profile } = { ...user, tokenBalance, updatedAt: now };
    return { profile, count };
  });
}

/** Geliştirme: IAP simülasyonu (Firebase üzerinden jeton / abonelik) */
export async function firebaseSimulatePurchase(
  userId: string,
  productId: string,
): Promise<{ profile: Profile; granted: number | string }> {
  const userRef = doc(db(), FIRESTORE_COLLECTIONS.users, userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('Kullanıcı bulunamadı');
  const user = snap.data() as Profile & { updatedAt?: string };
  const now = new Date().toISOString();

  if (productId === IAP_PRODUCTS.monthly.id) {
    const profile = { ...user, isSubscribed: true, updatedAt: now };
    await setDoc(userRef, profile, { merge: true });
    const { updatedAt: _, ...p } = profile;
    return { profile: p, granted: 'subscription' };
  }

  const pack = Object.values(IAP_PRODUCTS).find((p) => p.id === productId && 'tokens' in p);
  if (!pack || !('tokens' in pack)) throw new Error('Geçersiz ürün');
  const tokenBalance = user.tokenBalance + pack.tokens;
  const profile = { ...user, tokenBalance, updatedAt: now };
  await setDoc(userRef, profile, { merge: true });
  const ledgerRef = doc(collection(db(), FIRESTORE_COLLECTIONS.ledger));
  await setDoc(ledgerRef, {
    id: ledgerRef.id,
    userId,
    delta: pack.tokens,
    reason: `purchase_${productId}`,
    createdAt: now,
  });
  const { updatedAt: _, ...p } = profile;
  return { profile: p, granted: pack.tokens };
}
