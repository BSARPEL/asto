import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { BrandMark, Button, ErrorText, Field, Screen, Subtitle, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
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

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <BrandMark />
          <Title>Asto’ya katıl</Title>
          <Subtitle>Kayıt olunca 5 jeton hediye. Doğum haritanı sonra gireceksin.</Subtitle>
          <Field label="Ad" value={displayName} onChangeText={setDisplayName} placeholder="Adın" />
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
            placeholder="En az 6 karakter"
          />
          <ErrorText>{error}</ErrorText>
          <Button label="Kayıt ol" onPress={onSubmit} loading={loading} />
          <View style={styles.footer}>
            <Link href="/(auth)/login" style={styles.link}>
              Zaten hesabın var mı? Giriş yap
            </Link>
            <Link href="/legal/terms" style={styles.linkMuted}>
              Kullanım şartları
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  footer: { marginTop: spacing.lg, gap: 10 },
  link: { color: colors.teal, fontFamily: 'Manrope_600SemiBold', fontSize: 15 },
  linkMuted: { color: colors.textMuted, fontFamily: 'Manrope_400Regular', fontSize: 13 },
});
