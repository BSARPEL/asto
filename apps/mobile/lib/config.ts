import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createGeminiRuntime, isGeminiApiKey, type AiRuntime } from '@asto/shared';
import { PRODUCTION_AI_API_URL } from '@/constants/endpoints';

const AI_API_PORT = 8788;

export type AppEnv = 'development' | 'staging' | 'production';

/** Build-time ortam: EAS / EXPO_PUBLIC_APP_ENV */
export const APP_ENV: AppEnv =
  (Constants.expoConfig?.extra?.appEnv as AppEnv | undefined) ??
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnv | undefined) ??
  (__DEV__ ? 'development' : 'production');

export const IS_PRODUCTION = APP_ENV === 'production';

function devMetroHost(): string | null {
  if (!__DEV__ || IS_PRODUCTION) return null;
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(
    url,
  );
}

/**
 * AI sunucusu (Cloud Functions + Gemini).
 * Mağaza sürümü: yalnızca HTTPS production URL — LAN/localhost asla kullanılmaz.
 */
function resolveAiApiUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.aiApiUrl as string | undefined;
  const fromEnv =
    process.env.EXPO_PUBLIC_AI_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    fromExtra;

  if (fromEnv) {
    const url = stripTrailingSlash(fromEnv);
    if (IS_PRODUCTION && isLocalUrl(url)) {
      console.warn('[config] Production build cannot use LAN AI URL — using Cloud Functions.');
      return PRODUCTION_AI_API_URL;
    }
    return url;
  }

  // Release bundle without explicit env → production Cloud Functions
  if (IS_PRODUCTION || !__DEV__) {
    return PRODUCTION_AI_API_URL;
  }

  // Yerel geliştirme (Expo Go / simülatör) — opsiyonel localhost
  const metroHost = devMetroHost();
  if (metroHost) return `http://${metroHost}:${AI_API_PORT}/api`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${AI_API_PORT}/api`;
  return `http://127.0.0.1:${AI_API_PORT}/api`;
}

export const AI_API_URL = resolveAiApiUrl();

export function isAiApiConfigured(): boolean {
  if (!AI_API_URL.length) return false;
  if (IS_PRODUCTION || !__DEV__) return AI_API_URL.startsWith('https://');
  return true;
}

export function usesEmbeddedBundle(): boolean {
  return !devMetroHost();
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

/** Google AI Studio — doğrudan Gemini (Firebase'den bağımsız). */
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
  return usesDirectGemini() || isAiApiConfigured();
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

/** Mobil: doğrudan Gemini (geçerli AI Studio API anahtarı varsa). */
export function usesDirectGemini(): boolean {
  return isGeminiApiKey(getGeminiApiKey());
}
