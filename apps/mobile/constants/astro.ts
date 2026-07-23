import { Platform, type TextStyle } from 'react-native';
import type { PlanetName, ZodiacSign } from '@asto/shared';
import { PLANET_LABELS_TR } from '@asto/shared';
import { colors } from './theme';

/** Burç renkleri — BN Astro açık zeminde okunaklı, markaya uyumlu doygun tonlar */
export const SIGN_COLORS: Record<ZodiacSign, string> = {
  Koç: '#C73892',
  Boğa: '#3D9A68',
  İkizler: '#6B3AA8',
  Yengeç: '#4A7EC4',
  Aslan: '#D4A017',
  Başak: '#5A9A3E',
  Terazi: '#A86A9A',
  Akrep: '#280F5F',
  Yay: '#C47A32',
  Oğlak: '#5A6B88',
  Kova: '#6B3AA8',
  Balık: '#C73892',
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
