#!/usr/bin/env node
/**
 * Cursor afterFileEdit hook — ilgili dosya değişince otomatik sync.
 */
import { readFileSync } from 'node:fs';
import {
  ROOT,
  log,
  buildShared,
  syncIos,
  classifyPath,
  debounceSharedBuild,
  debounceIosSync,
} from './lib/sync-utils.mjs';

const input = readFileSync(0, 'utf8');
let filePath = '';
try {
  const data = JSON.parse(input || '{}');
  filePath = data.file_path || data.path || data.filePath || '';
} catch {
  process.exit(0);
}

if (!filePath) process.exit(0);

const abs = filePath.startsWith('/') ? filePath : `${ROOT}/${filePath}`;
const kind = classifyPath(abs);
if (!kind) process.exit(0);

// Hook must exit quickly — debounce heavy work
if (kind === 'shared') {
  debounceSharedBuild(() => {
    buildShared().catch((e) => log('hook', `shared: ${e.message}`));
  });
} else if (kind === 'ios') {
  debounceIosSync(() => {
    syncIos().catch((e) => log('hook', `ios: ${e.message}`));
  });
}

// api: tsx watch handles itself; mobile js: metro fast refresh
process.exit(0);
