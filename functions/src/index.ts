import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from '../../packages/api/src/app';

process.env.STORE_BACKEND = 'firestore';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'bn-astro';
process.env.FIREBASE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || 'bnastro';
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
process.env.NODE_ENV = 'production';

let app: ReturnType<typeof createApp> | undefined;

function getApp() {
  if (!app) app = createApp();
  return app;
}

/** HTTPS AI API — Gemini anahtarı sunucuda; mobil Firebase ID token gönderir. */
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
