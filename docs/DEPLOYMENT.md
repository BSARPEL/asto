# Dağıtım — App Store ve production

Asto **native standalone** olarak yayınlanır. **Ayrı sunucu (VPS) gerekmez** — AI katmanı Firebase Cloud Functions üzerinde çalışır.

Tam yol haritası: **[FIREBASE-PRODUCTION.md](./FIREBASE-PRODUCTION.md)**

## Mimari

```
[iPhone App Store]
      │
      ├── Firebase Auth + Firestore (veri, harita, jeton)
      │
      └── HTTPS ──► Cloud Function astoApi (Firebase)
                         └── GEMINI_API_KEY (Firebase env — gizli)
```

Yerel geliştirme: opsiyonel `npm run api` (port 8788); production’da kullanılmaz.

## 1. AI API’yi deploy et (Cloud Functions)

```bash
firebase login
# packages/api/.env → GEMINI_API_KEY
npm run deploy:ai-api
```

URL: `https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api`

Gerekli: Blaze plan. Anahtar `packages/api/.env`’den okunur → `functions/.env` → Firebase runtime (git’e girmez).

### Docker / VPS (alternatif — gerekmez)

Sadece Firebase dışı hosting isteyenler için; bkz. aşağıdaki Docker bölümü.

### Docker / VPS (alternatif)

```bash
docker build -f packages/api/Dockerfile -t asto-api .
docker run -p 8788:8788 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY=... \
  -e STORE_BACKEND=firestore \
  -e FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/adminsdk.json \
  asto-api
```

| Değişken | Açıklama |
|----------|----------|
| `GEMINI_API_KEY` | AI için (zorunlu production) |
| `STORE_BACKEND` | `firestore` |
| `FIREBASE_*` | Admin SDK — Firestore okuma/yazma |

## 2. Firebase

- Firestore rules: `npm run deploy:firestore-rules`
- Mobil `EXPO_PUBLIC_FIREBASE_*` değerleri Firebase Console’dan

## 3. Mobil — production build

### EAS Build

```bash
cd apps/mobile
eas secret:create --scope project --name EXPO_PUBLIC_AI_API_URL --value https://.../astoApi/api
# Firebase anahtarları da EAS secret veya eas.json env ile

eas build --platform ios --profile production
eas submit --platform ios --profile production
```

### Xcode Archive

```bash
cp apps/mobile/.env.production.example apps/mobile/.env
# EXPO_PUBLIC_AI_API_URL ve FIREBASE_* doldur

npm run ios:prebuild
npm run ios:open
```

`.env` değişince mutlaka yeniden build — `EXPO_PUBLIC_*` compile-time gömülür.

## 4. Ortam özeti

| Ortam | AI API | Firebase | Metro |
|-------|--------|----------|-------|
| Fiziksel cihaz (yerel) | `http://192.168.x.x:8788/api` | bn-astro dev | Hayır |
| TestFlight / App Store | HTTPS Cloud Functions | production | Hayır |

## 5. Yayın öncesi kontrol listesi

- [ ] `GET {AI_API_URL}/health` → `ai: true`
- [ ] Firestore rules deploy edildi
- [ ] `EXPO_PUBLIC_AI_API_URL` + Firebase env production build’de doğru
- [ ] Privacy / Terms güncel
- [ ] RevenueCat + AdMob production anahtarları

Detaylı geliştirme: [DEVELOPMENT.md](./DEVELOPMENT.md)
