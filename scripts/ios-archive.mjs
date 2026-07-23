#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { loadMobileEnv } from './load-mobile-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IOS_DIR = join(__dirname, '..', 'apps/mobile/ios');

function findIosTarget() {
  if (!existsSync(IOS_DIR)) {
    console.error('[ios-archive] ios/ yok — önce: npm run ios:prebuild');
    process.exit(1);
  }

  const workspace = readdirSync(IOS_DIR).find((f) => f.endsWith('.xcworkspace'));
  if (!workspace) {
    console.error('[ios-archive] .xcworkspace bulunamadı');
    process.exit(1);
  }

  const projectName = basename(workspace, '.xcworkspace');
  const schemePath = join(IOS_DIR, `${projectName}.xcodeproj`, 'xcshareddata', 'xcschemes', `${projectName}.xcscheme`);
  if (!existsSync(schemePath)) {
    const schemesDir = join(IOS_DIR, `${projectName}.xcodeproj`, 'xcshareddata', 'xcschemes');
    const fallback = existsSync(schemesDir)
      ? readdirSync(schemesDir).find((f) => f.endsWith('.xcscheme'))
      : undefined;
    if (!fallback) {
      console.error('[ios-archive] scheme bulunamadı');
      process.exit(1);
    }
    return {
      workspace: join(IOS_DIR, workspace),
      scheme: basename(fallback, '.xcscheme'),
      archivePath: join(process.env.HOME || '', 'Desktop', 'BNAstro.xcarchive'),
    };
  }

  return {
    workspace: join(IOS_DIR, workspace),
    scheme: projectName,
    archivePath: join(process.env.HOME || '', 'Desktop', 'BNAstro.xcarchive'),
  };
}

const { workspace, scheme, archivePath } = findIosTarget();
console.log(`[ios-archive] workspace=${workspace} scheme=${scheme}`);

const buildEnv = loadMobileEnv();
const isProduction = buildEnv.EXPO_PUBLIC_APP_ENV === 'production';
const geminiKey = (buildEnv.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
const geminiLooksValid =
  /^AIza[\w-]{20,}/.test(geminiKey) || /^AQ\.[\w-]{20,}/.test(geminiKey);

if (!geminiKey || !geminiLooksValid) {
  console.error(
    '[ios-archive] HATA: EXPO_PUBLIC_GEMINI_API_KEY gerekli (doğrudan Gemini — Cloud Functions yok).',
  );
  process.exit(1);
}

console.log(
  `[ios-archive] ${isProduction ? 'Production' : 'Dev'}: doğrudan Gemini (${geminiKey.slice(0, 8)}…)`,
);
console.warn('[ios-archive] Gemini anahtarını git\'e commit etmeyin.');

const result = spawnSync(
  'xcodebuild',
  [
    '-workspace',
    workspace,
    '-scheme',
    scheme,
    '-configuration',
    'Release',
    '-destination',
    'generic/platform=iOS',
    '-archivePath',
    archivePath,
    'archive',
  ],
  { stdio: 'inherit', env: buildEnv },
);

process.exit(result.status ?? 1);
