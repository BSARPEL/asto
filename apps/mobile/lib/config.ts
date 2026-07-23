import Constants from 'expo-constants';
import { createGeminiRuntime, isGeminiApiKey, type AiRuntime } from '@asto/shared';

export type AppEnv = 'development' | 'staging' | 'production';

/** Build-time ortam: EAS / EXPO_PUBLIC_APP_ENV */
export const APP_ENV: AppEnv =
  (Constants.expoConfig?.extra?.appEnv as AppEnv | undefined) ??
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnv | undefined) ??
  (__DEV__ ? 'development' : 'production');

export const IS_PRODUCTION = APP_ENV === 'production';

/**
 * @deprecated Cloud Functions AI API kullanılmıyor — doğrudan Gemini.
 * Geriye dönük uyumluluk için boş bırakılabilir.
 */
export const AI_API_URL = '';

export function isAiApiConfigured(): boolean {
  return false;
}

export function usesEmbeddedBundle(): boolean {
  return true;
}

/** Firebase Auth + Firestore — kayıt, profil, harita, partner verisi */
export function usesFirebaseDirect(): boolean {
  const fromExtra = Constants.expoConfig?.extra?.dataBackend as string | undefined;
  if (fromExtra === 'firebase') return true;
  if (process.env.EXPO_PUBLIC_DATA_BACKEND === 'firebase') return true;
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  return Boolean(apiKey && appId);
}

/** Google AI Studio — doğrudan Gemini (Cloud Functions yok). */
export function getGeminiApiKey(): string {
  const fromExtra = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;
  return (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    fromExtra ||
    ''
  );
}

export function getGeminiModel(): string {
  return (
    process.env.EXPO_PUBLIC_GEMINI_MODEL ||
    (Constants.expoConfig?.extra?.geminiModel as string | undefined) ||
    'gemini-2.5-flash-lite'
  );
}

/** Set but wrong format (e.g. OAuth token instead of AI Studio API key). */
export function getGeminiKeyIssue(): string | null {
  const key = getGeminiApiKey();
  if (!key) return null;
  if (!isGeminiApiKey(key)) {
    return [
      'EXPO_PUBLIC_GEMINI_API_KEY geçersiz veya eksik.',
      'Google AI Studio’dan yeni anahtar oluşturun: aistudio.google.com/apikey',
    ].join(' ');
  }
  return null;
}

export function isAiAvailable(): boolean {
  return usesDirectGemini();
}

let geminiRuntime: AiRuntime | undefined;
let geminiRuntimeKey: string | undefined;

export function getGeminiRuntime(): AiRuntime {
  const issue = getGeminiKeyIssue();
  if (issue) throw new Error(issue);
  const key = getGeminiApiKey();
  if (!key) throw new Error('Gemini API anahtarı tanımlı değil');
  if (!geminiRuntime || geminiRuntimeKey !== key) {
    geminiRuntimeKey = key;
    geminiRuntime = createGeminiRuntime(key, getGeminiModel());
  }
  return geminiRuntime;
}

/**
 * Mobil: doğrudan Gemini — EXPO_PUBLIC_GEMINI_API_KEY (gitignore .env).
 * Cloud Functions / astoApi kullanılmaz.
 */
export function usesDirectGemini(): boolean {
  return isGeminiApiKey(getGeminiApiKey());
}
