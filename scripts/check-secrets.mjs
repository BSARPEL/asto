#!/usr/bin/env node
/**
 * Staged / tracked dosyalarda sızan Gemini anahtarlarını tespit eder.
 * Kullanım: npm run check:secrets
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PATTERNS = [
  {
    name: 'Gemini AI Studio (AQ.)',
    regex: /(?:^|[\s"'`=])(AQ\.[A-Za-z0-9_-]{24,})/m,
  },
  {
    name: 'EXPO_PUBLIC_GEMINI_API_KEY dolu',
    regex: /^EXPO_PUBLIC_GEMINI_API_KEY=(?!#?\s*$)(.+)$/m,
  },
  {
    name: 'GEMINI_API_KEY dolu (.env)',
    regex: /^GEMINI_API_KEY=(?!#?\s*$|example|your|<).+$/m,
  },
];

const IGNORE = new Set([
  'scripts/check-secrets.mjs',
  'docs/SECRETS.md',
  'packages/shared/src/ai/index.ts',
]);

function gitStagedFiles() {
  const r = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.status !== 0) return [];
  return r.stdout
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

function scanFile(relPath, content) {
  const hits = [];
  for (const { name, regex } of PATTERNS) {
    const m = content.match(regex);
    if (m) hits.push({ pattern: name, sample: (m[1] || m[0]).slice(0, 12) + '…' });
  }
  return hits;
}

const files = gitStagedFiles();
let failed = false;

if (files.length === 0) {
  console.log('[check-secrets] Staged dosya yok — atlanıyor.');
  process.exit(0);
}

for (const rel of files) {
  if (IGNORE.has(rel)) continue;
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) continue;
  let content;
  try {
    content = readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  const hits = scanFile(rel, content);
  if (hits.length) {
    failed = true;
    console.error(`\n✗ ${rel}`);
    for (const h of hits) console.error(`    ${h.pattern}: ${h.sample}`);
  }
}

if (failed) {
  console.error(
    '\nGemini anahtarları git\'e commit edilemez. Sunucu: packages/api/.env → npm run deploy:ai-api\n',
  );
  process.exit(1);
}

console.log(`[check-secrets] ✓ ${files.length} staged dosya temiz.`);
