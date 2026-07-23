#!/usr/bin/env node
/**
 * Firebase production kurulum kontrolü + deploy.
 * Sunucu/VPS gerekmez — AI yalnızca Cloud Functions üzerinde.
 *
 * Run: npm run setup:production
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const API_ENV = join(ROOT, 'packages/api/.env');
const MOBILE_ENV = join(ROOT, 'apps/mobile/.env');
const PRODUCTION_AI_API_URL =
  'https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api';
const PROJECT = 'bn-astro';

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

function step(n, title) {
  console.log(`\n── ${n}. ${title} ──`);
}

let failed = false;
function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}
function ok(msg) {
  console.log(`✓ ${msg}`);
}

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  Asto — Firebase production kurulum            ║');
console.log('║  (sunucu yok, Cloud Functions + Firestore)     ║');
console.log('╚══════════════════════════════════════════════════╝');

step(1, 'Firebase CLI oturumu');
const login = spawnSync('npx', ['firebase', 'projects:list', '--project', PROJECT], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (login.status !== 0) {
  fail('Firebase girişi yok — çalıştırın: npx firebase login');
} else {
  ok(`Proje: ${PROJECT}`);
}

step(2, 'Gemini anahtarı (yalnızca deploy makinesi)');
const apiEnv = loadEnv(API_ENV);
if (!apiEnv.GEMINI_API_KEY?.trim()) {
  fail('packages/api/.env → GEMINI_API_KEY eksik');
  console.log('  → https://aistudio.google.com/apikey');
} else {
  ok('GEMINI_API_KEY tanımlı (git\'e commit etmeyin)');
}

step(3, 'Mobil env (Gemini anahtarı OLMAMALI)');
const mobileEnv = loadEnv(MOBILE_ENV);
if (mobileEnv.EXPO_PUBLIC_GEMINI_API_KEY?.trim()) {
  fail('apps/mobile/.env içinde EXPO_PUBLIC_GEMINI_API_KEY var — kaldırın');
} else {
  ok('Mobilde Gemini anahtarı yok');
}
const aiUrl = mobileEnv.EXPO_PUBLIC_AI_API_URL || PRODUCTION_AI_API_URL;
if (!aiUrl.startsWith('https://')) {
  fail('EXPO_PUBLIC_AI_API_URL HTTPS olmalı');
} else {
  ok(`AI URL: ${aiUrl}`);
}

step(4, 'Cloud Functions health');
const health = await fetch(`${PRODUCTION_AI_API_URL}/health`).catch(() => null);
if (health?.ok) {
  const data = await health.json();
  ok(`astoApi çalışıyor — ai=${data.ai} model=${data.model}`);
} else {
  console.warn(`⚠ astoApi henüz deploy edilmemiş (HTTP ${health?.status ?? 'network'})`);
  console.log('  → npm run deploy:ai-api');
  console.log('\n  GCP API hatası alırsanız Firebase Console → Blaze plan + şunları etkinleştirin:');
  console.log('    • Cloud Functions API');
  console.log('    • Cloud Build API');
  console.log('    • Artifact Registry API');
  console.log(`    https://console.cloud.google.com/apis/library?project=${PROJECT}`);
}

if (failed) {
  console.error('\nKurulum eksik — yukarıdaki adımları tamamlayın.');
  console.error('Detay: docs/FIREBASE-PRODUCTION.md\n');
  process.exit(1);
}

const shouldDeploy = process.argv.includes('--deploy');
if (shouldDeploy) {
  step(5, 'Deploy');
  const deploy = spawnSync('npm', ['run', 'deploy:ai-api'], { cwd: ROOT, stdio: 'inherit' });
  process.exit(deploy.status ?? 1);
}

console.log('\nKurulum kontrolü tamam. Deploy için:');
console.log('  npm run setup:production -- --deploy');
console.log('veya: npm run deploy:ai-api\n');
