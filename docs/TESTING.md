# Test rehberi

Asto'da otomatik testler **Node scriptleri** olarak kök `scripts/` altında çalışır. Unit test framework (Jest) şu an yok; chart engine smoke ve E2E akışlar script ile doğrulanır.

## Ön koşullar

```bash
npm install
npm run build --workspace=@asto/shared

# API testleri için
cp packages/api/.env.example packages/api/.env
# GEMINI_API_KEY + firebase-adminsdk.json

# Auth/Firestore testleri için
cp apps/mobile/.env.development apps/mobile/.env
# EXPO_PUBLIC_FIREBASE_* doldur
```

## Script referansı

| Komut | Script | Ne test eder |
|-------|--------|--------------|
| `npm run test:auth` | `test-mobile-auth-flow.mjs` | Kayıt, giriş, profil, ledger, birth save, kurallar |
| `npm run test:birth` | `test-birth-flow.mjs` | `computeNatalChart`, Firestore birth kaydı |
| `npm run test:ai` | `test-ai-api.mjs` | Firebase token + AI API endpoint'leri |
| `npm run test:journey` | `test-user-journey.mjs` | Register → harita → AI öngörü → sohbet |
| `npm run verify:store` | `verify-store-build.mjs` | Mağaza `.env` doğrulama |
| `npm run verify:ai-api` | `verify-ai-api.mjs` | Production Cloud Functions health |
| `npm run check:secrets` | `check-secrets.mjs` | Git'te sızan anahtar taraması |

## Manuel smoke (mobil)

1. Kayıt ol → 5 jeton bonusu
2. Doğum haritası kaydet
3. Günlük öngörü al (cache etiketi görünmeli)
4. Soru sor (sohbet kaybolmamalı)
5. Partner ekle → sinastri analizi
6. Partner sohbetinde soru sor
7. Ödüllü reklam (simülasyon)
8. Çıkış → tekrar giriş (oturum kalıcı)

## API health

```bash
# Yerel
npm run api
curl http://localhost:8788/api/health

# Production
curl https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api/health
```

Beklenen: `{ "ok": true, "ai": true, "provider": "gemini", ... }`

## TypeScript

```bash
cd packages/api && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

## Firestore kuralları

Auth testi `sessions` koleksiyonunun engellendiğini doğrular:

```bash
npm run test:auth
# → rules: sessions blocked: permission-denied
```

Kural deploy sonrası:

```bash
npm run deploy:firestore-rules
npm run test:auth
```

## CI önerisi (gelecek)

Önerilen minimum pipeline:

1. `npm run build --workspace=@asto/shared`
2. `cd packages/api && npx tsc --noEmit`
3. `cd apps/mobile && npx tsc --noEmit`
4. `npm run check:secrets`
5. (Opsiyonel, secret'lı runner) `npm run test:auth`

## İlgili

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
