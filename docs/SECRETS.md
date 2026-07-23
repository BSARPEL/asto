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

### Mobil (production — varsayılan)

AI öngörü, sinastri ve sohbet **doğrudan Gemini** üzerinden çalışır (Cloud Functions gerekmez):

`apps/mobile/.env`:

```env
EXPO_PUBLIC_GEMINI_API_KEY=<Google AI Studio anahtarı>
EXPO_PUBLIC_GEMINI_MODEL=gemini-flash-latest
```

iOS kısıtlaması: Google Cloud Console'da anahtarı `com.bn.astro.app` bundle ID ile sınırlayın.

### Sunucu (opsiyonel yedek — `packages/api/.env`)

```env
GEMINI_API_KEY=<anahtarınız>
GEMINI_MODEL=gemini-flash-latest
```

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

Gemini anahtarı Cloud Functions **Secret Manager**’a yazılır (`npm run deploy:ai-api` → `GEMINI_API_KEY` secret).  
Kaynak: `packages/api/.env` (deploy script okur).

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

## 5. İlk kurulum checklist

```bash
# 1. API env
cp packages/api/.env.example packages/api/.env
# GEMINI_API_KEY doldur
# Admin SDK JSON → packages/api/.secrets/firebase-adminsdk.json

# 2. Mobil env (mağaza)
cp apps/mobile/.env.production apps/mobile/.env

# 3. Test
npm run api                    # GET http://localhost:8788/api/health → ai: true
npm run test:ai                # Firebase token + yerel/remote AI API

# 4. Production AI API
firebase login
npm run deploy:ai-api

# 5. Mağaza archive
npm run ios:archive:store
```

---

## Güvenlik

- `packages/api/.secrets/` ve `packages/api/.env` → git’e **eklenmez**
- Admin SDK veya Gemini anahtarını mobil `EXPO_PUBLIC_*` içine koymayın
- Anahtar sızdıysa: Google Cloud / AI Studio’dan rotate edin, yeni JSON indirin
