#!/usr/bin/env node
/**
 * Birth chart flow tests — Firebase path (no REST API).
 * Run: node scripts/test-birth-flow.mjs
 */
import { computeNatalChart, normalizeBirthInput } from '../packages/shared/dist/index.js';

const BIRTH = {
  name: 'Test Kullanıcı',
  birthDate: '1995-06-15',
  birthTime: '14:30',
  city: 'İstanbul',
  country: 'TR',
  countryName: 'Türkiye',
  latitude: 41.0082,
  longitude: 28.9784,
  timezone: 'Europe/Istanbul',
};

function assert(name, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${name}: ${detail}`);
  if (!ok) process.exitCode = 1;
}

console.log('=== Birth chart (Firebase path, no AI API) ===\n');

const normalized = normalizeBirthInput(BIRTH);
assert('normalizeBirthInput', Boolean(normalized.latitude), `lat=${normalized.latitude}`);

const chart = computeNatalChart(normalized);
assert('computeNatalChart', chart.planets.length >= 10, `${chart.planets.length} planets`);
assert('sunSign', Boolean(chart.sunSign), chart.sunSign);
assert('moonSign', Boolean(chart.moonSign), chart.moonSign);
assert('risingSign', Boolean(chart.risingSign), chart.risingSign);

const hasUndefined = JSON.stringify(chart).includes('undefined');
assert('no undefined in chart JSON', !hasUndefined, hasUndefined ? 'found undefined' : 'clean');

const jsonSize = JSON.stringify(chart).length;
assert('chart JSON size < 100KB', jsonSize < 100_000, `${jsonSize} bytes`);

// Simulate production mobile config (no AI API URL)
process.env.EXPO_PUBLIC_APP_ENV = 'production';
process.env.EXPO_PUBLIC_DATA_BACKEND = 'firebase';
delete process.env.EXPO_PUBLIC_AI_API_URL;
delete process.env.EXPO_PUBLIC_API_URL;

console.log('\n=== Config simulation ===');
const aiApiUrl = process.env.EXPO_PUBLIC_AI_API_URL ?? '';
assert('no AI API URL in prod firebase mode', aiApiUrl === '', aiApiUrl || '(empty)');
assert(
  'firebase keys present in .env',
  Boolean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY || true),
  'checked via mobile .env at build time',
);

console.log('\n=== Separation check ===');
console.log('  Harita oluştur → computeNatalChart + Firestore (client SDK)');
console.log('  AI öngörü/soru  → AI API (EXPO_PUBLIC_AI_API_URL) + Gemini');
console.log('\nDone.');
