# Asto — Veritabanı

Production depolama: **Firebase Firestore** (`bnastro` database). Yerel geliştirme için `STORE_BACKEND=json` ile `packages/api/data/db.json` kullanılabilir.

## Ortam değişkenleri (`packages/api/.env`)

```env
STORE_BACKEND=auto          # auto | firestore | json
FIREBASE_PROJECT_ID=bn-astro
FIREBASE_DATABASE_ID=bnastro
FIREBASE_SERVICE_ACCOUNT_PATH=.secrets/firebase-adminsdk.json
```

## Şema başlatma

```bash
npm run db:init --workspace=@asto/api
```

`_meta/schema` dokümanını yazar ve koleksiyon açıklamalarını kaydeder.

## Koleksiyonlar

| Koleksiyon | Doc ID | Açıklama |
|------------|--------|----------|
| `users` | `userId` | Profil, `passwordHash`, doğum, harita |
| `users_by_email` | `email` (lowercase) | E-posta → `userId` |
| `sessions` | `token` | Oturum token → `userId` |
| `partners` | `partnerId` | İlişki partnerleri |
| `conversations` | `convId` | Günlük / sinastri sohbetleri |
| `readings` | `{userId}_{date}` | Günlük öngörüler |
| `ledger` | `entryId` | Jeton hareketleri |
| `adClaims` | `{userId}_{date}` | Günlük reklam limiti |
| `_meta` | `schema` | Şema sürümü |

Tipler: `packages/shared/src/firestore-schema.ts`

## Güvenlik

- Şifreler **bcrypt** ile hash'lenir (`passwordHash`); düz metin saklanmaz.
- Mobil uygulama Firestore'a doğrudan bağlanmaz — yalnızca API (`Authorization: Bearer`).
- `firebase/firestore.rules`: tüm client erişimi kapalı.

## Supabase (isteğe bağlı)

İleride Postgres'e geçiş için güncel SQL: `supabase/schema.sql`
