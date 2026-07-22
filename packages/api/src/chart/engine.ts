import * as Astronomy from 'astronomy-engine';
import type {
  Aspect,
  BirthInput,
  ChartData,
  PlanetName,
  PlanetPosition,
  SynastryAspect,
  SynastryResult,
  ZodiacSign,
} from '@asto/shared';
import { SIGNS_TR } from '@asto/shared';

const PLANETS: { name: PlanetName; body: Astronomy.Body }[] = [
  { name: 'Sun', body: Astronomy.Body.Sun },
  { name: 'Moon', body: Astronomy.Body.Moon },
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus', body: Astronomy.Body.Venus },
  { name: 'Mars', body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', body: Astronomy.Body.Saturn },
  { name: 'Uranus', body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto', body: Astronomy.Body.Pluto },
];

const ASPECT_DEFS: { type: Aspect['type']; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'opposition', angle: 180, orb: 8 },
  { type: 'trine', angle: 120, orb: 7 },
  { type: 'square', angle: 90, orb: 7 },
  { type: 'sextile', angle: 60, orb: 5 },
];

function normalizeLongitude(lon: number): number {
  let x = lon % 360;
  if (x < 0) x += 360;
  return x;
}

function longitudeToSign(lon: number): { sign: ZodiacSign; signDegree: number } {
  const n = normalizeLongitude(lon);
  const idx = Math.floor(n / 30) % 12;
  return { sign: SIGNS_TR[idx] as ZodiacSign, signDegree: n % 30 };
}

function angleDiff(a: number, b: number): number {
  let d = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  if (d > 180) d = 360 - d;
  return d;
}

/** Approximate timezone offset hours for common zones (fallback without tzdb). */
function timezoneOffsetHours(timezone: string, date: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = fmt.formatToParts(date);
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const m = tz.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!m) return 3; // Turkey default
    const sign = m[1] === '-' ? -1 : 1;
    const h = Number(m[2]);
    const min = Number(m[3] ?? 0);
    return sign * (h + min / 60);
  } catch {
    return 3;
  }
}

function birthToUtc(birth: BirthInput): Date {
  const [y, mo, d] = birth.birthDate.split('-').map(Number);
  const [hh, mm] = birth.birthTime.split(':').map(Number);
  const localAsUtc = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
  const offset = timezoneOffsetHours(birth.timezone, localAsUtc);
  return new Date(localAsUtc.getTime() - offset * 3600_000);
}

/** Local sidereal time in degrees */
function localSiderealTimeDegrees(date: Date, longitude: number): number {
  const jd = Astronomy.MakeTime(date).ut + 2451545.0;
  const T = (jd - 2451545.0) / 36525;
  let gst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  gst = normalizeLongitude(gst);
  return normalizeLongitude(gst + longitude);
}

function obliquityDegrees(date: Date): number {
  const T = (Astronomy.MakeTime(date).ut) / 36525;
  return 23.439291 - 0.0130042 * T;
}

function calculateAscMc(date: Date, lat: number, lon: number): { asc: number; mc: number } {
  const lst = localSiderealTimeDegrees(date, lon);
  const eps = (obliquityDegrees(date) * Math.PI) / 180;
  const ramc = (lst * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;

  const y = Math.cos(ramc);
  const x = -Math.sin(ramc) * Math.cos(eps);
  const mc = normalizeLongitude((Math.atan2(y, x) * 180) / Math.PI);

  const sinEps = Math.sin(eps);
  const cosEps = Math.cos(eps);
  const yAsc = -Math.cos(ramc);
  const xAsc = Math.sin(ramc) * cosEps + Math.tan(phi) * sinEps;
  const asc = normalizeLongitude((Math.atan2(yAsc, xAsc) * 180) / Math.PI);

  return { asc, mc };
}

function wholeSignHouses(ascLongitude: number): number[] {
  const ascSignStart = Math.floor(normalizeLongitude(ascLongitude) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => normalizeLongitude(ascSignStart + i * 30));
}

function houseForLongitude(lon: number, houses: number[]): number {
  const n = normalizeLongitude(lon);
  const signIndex = Math.floor(n / 30);
  const firstSign = Math.floor(houses[0] / 30);
  return ((signIndex - firstSign + 12) % 12) + 1;
}

function geoEclipticLongitude(body: Astronomy.Body, date: Date): number {
  const time = Astronomy.MakeTime(date);
  if (body === Astronomy.Body.Moon) {
    return normalizeLongitude(Astronomy.EclipticGeoMoon(time).lon);
  }
  const vec = Astronomy.GeoVector(body, time, true);
  return normalizeLongitude(Astronomy.Ecliptic(vec).elon);
}

function isRetrograde(body: Astronomy.Body, date: Date): boolean {
  if (body === Astronomy.Body.Sun || body === Astronomy.Body.Moon) return false;
  try {
    const lon0 = geoEclipticLongitude(body, date);
    const lon1 = geoEclipticLongitude(body, new Date(date.getTime() + 24 * 3600_000));
    let d = lon1 - lon0;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d < 0;
  } catch {
    return false;
  }
}

function computeAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (a.name === 'Ascendant' || a.name === 'Midheaven') continue;
      if (b.name === 'Ascendant' || b.name === 'Midheaven') continue;
      const diff = angleDiff(a.longitude, b.longitude);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            planetA: a.name,
            planetB: b.name,
            type: def.type,
            orb: Number(orb.toFixed(2)),
          });
          break;
        }
      }
    }
  }
  return aspects.sort((x, y) => x.orb - y.orb);
}

export function computeNatalChart(birth: BirthInput): ChartData {
  const utc = birthToUtc(birth);
  const { asc, mc } = calculateAscMc(utc, birth.latitude, birth.longitude);
  const houses = wholeSignHouses(asc);

  const planets: PlanetPosition[] = PLANETS.map(({ name, body }) => {
    const lon = geoEclipticLongitude(body, utc);
    const { sign, signDegree } = longitudeToSign(lon);
    return {
      name,
      longitude: Number(lon.toFixed(4)),
      sign,
      signDegree: Number(signDegree.toFixed(2)),
      house: houseForLongitude(lon, houses),
      retrograde: isRetrograde(body, utc),
    };
  });

  const ascPos = longitudeToSign(asc);
  planets.push({
    name: 'Ascendant',
    longitude: Number(asc.toFixed(4)),
    sign: ascPos.sign,
    signDegree: Number(ascPos.signDegree.toFixed(2)),
    house: 1,
  });

  const mcPos = longitudeToSign(mc);
  planets.push({
    name: 'Midheaven',
    longitude: Number(mc.toFixed(4)),
    sign: mcPos.sign,
    signDegree: Number(mcPos.signDegree.toFixed(2)),
    house: 10,
  });

  const sun = planets.find((p) => p.name === 'Sun')!;
  const moon = planets.find((p) => p.name === 'Moon')!;

  return {
    planets,
    houses,
    aspects: computeAspects(planets),
    sunSign: sun.sign,
    moonSign: moon.sign,
    risingSign: ascPos.sign,
  };
}

export function computeTransits(date = new Date()): PlanetPosition[] {
  return PLANETS.map(({ name, body }) => {
    const lon = geoEclipticLongitude(body, date);
    const { sign, signDegree } = longitudeToSign(lon);
    return {
      name,
      longitude: Number(lon.toFixed(4)),
      sign,
      signDegree: Number(signDegree.toFixed(2)),
      house: 0,
      retrograde: isRetrograde(body, date),
    };
  });
}

export function computeSynastry(self: ChartData, partner: ChartData): SynastryResult {
  const aspects: SynastryAspect[] = [];
  const selfPlanets = self.planets.filter((p) => !['Ascendant', 'Midheaven'].includes(p.name));
  const partnerPlanets = partner.planets.filter((p) => !['Ascendant', 'Midheaven'].includes(p.name));

  for (const a of selfPlanets) {
    for (const b of partnerPlanets) {
      const diff = angleDiff(a.longitude, b.longitude);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            planetA: a.name,
            personA: 'self',
            planetB: b.name,
            personB: 'partner',
            type: def.type,
            orb: Number(orb.toFixed(2)),
          });
          break;
        }
      }
    }
  }

  const weights: Record<Aspect['type'], number> = {
    conjunction: 10,
    trine: 8,
    sextile: 6,
    opposition: 4,
    square: 2,
  };

  let raw = 40;
  for (const asp of aspects) {
    const personal =
      ['Sun', 'Moon', 'Venus', 'Mars'].includes(asp.planetA) ||
      ['Sun', 'Moon', 'Venus', 'Mars'].includes(asp.planetB);
    raw += (weights[asp.type] ?? 0) * (personal ? 1.2 : 0.7) - asp.orb * 0.3;
  }

  const score = Math.max(35, Math.min(98, Math.round(raw)));

  const highlights: string[] = [];
  if (self.sunSign === partner.sunSign) highlights.push('Aynı Güneş burcu — benzer yaşam ritmi');
  if (self.moonSign === partner.moonSign) highlights.push('Aynı Ay burcu — duygusal dil uyumu');
  if (self.risingSign === partner.risingSign) highlights.push('Aynı yükselen — dünyaya benzer bakış');

  const venusMars = aspects.find(
    (a) =>
      (a.planetA === 'Venus' && a.planetB === 'Mars') ||
      (a.planetA === 'Mars' && a.planetB === 'Venus'),
  );
  if (venusMars) highlights.push(`Venüs–Mars ${venusMars.type}: çekim ve tutku dinamiği`);

  const sunMoon = aspects.find(
    (a) =>
      (a.planetA === 'Sun' && a.planetB === 'Moon') ||
      (a.planetA === 'Moon' && a.planetB === 'Sun'),
  );
  if (sunMoon) highlights.push(`Güneş–Ay ${sunMoon.type}: temel bağ ve tamamlayıcılık`);

  if (highlights.length === 0) {
    highlights.push('Haritalar arasında çok sayıda açı var; dinamik bir ilişki potansiyeli');
  }

  return {
    score,
    aspects: aspects.sort((a, b) => a.orb - b.orb).slice(0, 24),
    highlights,
  };
}

export function chartSummaryForPrompt(chart: ChartData, label = 'Natal'): string {
  const lines = chart.planets.map(
    (p) =>
      `${p.name}: ${p.sign} ${p.signDegree.toFixed(1)}° (ev ${p.house})${p.retrograde ? ' R' : ''}`,
  );
  const aspects = chart.aspects
    .slice(0, 12)
    .map((a) => `${a.planetA}-${a.planetB} ${a.type} (orb ${a.orb}°)`)
    .join('; ');
  return [
    `${label}: Güneş ${chart.sunSign}, Ay ${chart.moonSign}, Yükselen ${chart.risingSign}`,
    lines.join('\n'),
    `Açılar: ${aspects}`,
  ].join('\n');
}
