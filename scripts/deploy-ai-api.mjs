#!/usr/bin/env node
/**
 * Deploy AI API to Firebase Cloud Functions (HTTPS + Gemini).
 * Reads GEMINI_API_KEY from packages/api/.env into functions/.env
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const API_ENV = join(ROOT, 'packages/api/.env');
const FUNCTIONS_ENV = join(ROOT, 'functions/.env');

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

const apiEnv = loadEnv(API_ENV);
const key = apiEnv.GEMINI_API_KEY;
if (!key) {
  console.error('[deploy-ai] GEMINI_API_KEY bulunamadı — packages/api/.env');
  process.exit(1);
}

const envLines = [
  `GEMINI_API_KEY=${key}`,
  `GEMINI_MODEL=${apiEnv.GEMINI_MODEL || 'gemini-flash-latest'}`,
  'STORE_BACKEND=firestore',
  'FIREBASE_PROJECT_ID=bn-astro',
  'FIREBASE_DATABASE_ID=bnastro',
  'NODE_ENV=production',
];
writeFileSync(FUNCTIONS_ENV, `${envLines.join('\n')}\n`);
console.log('[deploy-ai] functions/.env yazıldı');

const result = spawnSync(
  'npx',
  ['firebase', 'deploy', '--only', 'functions:asto-api', '--project', 'bn-astro'],
  { cwd: ROOT, stdio: 'inherit', env: { ...process.env } },
);

if (result.status !== 0) process.exit(result.status ?? 1);

const url = 'https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api';
console.log(`\n[deploy-ai] Mobil .env satırı:`);
console.log(`EXPO_PUBLIC_AI_API_URL=${url}`);
