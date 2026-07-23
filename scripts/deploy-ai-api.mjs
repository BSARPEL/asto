#!/usr/bin/env node
/**
 * Production AI API → Firebase Cloud Functions (sunucu/VPS yok).
 *
 * Gemini anahtarı:
 *   1. Yerel: packages/api/.env (gitignore) — deploy script okur
 *   2. Firebase: functions/.env (gitignore) — deploy sırasında Cloud Function env'ine yazılır
 *
 * Run: npm run deploy:ai-api
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const API_ENV = join(ROOT, 'packages/api/.env');
const FUNCTIONS_ENV = join(ROOT, 'functions/.env');
const PROJECT = 'bn-astro';
const PRODUCTION_AI_API_URL =
  'https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api';

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  return result.status ?? 1;
}

const apiEnv = loadEnv(API_ENV);
const key = apiEnv.GEMINI_API_KEY?.trim();
if (!key) {
  console.error('[deploy-ai] GEMINI_API_KEY bulunamadı — packages/api/.env');
  console.error('  Google AI Studio: https://aistudio.google.com/apikey');
  process.exit(1);
}

console.log('[deploy-ai] Firebase oturumu kontrol ediliyor…');
const saPath = join(ROOT, 'packages/api/.secrets/firebase-adminsdk.json');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(saPath)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
}
const whoami = spawnSync('npx', ['firebase', 'login:list'], { cwd: ROOT, encoding: 'utf8' });
const hasLogin = whoami.stdout?.includes('@') || existsSync(saPath);
if (!hasLogin) {
  console.error('\n[deploy-ai] Firebase girişi gerekli:\n  npx firebase login\n');
  process.exit(1);
}
if (!whoami.stdout?.includes('@') && existsSync(saPath)) {
  console.log('[deploy-ai] Service account ile deploy deneniyor…');
}

writeFileSync(
  FUNCTIONS_ENV,
  [
    `GEMINI_API_KEY=${key}`,
    `GEMINI_MODEL=${apiEnv.GEMINI_MODEL || 'gemini-2.5-flash-lite'}`,
    'STORE_BACKEND=firestore',
    `FIREBASE_PROJECT_ID=${PROJECT}`,
    'FIREBASE_DATABASE_ID=bnastro',
    'NODE_ENV=production',
    '',
  ].join('\n'),
);
console.log('[deploy-ai] functions/.env yazıldı → Firebase Cloud Function ortamına yüklenecek');

console.log('[deploy-ai] Cloud Functions deploy…');
const deploy = run('npx', [
  'firebase',
  'deploy',
  '--only',
  'functions:asto-api',
  '--project',
  PROJECT,
]);
if (deploy !== 0) {
  console.error('\n[deploy-ai] Deploy başarısız. Sık nedenler:');
  console.error('  1. Blaze plan kapalı → Firebase Console → Upgrade');
  console.error('  2. API kapalı → https://console.cloud.google.com/apis/library?project=bn-astro');
  console.error('     (Cloud Functions, Cloud Build, Artifact Registry)');
  console.error('  3. Oturum → npx firebase login\n');
  process.exit(deploy);
}

console.log('\n[deploy-ai] Health kontrolü (30 sn bekleniyor)…');
await new Promise((r) => setTimeout(r, 30_000));

let healthOk = false;
for (let attempt = 1; attempt <= 3; attempt++) {
  const health = await fetch(`${PRODUCTION_AI_API_URL}/health`).catch(() => null);
  if (health?.ok) {
    const data = await health.json();
    console.log(`[deploy-ai] ✓ ${PRODUCTION_AI_API_URL}/health`);
    console.log(`    ai=${data.ai} provider=${data.provider} model=${data.model}`);
    healthOk = true;
    break;
  }
  console.warn(`[deploy-ai] Health deneme ${attempt}/3: HTTP ${health?.status ?? 'network'}`);
  if (attempt < 3) await new Promise((r) => setTimeout(r, 15_000));
}

if (!healthOk) {
  console.warn('[deploy-ai] Health henüz yanıt vermiyor — birkaç dakika sonra tekrar deneyin.');
}

console.log('\n[deploy-ai] Mobil (Gemini anahtarı YOK — yalnızca public AI URL):');
console.log(`EXPO_PUBLIC_AI_API_URL=${PRODUCTION_AI_API_URL}`);
console.log('\n[deploy-ai] Mağaza build: npm run ios:archive:store\n');
