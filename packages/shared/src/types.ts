export type PlanetName =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto'
  | 'NorthNode'
  | 'SouthNode'
  | 'Ascendant'
  | 'Descendant'
  | 'Midheaven';

export type Gender = 'female' | 'male';

export type ZodiacSign =
  | 'Koç'
  | 'Boğa'
  | 'İkizler'
  | 'Yengeç'
  | 'Aslan'
  | 'Başak'
  | 'Terazi'
  | 'Akrep'
  | 'Yay'
  | 'Oğlak'
  | 'Kova'
  | 'Balık';

export interface BirthInput {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  /** City name only (e.g. İstanbul) */
  city: string;
  /** ISO 3166-1 alpha-2 (e.g. TR) */
  country?: string;
  /** Display country name (e.g. Türkiye) */
  countryName?: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA, e.g. Europe/Istanbul
  /** Used for gendered synastry keys (e.g. woman Sun / man Moon). */
  gender?: Gender;
}

export interface PlanetPosition {
  name: PlanetName;
  longitude: number;
  sign: ZodiacSign;
  signDegree: number;
  house: number;
  retrograde?: boolean;
}

export interface Aspect {
  planetA: PlanetName;
  planetB: PlanetName;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  orb: number;
  applying?: boolean;
}

export interface ChartData {
  planets: PlanetPosition[];
  houses: number[]; // cusp longitudes 1-12
  aspects: Aspect[];
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  tokenBalance: number;
  isSubscribed: boolean;
  birth?: BirthInput;
  natalChart?: ChartData;
  /** Cached AI natal chart narrative — cleared when birth changes */
  chartNarrative?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  userId: string;
  birth: BirthInput;
  natalChart: ChartData;
  /** Final score shown in UI — from AI when analysis exists */
  synastryScore?: number;
  /** Brief AI rationale for synastryScore */
  synastryScoreNote?: string;
  analysis?: string;
  /** ISO timestamp when analysis was last generated */
  analysisAt?: string;
  /** Sinastri sohbeti — analiz sonrası soru-cevap */
  conversationId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  /** daily = günlük öngörü; synastry = partner sinastri sohbeti */
  kind?: 'daily' | 'synastry';
  /** Set when kind is synastry */
  partnerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReading {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD (user local calendar day)
  summary: string;
  themes: string[];
  /** Sohbet bu öngörüyle bağlı — sorular kaybolmaz */
  conversationId?: string;
  createdAt: string;
}

export interface TokenLedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface SynastryAspect {
  planetA: PlanetName;
  personA: 'self' | 'partner';
  planetB: PlanetName;
  personB: 'self' | 'partner';
  type: Aspect['type'];
  orb: number;
}

export interface SynastryFocusArea {
  key:
    | 'woman_sun_man_moon'
    | 'moon_moon'
    | 'woman_mars_man_venus'
    | 'lunar_nodes'
    | 'asc_overlay'
    | 'dsc_overlay';
  title: string;
  findings: string[];
}

export interface SynastryScoreBreakdown {
  harmony: number;
  tension: number;
  personalPlanets: number;
  focusAreas: number;
  elementalBlend: number;
  angleOverlays: number;
  engineTotal: number;
}

export interface SynastryResult {
  /** Engine-computed reference score (0–100) */
  score: number;
  scoreBreakdown: SynastryScoreBreakdown;
  aspects: SynastryAspect[];
  highlights: string[];
  /** Precomputed relationship keys for the AI — do not invent angles beyond these. */
  focusAreas: SynastryFocusArea[];
}
