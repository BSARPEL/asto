import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from '../../packages/api/src/app';

process.env.STORE_BACKEND = 'firestore';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'bn-astro';
process.env.FIREBASE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || 'bnastro';
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
process.env.NODE_ENV = 'production';
// GEMINI_API_KEY → functions/.env (deploy script yazar; Firebase runtime'a yükler, git'e girmez)

let app: ReturnType<typeof createApp> | undefined;

function getApp() {
  if (!app) {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      console.error('[astoApi] GEMINI_API_KEY eksik — npm run deploy:ai-api çalıştırın');
    }
    app = createApp();
  }
  return app;
}

/** Production AI API — Gemini (Firebase env) + Firestore Admin. Sunucu/VPS gerekmez. */
export const astoApi = onRequest(
  {
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
    maxInstances: 20,
    cors: true,
  },
  (req, res) => getApp()(req, res),
);
