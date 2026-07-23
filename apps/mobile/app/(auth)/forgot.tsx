import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import {
  AuthShell,
  BrandMark,
  Button,
  ErrorText,
  Field,
  GlassCard,
  Screen,
  Subtitle,
  SuccessBanner,
  Title,
  useLayout,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { isWide } = useLayout();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setInfo('Şifre sıfırlama bağlantısı e-postana gönderildi.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <>
      {!isWide ? <BrandMark size="lg" /> : null}
      <Title>Şifremi unuttum</Title>
      <Subtitle>E-posta adresine sıfırlama bağlantısı gönderelim.</Subtitle>
      <Field
        label="E-posta"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@mail.com"
      />
      <ErrorText>{error}</ErrorText>
      {info ? <SuccessBanner>{info}</SuccessBanner> : null}
      <Button label="Bağlantı gönder" onPress={onSubmit} loading={loading} />
      <View style={styles.footer}>
        <Link href="/(auth)/login" style={styles.link}>
          Girişe dön
        </Link>
      </View>
    </>
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthShell>{isWide ? form : <GlassCard>{form}</GlassCard>}</AuthShell>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  footer: { marginTop: spacing.md, alignItems: 'center' },
  link: { fontFamily: fonts.bodySemi, color: colors.teal, fontSize: 14 },
});
