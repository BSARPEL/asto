#!/usr/bin/env node
/**
 * Sync agent skills from .cursor/skills/ to .qwen, .claude, and .agents.
 * Run after editing skills: npm run sync:skills
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, '.cursor', 'skills');
const TARGETS = [
  join(ROOT, '.qwen', 'skills'),
  join(ROOT, '.claude', 'skills'),
  join(ROOT, '.agents', 'skills'),
];

const NESTED = [
  {
    source: join(ROOT, 'apps', 'mobile', '.cursor', 'skills'),
    targets: [
      join(ROOT, 'apps', 'mobile', '.qwen', 'skills'),
      join(ROOT, 'apps', 'mobile', '.claude', 'skills'),
    ],
  },
];

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

function syncTarget(target) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
  copyDir(SOURCE, target);
  console.log(`[sync:skills] ${target.replace(ROOT + '/', '')}`);
}

if (!existsSync(SOURCE)) {
  console.error('[sync:skills] Kaynak yok:', SOURCE);
  process.exit(1);
}

console.log('[sync:skills] Kaynak:', SOURCE);
for (const target of TARGETS) {
  syncTarget(target);
}
for (const { source, targets } of NESTED) {
  if (!existsSync(source)) continue;
  for (const target of targets) {
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
    copyDir(source, target);
    console.log(`[sync:skills] ${target.replace(ROOT + '/', '')}`);
  }
}
console.log('[sync:skills] Tamam.');
