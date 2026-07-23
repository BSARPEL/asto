#!/usr/bin/env node
/**
 * App Store / TestFlight archive öncesi doğrulama.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOBILE_ENV_PATH, parseEnvFile } from './load-mobile-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = parseEnvFile(MOBILE_ENV_PATH);
let failed = false;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

console.log('=== Mağaza build doğrulaması ===\n');

if (env.EXPO_PUBLIC_APP_ENV !== 'production') {
  fail(`EXPO_PUBLIC_APP_ENV=production olmalı (şu an: ${env.EXPO_PUBLIC_APP_ENV || '(yok)'})`);
} else {
  ok('EXPO_PUBLIC_APP_ENV=production');
}

const geminiKey = env.EXPO_PUBLIC_GEMINI_API_KEY || '';
if (geminiKey.length < 10) {
  fail('EXPO_PUBLIC_GEMINI_API_KEY gerekli (Google AI Studio)');
} else {
  ok(`EXPO_PUBLIC_GEMINI_API_KEY tanımlı (${geminiKey.slice(0, 8)}…)`);
}

if (env.EXPO_PUBLIC_DATA_BACKEND !== 'firebase') {
  fail('EXPO_PUBLIC_DATA_BACKEND=firebase olmalı');
} else {
  ok('Firebase veri katmanı');
}

if (!env.EXPO_PUBLIC_FIREBASE_API_KEY || !env.EXPO_PUBLIC_FIREBASE_APP_ID) {
  fail('EXPO_PUBLIC_FIREBASE_* eksik');
} else {
  ok('Firebase client config');
}

if (failed) {
  console.error('\nDüzeltme: cp apps/mobile/.env.production apps/mobile/.env\n');
  process.exit(1);
}

console.log('\nMağaza build için hazır (Gemini doğrudan mobil).\n');
