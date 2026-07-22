import Constants from 'expo-constants';
import { Platform } from 'react-native';

function defaultApiUrl() {
  // Android emulator cannot reach host localhost
  if (Platform.OS === 'android') return 'http://10.0.2.2:8788/api';
  return 'http://localhost:8788/api';
}

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_API_URL ||
  defaultApiUrl();
