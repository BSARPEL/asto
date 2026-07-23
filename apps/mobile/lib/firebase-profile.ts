import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  FIRESTORE_COLLECTIONS,
  TOKEN_REWARDS,
  adClaimDocId,
  normalizeEmail,
  type Profile,
} from '@asto/shared';
import { getFirebaseAuth, getFirebaseDb } from './firebase';

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta zaten kayıtlı';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı yok. Tekrar deneyin.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Lütfen biraz bekleyin.';
    default:
      return 'Kimlik doğrulama hatası. Tekrar deneyin.';
  }
}

function wrapAuthError(e: unknown): Error {
  const code = (e as { code?: string })?.code ?? '';
  return new Error(authErrorMessage(code));
}

export async function firebaseRegister(
  email: string,
  password: string,
  displayName: string,
): Promise<Profile> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const normalizedEmail = normalizeEmail(email);

  let user: User;
  try {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    user = cred.user;
  } catch (e) {
    throw wrapAuthError(e);
  }

  const now = new Date().toISOString();
  const profile: Profile & { updatedAt: string } = {
    id: user.uid,
    email: normalizedEmail,
    displayName,
    tokenBalance: TOKEN_REWARDS.signupBonus,
    isSubscribed: false,
    createdAt: now,
    updatedAt: now,
  };

  const ledgerRef = doc(collection(db, FIRESTORE_COLLECTIONS.ledger));
  await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, user.uid), profile);
  await setDoc(ledgerRef, {
    id: ledgerRef.id,
    userId: user.uid,
    delta: TOKEN_REWARDS.signupBonus,
    reason: 'signup_bonus',
    createdAt: now,
  });

  return profile;
}

export async function firebaseLogin(email: string, password: string): Promise<Profile> {
  const auth = getFirebaseAuth();
  try {
    const cred = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    const profile = await firebaseGetProfile(cred.user.uid);
    if (!profile) throw new Error('Kullanıcı profili bulunamadı');
    return profile;
  } catch (e) {
    if (e instanceof Error && e.message === 'Kullanıcı profili bulunamadı') throw e;
    throw wrapAuthError(e);
  }
}

export async function firebaseLogout(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function firebaseGetProfile(userId: string): Promise<Profile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), FIRESTORE_COLLECTIONS.users, userId));
  if (!snap.exists()) return null;
  const data = snap.data() as Profile & { updatedAt?: string };
  const { updatedAt: _, ...profile } = data;
  return profile;
}

export async function firebaseGetAdCountToday(userId: string): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const snap = await getDoc(
    doc(getFirebaseDb(), FIRESTORE_COLLECTIONS.adClaims, adClaimDocId(userId, date)),
  );
  return snap.exists() ? ((snap.data().count as number) ?? 0) : 0;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export async function firebaseSaveProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const ref = doc(getFirebaseDb(), FIRESTORE_COLLECTIONS.users, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Kullanıcı bulunamadı');
  const merged = {
    ...(snap.data() as Profile),
    ...omitUndefined(patch as Record<string, unknown>),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, merged, { merge: true });
  const { updatedAt: _, ...profile } = merged as Profile & { updatedAt: string };
  return profile;
}

/** Eski API oturumlarından kalan profil (uid ile) */
export async function firebaseFindProfileByEmail(email: string): Promise<Profile | null> {
  const q = query(
    collection(getFirebaseDb(), FIRESTORE_COLLECTIONS.users),
    where('email', '==', normalizeEmail(email)),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0]!.data() as Profile;
  return data;
}
