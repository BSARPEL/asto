#!/usr/bin/env node
import { syncIos } from './lib/sync-utils.mjs';

const force = process.argv.includes('--force');

syncIos({ force })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
