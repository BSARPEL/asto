import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '../..');
export const CACHE_DIR = join(ROOT, '.asto');

export function log(tag, msg) {
  const ts = new Date().toLocaleTimeString('tr-TR', { hour12: false });
  console.log(`[${ts}] [${tag}] ${msg}`);
}

export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? ROOT,
      stdio: opts.silent ? 'pipe' : 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, ...opts.env },
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

export function hashFiles(paths) {
  const h = createHash('sha256');
  for (const p of paths) {
    if (existsSync(p)) h.update(readFileSync(p));
  }
  return h.digest('hex');
}

export function readCache(name) {
  const p = join(CACHE_DIR, name);
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : '';
}

export function writeCache(name, value) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(join(CACHE_DIR, name), value);
}

let sharedTimer;
let iosTimer;

export function debounceSharedBuild(fn, ms = 400) {
  clearTimeout(sharedTimer);
  sharedTimer = setTimeout(fn, ms);
}

export function debounceIosSync(fn, ms = 1500) {
  clearTimeout(iosTimer);
  iosTimer = setTimeout(fn, ms);
}

export const IOS_HASH_FILES = [
  join(ROOT, 'apps/mobile/app.json'),
  join(ROOT, 'apps/mobile/package.json'),
  join(ROOT, 'package-lock.json'),
];

export function needsIosSync() {
  const next = hashFiles(IOS_HASH_FILES);
  const prev = readCache('ios-sync.hash');
  return next !== prev;
}

export async function buildShared() {
  log('sync', 'Building @asto/shared…');
  await run('npm', ['run', 'build', '--workspace=@asto/shared'], { silent: false });
  log('sync', '@asto/shared build OK');
}

export async function syncIos({ force = false } = {}) {
  const next = hashFiles(IOS_HASH_FILES);
  const prev = readCache('ios-sync.hash');
  if (!force && next === prev) {
    log('sync', 'iOS native — değişiklik yok, atlanıyor');
    return false;
  }

  log('sync', 'iOS native — prebuild + pod install…');
  await run('npx', ['expo', 'prebuild', '-p', 'ios', '--no-install'], {
    cwd: join(ROOT, 'apps/mobile'),
  });
  await run('pod', ['install'], { cwd: join(ROOT, 'apps/mobile/ios') });
  writeCache('ios-sync.hash', next);
  log('sync', 'iOS native sync OK — Xcode’da ⌘R yeterli (native değiştiyse)');
  return true;
}

export function classifyPath(filePath) {
  const rel = filePath.replace(ROOT + '/', '').replace(/\\/g, '/');
  if (rel.startsWith('packages/shared/')) return 'shared';
  if (rel === 'apps/mobile/app.json' || rel === 'apps/mobile/package.json') return 'ios';
  if (rel === 'package-lock.json') return 'ios';
  if (rel.startsWith('packages/api/')) return 'api';
  if (rel.startsWith('apps/mobile/')) return 'mobile';
  return null;
}
