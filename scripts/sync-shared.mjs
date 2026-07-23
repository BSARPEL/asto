#!/usr/bin/env node
import { buildShared } from './lib/sync-utils.mjs';

buildShared().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
