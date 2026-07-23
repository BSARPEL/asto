import 'dotenv/config';
import {
  FIRESTORE_COLLECTIONS,
  FIRESTORE_DATABASE_ID,
  FIRESTORE_PARTNER_FIELDS,
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
    description:
      'BN Astro Firestore (bnastro) — Auth client + Admin SDK. Schema v2: Harmony relationship funnel on partners.',
    updatedAt: now,
    partnerFields: FIRESTORE_PARTNER_FIELDS,
  };

  await db.collection(FIRESTORE_COLLECTIONS.meta).doc('schema').set(meta, { merge: true });

  // Touch each collection namespace so it appears in Firebase Console after first deploy.
  await db.collection(FIRESTORE_COLLECTIONS.meta).doc('collections').set(
    {
      users: 'profiles, birth, natalChart, soulmateReading, chartNarrative, tokens, Plus',
      users_by_email: 'email → userId lookup (Admin only)',
      sessions: 'legacy Bearer token → userId (Admin only)',
      partners:
        'synastry targets — birth, natalChart, relationshipType, analysisFocus, previewSummary, analysis, fullUnlocked, conversationId',
      conversations: 'daily + synastry chat logs',
      readings: 'daily AI forecasts keyed by userId_date',
      ledger: 'token balance changes (purchase, unlock, ads)',
      adClaims: 'rewarded ad daily limits',
      partnerFields: FIRESTORE_PARTNER_FIELDS,
      schemaVersion: FIRESTORE_SCHEMA_VERSION,
      updatedAt: now,
    },
    { merge: true },
  );

  // Explicit partner field catalog for agents / Console
  await db.collection(FIRESTORE_COLLECTIONS.meta).doc('partner_fields').set(
    {
      schemaVersion: FIRESTORE_SCHEMA_VERSION,
      fields: FIRESTORE_PARTNER_FIELDS,
      relationshipTypes: ['love', 'friendship', 'family', 'work'],
      unlockPaths: ['tokens (fullRelationshipReport)', 'iap (asto_full_report)', 'Plus subscription'],
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
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
