# Mobile — `apps/mobile`

Expo SDK 55, React Native, Expo Router. Detaylı rehber: [../../docs/MOBILE.md](../../docs/MOBILE.md).

## Hızlı harita

| Ne | Nerede |
|----|--------|
| Ekranlar | `app/` |
| UI kit | `components/ui.tsx` |
| Auth | `lib/auth.tsx`, `lib/firebase-profile.ts` |
| Firestore veri | `lib/firebase-data.ts` |
| Doğum / harita | `lib/birth-service.ts` |
| AI | `lib/ai-service.ts` → `ai-api.ts` veya `ai-direct.ts` |
| Config | `lib/config.ts`, `app.config.js` |
| Native iOS | `plugins/withNativeIosStandalone.js` |

## Kurallar

- Expo Go / Metro **mağaza build'inde kullanılmaz** — gömülü bundle
- JS değişince Xcode ⌘R veya `npm run ios:device`
- Native değişince `npm run sync:ios`
- `@asto/shared` sabitlerini mobile'da tekrar tanımlama
- UI metinleri Türkçe

## Env

```bash
cp .env.development .env    # yerel
cp .env.production.example .env   # mağaza (doldur)
```

## Agent skills

`apps/mobile/.cursor/skills/mobile-expo/` — bu pakete scoped skill.
