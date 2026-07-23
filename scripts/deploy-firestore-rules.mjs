#!/usr/bin/env node
/**
 * Deploy Firestore security rules to bnastro database.
 * Uses packages/api service account (same as API server).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECT_ID = 'bn-astro';
const DATABASE_ID = 'bnastro';
const RULES_PATH = join(ROOT, 'firebase', 'firestore.rules');
const SA_PATH = join(ROOT, 'packages', 'api', '.secrets', 'firebase-adminsdk.json');

const rulesContent = readFileSync(RULES_PATH, 'utf8');

const auth = new GoogleAuth({
  keyFile: SA_PATH,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

async function api(path, options = {}) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const res = await fetch(`https://firebaserules.googleapis.com/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('[rules] Creating ruleset…');
  const ruleset = await api(`projects/${PROJECT_ID}/rulesets`, {
    method: 'POST',
    body: JSON.stringify({
      source: {
        files: [{ name: 'firestore.rules', content: rulesContent }],
      },
    }),
  });

  const rulesetName = ruleset.name;
  console.log('[rules] Ruleset:', rulesetName);

  const releaseName = `projects/${PROJECT_ID}/releases/cloud.firestore/${DATABASE_ID}`;
  console.log('[rules] Releasing to', releaseName);

  try {
    await api(`${releaseName}`, {
      method: 'PATCH',
      body: JSON.stringify({ release: { name: releaseName, rulesetName } }),
    });
  } catch {
    await api(`projects/${PROJECT_ID}/releases`, {
      method: 'POST',
      body: JSON.stringify({ name: releaseName, rulesetName }),
    });
  }

  console.log('[rules] Deployed successfully to', DATABASE_ID);
}

main().catch((e) => {
  console.error('[rules] Deploy failed:', e.message);
  process.exit(1);
});
