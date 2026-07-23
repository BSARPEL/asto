#!/usr/bin/env node
/** Shared patches for Metro-free iOS builds */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DEBUG_SKIP_BLOCK =
  'if [[ \\"$CONFIGURATION\\" = *Debug* ]]; then\\n  export SKIP_BUNDLING=1\\nfi\\n';

const RN_XCODE_BACKTICK =
  '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`';

const RN_XCODE_WRAPPER_PREFIX = 'export SKIP_BUNDLING_METRO_IP=1\\nBUNDLE_CONFIG=Release CONFIGURATION=Release ';

export function findIosProject(iosDir) {
  const pbxName = readdirSync(iosDir).find((f) => f.endsWith('.xcodeproj'));
  if (!pbxName) return null;
  const projectName = pbxName.replace(/\.xcodeproj$/, '');
  return { pbxName, projectName };
}

export function patchPbxproj(iosDir) {
  const project = findIosProject(iosDir);
  if (!project) return false;

  const pbxPath = join(iosDir, project.pbxName, 'project.pbxproj');
  if (!existsSync(pbxPath)) return false;

  let pbx = readFileSync(pbxPath, 'utf8');
  let changed = false;

  if (pbx.includes(DEBUG_SKIP_BLOCK)) {
    pbx = pbx.replace(DEBUG_SKIP_BLOCK, '');
    changed = true;
  }

  // Revert custom bundle wrapper — use standard backtick + .xcode.env.local instead
  if (pbx.includes(RN_XCODE_WRAPPER_PREFIX)) {
    pbx = pbx.replace(RN_XCODE_WRAPPER_PREFIX, '');
    changed = true;
  }
  if (pbx.includes('RN_XCODE_SH=')) {
    pbx = pbx.replace(/RN_XCODE_SH=.*CONFIGURATION=Release "\$RN_XCODE_SH"\\n/, `${RN_XCODE_BACKTICK}\n`);
    changed = true;
  }

  if (changed) writeFileSync(pbxPath, pbx);
  return changed;
}

export function patchXcscheme(iosDir) {
  const project = findIosProject(iosDir);
  if (!project) return false;

  const schemePath = join(
    iosDir,
    project.pbxName,
    'xcshareddata',
    'xcschemes',
    `${project.projectName}.xcscheme`,
  );
  if (!existsSync(schemePath)) return false;

  let scheme = readFileSync(schemePath, 'utf8');
  const before = scheme;
  scheme = scheme.replace(
    /<LaunchAction([^>]*)\n\s+buildConfiguration = "Debug"/,
    '<LaunchAction$1\n      buildConfiguration = "Release"',
  );
  if (scheme !== before) {
    writeFileSync(schemePath, scheme);
    return true;
  }
  return false;
}
