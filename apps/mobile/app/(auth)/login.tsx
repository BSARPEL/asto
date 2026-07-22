import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { BrandMark, Button, ErrorText, Field, Screen, Subtitle, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <BrandMark size="lg" />
          <Title>Yıldızlara hoş geldin</Title>
          <Subtitle>Haritana göre günlük öngörü ve ilişki yorumları için giriş yap.</Subtitle>
          <Field
            label="E-posta"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@mail.com"
          />
          <Field
            label="Şifre"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
          />
          <ErrorText>{error}</ErrorText>
          <Button label="Giriş yap" onPress={onSubmit} loading={loading} />
          <View style={styles.footer}>
            <Link href="/(auth)/register" style={styles.link}>
              Hesabın yok mu? Kayıt ol
            </Link>
            <Link href="/legal/privacy" style={styles.linkMuted}>
              Gizlilik
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  footer: { marginTop: spacing.lg, gap: 10 },
  link: { color: colors.teal, fontFamily: 'Manrope_600SemiBold', fontSize: 15 },
  linkMuted: { color: colors.textMuted, fontFamily: 'Manrope_400Regular', fontSize: 13 },
});
