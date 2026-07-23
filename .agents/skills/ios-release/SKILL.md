---
name: ios-release
description: iOS native build, prebuild, Xcode archive, and App Store env for Asto Expo app. Use when building for device, TestFlight, or fixing mobile production config.
paths:
  - apps/mobile/**
  - scripts/ios-*.mjs
  - scripts/verify-store-build.mjs
---

# iOS release (Asto)

## Önemli

- **Expo Go / Metro kullanılmaz** mağaza sürümünde
- `withNativeIosStandalone` — gömülü JS bundle zorunlu
- JS değişince: Xcode ⌘R veya `npm run ios:device`
- Native/plugin değişince: `npm run sync:ios`

## İlk kurulum

```bash
npm install
npm run build --workspace=@asto/shared
cp apps/mobile/.env.production.example apps/mobile/.env   # doldur
npm run ios:prebuild
npm run ios:open
```

## Mağaza archive

```bash
npm run ios:archive:store
# → ~/Desktop/BNAstro.xcarchive
```

Önce `verify-store-build.mjs` çalışır: `EXPO_PUBLIC_APP_ENV=production`, Firebase `*`, HTTPS AI URL.

## Env (mobil)

| Değişken | Amaç |
|----------|------|
| `EXPO_PUBLIC_APP_ENV` | `production` |
| `EXPO_PUBLIC_FIREBASE_*` | Auth + Firestore |
| `EXPO_PUBLIC_AI_API_URL` | Cloud Functions HTTPS |
| `EXPO_PUBLIC_DATA_BACKEND` | `firebase` |

`app.config.js` production'da LAN URL'yi reddeder.

## EAS

`apps/mobile/eas.json` — `production` profili Cloud Functions URL içerir. Firebase secrets EAS env veya `.env` ile.

## Bundle ID

`com.bn.astro.app` (`app.json`)
