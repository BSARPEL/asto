#!/usr/bin/env node
/**
 * Tam kullanıcı yolculuğu: kayıt → giriş → harita → öngörü → AI sohbet
 * Run: node scripts/test-user-journey.mjs
 * Env: API_BASE (default: mobile .env AI URL veya localhost)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { computeNatalChart, normalizeBirthInput, TOKEN_REWARDS } from '@asto/shared';
import { cert, getApps, initializeApp as initAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv(path) {
  const env = {};
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch { /* */ }
  return env;
}

const mobileEnv = loadEnv(join(ROOT, 'apps/mobile/.env'));
const API_BASE =
  process.env.API_BASE ||
  mobileEnv.EXPO_PUBLIC_AI_API_URL ||
  'http://127.0.0.1:8788/api';

const firebaseConfig = {
  apiKey: mobileEnv.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: mobileEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bn-astro.firebaseapp.com',
  projectId: mobileEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'bn-astro',
  appId: mobileEnv.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const DATABASE_ID = mobileEnv.EXPO_PUBLIC_FIREBASE_DATABASE_ID || 'bnastro';
const SA_PATH = join(ROOT, 'packages/api/.secrets/firebase-adminsdk.json');

const EMAIL = `journey-${Date.now()}@bnastro.test`;
const PASSWORD = 'TestPass123!';
const NAME = 'Yolculuk Test';

const BIRTH = {
  name: NAME,
  birthDate: '1990-03-20',
  birthTime: '09:15',
  city: 'Ankara',
  country: 'TR',
  countryName: 'Türkiye',
  latitude: 39.9334,
  longitude: 32.8597,
  timezone: 'Europe/Istanbul',
};

let failed = false;
function step(ok, label, detail) {
  console.log(`${ok ? '✓' : '✗'} ${label}: ${detail}`);
  if (!ok) failed = true;
}

async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, DATABASE_ID);

if (!getApps().length) {
  initAdminApp({
    credential: cert(JSON.parse(readFileSync(SA_PATH, 'utf8'))),
    projectId: firebaseConfig.projectId,
  });
}
const adminAuth = getAdminAuth();

let uid = '';

console.log(`=== Kullanıcı yolculuğu E2E ===\nAPI: ${API_BASE}\nKullanıcı: ${EMAIL}\n`);

try {
  // Kayıt
  const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
  uid = cred.user.uid;
  const now = new Date().toISOString();
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email: EMAIL,
    displayName: NAME,
    tokenBalance: TOKEN_REWARDS.signupBonus,
    isSubscribed: false,
    createdAt: now,
    updatedAt: now,
  });
  step(true, 'Kayıt ol', `${NAME} (${uid.slice(0, 8)}…)`);

  // Çıkış + giriş
  await signOut(auth);
  await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
  const profileSnap = await getDoc(doc(db, 'users', uid));
  step(profileSnap.exists(), 'Giriş yap', profileSnap.data()?.displayName ?? 'profil yok');

  // Harita
  const birth = normalizeBirthInput(BIRTH);
  const natalChart = computeNatalChart(birth);
  await setDoc(
    doc(db, 'users', uid),
    { birth, natalChart, displayName: NAME, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  step(Boolean(natalChart.sunSign), 'Haritamı oluştur', `${natalChart.sunSign} / ${natalChart.risingSign}`);

  const idToken = await auth.currentUser.getIdToken();

  // Öngörü al
  const daily = await api('/readings/daily', {
    method: 'POST',
    token: idToken,
    body: { force: true },
  });
  step(
    daily.res.ok && daily.data.reading?.summary?.length > 50,
    'Öngörü al (AI)',
    daily.res.ok ? `${daily.data.reading.summary.slice(0, 70)}…` : daily.data.error || daily.res.status,
  );

  const convId = daily.data.conversation?.id;

  // AI sohbet — 2 soru
  const q1 = await api('/conversations/ask', {
    method: 'POST',
    token: idToken,
    body: { question: 'Bugün ilişkilerimde nelere dikkat etmeliyim?', conversationId: convId },
  });
  const msgs1 = q1.data.conversation?.messages?.length ?? 0;
  step(q1.res.ok && msgs1 >= 2, 'AI sohbet (soru 1)', q1.res.ok ? `${msgs1} mesaj` : q1.data.error || q1.res.status);

  const q2 = await api('/conversations/ask', {
    method: 'POST',
    token: idToken,
    body: {
      question: 'Kariyerim için bu hafta hangi enerji öne çıkıyor?',
      conversationId: q1.data.conversation?.id || convId,
    },
  });
  const msgs2 = q2.data.conversation?.messages?.length ?? 0;
  step(q2.res.ok && msgs2 >= 4, 'AI sohbet (soru 2)', q2.res.ok ? `${msgs2} mesaj (geçmiş korundu)` : q2.data.error || q2.res.status);

  if (q2.res.ok && q2.data.conversation?.messages?.length >= 4) {
    const last = q2.data.conversation.messages.at(-1);
    step(last?.role === 'assistant' && last.content.length > 20, 'Yanıt kalitesi', `${last.content.slice(0, 60)}…`);
  }

  console.log(failed ? '\n✗ Bazı adımlar başarısız.' : '\n✓ Tüm kullanıcı adımları başarılı.');
} catch (e) {
  console.error('FATAL:', e);
  failed = true;
} finally {
  if (uid) {
    try {
      await adminAuth.deleteUser(uid);
      console.log(`\n[cleanup] ${uid}`);
    } catch { /* */ }
  }
  if (failed) process.exitCode = 1;
}
