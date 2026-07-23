---
name: verify-and-test
description: Run Asto validation scripts and smoke tests after changes. Use before release, after auth/Firestore/AI/chart changes, or when user asks to verify the app works.
---

# Doğrulama & test (Asto)

## Hızlı kontrol

```bash
npm run build --workspace=@asto/shared
cd packages/api && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

## E2E scriptler

| Script | Ne test eder |
|--------|----------------|
| `node scripts/test-mobile-auth-flow.mjs` | Kayıt, giriş, profil, ledger, kurallar |
| `node scripts/test-user-journey.mjs` | Tam kullanıcı yolculuğu + AI |
| `node scripts/test-birth-flow.mjs` | Doğum haritası |
| `node scripts/test-ai-api.mjs` | AI API + Firebase token |
| `node scripts/verify-store-build.mjs` | Mağaza env doğrulama |

## Yerel API

```bash
npm run api
curl http://localhost:8788/api/health
```

## Smoke akışı (manuel)

1. Kayıt / giriş
2. Doğum haritası kaydet
3. Günlük öngörü (AI)
4. Soru sor
5. Partner ekle + sinastri
6. Ödüllü reklam (simülasyon)

## Firestore kuralları

```bash
npm run deploy:firestore-rules
```

## Başarısızlık ipuçları

- **Auth hatası:** `authBusyRef`, yarım profil, Firebase env
- **AI 404:** Cloud Functions deploy edilmemiş → `npm run deploy:ai-api`
- **Permission denied:** rules deploy + `bnastro` database ID
