import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig, FIRESTORE_DATABASE_ID, firebaseConfigured } from './firebase-config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfigured()) {
    throw new Error('Firebase yapılandırması eksik (EXPO_PUBLIC_FIREBASE_*)');
  }
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    if (Platform.OS === 'web') {
      auth = getAuth(firebaseApp);
    } else {
      try {
        auth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        // Zaten başlatılmış (hot reload) — mevcut instance
        auth = getAuth(firebaseApp);
      }
    }
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp(), FIRESTORE_DATABASE_ID);
  }
  return db;
}

export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
