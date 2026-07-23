import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; number: string; text: string }
  | { type: 'paragraph'; text: string };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    const bullet = /^[*•-]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      blocks.push({ type: 'bullet', text: bullet[1] });
      continue;
    }

    const numbered = /^(\d+)[.)]\s*(.+)$/.exec(line);
    if (numbered) {
      flushParagraph();
      blocks.push({ type: 'numbered', number: numbered[1], text: numbered[2] });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function RichText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={styles.bold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export function AiMarkdown({ content, compact }: { content: string; compact?: boolean }) {
  const blocks = parseBlocks(content);

  return (
    <View style={styles.root}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <View key={index} style={[styles.headingWrap, index > 0 && styles.headingSpaced]}>
              <View style={styles.headingAccent} />
              <RichText
                text={block.text}
                style={[styles.heading, compact && styles.headingCompact]}
              />
            </View>
          );
        }

        if (block.type === 'numbered') {
          return (
            <View key={index} style={styles.numberedRow}>
              <View style={[styles.numberBadge, compact && styles.numberBadgeCompact]}>
                <Text style={styles.numberText}>{block.number}</Text>
              </View>
              <RichText
                text={block.text}
                style={[styles.body, styles.numberedBody, compact && styles.bodyCompact]}
              />
            </View>
          );
        }

        if (block.type === 'bullet') {
          return (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <RichText
                text={block.text}
                style={[styles.body, styles.bulletBody, compact && styles.bodyCompact]}
              />
            </View>
          );
        }

        return (
          <RichText
            key={index}
            text={block.text}
            style={[styles.body, styles.paragraph, compact && styles.bodyCompact]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: '100%',
  },
  headingWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: spacing.xs,
  },
  headingSpaced: {
    marginTop: spacing.sm,
  },
  headingAccent: {
    width: 3,
    minHeight: 18,
    marginTop: 3,
    borderRadius: 2,
    backgroundColor: colors.teal,
  },
  heading: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  headingCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSoft,
  },
  bodyCompact: {
    fontSize: 13,
    lineHeight: 20,
  },
  bold: {
    fontFamily: fonts.bodySemi,
    color: colors.text,
  },
  paragraph: {
    marginBottom: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
    marginTop: 8,
  },
  bulletBody: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numberBadgeCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  numberText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.teal,
  },
  numberedBody: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});
