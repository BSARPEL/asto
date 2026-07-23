#!/usr/bin/env node
/**
 * GeoNames cities15000 → country-grouped JSON for @asto/shared
 * Source: https://download.geonames.org/export/dump/cities15000.zip (CC BY 4.0)
 */
import { execSync } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'packages/shared/src/data');
const OUT_FILE = join(OUT_DIR, 'world-cities.json');
const TMP = join(ROOT, '.asto/cities-build');
const ZIP_URL = 'https://download.geonames.org/export/dump/cities15000.zip';

/** @type {Map<string, string>} */
const countryNames = new Map();

const COUNTRY_NAMES_TR = {
  TR: 'Türkiye',
  US: 'Amerika Birleşik Devletleri',
  GB: 'Birleşik Krallık',
  DE: 'Almanya',
  FR: 'Fransa',
  NL: 'Hollanda',
  IT: 'İtalya',
  ES: 'İspanya',
  GR: 'Yunanistan',
  AZ: 'Azerbaycan',
  CY: 'Kıbrıs',
};

function displayCountryName(code, englishName) {
  return COUNTRY_NAMES_TR[code] ?? englishName;
}

function loadCountryNames() {
  const raw = execSync(`curl -fsSL "https://download.geonames.org/export/dump/countryInfo.txt"`, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  for (const line of raw.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    countryNames.set(parts[0], parts[4]);
  }
}

async function downloadZip(dest) {
  const res = await fetch(ZIP_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function parseCities(txt) {
  /** @type {Record<string, [string, number, number, string, number][]>} */
  const byCountry = {};
  const seen = new Set();
  let total = 0;

  for (const line of txt.split('\n')) {
    if (!line) continue;
    const c = line.split('\t');
    if (c.length < 18) continue;
    const name = c[1];
    const lat = Number(c[4]);
    const lng = Number(c[5]);
    const country = c[8];
    const pop = Number(c[14]) || 0;
    const tz = c[17];
    if (!name || !tz || !country || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const key = `${country}|${name.toLowerCase()}|${lat.toFixed(2)}|${lng.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (!byCountry[country]) byCountry[country] = [];
    byCountry[country].push([
      name,
      Math.round(lat * 10000) / 10000,
      Math.round(lng * 10000) / 10000,
      tz,
      pop,
    ]);
    total += 1;
  }

  for (const code of Object.keys(byCountry)) {
    byCountry[code].sort((a, b) => b[4] - a[4]);
  }

  return { byCountry, total };
}

async function main() {
  console.log('Downloading GeoNames cities15000…');
  mkdirSync(TMP, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  loadCountryNames();
  const zipPath = join(TMP, 'cities15000.zip');
  await downloadZip(zipPath);

  execSync(`unzip -o -q "${zipPath}" -d "${TMP}"`);
  const txt = readFileSync(join(TMP, 'cities15000.txt'), 'utf8');
  const { byCountry, total } = parseCities(txt);

  const countries = {};
  for (const [code, cities] of Object.entries(byCountry)) {
    const english = countryNames.get(code) ?? code;
    countries[code] = {
      name: displayCountryName(code, english),
      cities,
    };
  }

  const payload = {
    source: 'GeoNames cities15000 (CC BY 4.0)',
    updated: new Date().toISOString().slice(0, 10),
    count: total,
    countries,
  };

  writeFileSync(OUT_FILE, JSON.stringify(payload));
  const mb = (Buffer.byteLength(JSON.stringify(payload)) / 1024 / 1024).toFixed(2);
  console.log(
    `Wrote ${total} cities in ${Object.keys(countries).length} countries → ${OUT_FILE} (${mb} MB)`,
  );

  rmSync(TMP, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
