#!/usr/bin/env node
/**
 * apps/mobile/.env dosyasını process.env'ye yükler (xcodebuild / archive için).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const MOBILE_ENV_PATH = join(__dirname, '..', 'apps/mobile/.env');

export function parseEnvFile(path) {
  const env = {};
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

/** .env değerlerini mevcut process.env üzerine yazar ve birleşik env döner. */
export function loadMobileEnv(path = MOBILE_ENV_PATH) {
  const parsed = parseEnvFile(path);
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
  return { ...process.env, ...parsed };
}
