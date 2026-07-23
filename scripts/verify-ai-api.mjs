#!/usr/bin/env node
/** Production AI API health check (Cloud Functions). */
const URL =
  process.env.AI_API_URL ||
  'https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api/health';

const res = await fetch(URL).catch((e) => {
  console.error(`✗ Bağlantı hatası: ${e.message}`);
  console.error('  → npm run deploy:ai-api');
  process.exit(1);
});

if (!res.ok) {
  console.error(`✗ HTTP ${res.status} — astoApi deploy edilmemiş olabilir`);
  console.error('  → npm run deploy:ai-api');
  process.exit(1);
}

const data = await res.json();
console.log(`✓ ${URL}`);
console.log(`  ok=${data.ok} ai=${data.ai} provider=${data.provider} model=${data.model}`);

if (!data.ai) {
  console.error('\n✗ Gemini yapılandırılmamış — packages/api/.env + deploy:ai-api');
  process.exit(1);
}
