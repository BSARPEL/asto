#!/usr/bin/env node
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IOS_DIR = join(__dirname, '..', 'apps/mobile/ios');

const STALE = ['Asto.xcworkspace', 'Asto.xcodeproj'];

function cleanupStaleIosProjects() {
  if (!existsSync(IOS_DIR)) return;

  for (const name of STALE) {
    const path = join(IOS_DIR, name);
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
      console.log(`[ios-open] Removed stale ${name}`);
    }
  }
}

function findWorkspace() {
  if (!existsSync(IOS_DIR)) {
    console.error('[ios-open] ios/ yok — önce: npm run ios:prebuild');
    process.exit(1);
  }

  cleanupStaleIosProjects();

  const workspaces = readdirSync(IOS_DIR).filter(
    (f) => f.endsWith('.xcworkspace') && !f.startsWith('project.'),
  );
  const preferred = workspaces.find((f) => f === 'BNAstro.xcworkspace') || workspaces[0];
  if (!preferred) {
    console.error('[ios-open] .xcworkspace bulunamadı — npm run ios:prebuild');
    process.exit(1);
  }

  return join(IOS_DIR, preferred);
}

function quitXcode() {
  const script =
    'tell application "System Events" to (name of processes) contains "Xcode"';
  const running = spawnSync('osascript', ['-e', script], { encoding: 'utf8' });
  if (running.stdout?.trim() !== 'true') return;

  console.log('[ios-open] Closing Xcode (Pods duplicate fix)...');
  spawnSync('osascript', ['-e', 'tell application "Xcode" to quit'], { stdio: 'inherit' });
  spawnSync('sleep', ['2']);
}

const workspace = findWorkspace();
quitXcode();

console.log('[ios-open] Opening workspace only (never open Pods.xcodeproj directly):');
console.log(`  ${workspace}`);

const result = spawnSync('open', [workspace], { stdio: 'inherit' });
process.exit(result.status ?? 1);
