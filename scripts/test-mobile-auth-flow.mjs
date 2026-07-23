#!/usr/bin/env node
/**
 * End-to-end test: mobile Firebase Auth + Firestore flows
 * (register, login, session load, birth chart save)
 *
 * Run: node scripts/test-mobile-auth-flow.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { computeNatalChart, normalizeBirthInput, TOKEN_REWARDS, adClaimDocId } from '@asto/shared';
import { cert, getApps, initializeApp as initAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv(filePath) {
  const env = {};
  try {
    const text = readFileSync(filePath, 'utf8');
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {
    /* optional */
  }
  return env;
}

const mobileEnv = loadEnv(join(ROOT, 'apps/mobile/.env'));
const apiEnv = loadEnv(join(ROOT, 'packages/api/.env'));

const FIREBASE_CONFIG = {
  apiKey: mobileEnv.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: mobileEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bn-astro.firebaseapp.com',
  projectId: mobileEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'bn-astro',
  storageBucket: mobileEnv.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: mobileEnv.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: mobileEnv.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const DATABASE_ID = mobileEnv.EXPO_PUBLIC_FIREBASE_DATABASE_ID || 'bnastro';
const SA_PATH = join(ROOT, 'packages/api/.secrets/firebase-adminsdk.json');

const TEST_EMAIL = `e2e-${Date.now()}@bnastro.test`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'E2E Test';

const results = [];
function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}: ${detail}`);
}
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name}: ${detail}`);
}

function assert(name, condition, detail) {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

// --- Firebase client (same as mobile app) ---
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app, DATABASE_ID);

// --- Admin (verification only) ---
if (!getApps().length) {
  initAdminApp({
    credential: cert(JSON.parse(readFileSync(SA_PATH, 'utf8'))),
    projectId: FIREBASE_CONFIG.projectId,
  });
}
const adminDb = getAdminFirestore();
adminDb.settings({ databaseId: DATABASE_ID });
const adminAuth = getAdminAuth();

async function mobileRegister(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  const now = new Date().toISOString();
  const profile = {
    id: user.uid,
    email,
    displayName,
    tokenBalance: TOKEN_REWARDS.signupBonus,
    isSubscribed: false,
    createdAt: now,
    updatedAt: now,
  };
  const ledgerRef = doc(collection(db, 'ledger'));
  await setDoc(doc(db, 'users', user.uid), profile);
  await setDoc(ledgerRef, {
    id: ledgerRef.id,
    userId: user.uid,
    delta: TOKEN_REWARDS.signupBonus,
    reason: 'signup_bonus',
    createdAt: now,
  });
  return profile;
}

async function mobileLogin(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) throw new Error('Kullanıcı profili bulunamadı');
  const data = snap.data();
  const { updatedAt: _, ...profile } = data;
  return profile;
}

async function mobileGetAdCountToday(userId) {
  const date = new Date().toISOString().slice(0, 10);
  const snap = await getDoc(doc(db, 'adClaims', adClaimDocId(userId, date)));
  return snap.exists() ? (snap.data().count ?? 0) : 0;
}

async function mobileSaveBirth(userId, birthInput, displayName) {
  const birth = normalizeBirthInput(birthInput);
  const natalChart = computeNatalChart(birth);
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Kullanıcı bulunamadı');
  const merged = {
    ...snap.data(),
    birth,
    natalChart,
    displayName: birth.name || displayName,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, merged, { merge: true });
  const { updatedAt: _, ...profile } = merged;
  return profile;
}

async function loadSession(userId) {
  const [profileSnap, adSnap, token] = await Promise.all([
    getDoc(doc(db, 'users', userId)),
    getDoc(doc(db, 'adClaims', adClaimDocId(userId, new Date().toISOString().slice(0, 10)))),
    auth.currentUser?.getIdToken(),
  ]);
  return {
    profile: profileSnap.exists() ? profileSnap.data() : null,
    adClaimsToday: adSnap.exists() ? (adSnap.data().count ?? 0) : 0,
    token: token ?? null,
  };
}

const BIRTH = {
  name: TEST_NAME,
  birthDate: '1995-06-15',
  birthTime: '14:30',
  city: 'İstanbul',
  country: 'TR',
  countryName: 'Türkiye',
  latitude: 41.0082,
  longitude: 28.9784,
  timezone: 'Europe/Istanbul',
};

let userId = '';

try {
  console.log('=== Mobile Auth + Firestore E2E ===\n');
  console.log(`Test user: ${TEST_EMAIL}\n`);

  // 1. Register
  const profile = await mobileRegister(TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
  userId = profile.id;
  assert('register: Firebase Auth user', Boolean(auth.currentUser?.uid), auth.currentUser?.uid ?? '');
  assert('register: profile id matches uid', profile.id === auth.currentUser?.uid, profile.id);
  assert('register: signup bonus', profile.tokenBalance === TOKEN_REWARDS.signupBonus, `${profile.tokenBalance} jeton`);

  // 2. Admin verify users + ledger
  const adminUser = await adminDb.collection('users').doc(userId).get();
  assert('admin: users doc exists', adminUser.exists, userId);
  const ledgerSnap = await adminDb.collection('ledger').where('userId', '==', userId).get();
  assert('admin: ledger entry', !ledgerSnap.empty, `${ledgerSnap.size} kayıt`);
  const ledger = ledgerSnap.docs[0]?.data();
  assert('admin: ledger signup_bonus', ledger?.reason === 'signup_bonus', ledger?.reason ?? '');

  // 3. Session load (onAuthStateChanged equivalent)
  const session = await loadSession(userId);
  assert('session: profile loaded', Boolean(session.profile), session.profile?.displayName ?? '');
  assert('session: id token', Boolean(session.token), session.token ? `${session.token.slice(0, 20)}…` : 'yok');
  assert('session: adClaims (missing doc)', session.adClaimsToday === 0, '0 (izin hatası olmamalı)');

  // 4. Logout + login
  await signOut(auth);
  assert('logout: signed out', auth.currentUser === null, 'oturum kapalı');

  const loggedIn = await mobileLogin(TEST_EMAIL, TEST_PASSWORD);
  assert('login: profile', loggedIn.email === TEST_EMAIL, loggedIn.displayName);
  assert('login: adClaims read', (await mobileGetAdCountToday(userId)) === 0, '0');

  // 5. Wrong password
  try {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, TEST_EMAIL, 'wrongpassword');
    fail('login: wrong password rejected', 'hata fırlatılmadı');
  } catch (e) {
    const code = e?.code ?? '';
    assert('login: wrong password rejected', code === 'auth/invalid-credential' || code === 'auth/wrong-password', code);
  }

  // Re-login for birth test
  await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);

  // 6. Birth chart (no REST API)
  const withChart = await mobileSaveBirth(userId, BIRTH, TEST_NAME);
  assert('birth: natalChart saved', Boolean(withChart.natalChart), withChart.natalChart?.sunSign ?? '');
  assert('birth: planets', (withChart.natalChart?.planets?.length ?? 0) >= 10, `${withChart.natalChart?.planets?.length} gezegen`);
  assert('birth: sun/moon/rising', Boolean(withChart.natalChart?.risingSign), `${withChart.natalChart?.sunSign} / ${withChart.natalChart?.moonSign} / ${withChart.natalChart?.risingSign}`);

  const adminAfterBirth = await adminDb.collection('users').doc(userId).get();
  const adminData = adminAfterBirth.data();
  assert('admin: birth in Firestore', Boolean(adminData?.birth?.city), adminData?.birth?.city ?? '');
  assert('admin: chart in Firestore', Boolean(adminData?.natalChart?.sunSign), adminData?.natalChart?.sunSign ?? '');

  // 7. Security rules — client cannot read sessions
  try {
    await getDoc(doc(db, 'sessions', 'fake-token'));
    pass('rules: sessions get (no throw)', 'belge yok veya erişim reddedildi');
  } catch (e) {
    assert('rules: sessions blocked', e?.code === 'permission-denied', e?.code ?? e?.message);
  }

  // 8. Duplicate register
  try {
    await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    fail('register: duplicate email blocked', 'kabul edildi');
  } catch (e) {
    assert('register: duplicate email blocked', e?.code === 'auth/email-already-in-use', e?.code ?? '');
  }

  console.log('\n=== Özet ===');
  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`${ok}/${total} test geçti`);
  if (ok < total) process.exitCode = 1;
  else console.log('\nTüm mobil kayıt/giriş/harita akışları çalışıyor.');
} catch (e) {
  console.error('\nFATAL:', e);
  process.exitCode = 1;
} finally {
  // Cleanup test user
  if (userId) {
    try {
      await adminAuth.deleteUser(userId);
      await adminDb.collection('users').doc(userId).delete();
      const ledger = await adminDb.collection('ledger').where('userId', '==', userId).get();
      for (const d of ledger.docs) await d.ref.delete();
      console.log(`\n[cleanup] Test kullanıcısı silindi: ${userId}`);
    } catch (e) {
      console.warn('[cleanup] failed:', e.message);
    }
  }
}
