import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8788;

function devLanHost(): string | null {
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
  return 'localhost';
}

function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const lanHost = devLanHost();

  // Expo LAN (192.168.x.x) ile çalışırken localhost yerine makine IP'sini kullan
  if (lanHost) {
    if (
      !configured ||
      configured.includes('localhost') ||
      configured.includes('127.0.0.1')
    ) {
      return `http://${lanHost}:${API_PORT}/api`;
    }
  }

  if (configured) return configured;
  return `http://${platformFallbackHost()}:${API_PORT}/api`;
}

export const API_URL = resolveApiUrl();
