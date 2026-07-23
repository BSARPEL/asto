#!/usr/bin/env node
/**
 * Tek komut: API + Metro + dosya izleyici (shared build, iOS prebuild gerektiğinde).
 * Kullanım: npm run dev:all
 * Xcode ile: npm run dev:all (Metro açık kalır) + Xcode ⌘R
 */
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import {
  ROOT,
  log,
  buildShared,
  syncIos,
  debounceSharedBuild,
  debounceIosSync,
  needsIosSync,
} from './lib/sync-utils.mjs';

const children = [];

function spawnBg(label, cmd, args, cwd = ROOT) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  children.push(child);
  child.on('exit', (code) => {
    if (code && code !== 0) log(label, `çıktı (kod ${code})`);
  });
  log('dev', `${label} başlatıldı`);
  return child;
}

async function main() {
  log('dev', 'Asto geliştirme ortamı…');

  await buildShared().catch((e) => log('warn', `shared build: ${e.message}`));

  if (needsIosSync()) {
    await syncIos().catch((e) => log('warn', `ios sync: ${e.message}`));
  }

  spawnBg('api', 'npm', ['run', 'api']);
  spawnBg('metro', 'npm', ['run', 'mobile']);

  const sharedSrc = join(ROOT, 'packages/shared/src');
  watch(sharedSrc, { recursive: true }, (_evt, file) => {
    if (file && !file.endsWith('.ts')) return;
    debounceSharedBuild(() => {
      buildShared().catch((e) => log('warn', `shared: ${e.message}`));
    });
  });
  log('watch', 'packages/shared/src');

  const mobileDir = join(ROOT, 'apps/mobile');
  for (const name of ['app.json', 'package.json']) {
    watch(join(mobileDir, name), () => {
      debounceIosSync(() => {
        syncIos().catch((e) => log('warn', `ios: ${e.message}`));
      });
    });
  }
  watch(join(ROOT, 'package-lock.json'), () => {
    debounceIosSync(() => {
      syncIos().catch((e) => log('warn', `ios: ${e.message}`));
    });
  });
  log('watch', 'apps/mobile/app.json, package.json, package-lock.json');

  log('dev', 'Hazır — JS değişiklikleri Metro ile yansır; Xcode’dan ⌘R (Metro açıkken)');
  log('dev', 'Durdurmak: Ctrl+C');

  const shutdown = () => {
    log('dev', 'Kapatılıyor…');
    for (const c of children) c.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
