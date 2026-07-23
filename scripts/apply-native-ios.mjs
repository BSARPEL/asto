#!/usr/bin/env node
import { copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchPbxproj, patchXcscheme } from './lib/native-ios-standalone.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEMPLATE_DIR = join(ROOT, 'apps/mobile/native-ios');
const IOS_DIR = join(ROOT, 'apps/mobile/ios');

if (!existsSync(IOS_DIR)) {
  console.error('[native-ios] ios/ yok — önce: npm run ios:prebuild');
  process.exit(1);
}

const staleWorkspace = join(IOS_DIR, 'Asto.xcworkspace');
if (existsSync(staleWorkspace)) {
  rmSync(staleWorkspace, { recursive: true, force: true });
  console.log('[native-ios] Removed stale Asto.xcworkspace');
}

for (const name of ['.xcode.env.local', '.xcode.env.updates']) {
  const src = join(TEMPLATE_DIR, name);
  const dest = join(IOS_DIR, name);
  if (!existsSync(src)) continue;
  copyFileSync(src, dest);
  console.log(`[native-ios] ${dest}`);
}

if (patchPbxproj(IOS_DIR)) console.log('[native-ios] Bundle script → production embed (no Metro ip.txt)');
if (patchXcscheme(IOS_DIR)) console.log('[native-ios] Scheme Run → Release (no Debug Metro)');

console.log('[native-ios] Standalone iOS ready (embedded main.jsbundle, no Metro)');
