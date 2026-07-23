export const APP_NAME = 'BN Astro';

export const TOKEN_COSTS = {
  askQuestion: 1,
  dailyReadingRefresh: 1,
  chartNarrative: 2,
  relationshipAnalysis: 3,
  dailyReadingFreePerDay: 1,
} as const;

export const TOKEN_REWARDS = {
  signupBonus: 5,
  rewardedAd: 1,
  maxRewardedAdsPerDay: 5,
} as const;

export const IAP_PRODUCTS = {
  tokens5: { id: 'asto_tokens_5', tokens: 5, priceLabel: '₺29,99' },
  tokens10: { id: 'asto_tokens_10', tokens: 10, priceLabel: '₺49,99' },
  tokens50: { id: 'asto_tokens_50', tokens: 50, priceLabel: '₺199,99' },
  monthly: { id: 'asto_sub_monthly', priceLabel: '₺249,99/ay' },
} as const;

export const SIGNS_TR = [
  'Koç',
  'Boğa',
  'İkizler',
  'Yengeç',
  'Aslan',
  'Başak',
  'Terazi',
  'Akrep',
  'Yay',
  'Oğlak',
  'Kova',
  'Balık',
] as const;

export const PLANET_LABELS_TR: Record<string, string> = {
  Sun: 'Güneş',
  Moon: 'Ay',
  Mercury: 'Merkür',
  Venus: 'Venüs',
  Mars: 'Mars',
  Jupiter: 'Jüpiter',
  Saturn: 'Satürn',
  Uranus: 'Uranüs',
  Neptune: 'Neptün',
  Pluto: 'Plüton',
  NorthNode: 'Kuzey Ay Düğümü',
  SouthNode: 'Güney Ay Düğümü',
  Ascendant: 'Yükselen',
  Descendant: 'Alçalan',
  Midheaven: 'MC',
};

export const ASPECT_LABELS_TR: Record<string, string> = {
  conjunction: 'Kavuşum',
  opposition: 'Karşıt',
  trine: 'Üçgen',
  square: 'Kare',
  sextile: 'Sextil',
};

/** Demo şehirler — doğum yeri seçimi */
export const CITY_PRESETS = [
  { city: 'İstanbul', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { city: 'Ankara', latitude: 39.9334, longitude: 32.8597, timezone: 'Europe/Istanbul' },
  { city: 'İzmir', latitude: 38.4237, longitude: 27.1428, timezone: 'Europe/Istanbul' },
  { city: 'Bursa', latitude: 40.1885, longitude: 29.061, timezone: 'Europe/Istanbul' },
  { city: 'Antalya', latitude: 36.8969, longitude: 30.7133, timezone: 'Europe/Istanbul' },
  { city: 'Adana', latitude: 37.0, longitude: 35.3213, timezone: 'Europe/Istanbul' },
  { city: 'Gaziantep', latitude: 37.0662, longitude: 37.3833, timezone: 'Europe/Istanbul' },
  { city: 'Konya', latitude: 37.8746, longitude: 32.4932, timezone: 'Europe/Istanbul' },
  { city: 'Trabzon', latitude: 41.0027, longitude: 39.7168, timezone: 'Europe/Istanbul' },
  { city: 'Diyarbakır', latitude: 37.9144, longitude: 40.2306, timezone: 'Europe/Istanbul' },
  { city: 'Berlin', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' },
  { city: 'Londra', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { city: 'New York', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { city: 'Paris', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
] as const;
