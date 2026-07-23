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
  city: string;
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
  createdAt: string;
}

export interface Partner {
  id: string;
  userId: string;
  birth: BirthInput;
  natalChart: ChartData;
  synastryScore?: number;
  analysis?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface DailyReading {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  summary: string;
  themes: string[];
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

export interface SynastryResult {
  score: number;
  aspects: SynastryAspect[];
  highlights: string[];
  /** Precomputed relationship keys for the AI — do not invent angles beyond these. */
  focusAreas: SynastryFocusArea[];
}
