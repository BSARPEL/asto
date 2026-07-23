# Mobil uygulama rehberi

Paket: `apps/mobile` — Expo SDK 55, React Native 0.83, Expo Router.

## Navigasyon (Expo Router)

```
app/
├── index.tsx                 # Auth gate → redirect
├── _layout.tsx               # Root: fonts, AuthProvider, Stack
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (onboarding)/
│   └── birth.tsx             # İlk doğum (header back kapalı)
├── (tabs)/
│   ├── _layout.tsx           # Tab bar
│   ├── chart.tsx             # Haritam
│   ├── forecast.tsx          # Günlük öngörü + sohbet
│   ├── relationship.tsx      # Sinastri + partner sohbeti
│   ├── tokens.tsx            # Jeton / abonelik
│   └── profile.tsx           # Profil
└── legal/
    ├── privacy.tsx
    └── terms.tsx
```

### Oturum akışı (`app/index.tsx`)

1. `loading` → spinner
2. `!profile` → `/(auth)/login`
3. `!profile.natalChart` → `/(onboarding)/birth`
4. Aksi halde → `/(tabs)/chart`

## Lib modülleri — sorumluluklar

### Firebase katmanı

| Modül | Sorumluluk |
|-------|------------|
| `firebase-config.ts` | `EXPO_PUBLIC_FIREBASE_*` okuma |
| `firebase.ts` | `initializeApp`, Auth persistence (AsyncStorage), Firestore `bnastro` |
| `firebase-profile.ts` | Kayıt (`writeBatch` users+ledger), giriş, profil kaydet |
| `firebase-data.ts` | Partner, reading, conversation, jeton transaction, IAP sim |
| `firestore-write.ts` | `forFirestore()` — undefined strip |
| `birth-service.ts` | `computeNatalChart` + Firestore profil güncelleme |

### AI katmanı

| Modül | Sorumluluk |
|-------|------------|
| `config.ts` | `AI_API_URL`, `usesDirectGemini()`, production LAN engeli |
| `ai-api.ts` | HTTPS AI API HTTP (Bearer Firebase token) |
| `ai-direct.ts` | Doğrudan Gemini (yerel `EXPO_PUBLIC_GEMINI_API_KEY`) |
| `ai-service.ts` | Orchestration: cache oku → AI çağır → Firestore yaz |

**Öncelik sırası (`ai-service.ts`):** `usesDirectGemini()` → `isAiApiConfigured()` → hata.

### Diğer

| Modül | Sorumluluk |
|-------|------------|
| `auth.tsx` | React context: token, profile, login/register/logout |
| `monetization.ts` | RevenueCat / AdMob veya simülasyon |
| `dates.ts` | `localTodayKey(timezone)` — öngörü cache tarihi |
| `birthLocation.ts` | Şehir/ülke seçimi yardımcıları |
| `storage.ts` | AsyncStorage wrapper (auth token) |

## UI kit

`components/ui.tsx` — tüm ekranlarda kullanılan primitives:

- Layout: `Screen`, `ScreenScroll`, `AuthShell`, `GlassCard`
- Form: `Field`, `Button`, `ErrorText`
- İçerik: `Card`, `Title`, `Body`, `SectionTitle`, `MessageBubble`
- Astro: `SignTrio`, `TokenBadge`, `HeroCard`

Tema: `constants/theme.ts` — `colors`, `fonts`, `spacing`, `typography`.

## Ortam dosyaları

| Dosya | Kullanım |
|-------|----------|
| `.env` | Aktif env (gitignore) |
| `.env.development` | Yerel şablon — `cp .env.development .env` |
| `.env.production.example` | Mağaza şablonu |
| `.env.device` | Fiziksel cihaz test (gitignore) |

`app.config.js` compile-time'da `extra` alanına env gömer (`aiApiUrl`, `geminiApiKey`).

## Native iOS

- **Expo Go kullanılmaz** — `withNativeIosStandalone` plugin
- `npm run ios:prebuild` → `ios/` + CocoaPods
- JS bundle her build'de gömülür (`export:embed`)
- Native şablonlar: `native-ios/README.md`

## Yeni özellik eklerken

1. Ekran → `app/` altında route
2. Veri → `firebase-data.ts` veya mevcut lib
3. AI → `ai-service.ts` üzerinden (doğrudan `ai-api` çağırma)
4. UI → `components/ui.tsx` bileşenleri
5. Sabitler → `@asto/shared` (mobile'da hardcode etme)
6. JS değişince Xcode ⌘R

## İlgili dokümanlar

- [DEVELOPMENT.md](./DEVELOPMENT.md) — iOS build
- [API.md](./API.md) — AI endpoint'leri
- [SECRETS.md](./SECRETS.md) — env
- [../.cursor/rules/mobile-expo.mdc](../.cursor/rules/mobile-expo.mdc) — Cursor kuralı
