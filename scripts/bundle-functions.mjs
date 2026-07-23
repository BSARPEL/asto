#!/usr/bin/env node
/**
 * Bundle API + functions entry for Firebase deploy (functions/ uploads only lib/).
 */
import * as esbuild from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

await esbuild.build({
  entryPoints: [join(ROOT, 'functions/src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: join(ROOT, 'functions/lib/index.js'),
  format: 'cjs',
  sourcemap: true,
  external: ['firebase-admin', 'firebase-functions'],
  logLevel: 'info',
});

console.log('[bundle-functions] OK → functions/lib/index.js');
