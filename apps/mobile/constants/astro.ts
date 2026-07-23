import { Platform, type TextStyle } from 'react-native';
import type { PlanetName, ZodiacSign } from '@asto/shared';
import { PLANET_LABELS_TR } from '@asto/shared';
import { colors } from './theme';

/** Burç renkleri — kart vurguları ve pill arka planları */
export const SIGN_COLORS: Record<ZodiacSign, string> = {
  Koç: '#D4624F',
  Boğa: '#5A9E78',
  İkizler: '#4A9A94',
  Yengeç: '#6B8FC9',
  Aslan: '#D4A04A',
  Başak: '#7DA85E',
  Terazi: '#B87AAB',
  Akrep: '#9A5DBF',
  Yay: '#D4854A',
  Oğlak: '#6B7FA0',
  Kova: '#4A9FD4',
  Balık: '#5A9DBF',
};

export const SIGN_GLYPHS: Record<ZodiacSign, string> = {
  Koç: '♈',
  Boğa: '♉',
  İkizler: '♊',
  Yengeç: '♋',
  Aslan: '♌',
  Başak: '♍',
  Terazi: '♎',
  Akrep: '♏',
  Yay: '♐',
  Oğlak: '♑',
  Kova: '♒',
  Balık: '♓',
};

/** İngilizce planet key → sembol */
export const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  NorthNode: '☊',
  SouthNode: '☋',
  Ascendant: '↑',
  Descendant: '↓',
  Midheaven: 'MC',
};

/** Sembol fontu desteklemezse kısa yedek */
export const PLANET_FALLBACK: Record<string, string> = {
  Sun: 'Gü',
  Moon: 'Ay',
  Mercury: 'Me',
  Venus: 'Ve',
  Mars: 'Ma',
  Jupiter: 'Jü',
  Saturn: 'Sa',
  Uranus: 'Ur',
  Neptune: 'Ne',
  Pluto: 'Pl',
  NorthNode: '☊',
  SouthNode: '☋',
  Ascendant: 'As',
  Descendant: 'Ds',
  Midheaven: 'MC',
};

/** Astro sembolleri için sistem fontu (Manrope/Syne desteklemez) */
export const glyphTextStyle: TextStyle = Platform.select({
  ios: { fontFamily: 'Georgia' },
  android: { fontFamily: 'serif' },
  default: { fontFamily: 'serif' },
}) ?? { fontFamily: 'serif' };

export function signColor(sign: string): string {
  return SIGN_COLORS[sign as ZodiacSign] ?? colors.teal;
}

export function signGlyph(sign: string): string {
  return SIGN_GLYPHS[sign as ZodiacSign] ?? '✦';
}

/** planetKey: Sun, Moon… veya Türkçe etiket */
export function planetGlyph(planetKey: string): string {
  if (PLANET_GLYPHS[planetKey]) return PLANET_GLYPHS[planetKey];
  // Türkçe etiketten geri çözümle
  const entry = Object.entries(PLANET_LABELS_TR).find(([, tr]) => tr === planetKey);
  if (entry) return PLANET_GLYPHS[entry[0]] ?? PLANET_FALLBACK[entry[0]] ?? '○';
  return PLANET_FALLBACK[planetKey] ?? '○';
}

export function planetGlyphForKey(key: PlanetName | string): string {
  return PLANET_GLYPHS[key] ?? PLANET_FALLBACK[key] ?? '○';
}

export function planetLabel(key: PlanetName | string): string {
  return PLANET_LABELS_TR[key] ?? String(key);
}
