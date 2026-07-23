#!/usr/bin/env node
/**
 * Test AI API with Firebase Auth ID token (same as mobile app).
 * Requires: npm run api (local) OR EXPO_PUBLIC_AI_API_URL for remote.
 *
 * Run: node scripts/test-ai-api.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getFirestore, setDoc } from 'firebase/firestore';
import { computeNatalChart, TOKEN_REWARDS } from '@asto/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv(path) {
  const env = {};
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const mobileEnv = loadEnv(join(ROOT, 'apps/mobile/.env'));
const API_BASE =
  process.env.API_BASE ||
  mobileEnv.EXPO_PUBLIC_AI_API_URL ||
  mobileEnv.EXPO_PUBLIC_API_URL ||
  'http://127.0.0.1:8788/api';

const firebaseConfig = {
  apiKey: mobileEnv.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: mobileEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bn-astro.firebaseapp.com',
  projectId: mobileEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'bn-astro',
  appId: mobileEnv.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const DATABASE_ID = mobileEnv.EXPO_PUBLIC_FIREBASE_DATABASE_ID || 'bnastro';

const TEST_EMAIL = `ai-e2e-${Date.now()}@bnastro.test`;
const TEST_PASSWORD = 'TestPass123!';

function assert(name, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${name}: ${detail}`);
  if (!ok) process.exitCode = 1;
}

async function api(path, { method = 'GET', token, body } = {}) {
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

const birth = {
  name: 'AI Test',
  birthDate: '1995-06-15',
  birthTime: '14:30',
  city: 'İstanbul',
  country: 'TR',
  countryName: 'Türkiye',
  latitude: 41.0082,
  longitude: 28.9784,
  timezone: 'Europe/Istanbul',
};

console.log(`=== AI API test (${API_BASE}) ===\n`);

try {
  const health = await api('/health');
  assert('health', health.res.ok && health.data.ai, `${health.data.provider} / ${health.data.model}`);

  const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
  const uid = cred.user.uid;
  const now = new Date().toISOString();
  const natalChart = computeNatalChart(birth);
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email: TEST_EMAIL,
    displayName: 'AI Test',
    tokenBalance: TOKEN_REWARDS.signupBonus + 10,
    isSubscribed: false,
    birth,
    natalChart,
    createdAt: now,
    updatedAt: now,
  });

  const idToken = await cred.user.getIdToken();
  assert('firebase id token', Boolean(idToken), `${idToken.slice(0, 24)}…`);

  const daily = await api('/readings/daily', { method: 'POST', token: idToken, body: { force: true } });
  assert(
    'daily reading (AI)',
    daily.res.ok && daily.data.reading?.summary,
    daily.res.ok ? `${daily.data.reading.summary.slice(0, 60)}…` : daily.data.error || daily.res.status,
  );

  const narrative = await api('/readings/chart-narrative', {
    method: 'POST',
    token: idToken,
    body: { force: true },
  });
  assert(
    'chart narrative (AI)',
    narrative.res.ok && narrative.data.text?.length > 100,
    narrative.res.ok ? `${narrative.data.text.length} karakter` : narrative.data.error || narrative.res.status,
  );

  const ask = await api('/conversations/ask', {
    method: 'POST',
    token: idToken,
    body: { question: 'Bugün kariyerim için ne önerirsin?' },
  });
  assert(
    'ask (AI)',
    ask.res.ok && ask.data.conversation?.messages?.length >= 2,
    ask.res.ok ? `${ask.data.conversation.messages.length} mesaj` : ask.data.error || ask.res.status,
  );

  console.log('\nDone.');
} catch (e) {
  console.error('FATAL:', e);
  process.exitCode = 1;
}
