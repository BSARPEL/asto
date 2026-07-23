import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

/**
 * AI sunucusu (Express / Cloud Functions + Gemini).
 * Firebase Auth + Firestore'dan BAĞIMSIZ — yalnızca Gemini istekleri için.
 */
function resolveAiApiUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.aiApiUrl as string | undefined;
  const fromEnv =
    process.env.EXPO_PUBLIC_AI_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    fromExtra;
  if (fromEnv) return stripTrailingSlash(fromEnv);

  if (__DEV__ && !IS_PRODUCTION) {
    const metroHost = devMetroHost();
    if (metroHost) return `http://${metroHost}:${AI_API_PORT}/api`;
    if (Platform.OS === 'android') return `http://10.0.2.2:${AI_API_PORT}/api`;
    return `http://127.0.0.1:${AI_API_PORT}/api`;
  }

  return '';
}

export const AI_API_URL = resolveAiApiUrl();

export function isAiApiConfigured(): boolean {
  return AI_API_URL.length > 0;
}

/** @deprecated Use isAiApiConfigured */
export const API_URL = AI_API_URL;
export function apiUrlConfigured(): boolean {
  return isAiApiConfigured();
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
