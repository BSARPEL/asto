import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8788;

export type AppEnv = 'development' | 'staging' | 'production';

/** Build-time ortam: EAS / EXPO_PUBLIC_APP_ENV ile set edilir. */
export const APP_ENV: AppEnv =
  (Constants.expoConfig?.extra?.appEnv as AppEnv | undefined) ??
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnv | undefined) ??
  (__DEV__ ? 'development' : 'production');

export const IS_PRODUCTION = APP_ENV === 'production';

/** Expo Go / Metro LAN host — yalnızca geliştirme */
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

function resolveApiUrl(): string {
  const fromBuild = process.env.EXPO_PUBLIC_API_URL;
  if (fromBuild) {
    return stripTrailingSlash(fromBuild);
  }

  // Geliştirme: Metro LAN veya simülatör/emülatör
  if (__DEV__ && !IS_PRODUCTION) {
    const metroHost = devMetroHost();
    if (metroHost) {
      return `http://${metroHost}:${API_PORT}/api`;
    }
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${API_PORT}/api`;
    }
    return `http://127.0.0.1:${API_PORT}/api`;
  }

  // App Store / production: build sırasında EXPO_PUBLIC_API_URL zorunlu
  if (IS_PRODUCTION) {
    console.error(
      '[Asto] EXPO_PUBLIC_API_URL eksik. EAS production build öncesi secret tanımlayın.',
    );
  }

  return '';
}

export const API_URL = resolveApiUrl();

/** Native standalone build (Metro yok) */
export function usesEmbeddedBundle(): boolean {
  return !devMetroHost();
}

export function apiUrlConfigured(): boolean {
  return API_URL.length > 0;
}
