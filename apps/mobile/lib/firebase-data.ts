import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
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
  await setDoc(ref, partner);
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

  const patch: Partner = {
    ...(snap.data() as Partner),
    birth,
    natalChart: computeNatalChart(birth),
    analysis: undefined,
    synastryScore: undefined,
    conversationId: undefined,
  };
  await setDoc(ref, patch);
  return patch;
}

export async function firebaseGetReading(userId: string, date: string): Promise<DailyReading | null> {
  const snap = await getDoc(doc(db(), FIRESTORE_COLLECTIONS.readings, readingDocId(userId, date)));
  return snap.exists() ? (snap.data() as DailyReading) : null;
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
