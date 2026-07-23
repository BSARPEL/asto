import { StyleSheet, Text, type TextStyle } from 'react-native';
import { glyphTextStyle, planetGlyphForKey, signGlyph } from '@/constants/astro';

type Props = {
  planetKey?: string;
  sign?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: TextStyle;
};

const SIZES = { sm: 14, md: 18, lg: 24 };

/** Gezegen veya burç sembolü — sembol fontu ile render eder */
export function AstroGlyph({ planetKey, sign, size = 'md', color, style }: Props) {
  const glyph = planetKey ? planetGlyphForKey(planetKey) : sign ? signGlyph(sign) : '✦';
  return (
    <Text
      style={[
        glyphTextStyle,
        styles.glyph,
        { fontSize: SIZES[size], color },
        style,
      ]}
      allowFontScaling={false}
    >
      {glyph}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
