import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import {
  AuthShell,
  BrandMark,
  Button,
  ErrorText,
  Field,
  GlassCard,
  Screen,
  Subtitle,
  Title,
  useLayout,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts, spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { isWide } = useLayout();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <>
      {!isWide ? (
        <>
          <BrandMark size="lg" />
          <Title>Hesap oluştur</Title>
          <Subtitle>
            İki haritayı karşılaştır, ilişkinin ritmini oku. Başlangıç hediyesi: 5 jeton.
          </Subtitle>
        </>
      ) : (
        <Title style={{ marginBottom: spacing.md }}>Kayıt ol</Title>
      )}
      <Field label="Ad" value={displayName} onChangeText={setDisplayName} placeholder="Adın" autoComplete="name" />
      <Field
        label="E-posta"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@mail.com"
      />
      <Field
        label="Şifre"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        placeholder="En az 6 karakter"
        hint="En az 6 karakter kullan"
      />
      <ErrorText>{error}</ErrorText>
      <Button label="Kayıt ol" onPress={onSubmit} loading={loading} />
      <Subtitle style={styles.bonusHint}>Başlangıç hediyesi: 5 jeton</Subtitle>
      <View style={styles.footer}>
        <Link href="/(auth)/login" style={styles.link}>
          Zaten hesabın var mı? Giriş yap
        </Link>
        <Link href="/legal/terms" style={styles.linkMuted}>
          Kullanım şartları
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
          <AuthShell>
            {isWide ? form : <GlassCard>{form}</GlassCard>}
          </AuthShell>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  bonusHint: {
    marginTop: spacing.sm,
    marginBottom: 0,
    textAlign: 'center',
    fontSize: 13,
  },
  footer: { marginTop: spacing.md, gap: 12 },
  link: { color: colors.teal, fontFamily: fonts.bodySemi, fontSize: 15 },
  linkMuted: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 },
});
