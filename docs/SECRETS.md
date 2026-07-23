# Gizli anahtarlar ve servis hesapları

Bu dosya **nerede** saklanacağını ve **hangi env değişkenlerinin** kullanılacağını tanımlar.  
Gerçek anahtarları **asla** git’e commit etmeyin (`.gitignore` ile hariç tutulur).

## Özet

| Ne | Nerede | Kim kullanır |
|----|--------|--------------|
| Firebase Admin SDK JSON | `packages/api/.secrets/firebase-adminsdk.json` | AI API sunucusu (Firestore Admin) |
| Gemini API anahtarı | `packages/api/.env` → `GEMINI_API_KEY` | AI API sunucusu (Cloud Functions / yerel) |
| Firebase client config | `apps/mobile/.env` → `EXPO_PUBLIC_FIREBASE_*` | Mobil uygulama (Auth + Firestore SDK) |

Mobil uygulama **Gemini anahtarını veya Admin SDK’yı görmez**.

---

## 1. Firebase Admin SDK

**Proje:** `bn-astro`  
**Servis hesabı e-posta:** `firebase-adminsdk-fbsvc@bn-astro.iam.gserviceaccount.com`  
**Firestore database:** `bnastro`

### Kurulum

Firebase Console → Project settings → Service accounts → Generate new private key  
İndirilen dosya örneği: `bn-astro-firebase-adminsdk-fbsvc-b2c5b1ac1e.json`

Projede şu konuma kopyalayın (sabit isim):

```bash
cp ~/Downloads/bn-astro-firebase-adminsdk-fbsvc-*.json \
  packages/api/.secrets/firebase-adminsdk.json
```

`packages/api/.env`:

```env
FIREBASE_PROJECT_ID=bn-astro
FIREBASE_DATABASE_ID=bnastro
FIREBASE_SERVICE_ACCOUNT_PATH=.secrets/firebase-adminsdk.json
STORE_BACKEND=auto
```

Alternatif (bazı araçlar için):

```env
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/asto/packages/api/.secrets/firebase-adminsdk.json
```

**Kullanım:** AI API, mobil kullanıcının Firebase ID token’ını doğrular ve Firestore’da profil / öngörü / jeton işlemlerini yapar.

---

## 2. Google Gemini (AI)

**Kaynak:** [Google AI Studio](https://aistudio.google.com/apikey) — `generativelanguage.googleapis.com`  
**Firebase ile ilgisi yok.**

### Production (mağaza)

AI öngörü, sinastri ve sohbet **Cloud Functions AI API** üzerinden çalışır. Gemini anahtarı yalnızca sunucudadır:

`apps/mobile/.env` / `.env.production` (gitignore — commit etmeyin):

```env
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_AI_API_URL=https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api
```

**Mobilde `EXPO_PUBLIC_GEMINI_API_KEY` kullanmayın** — GitHub secret scanning anahtarı Google'a bildirir ve Google otomatik iptal eder.

### Sunucu (`packages/api/.env` — gitignore)

```env
GEMINI_API_KEY=<anahtarınız>
GEMINI_MODEL=gemini-2.5-flash-lite
```

Deploy: `npm run deploy:ai-api` → Firebase Cloud Function env (`functions/.env`, gitignore).

### Yerel geliştirme (opsiyonel doğrudan Gemini)

Yalnızca `apps/mobile/.env` (gitignore). Asla `.env.production` veya GitHub'a koymayın:

```env
EXPO_PUBLIC_GEMINI_API_KEY=<yalnızca yerel test>
```

Alternatif (önerilen): `npm run api` + `EXPO_PUBLIC_AI_API_URL=http://127.0.0.1:8788/api`

### Yerel doğrulama (terminal)

```bash
# packages/api/.env içindeki GEMINI_API_KEY ile
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent" \
  -H "Content-Type: application/json" \
  -H "X-goog-api-key: $GEMINI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Merhaba"}]}]}'
```

Başarılı yanıt: HTTP 200, `candidates[0].content.parts[0].text`.

### Production deploy

Gemini anahtarı Cloud Functions ortamına yazılır (`npm run deploy:ai-api` → `functions/.env`, gitignore).  
Kaynak: `packages/api/.env` (yalnızca deploy makinesinde).

---

## 3. Mobil Firebase (client — public)

`apps/mobile/.env` / `.env.production` — bunlar **client** anahtarlarıdır, Admin SDK değildir:

```env
EXPO_PUBLIC_DATA_BACKEND=firebase
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bn-astro
EXPO_PUBLIC_FIREBASE_DATABASE_ID=bnastro
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
# ... diğer EXPO_PUBLIC_FIREBASE_*
```

Değerler: Firebase Console → Project settings → Your apps → Web app config.

---

## 4. Production AI API URL (mobil)

Mağaza build’leri — tüm telefonlar:

```env
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_AI_API_URL=https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api
```

Deploy: `firebase login` → `npm run deploy:ai-api`

---

## İlk kurulum checklist

```bash
# 1. API env
cp packages/api/.env.example packages/api/.env
# GEMINI_API_KEY doldur
# Admin SDK JSON → packages/api/.secrets/firebase-adminsdk.json

# 2. Mobil env (mağaza)
cp apps/mobile/.env.production.example apps/mobile/.env

# 3. Test
npm run api                    # GET http://localhost:8788/api/health → ai: true
npm run test:auth              # Firebase auth + Firestore
npm run test:ai                # Firebase token + AI API

# 4. Production AI API
firebase login
npm run deploy:ai-api
npm run deploy:firestore-rules

# 5. Mağaza archive
npm run ios:archive:store
```

Tam developer rehberi: [README.md](../README.md) | Test: [TESTING.md](./TESTING.md)

---

## Güvenlik

- `packages/api/.secrets/`, `packages/api/.env`, `apps/mobile/.env*` (production/device) → git'e **eklenmez**
- Gemini anahtarını mobil `EXPO_PUBLIC_GEMINI_API_KEY` içine koymayın (mağaza build'i bundle'dan da okunabilir)
- Commit öncesi: `npm run check:secrets`
- Anahtar sızdıysa: Google AI Studio'dan yeni anahtar → `packages/api/.env` → `npm run deploy:ai-api`; Git geçmişinden temizlemek için `git filter-repo` veya BFG gerekebilir

Sorun giderme: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
