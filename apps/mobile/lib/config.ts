import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8788;

/** Expo Go / Metro LAN host — yalnızca geliştirme sunucusu açıkken */
function devMetroHost(): string | null {
  if (!__DEV__) return null;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function platformFallbackHost() {
  if (Platform.OS === 'android') return '10.0.2.2';
  return '127.0.0.1';
}

function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const metroHost = devMetroHost();

  // Metro açıksa ve yapılandırma localhost ise LAN IP kullan (simülatör + Expo Go)
  if (metroHost) {
    if (
      !configured ||
      configured.includes('localhost') ||
      configured.includes('127.0.0.1')
    ) {
      return `http://${metroHost}:${API_PORT}/api`;
    }
  }

  if (configured) return configured;
  return `http://${platformFallbackHost()}:${API_PORT}/api`;
}

export const API_URL = resolveApiUrl();

/** Native standalone build'de Metro kullanılmıyor mu? */
export function usesEmbeddedBundle(): boolean {
  return !devMetroHost();
}
