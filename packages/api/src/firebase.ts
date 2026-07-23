import fs from 'fs';
import path from 'path';
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore as getFirestoreDb, type Firestore } from 'firebase-admin/firestore';
import { FIRESTORE_DATABASE_ID } from '@asto/shared';

let app: App | undefined;

function resolveCredentialsPath(): string {
  const credPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH veya GOOGLE_APPLICATION_CREDENTIALS gerekli');
  }
  return path.isAbsolute(credPath) ? credPath : path.join(__dirname, '..', credPath);
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_PROJECT_ID,
  );
}

export function getFirebaseApp(): App {
  if (!app) {
    const resolved = resolveCredentialsPath();
    const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8')) as ServiceAccount;
    app = getApps().length
      ? getApps()[0]!
      : initializeApp({
          credential: cert(serviceAccount),
          projectId:
            process.env.FIREBASE_PROJECT_ID ||
            (serviceAccount as ServiceAccount & { project_id?: string }).project_id,
        });
  }
  return app;
}

export function getFirestore(): Firestore {
  const databaseId = process.env.FIREBASE_DATABASE_ID || FIRESTORE_DATABASE_ID;
  return getFirestoreDb(getFirebaseApp(), databaseId);
}
