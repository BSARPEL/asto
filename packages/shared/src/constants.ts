export const APP_NAME = 'BN Astro';

export const TOKEN_COSTS = {
  askQuestion: 1,
  dailyReadingRefresh: 1,
  chartNarrative: 2,
  relationshipAnalysis: 3,
  soulmateReading: 2,
  fullRelationshipReport: 5,
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
  fullReport: { id: 'asto_full_report', priceLabel: '₺129,99' },
} as const;

export type RelationshipType = 'love' | 'friendship' | 'family' | 'work';

export const RELATIONSHIP_TYPES: Array<{
  id: RelationshipType;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'love',
    title: 'Romantik',
    subtitle: 'Çekim, duygusal bağ ve uzun vadeli dinamikler',
  },
  {
    id: 'friendship',
    title: 'Arkadaşlık',
    subtitle: 'Güven, destek ve dostluğun ritmi',
  },
  {
    id: 'family',
    title: 'Aile',
    subtitle: 'Bağlar, roller ve iletişim kalıpları',
  },
  {
    id: 'work',
    title: 'İş',
    subtitle: 'İş birliği, karar alma ve çatışma yönetimi',
  },
];

/** AI prompt framing per relationship lens */
export const RELATIONSHIP_TYPE_AI: Record<
  RelationshipType,
  { label: string; lens: string; sections: string[] }
> = {
  love: {
    label: 'Romantik ilişki / çekim',
    lens:
      'Bu bir ROMANTİK / duygusal bağ analizidir. Çekim, yakınlık, uzun vadeli uyum ve ilişki dinamiği dilinde yaz. Flört veya partner dili uygundur.',
    sections: [
      '1) Genel dinamik',
      '2) Kadın Güneş – Erkek Ay ilişkisi',
      '3) Ay + Ay ilişkisi',
      '4) Kadın Mars – Erkek Venüs ilişkisi',
      '5) Ay düğümleri arasındaki ilişki',
      '6) Yükselen (Asc) üzerinde diğer kişinin faktörü var mı?',
      '7) Alçalan (Dsc) üzerinde diğer kişinin faktörü var mı?',
      '8) Güçlü yönler ve gelişime açık alanlar',
      '9) Kısa öneri',
    ],
  },
  friendship: {
    label: 'Arkadaşlık',
    lens:
      'Bu bir ARKADAŞLIK analizidir. Romantik/cinsel çekim dili KULLANMA. Güven, destek, mizah, sınırlar ve dostluğun ritmine odaklan. Engine’deki Güneş/Ay/Mars/Venüs verilerini arkadaşlık dinamikleri olarak yorumla.',
    sections: [
      '1) Genel dinamik — dostluk ritmi',
      '2) Duygusal destek (Güneş–Ay etkileşimleri)',
      '3) Empati ve anlaşılma (Ay–Ay)',
      '4) Enerji ve motivasyon (Mars–Venüs / eylem uyumu)',
      '5) Ortak büyüme ve yön (Ay düğümleri)',
      '6) Sosyal uyum — yükselen (Asc) etkileri',
      '7) Tamamlayıcı roller — alçalan (Dsc) etkileri',
      '8) Güçlü yönler ve sürtünme noktaları',
      '9) Kısa öneri (arkadaşlık için)',
    ],
  },
  family: {
    label: 'Aile / bağlar',
    lens:
      'Bu bir AİLE / bağ analizidir. Romantik dil KULLANMA. Roller, iletişim kalıpları, bakım, sınırlar ve aile içi dinamiklere odaklan. Engine verisini aile ilişkisi çerçevesinde yorumla.',
    sections: [
      '1) Genel dinamik — aile bağı',
      '2) Kimlik ve tanınma (Güneş–Ay)',
      '3) Duygusal ihtiyaçlar (Ay–Ay)',
      '4) Tempo ve gerilim (Mars–Venüs / eylem)',
      '5) Ortak kader / öğrenme (Ay düğümleri)',
      '6) İlk izlenim ve tutum (Asc)',
      '7) Karşı tarafın tamamladığı alan (Dsc)',
      '8) Güçlü yönler ve hassas alanlar',
      '9) Kısa öneri (aile iletişimi için)',
    ],
  },
  work: {
    label: 'İş birliği / profesyonel',
    lens:
      'Bu bir İŞ / profesyonel iş birliği analizidir. Romantik dil KULLANMA. Karar alma, sorumluluk paylaşımı, çatışma yönetimi, tempo ve güvenilirliğe odaklan. Engine verisini çalışma dinamiği olarak yorumla.',
    sections: [
      '1) Genel dinamik — iş birliği ritmi',
      '2) Liderlik ve görünürlük (Güneş–Ay)',
      '3) İletişim ve ihtiyaçlar (Ay–Ay)',
      '4) Tempo, motivasyon ve çekişme (Mars–Venüs)',
      '5) Uzun vadeli yön (Ay düğümleri)',
      '6) İlk izlenim / profesyonel duruş (Asc)',
      '7) Tamamlayıcı beceriler (Dsc)',
      '8) Güçlü yönler ve risk alanları',
      '9) Kısa öneri (iş birliği için)',
    ],
  },
};

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
