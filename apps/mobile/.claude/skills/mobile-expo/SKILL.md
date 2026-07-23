---
name: mobile-expo
description: Expo mobile app conventions for Asto screens, Firebase client, and native iOS builds. Use when editing apps/mobile screens, components, or lib.
paths: apps/mobile/**/*
---

# Mobile (Expo → native)

- Router: `apps/mobile/app/` — auth → onboarding birth → `(tabs)`
- UI: `constants/theme.ts` + `components/ui.tsx`
- Firebase: `lib/firebase-*.ts`, `lib/auth.tsx`, `lib/birth-service.ts`
- AI: `lib/ai-service.ts` + `lib/ai-api.ts` (veya `ai-direct.ts`)
- Doğum: `components/BirthForm.tsx` → `birth-service.ts`
- Monetizasyon: `lib/monetization.ts`
- Native: `plugins/withNativeIosStandalone.js` — gömülü bundle

## Build

```bash
npm run ios:prebuild
npm run ios:open   # Xcode ⌘R
```

`app.json` / native paket değişince: `npm run sync:ios`

## Env

`EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_AI_API_URL`, `EXPO_PUBLIC_APP_ENV`

Detay: `.cursor/rules/mobile-expo.mdc`, skill `ios-release`.
