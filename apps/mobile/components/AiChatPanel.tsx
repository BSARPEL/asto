import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ChatMessage } from '@asto/shared';
import { Chip, MessageBubble } from '@/components/ui';
import { colors, fonts, radii, spacing } from '@/constants/theme';

type Props = {
  messages: ChatMessage[];
  loading?: boolean;
  asking?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  suggestions?: string[];
  onSuggestion?: (text: string) => void;
  placeholder?: string;
  emptyTitle?: string;
  emptyBody?: string;
};

function TypingBubble() {
  return (
    <View style={[styles.typingBubble]}>
      <ActivityIndicator size="small" color={colors.teal} />
      <Text style={styles.typingText}>Asto yazıyor…</Text>
    </View>
  );
}

export function AiChatPanel({
  messages,
  loading = false,
  asking = false,
  value,
  onChangeText,
  onSend,
  suggestions = [],
  onSuggestion,
  placeholder = 'Mesaj yaz…',
  emptyTitle = 'Sohbet',
  emptyBody = 'Bir soru yazarak başla.',
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const canSend = value.trim().length > 0 && !asking;

  useEffect(() => {
    if (messages.length === 0 && !asking) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, asking, messages[messages.length - 1]?.id]);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 && !loading ? styles.messagesEmpty : null,
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.loadingText}>Sohbet yükleniyor…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>✦</Text>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyBody}>{emptyBody}</Text>
            {suggestions.length > 0 ? (
              <View style={styles.suggestionWrap}>
                {suggestions.map((s) => (
                  <Chip key={s} label={s} onPress={() => onSuggestion?.(s)} compact />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} compact showRole={false} />
            ))}
            {asking ? <TypingBubble /> : null}
          </>
        )}
      </ScrollView>

      {messages.length > 0 && suggestions.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionStrip}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map((s) => (
            <Chip key={s} label={s} onPress={() => onSuggestion?.(s)} compact />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          editable={!asking}
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendBtn,
            !canSend && styles.sendBtnDisabled,
            pressed && canSend && styles.sendBtnPressed,
          ]}
        >
          {asking ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: '100%',
  },
  messages: {
    flex: 1,
    minHeight: 0,
  },
  messagesContent: {
    paddingVertical: spacing.xs,
    gap: 4,
  },
  messagesEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyGlyph: {
    fontSize: 22,
    color: colors.teal,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  suggestionStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: spacing.xs,
  },
  typingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.assistantBubble,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderBottomLeftRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: '70%',
  },
  typingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  sendIcon: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.onAccent,
    lineHeight: 20,
  },
});
