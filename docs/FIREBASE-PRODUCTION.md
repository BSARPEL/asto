# Firebase ile production (sunucu yok)

Asto mağazada **kendi sunucunuz olmadan** çalışır. Tüm AI istekleri **Firebase Cloud Functions** üzerinden gider; Gemini anahtarı yalnızca Firebase ortamında tutulur.

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│  iPhone (App Store)                                         │
│  • Firebase Auth + Firestore (profil, harita, jeton)        │
│  • HTTPS → Cloud Functions (AI)                             │
│  • Gemini anahtarı YOK                                      │
└───────────────┬─────────────────────────┬─────────────────────┘
                │                         │
                ▼                         ▼
     ┌──────────────────┐    ┌──────────────────────────────┐
     │ Firebase         │    │ Cloud Function: astoApi      │
     │ Auth + Firestore │◄───│ packages/api (Express)       │
     │ (bn-astro)       │    │ GEMINI_API_KEY → env (gizli) │
     └──────────────────┘    └──────────────────────────────┘
```

| Bileşen | Nerede | Gizli mi? |
|---------|--------|-----------|
| Kullanıcı verisi | Firestore | Kurallarla korunur |
| Firebase client config | Mobil `.env` | Public (normal) |
| Gemini API anahtarı | `functions/.env` → Cloud Function env | Evet, mobilde yok |
| AI endpoint URL | `EXPO_PUBLIC_AI_API_URL` | Public HTTPS (anahtar değil) |

**Önemli:** `EXPO_PUBLIC_GEMINI_API_KEY` mobilde **kullanılmaz**. GitHub’a sızdığında Google anahtarı iptal eder.

## Tek seferlik kurulum

### 1. Google AI Studio anahtarı

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → yeni anahtar
2. Yalnızca `packages/api/.env` içine yazın (gitignore):

```env
GEMINI_API_KEY=<anahtarınız>
GEMINI_MODEL=gemini-2.5-flash-lite
FIREBASE_PROJECT_ID=bn-astro
FIREBASE_DATABASE_ID=bnastro
```

### 2. Firebase CLI

```bash
npx firebase login
```

Proje: **bn-astro** (Blaze plan — Cloud Functions için gerekli).

### 3. AI API deploy (Cloud Functions)

```bash
npm run deploy:ai-api
```

Bu komut:
- `packages/api/.env` içinden `GEMINI_API_KEY` okur
- `functions/.env` yazar (gitignore)
- `astoApi` Cloud Function’ı deploy eder
- Health kontrolü yapar

Production URL (sabit):

```
https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api
```

Doğrulama:

```bash
curl https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api/health
# → {"ok":true,"ai":true,...}
```

### 4. Firestore şema + kurallar + indeksler (Harmony funnel)

Partner alanları (v2): `relationshipType`, `analysisFocus`, `previewSummary`, `fullUnlocked`, sinastri cache.

```bash
# Tek komut: schema meta + rules + indexes
npm run firebase:setup

# veya ayrı
npm run db:init                 # _meta/schema + partner_fields
npm run deploy:firestore-rules
npm run deploy:firestore-indexes
```

### 5. Mobil production env

```bash
cp apps/mobile/.env.production.example apps/mobile/.env
# Firebase EXPO_PUBLIC_FIREBASE_* doldurun
# EXPO_PUBLIC_GEMINI_API_KEY EKLEMEYİN
```

`EXPO_PUBLIC_AI_API_URL` şablonda zaten Cloud Functions URL’si ile gelir.

### 6. App Store build

```bash
npm run ios:archive:store
```

## Günlük iş akışı

| Ne zaman | Ne yapılır |
|----------|------------|
| Gemini anahtarı değişti | `packages/api/.env` güncelle → `npm run deploy:ai-api` |
| AI prompt / route değişti | `npm run deploy:ai-api` |
| Mobil UI değişti | `npm run ios:archive:store` |
| Firestore şema/kural | `npm run deploy:firestore-rules` |
| Dokümantasyon | `docs/README.md` indeksine bakın |

## Sorun giderme (özet)

Detaylı tablo: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Yerel geliştirme (opsiyonel)

Sunucu kurmadan Firebase + doğrudan Gemini (yalnızca yerel `.env`, commit etme):

```env
EXPO_PUBLIC_GEMINI_API_KEY=<yerel test>
```

Önerilen: yerel API proxy:

```bash
npm run api   # packages/api/.env kullanır
# apps/mobile/.env:
EXPO_PUBLIC_AI_API_URL=http://127.0.0.1:8788/api
```

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| `/health` 404 | `npm run deploy:ai-api` çalıştırılmamış |
| `ai: false` | `GEMINI_API_KEY` geçersiz — yeni anahtar + redeploy |
| 401 AI istekleri | Kullanıcı giriş yapmamış / token süresi dolmuş |
| GitHub key uyarısı | Mobilde `EXPO_PUBLIC_GEMINI_API_KEY` kaldırın; geçmiş commit’leri temizleyin |

## Maliyet

- **Firebase Blaze:** Cloud Functions kullanımına göre (düşük trafikte düşük)
- **Gemini:** Google AI Studio kotası / ücretlendirme
- **VPS:** Gerekmez

Detay: [SECRETS.md](./SECRETS.md), [DEPLOYMENT.md](./DEPLOYMENT.md)
