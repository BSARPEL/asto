/** Firebase Web config — bn-astro (public client keys) */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'bn-astro.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'bn-astro',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'bn-astro.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '481390089522',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const FIRESTORE_DATABASE_ID =
  process.env.EXPO_PUBLIC_FIREBASE_DATABASE_ID ?? 'bnastro';

export function firebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId);
}
