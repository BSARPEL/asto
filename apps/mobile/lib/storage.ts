import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const useSecure = Platform.OS === 'ios' || Platform.OS === 'android';

export async function getItem(key: string): Promise<string | null> {
  if (useSecure) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (useSecure) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (useSecure) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}
