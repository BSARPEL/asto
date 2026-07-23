#!/usr/bin/env node
/**
 * Copies native-ios templates into apps/mobile/ios after prebuild.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEMPLATE_DIR = join(ROOT, 'apps/mobile/native-ios');
const IOS_DIR = join(ROOT, 'apps/mobile/ios');

if (!existsSync(IOS_DIR)) {
  console.error('[native-ios] ios/ yok — önce: cd apps/mobile && npx expo prebuild -p ios');
  process.exit(1);
}

const files = ['.xcode.env.local', '.xcode.env.updates'];
for (const name of files) {
  const src = join(TEMPLATE_DIR, name);
  const dest = join(IOS_DIR, name);
  if (!existsSync(src)) continue;
  copyFileSync(src, dest);
  console.log(`[native-ios] ${dest}`);
}

console.log('[native-ios] Metro kapalı native build hazır (SKIP_BUNDLING=0)');
