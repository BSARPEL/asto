#!/usr/bin/env node
/**
 * Deploy Firestore composite indexes to bnastro via Admin REST API
 * (same service account as rules deploy — avoids firebase CLI IAM gaps).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECT_ID = 'bn-astro';
const DATABASE_ID = 'bnastro';
const INDEXES_PATH = join(ROOT, 'firebase', 'firestore.indexes.json');
const SA_PATH = join(ROOT, 'packages', 'api', '.secrets', 'firebase-adminsdk.json');

const { indexes } = JSON.parse(readFileSync(INDEXES_PATH, 'utf8'));

const auth = new GoogleAuth({
  keyFile: SA_PATH,
  scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore'],
});

async function api(method, url, body) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function indexKey(idx) {
  return `${idx.collectionGroup}|${idx.fields.map((f) => `${f.fieldPath}:${f.order}`).join(',')}`;
}

async function listExisting() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/collectionGroups/-/indexes`;
  const { ok, status, data } = await api('GET', url);
  if (!ok) {
    // Fallback: empty list if endpoint shape differs
    console.warn('[indexes] list warning', status, JSON.stringify(data).slice(0, 200));
    return [];
  }
  return data.indexes || [];
}

async function createIndex(idx) {
  const parent = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/collectionGroups/${idx.collectionGroup}`;
  const url = `https://firestore.googleapis.com/v1/${parent}/indexes`;
  const body = {
    queryScope: idx.queryScope || 'COLLECTION',
    fields: idx.fields.map((f) => ({
      fieldPath: f.fieldPath,
      order: f.order,
    })),
  };
  return api('POST', url, body);
}

async function main() {
  if (!Array.isArray(indexes) || indexes.length === 0) {
    console.log('[indexes] No indexes to deploy');
    return;
  }

  console.log(`[indexes] Deploying ${indexes.length} index(es) to ${DATABASE_ID}…`);
  const existing = await listExisting();
  const existingKeys = new Set(
    existing.map((e) =>
      indexKey({
        collectionGroup: e.name?.split('/collectionGroups/')[1]?.split('/')[0] || '',
        fields: (e.fields || []).filter((f) => f.fieldPath !== '__name__'),
      }),
    ),
  );

  for (const idx of indexes) {
    const key = indexKey(idx);
    if (existingKeys.has(key)) {
      console.log('[indexes] exists', key);
      continue;
    }
    const { ok, status, data } = await createIndex(idx);
    if (ok || status === 409) {
      console.log('[indexes] OK', key, status === 409 ? '(already exists)' : '');
    } else {
      console.error('[indexes] FAIL', key, status, JSON.stringify(data));
      process.exitCode = 1;
    }
  }

  console.log('[indexes] Done. Composite indexes may take a few minutes to build in Console.');
}

main().catch((e) => {
  console.error('[indexes] Deploy failed:', e.message);
  process.exit(1);
});
