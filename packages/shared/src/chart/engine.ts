import * as Astronomy from 'astronomy-engine';
import type {
  Aspect,
  BirthInput,
  ChartData,
  Gender,
  PlanetName,
  PlanetPosition,
  SynastryAspect,
  SynastryFocusArea,
  SynastryResult,
  ZodiacSign,
} from '../types';
import { ASPECT_LABELS_TR, PLANET_LABELS_TR, SIGNS_TR } from '../constants';

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

const ANGLE_POINTS: PlanetName[] = ['Ascendant', 'Descendant', 'Midheaven'];
const NODE_POINTS: PlanetName[] = ['NorthNode', 'SouthNode'];

/** Mean lunar north node (Meeus), degrees. */
function meanNorthNodeLongitude(date: Date): number {
  const jd = Astronomy.MakeTime(date).ut + 2451545.0;
  const T = (jd - 2451545.0) / 36525;
  const omega =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    (T * T * T) / 467441 -
    (T * T * T * T) / 60616000;
  return normalizeLongitude(omega);
}

function makePoint(
  name: PlanetName,
  lon: number,
  houses: number[],
  house?: number,
): PlanetPosition {
  const { sign, signDegree } = longitudeToSign(lon);
  return {
    name,
    longitude: Number(lon.toFixed(4)),
    sign,
    signDegree: Number(signDegree.toFixed(2)),
    house: house ?? houseForLongitude(lon, houses),
  };
}

function findAspect(
  lonA: number,
  lonB: number,
  orbLimit?: number,
): { type: Aspect['type']; orb: number } | null {
  const diff = angleDiff(lonA, lonB);
  for (const def of ASPECT_DEFS) {
    const orb = Math.abs(diff - def.angle);
    const maxOrb = orbLimit ?? def.orb;
    if (orb <= maxOrb) {
      return { type: def.type, orb: Number(orb.toFixed(2)) };
    }
  }
  return null;
}

function labelPlanet(name: PlanetName): string {
  return PLANET_LABELS_TR[name] ?? name;
}

function labelAspect(type: Aspect['type']): string {
  return ASPECT_LABELS_TR[type] ?? type;
}

function computeAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (ANGLE_POINTS.includes(a.name) || ANGLE_POINTS.includes(b.name)) continue;
      const hit = findAspect(a.longitude, b.longitude);
      if (hit) {
        aspects.push({
          planetA: a.name,
          planetB: b.name,
          type: hit.type,
          orb: hit.orb,
        });
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

  const dsc = normalizeLongitude(asc + 180);
  const northNode = meanNorthNodeLongitude(utc);
  const southNode = normalizeLongitude(northNode + 180);

  planets.push(makePoint('Ascendant', asc, houses, 1));
  planets.push(makePoint('Descendant', dsc, houses, 7));
  planets.push(makePoint('Midheaven', mc, houses, 10));
  planets.push(makePoint('NorthNode', northNode, houses));
  planets.push(makePoint('SouthNode', southNode, houses));

  const sun = planets.find((p) => p.name === 'Sun')!;
  const moon = planets.find((p) => p.name === 'Moon')!;
  const ascPoint = planets.find((p) => p.name === 'Ascendant')!;

  return {
    planets,
    houses,
    aspects: computeAspects(planets),
    sunSign: sun.sign,
    moonSign: moon.sign,
    risingSign: ascPoint.sign,
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

function getPoint(chart: ChartData, name: PlanetName): PlanetPosition | undefined {
  return chart.planets.find((p) => p.name === name);
}

function formatPairAspect(
  leftLabel: string,
  rightLabel: string,
  hit: { type: Aspect['type']; orb: number },
): string {
  return `${leftLabel} – ${rightLabel}: ${labelAspect(hit.type)} (orb ${hit.orb}°)`;
}

function pairAspectFindings(
  chartA: ChartData,
  labelA: string,
  nameA: PlanetName,
  chartB: ChartData,
  labelB: string,
  nameB: PlanetName,
): string[] {
  const a = getPoint(chartA, nameA);
  const b = getPoint(chartB, nameB);
  if (!a || !b) return [];
  const hit = findAspect(a.longitude, b.longitude);
  if (!hit) {
    return [
      `${labelA} ${labelPlanet(nameA)} (${a.sign} ${a.signDegree.toFixed(1)}°) ile ${labelB} ${labelPlanet(nameB)} (${b.sign} ${b.signDegree.toFixed(1)}°) arasında majör açı yok`,
    ];
  }
  return [
    formatPairAspect(
      `${labelA} ${labelPlanet(nameA)} (${a.sign} ${a.signDegree.toFixed(1)}°)`,
      `${labelB} ${labelPlanet(nameB)} (${b.sign} ${b.signDegree.toFixed(1)}°)`,
      hit,
    ),
  ];
}

function overlayOnAngle(
  angleChart: ChartData,
  angleOwnerLabel: string,
  angleName: 'Ascendant' | 'Descendant',
  otherChart: ChartData,
  otherLabel: string,
): string[] {
  const angle = getPoint(angleChart, angleName);
  if (!angle) return [`${angleOwnerLabel} ${labelPlanet(angleName)} hesaplanamadı`];

  const findings: string[] = [];
  const bodies = otherChart.planets.filter((p) => !ANGLE_POINTS.includes(p.name));
  for (const p of bodies) {
    const hit = findAspect(angle.longitude, p.longitude, p.name.includes('Node') ? 6 : 8);
    if (!hit) continue;
    // "üzerinde faktör" primarily means conjunction; keep tight major aspects too
    if (hit.type !== 'conjunction' && hit.orb > 3) continue;
    if (hit.type !== 'conjunction' && hit.type !== 'opposition' && hit.type !== 'square') continue;
    findings.push(
      `${otherLabel} ${labelPlanet(p.name)} (${p.sign} ${p.signDegree.toFixed(1)}°) → ${angleOwnerLabel} ${labelPlanet(angleName)} (${angle.sign} ${angle.signDegree.toFixed(1)}°): ${labelAspect(hit.type)} (orb ${hit.orb}°)`,
    );
  }

  if (findings.length === 0) {
    findings.push(
      `${angleOwnerLabel} ${labelPlanet(angleName)} (${angle.sign} ${angle.signDegree.toFixed(1)}°) üzerinde ${otherLabel} faktörü (kavuşum/yakın açı) yok`,
    );
  }
  return findings.sort();
}

function resolveWomanMan(
  selfGender?: Gender,
  partnerGender?: Gender,
): { woman: 'self' | 'partner'; man: 'self' | 'partner' } | null {
  if (selfGender === 'female' && partnerGender === 'male') {
    return { woman: 'self', man: 'partner' };
  }
  if (selfGender === 'male' && partnerGender === 'female') {
    return { woman: 'partner', man: 'self' };
  }
  return null;
}

function buildSynastryFocusAreas(
  self: ChartData,
  partner: ChartData,
  selfGender?: Gender,
  partnerGender?: Gender,
): SynastryFocusArea[] {
  const roles = resolveWomanMan(selfGender, partnerGender);
  const chartOf = (who: 'self' | 'partner') => (who === 'self' ? self : partner);

  const womanSunManMoon: string[] = roles
    ? pairAspectFindings(
        chartOf(roles.woman),
        'Kadın',
        'Sun',
        chartOf(roles.man),
        'Erkek',
        'Moon',
      )
    : [
        ...pairAspectFindings(self, 'Kişi A', 'Sun', partner, 'Kişi B', 'Moon'),
        ...pairAspectFindings(partner, 'Kişi B', 'Sun', self, 'Kişi A', 'Moon'),
        'Not: Kadın/erkek ataması için her iki kişinin cinsiyeti gerekli; her iki yön de verildi',
      ];

  const moonMoon = pairAspectFindings(self, 'Kişi A', 'Moon', partner, 'Kişi B', 'Moon');
  if (self.moonSign === partner.moonSign) {
    moonMoon.unshift(`Aynı Ay burcu (${self.moonSign}): duygusal dil ortaklığı`);
  }

  const womanMarsManVenus: string[] = roles
    ? pairAspectFindings(
        chartOf(roles.woman),
        'Kadın',
        'Mars',
        chartOf(roles.man),
        'Erkek',
        'Venus',
      )
    : [
        ...pairAspectFindings(self, 'Kişi A', 'Mars', partner, 'Kişi B', 'Venus'),
        ...pairAspectFindings(partner, 'Kişi B', 'Mars', self, 'Kişi A', 'Venus'),
        'Not: Kadın Mars / Erkek Venüs için cinsiyet bilgisi eksik; her iki yön de verildi',
      ];

  const nodeFindings: string[] = [];
  for (const nodeA of NODE_POINTS) {
    for (const nodeB of NODE_POINTS) {
      nodeFindings.push(
        ...pairAspectFindings(self, 'Kişi A', nodeA, partner, 'Kişi B', nodeB).filter(
          (line) => !line.includes('majör açı yok'),
        ),
      );
    }
  }
  // Node to personal planets (both directions)
  const personal: PlanetName[] = ['Sun', 'Moon', 'Venus', 'Mars', 'Mercury'];
  for (const node of NODE_POINTS) {
    for (const planet of personal) {
      nodeFindings.push(
        ...pairAspectFindings(self, 'Kişi A', node, partner, 'Kişi B', planet).filter(
          (line) => !line.includes('majör açı yok'),
        ),
        ...pairAspectFindings(partner, 'Kişi B', node, self, 'Kişi A', planet).filter(
          (line) => !line.includes('majör açı yok'),
        ),
      );
    }
  }
  if (nodeFindings.length === 0) {
    nodeFindings.push('Ay düğümleri arasında veya düğüm–kişisel gezegen majör açısı yok');
  }

  const ascFindings = [
    ...overlayOnAngle(self, 'Kişi A', 'Ascendant', partner, 'Kişi B'),
    ...overlayOnAngle(partner, 'Kişi B', 'Ascendant', self, 'Kişi A'),
  ];
  const dscFindings = [
    ...overlayOnAngle(self, 'Kişi A', 'Descendant', partner, 'Kişi B'),
    ...overlayOnAngle(partner, 'Kişi B', 'Descendant', self, 'Kişi A'),
  ];

  return [
    {
      key: 'woman_sun_man_moon',
      title: 'Kadın Güneş – Erkek Ay',
      findings: womanSunManMoon,
    },
    {
      key: 'moon_moon',
      title: 'Ay – Ay',
      findings: moonMoon,
    },
    {
      key: 'woman_mars_man_venus',
      title: 'Kadın Mars – Erkek Venüs',
      findings: womanMarsManVenus,
    },
    {
      key: 'lunar_nodes',
      title: 'Ay düğümleri',
      findings: nodeFindings.slice(0, 12),
    },
    {
      key: 'asc_overlay',
      title: 'Yükselen (Asc) üzerinde diğer kişinin faktörü',
      findings: ascFindings,
    },
    {
      key: 'dsc_overlay',
      title: 'Alçalan (Dsc) üzerinde diğer kişinin faktörü',
      findings: dscFindings,
    },
  ];
}

const SIGN_ELEMENT: Record<ZodiacSign, 'fire' | 'earth' | 'air' | 'water'> = {
  Koç: 'fire',
  Aslan: 'fire',
  Yay: 'fire',
  Boğa: 'earth',
  Başak: 'earth',
  Oğlak: 'earth',
  İkizler: 'air',
  Terazi: 'air',
  Kova: 'air',
  Yengeç: 'water',
  Akrep: 'water',
  Balık: 'water',
};

function planetPairWeight(a: PlanetName, b: PlanetName): number {
  const weight = (name: PlanetName) => {
    if (name === 'Sun' || name === 'Moon') return 1.5;
    if (name === 'Venus' || name === 'Mars') return 1.35;
    if (name === 'Mercury') return 1.1;
    if (name === 'Jupiter' || name === 'Saturn') return 1.0;
    if (NODE_POINTS.includes(name)) return 0.95;
    return 0.65;
  };
  return weight(a) * weight(b);
}

function orbTightness(orb: number, maxOrb = 8): number {
  return Math.max(0.15, 1 - orb / maxOrb);
}

function scoreSynastryAspects(aspects: SynastryAspect[]): {
  harmony: number;
  tension: number;
  personalPlanets: number;
} {
  const harmonyWeights: Partial<Record<Aspect['type'], number>> = {
    trine: 9,
    sextile: 6.5,
    conjunction: 5,
  };
  const tensionWeights: Partial<Record<Aspect['type'], number>> = {
    square: 6,
    opposition: 4.5,
  };

  let harmony = 0;
  let tension = 0;
  let personalPlanets = 0;
  const personal = new Set<PlanetName>(['Sun', 'Moon', 'Venus', 'Mars']);

  for (const asp of aspects) {
    const pairW = planetPairWeight(asp.planetA, asp.planetB);
    const tight = orbTightness(asp.orb);

    if (harmonyWeights[asp.type]) {
      const pts = (harmonyWeights[asp.type] ?? 0) * pairW * tight;
      harmony += pts;
      if (personal.has(asp.planetA) && personal.has(asp.planetB)) personalPlanets += pts * 0.4;
      else if (personal.has(asp.planetA) || personal.has(asp.planetB)) personalPlanets += pts * 0.2;
    }
    if (tensionWeights[asp.type]) {
      tension += (tensionWeights[asp.type] ?? 0) * pairW * tight;
    }
  }

  return {
    harmony: Math.round(harmony * 10) / 10,
    tension: Math.round(tension * 10) / 10,
    personalPlanets: Math.round(personalPlanets * 10) / 10,
  };
}

function elementCompatibility(a: string, b: string): number {
  if (a === b) return 4;
  const pair = `${a}-${b}`;
  if (pair === 'fire-air' || pair === 'air-fire' || pair === 'earth-water' || pair === 'water-earth') {
    return 3;
  }
  if (pair === 'fire-earth' || pair === 'earth-fire' || pair === 'air-water' || pair === 'water-air') {
    return 1;
  }
  return -1;
}

function scoreElementalBlend(self: ChartData, partner: ChartData): number {
  const sunA = SIGN_ELEMENT[self.sunSign];
  const sunB = SIGN_ELEMENT[partner.sunSign];
  const moonA = SIGN_ELEMENT[self.moonSign];
  const moonB = SIGN_ELEMENT[partner.moonSign];
  const ascA = SIGN_ELEMENT[self.risingSign];
  const ascB = SIGN_ELEMENT[partner.risingSign];

  let score = 0;
  score += elementCompatibility(sunA, sunB) * 1.2;
  score += elementCompatibility(moonA, moonB) * 1.5;
  score += elementCompatibility(ascA, ascB) * 0.8;
  if (self.sunSign === partner.sunSign) score += 2;
  if (self.moonSign === partner.moonSign) score += 3;
  if (self.risingSign === partner.risingSign) score += 2;
  return Math.round(score * 10) / 10;
}

function scoreFocusAreas(focusAreas: SynastryFocusArea[]): number {
  let score = 0;
  const keyBonus: Record<SynastryFocusArea['key'], number> = {
    woman_sun_man_moon: 5,
    moon_moon: 4.5,
    woman_mars_man_venus: 4,
    lunar_nodes: 3.5,
    asc_overlay: 3,
    dsc_overlay: 3,
  };

  for (const area of focusAreas) {
    const positives = area.findings.filter(
      (f) => !f.includes('yok') && !f.startsWith('Not:') && !f.includes('hesaplanamadı'),
    );
    const base = keyBonus[area.key] ?? 2;
    if (positives.length > 0) {
      score += base + Math.min(positives.length - 1, 2) * 1.5;
    } else {
      score -= base * 0.35;
    }
  }

  return Math.round(score * 10) / 10;
}

function scoreAngleOverlays(focusAreas: SynastryFocusArea[]): number {
  let score = 0;
  for (const key of ['asc_overlay', 'dsc_overlay'] as const) {
    const area = focusAreas.find((a) => a.key === key);
    if (!area) continue;
    const hits = area.findings.filter((f) => !f.includes('yok'));
    score += hits.length * 2.5;
  }
  return Math.round(score * 10) / 10;
}

export function synastryScoreBreakdownForPrompt(breakdown: SynastryResult['scoreBreakdown']): string {
  return [
    `Uyumlu açı katkısı: +${breakdown.harmony}`,
    `Gerilim açısı düşüşü: -${breakdown.tension}`,
    `Kişisel gezegen ağırlığı: +${breakdown.personalPlanets}`,
    `6 odak alanı katkısı: ${breakdown.focusAreas >= 0 ? '+' : ''}${breakdown.focusAreas}`,
    `Element / burç uyumu: ${breakdown.elementalBlend >= 0 ? '+' : ''}${breakdown.elementalBlend}`,
    `Açı/ev örtüşmesi: +${breakdown.angleOverlays}`,
    `Motor referans skoru: ${breakdown.engineTotal}/100`,
  ].join('\n');
}

export function computeSynastry(
  self: ChartData,
  partner: ChartData,
  options?: { selfGender?: Gender; partnerGender?: Gender },
): SynastryResult {
  const aspects: SynastryAspect[] = [];
  const selfPlanets = self.planets.filter((p) => !ANGLE_POINTS.includes(p.name));
  const partnerPlanets = partner.planets.filter((p) => !ANGLE_POINTS.includes(p.name));

  for (const a of selfPlanets) {
    for (const b of partnerPlanets) {
      const hit = findAspect(a.longitude, b.longitude);
      if (!hit) continue;
      aspects.push({
        planetA: a.name,
        personA: 'self',
        planetB: b.name,
        personB: 'partner',
        type: hit.type,
        orb: hit.orb,
      });
    }
  }

  const focusAreas = buildSynastryFocusAreas(
    self,
    partner,
    options?.selfGender,
    options?.partnerGender,
  );

  const aspectScores = scoreSynastryAspects(aspects);
  const elementalBlend = scoreElementalBlend(self, partner);
  const focusAreasScore = scoreFocusAreas(focusAreas);
  const angleOverlays = scoreAngleOverlays(focusAreas);

  const raw =
    42 +
    aspectScores.harmony * 1.15 -
    aspectScores.tension * 0.95 +
    aspectScores.personalPlanets * 0.5 +
    elementalBlend +
    focusAreasScore +
    angleOverlays;

  const scoreBreakdown = {
    harmony: aspectScores.harmony,
    tension: aspectScores.tension,
    personalPlanets: aspectScores.personalPlanets,
    focusAreas: focusAreasScore,
    elementalBlend,
    angleOverlays,
    engineTotal: Math.max(32, Math.min(96, Math.round(raw))),
  };
  const score = scoreBreakdown.engineTotal;

  const highlights: string[] = [];
  if (self.sunSign === partner.sunSign) highlights.push('Aynı Güneş burcu — benzer yaşam ritmi');
  if (self.moonSign === partner.moonSign) highlights.push('Aynı Ay burcu — duygusal dil uyumu');
  if (self.risingSign === partner.risingSign) highlights.push('Aynı yükselen — dünyaya benzer bakış');

  for (const area of focusAreas) {
    const hit = area.findings.find((f) => !f.includes('yok') && !f.startsWith('Not:'));
    if (hit) highlights.push(`${area.title}: ${hit}`);
  }

  if (highlights.length === 0) {
    highlights.push('Haritalar arasında çok sayıda açı var; dinamik bir ilişki potansiyeli');
  }

  return {
    score,
    scoreBreakdown,
    aspects: aspects.sort((a, b) => a.orb - b.orb).slice(0, 24),
    highlights: highlights.slice(0, 8),
    focusAreas,
  };
}

export function chartSummaryForPrompt(chart: ChartData, label = 'Natal'): string {
  const lines = chart.planets.map(
    (p) =>
      `${labelPlanet(p.name)}: ${p.sign} ${p.signDegree.toFixed(1)}° (ev ${p.house})${p.retrograde ? ' R' : ''}`,
  );
  const aspects = chart.aspects
    .slice(0, 12)
    .map(
      (a) =>
        `${labelPlanet(a.planetA)}-${labelPlanet(a.planetB)} ${labelAspect(a.type)} (orb ${a.orb}°)`,
    )
    .join('; ');
  return [
    `${label}: Güneş ${chart.sunSign}, Ay ${chart.moonSign}, Yükselen ${chart.risingSign}`,
    lines.join('\n'),
    `Açılar: ${aspects}`,
  ].join('\n');
}

export function synastryFocusAreasForPrompt(focusAreas: SynastryFocusArea[]): string {
  return focusAreas
    .map((area) => {
      const body = area.findings.map((f) => `  - ${f}`).join('\n');
      return `### ${area.title}\n${body}`;
    })
    .join('\n\n');
}

/** Key natal positions for the six mandatory synastry focus areas. */
export function relationshipKeySummaryForPrompt(
  self: ChartData,
  partner: ChartData,
  selfGender?: Gender,
  partnerGender?: Gender,
): string {
  const roles = resolveWomanMan(selfGender, partnerGender);
  const chartOf = (who: 'self' | 'partner') => (who === 'self' ? self : partner);
  const personLabel = (who: 'self' | 'partner') => (who === 'self' ? 'Kişi A' : 'Kişi B');

  const lines: string[] = [];

  if (roles) {
    const womanLabel = roles.woman === 'self' ? 'Kişi A (kadın)' : 'Kişi B (kadın)';
    const manLabel = roles.man === 'self' ? 'Kişi A (erkek)' : 'Kişi B (erkek)';
    const woman = chartOf(roles.woman);
    const man = chartOf(roles.man);
    const wSun = getPoint(woman, 'Sun');
    const mMoon = getPoint(man, 'Moon');
    const wMars = getPoint(woman, 'Mars');
    const mVenus = getPoint(man, 'Venus');
    if (wSun) lines.push(`Kadın Güneş: ${wSun.sign} ${wSun.signDegree.toFixed(1)}° — ${womanLabel}`);
    if (mMoon) lines.push(`Erkek Ay: ${mMoon.sign} ${mMoon.signDegree.toFixed(1)}° — ${manLabel}`);
    if (wMars) lines.push(`Kadın Mars: ${wMars.sign} ${wMars.signDegree.toFixed(1)}° — ${womanLabel}`);
    if (mVenus) lines.push(`Erkek Venüs: ${mVenus.sign} ${mVenus.signDegree.toFixed(1)}° — ${manLabel}`);
  } else {
    lines.push(
      'Not: Kadın/erkek ataması için her iki kişinin cinsiyeti gerekli (Kadın Güneş–Erkek Ay ve Kadın Mars–Erkek Venüs için).',
    );
  }

  const aMoon = getPoint(self, 'Moon');
  const bMoon = getPoint(partner, 'Moon');
  if (aMoon && bMoon) {
    lines.push(
      `Kişi A Ay: ${aMoon.sign} ${aMoon.signDegree.toFixed(1)}° | Kişi B Ay: ${bMoon.sign} ${bMoon.signDegree.toFixed(1)}°`,
    );
  }

  for (const who of ['self', 'partner'] as const) {
    const chart = chartOf(who);
    const nn = getPoint(chart, 'NorthNode');
    const sn = getPoint(chart, 'SouthNode');
    if (nn) lines.push(`${personLabel(who)} Kuzey Ay Düğümü: ${nn.sign} ${nn.signDegree.toFixed(1)}°`);
    if (sn) lines.push(`${personLabel(who)} Güney Ay Düğümü: ${sn.sign} ${sn.signDegree.toFixed(1)}°`);
  }

  for (const who of ['self', 'partner'] as const) {
    const chart = chartOf(who);
    const asc = getPoint(chart, 'Ascendant');
    const dsc = getPoint(chart, 'Descendant');
    if (asc) lines.push(`${personLabel(who)} Yükselen (Asc): ${asc.sign} ${asc.signDegree.toFixed(1)}°`);
    if (dsc) lines.push(`${personLabel(who)} Alçalan (Dsc): ${dsc.sign} ${dsc.signDegree.toFixed(1)}°`);
  }

  return lines.join('\n');
}
