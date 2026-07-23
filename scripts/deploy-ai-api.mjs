#!/usr/bin/env node
/**
 * Deploy production AI API (Firebase Cloud Functions + Gemini from packages/api/.env).
 * Gemini = Google AI Studio (generativelanguage.googleapis.com), Firebase'den bağımsız.
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

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  return result.status ?? 1;
}

const apiEnv = loadEnv(API_ENV);
const key = apiEnv.GEMINI_API_KEY;
if (!key) {
  console.error('[deploy-ai] GEMINI_API_KEY bulunamadı — packages/api/.env');
  process.exit(1);
}

console.log('[deploy-ai] Firebase oturumu kontrol ediliyor…');
const whoami = spawnSync('npx', ['firebase', 'projects:list', '--project', PROJECT], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (whoami.status !== 0) {
  console.error('\n[deploy-ai] Firebase girişi gerekli:\n  npx firebase login\n');
  process.exit(1);
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
console.log('[deploy-ai] functions/.env yazıldı (GEMINI_API_KEY)');

console.log('[deploy-ai] Cloud Functions deploy…');
const deploy = run('npx', [
  'firebase',
  'deploy',
  '--only',
  'functions:asto-api',
  '--project',
  PROJECT,
]);
if (deploy !== 0) process.exit(deploy);

console.log('\n[deploy-ai] Health kontrolü…');
await new Promise((r) => setTimeout(r, 12000));
const health = await fetch(`${PRODUCTION_AI_API_URL}/health`).catch(() => null);
if (health?.ok) {
  const data = await health.json();
  console.log(`[deploy-ai] ✓ ${PRODUCTION_AI_API_URL}/health`);
  console.log(`    ai=${data.ai} provider=${data.provider} model=${data.model}`);
} else {
  console.warn(`[deploy-ai] Health: HTTP ${health?.status ?? 'network'} — birkaç dakika bekleyip tekrar deneyin.`);
}

console.log('\n[deploy-ai] Mobil .env (zaten ayarlı olmalı):');
console.log(`EXPO_PUBLIC_AI_API_URL=${PRODUCTION_AI_API_URL}`);
