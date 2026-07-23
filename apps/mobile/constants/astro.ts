import { Platform, type TextStyle } from 'react-native';
import type { PlanetName, ZodiacSign } from '@asto/shared';
import { PLANET_LABELS_TR } from '@asto/shared';
import { colors } from './theme';

/** Burç renkleri — gece temasında okunaklı doygun tonlar */
export const SIGN_COLORS: Record<ZodiacSign, string> = {
  Koç: '#E87A68',
  Boğa: '#6DB890',
  İkizler: '#5EB8B0',
  Yengeç: '#7BA3D9',
  Aslan: '#E0B45A',
  Başak: '#8FBF6E',
  Terazi: '#C490B8',
  Akrep: '#B07AD4',
  Yay: '#E09A5A',
  Oğlak: '#8A9BB8',
  Kova: '#5AB0E0',
  Balık: '#6AABB8',
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
