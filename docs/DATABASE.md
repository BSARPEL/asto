# Asto — Veritabanı

Production depolama: **Firebase Firestore** (`bnastro` database, proje `bn-astro`).

Mobil uygulama **doğrudan Firestore** kullanır (Firebase Auth ile). AI API sunucusu aynı veriyi **Firebase Admin SDK** ile okur/yazar.

Yerel geliştirme için API tarafında `STORE_BACKEND=json` ile `packages/api/data/db.json` kullanılabilir (legacy REST testleri).

## Ortam değişkenleri

### Mobil (`apps/mobile/.env`)

```env
EXPO_PUBLIC_DATA_BACKEND=firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_DATABASE_ID=bnastro
```

### API (`packages/api/.env`)

```env
STORE_BACKEND=auto          # auto | firestore | json
FIREBASE_PROJECT_ID=bn-astro
FIREBASE_DATABASE_ID=bnastro
FIREBASE_SERVICE_ACCOUNT_PATH=.secrets/firebase-adminsdk.json
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-flash-latest
```

Admin SDK hesabı: `firebase-adminsdk-fbsvc@bn-astro.iam.gserviceaccount.com`  
Kurulum: **[docs/SECRETS.md](./SECRETS.md)**

## Şema başlatma

```bash
npm run db:init --workspace=@asto/api
```

## Koleksiyonlar

| Koleksiyon | Doc ID | Açıklama |
|------------|--------|----------|
| `users` | `userId` (Firebase UID) | Profil, doğum, harita, jeton |
| `partners` | `partnerId` | İlişki partnerleri (`userId` alanı) |
| `conversations` | `convId` | Günlük / sinastri sohbetleri |
| `readings` | `{userId}_{date}` | Günlük öngörüler |
| `ledger` | `entryId` | Jeton hareketleri |
| `adClaims` | `{userId}_{date}` | Günlük reklam limiti |
| `_meta` | `schema` | Şema sürümü |

Tipler: `packages/shared/src/firestore-schema.ts`

## Güvenlik

- Mobil: Firebase Auth + `firebase/firestore.rules` (kullanıcı kendi verisine erişir).
- AI API: Admin SDK — tüm koleksiyonlara sunucu erişimi; istemci Bearer = Firebase ID token.
- Eski `sessions` / `users_by_email` koleksiyonları legacy JSON store içindi; Firestore modunda kullanılmaz.

## Supabase (isteğe bağlı)

İleride Postgres'e geçiş için: `supabase/schema.sql`
