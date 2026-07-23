import { useEffect, useMemo, useRef } from 'react';
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
import { MessageBubble } from '@/components/ui';
import { FadeIn, SoftPulse, enterChatAssistant } from '@/components/motion';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import Animated from 'react-native-reanimated';

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
  /** Shown immediately while waiting for the assistant (optimistic user bubble). */
  pendingUserText?: string;
};

function TypingBubble() {
  return (
    <Animated.View entering={enterChatAssistant} style={styles.typingBubble}>
      <SoftPulse>
        <ActivityIndicator size="small" color={colors.teal} />
      </SoftPulse>
      <Text style={styles.typingText}>Asto yazıyor…</Text>
    </Animated.View>
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
  pendingUserText,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const canSend = value.trim().length > 0 && !asking;

  const displayMessages = useMemo(() => {
    const pending = pendingUserText?.trim();
    if (!asking || !pending) return messages;
    if (messages.some((m) => m.role === 'user' && m.content === pending)) return messages;
    return [
      ...messages,
      {
        id: '__pending__',
        role: 'user' as const,
        content: pending,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [messages, pendingUserText, asking]);

  const showEmpty = displayMessages.length === 0 && !asking && !loading;
  const showSuggestions = showEmpty && suggestions.length > 0;

  useEffect(() => {
    if (displayMessages.length === 0 && !asking) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [displayMessages.length, asking, displayMessages[displayMessages.length - 1]?.id]);

  const handleSuggestion = (text: string) => {
    if (asking || loading) return;
    onSuggestion?.(text);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={[
          styles.messagesContent,
          showEmpty ? styles.messagesEmpty : styles.messagesFilled,
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {loading && displayMessages.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.loadingText}>Sohbet yükleniyor…</Text>
          </View>
        ) : showEmpty ? (
          <FadeIn from="up">
            <View style={styles.empty}>
              <Text style={styles.emptyGlyph}>✦</Text>
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              <Text style={styles.emptyBody}>{emptyBody}</Text>
              {showSuggestions ? (
                <View style={styles.suggestionList}>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => handleSuggestion(s)}
                      style={({ pressed }) => [
                        styles.suggestionBtn,
                        pressed && styles.suggestionBtnPressed,
                      ]}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </FadeIn>
        ) : (
          <>
            {loading ? (
              <View style={styles.refreshRow}>
                <ActivityIndicator size="small" color={colors.teal} />
              </View>
            ) : null}
            {displayMessages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} compact showRole={false} />
            ))}
            {asking ? <TypingBubble /> : null}
          </>
        )}
      </ScrollView>

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
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    minHeight: 0,
  },
  messagesContent: {
    paddingVertical: spacing.xs,
    gap: 6,
  },
  messagesEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messagesFilled: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
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
  refreshRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    width: '100%',
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
  suggestionList: {
    width: '100%',
    gap: 8,
    marginTop: spacing.xs,
  },
  suggestionBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionBtnPressed: {
    backgroundColor: colors.tealDim,
    borderColor: 'rgba(61, 154, 148, 0.35)',
  },
  suggestionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
    textAlign: 'left',
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
    maxWidth: '85%',
  },
  typingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  composer: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    maxHeight: 96,
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
    flexShrink: 0,
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
