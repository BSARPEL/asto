import 'dotenv/config';
import {
  FIRESTORE_COLLECTIONS,
  FIRESTORE_DATABASE_ID,
  FIRESTORE_SCHEMA_VERSION,
  type FirestoreMetaSchemaRecord,
} from '@asto/shared';
import { getFirestore, isFirebaseConfigured } from '../firebase';

export async function initFirestoreSchema(): Promise<FirestoreMetaSchemaRecord> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase yapılandırılmamış — .env dosyasını kontrol edin');
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const meta: FirestoreMetaSchemaRecord = {
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    databaseId: process.env.FIREBASE_DATABASE_ID || FIRESTORE_DATABASE_ID,
    collections: Object.values(FIRESTORE_COLLECTIONS),
    description: 'Asto API Firestore schema — all client access via Express + Admin SDK',
    updatedAt: now,
  };

  await db.collection(FIRESTORE_COLLECTIONS.meta).doc('schema').set(meta, { merge: true });

  // Touch each collection namespace so it appears in Firebase Console after first deploy.
  await db.collection(FIRESTORE_COLLECTIONS.meta).doc('collections').set(
    {
      users: 'profiles + passwordHash',
      users_by_email: 'email → userId lookup',
      sessions: 'Bearer token → userId',
      partners: 'relationship charts per user',
      conversations: 'daily + synastry chat logs',
      readings: 'daily AI forecasts keyed by userId_date',
      ledger: 'token balance changes',
      adClaims: 'rewarded ad daily limits',
      updatedAt: now,
    },
    { merge: true },
  );

  return meta;
}

if (process.argv[1]?.includes('init-firestore')) {
  initFirestoreSchema()
    .then((meta) => {
      console.log('Firestore schema initialized:', meta);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
