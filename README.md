# Asto — AI Astroloji

**Asto**, Expo (React Native) + Firebase + Google Gemini ile çalışan bir astroloji uygulamasıdır. Kullanıcı doğum bilgisini girer; natal harita cihazda hesaplanır ve Firestore'a kaydedilir; günlük öngörü, soru-cevap ve ilişki (sinastri) analizi AI katmanı üzerinden üretilir.

> Bu README yeni bir developer'ın projede **nerede ne olduğunu** hızlıca bulması için yazıldı. Özet tablolar + dosya haritası + komut referansı içerir.

---

## İçindekiler

1. [Hızlı başlangıç](#hızlı-başlangıç)
2. [Monorepo yapısı](#monorepo-yapısı)
3. [Mimari özeti](#mimari-özeti)
4. [Dosya haritası — nerede ne var?](#dosya-haritası--nerede-ne-var)
5. [Ortam değişkenleri](#ortam-değişkenleri)
6. [Komut referansı](#komut-referansı)
7. [Geliştirme akışları](#geliştirme-akışları)
8. [Test ve doğrulama](#test-ve-doğrulama)
9. [Production ve App Store](#production-ve-app-store)
10. [Dokümantasyon indeksi](#dokümantasyon-indeksi)
11. [AI agent / Cursor / Claude / Qwen](#ai-agent--cursor--claude--qwen)

---

## Hızlı başlangıç

### Gereksinimler

| Araç | Sürüm |
|------|-------|
| Node.js | ≥ 20 |
| npm | 10+ |
| macOS + Xcode | iOS native build için |
| Firebase CLI | `npm run deploy:*` için (`firebase login`) |

### İlk kurulum (5 adım)

```bash
# 1. Bağımlılıklar + shared build
git clone <repo-url> asto && cd asto
npm install

# 2. API ortamı (Gemini + Firebase Admin)
cp packages/api/.env.example packages/api/.env
# GEMINI_API_KEY doldur
# Admin SDK: packages/api/.secrets/firebase-adminsdk.json

# 3. Mobil ortamı
cp apps/mobile/.env.development apps/mobile/.env
# EXPO_PUBLIC_FIREBASE_* doldur (Firebase Console → Web app)

# 4. Yerel AI API
npm run api
# → http://localhost:8788/api/health

# 5. iOS native (fiziksel cihaz / TestFlight)
npm run ios:prebuild
npm run ios:open   # Xcode → Signing → ⌘R
```

Detaylı kurulum: [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)  
Anahtarlar: [docs/SECRETS.md](./docs/SECRETS.md)

---

## Monorepo yapısı

```
asto/
├── apps/
│   └── mobile/              # Expo RN uygulaması (App Store hedefi)
├── packages/
│   ├── api/                 # Express AI API → Firebase Cloud Functions
│   └── shared/              # Tipler, chart engine, TOKEN_COSTS, Firestore şema
├── firebase/
│   └── firestore.rules      # Güvenlik kuralları (bnastro DB)
├── functions/               # Cloud Functions bundle (astoApi)
├── scripts/                 # Deploy, test, iOS, sync yardımcıları
├── docs/                    # İnsan dokümantasyonu
├── .cursor/                 # Cursor rules + agent skills (kaynak)
├── .qwen/                   # Qwen Code skills (sync)
├── .claude/                 # Claude Code skills + settings
├── AGENTS.md                # AI agent hızlı rehber
├── CLAUDE.md                # Claude Code proje bağlamı
└── package.json             # Workspace kök scriptleri
```

**npm workspaces:** `apps/*`, `packages/*` — kökten `npm run <script>` çalıştırın.

---

## Mimari özeti

Production'da mobil uygulama **iki bağımsız backend** kullanır:

```
┌─────────────────────────────────────────────────────────────┐
│  apps/mobile (Expo RN)                                      │
├──────────────────────────┬──────────────────────────────────┤
│  Firebase SDK            │  AI HTTP (lib/ai-api.ts)         │
│  Auth + Firestore        │  Bearer: Firebase ID token       │
└────────────┬─────────────┴────────────────┬────────────────┘
             │                              │
             ▼                              ▼
  ┌────────────────────┐         ┌─────────────────────────┐
  │ Firebase bn-astro  │         │ AI API (Express / CF)   │
  │ Firestore: bnastro │         │ packages/api + Gemini   │
  └────────────────────┘         └─────────────────────────┘
```

| İş | Nerede çalışır |
|----|----------------|
| Kayıt, giriş, profil | Firebase Auth + Firestore `users` |
| Doğum haritası hesaplama | **Mobil** — `computeNatalChart` (`@asto/shared`) |
| Partner CRUD, jeton, önbellek | Firestore (mobil SDK) |
| Günlük öngörü, AI sohbet, sinastri | AI API + Gemini |
| AI sonuç cache | Firestore (mobil + API Admin SDK) |

Tam diyagram: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Dosya haritası — nerede ne var?

### Mobil uygulama (`apps/mobile/`)

| Yol | Ne yazıyor / ne yapıyor |
|-----|-------------------------|
| `app/index.tsx` | Oturum kontrolü → login / birth / tabs yönlendirme |
| `app/(auth)/login.tsx` | Giriş ekranı |
| `app/(auth)/register.tsx` | Kayıt ekranı |
| `app/(onboarding)/birth.tsx` | İlk doğum bilgisi |
| `app/(tabs)/chart.tsx` | Natal harita + AI yorum |
| `app/(tabs)/forecast.tsx` | Günlük öngörü + sohbet |
| `app/(tabs)/relationship.tsx` | Partner listesi, sinastri, sohbet |
| `app/(tabs)/tokens.tsx` | Jeton satın alma / reklam |
| `app/(tabs)/profile.tsx` | Profil ve ayarlar |
| `app/legal/privacy.tsx` | Gizlilik metni |
| `app/legal/terms.tsx` | Kullanım şartları |
| `components/ui.tsx` | UI kit (Screen, Card, Button, Field…) |
| `components/BirthForm.tsx` | Doğum bilgisi formu |
| `components/AiChatPanel.tsx` | Sohbet paneli |
| `constants/theme.ts` | Renkler, fontlar, spacing |
| `lib/auth.tsx` | Auth context, login/register/logout |
| `lib/firebase.ts` | Firebase app init (Auth + Firestore) |
| `lib/firebase-config.ts` | `EXPO_PUBLIC_FIREBASE_*` |
| `lib/firebase-profile.ts` | Kayıt, giriş, profil CRUD |
| `lib/firebase-data.ts` | Partner, reading, conversation, jeton |
| `lib/birth-service.ts` | Harita hesapla + Firestore kaydet |
| `lib/ai-service.ts` | AI orchestration (Firebase + AI birleşimi) |
| `lib/ai-api.ts` | HTTPS AI API HTTP client |
| `lib/ai-direct.ts` | Doğrudan Gemini (yerel `.env` anahtarı) |
| `lib/config.ts` | `AI_API_URL`, `usesDirectGemini()`, env çözümleme |
| `lib/monetization.ts` | IAP / AdMob (veya simülasyon) |
| `lib/dates.ts` | Kullanıcı timezone'unda bugünün tarihi |
| `app.config.js` | Expo config, production AI URL |
| `app.json` | Bundle ID, plugin listesi |
| `eas.json` | EAS build profilleri |
| `plugins/withNativeIosStandalone.js` | Gömülü bundle, Metro kapalı |
| `.env` | Aktif mobil env (gitignore) |
| `.env.development` | Yerel geliştirme şablonu |
| `.env.production.example` | Mağaza build şablonu |

Ekran akışı: **login/register → doğum haritası → tabs (harita, öngörü, ilişki, jeton, profil)**

Detay: [docs/MOBILE.md](./docs/MOBILE.md)

### AI API (`packages/api/`)

| Yol | Ne yazıyor / ne yapıyor |
|-----|-------------------------|
| `src/index.ts` | Sunucu başlatma (port 8788) |
| `src/app.ts` | Express app, CORS, hata yakalama |
| `src/routes.ts` | Route kayıt |
| `src/routes/ai-routes.ts` | **Mobil AI endpoint'leri** (production) |
| `src/routes/legacy-routes.ts` | Eski REST (JSON store / dev only) |
| `src/ai.ts` | Gemini prompt'ları ve çağrıları |
| `src/middleware.ts` | Firebase ID token doğrulama |
| `src/store-firestore.ts` | Firestore Admin veri katmanı |
| `src/store-json.ts` | Yerel JSON store (legacy) |
| `src/firebase.ts` | Admin SDK init |
| `src/db/init-firestore.ts` | `_meta/schema` başlatma |
| `.env` | GEMINI_API_KEY, Admin SDK yolu (gitignore) |
| `.env.example` | Şablon |
| `.secrets/firebase-adminsdk.json` | Admin SDK JSON (gitignore) |

Endpoint listesi: [docs/API.md](./docs/API.md)

### Shared paket (`packages/shared/`)

| Yol | Ne yazıyor / ne yapıyor |
|-----|-------------------------|
| `src/types.ts` | `Profile`, `Partner`, `DailyReading`, `ChartData`… |
| `src/constants.ts` | `TOKEN_COSTS`, `TOKEN_REWARDS`, `IAP_PRODUCTS` |
| `src/chart/engine.ts` | `computeNatalChart`, `computeSynastry`, transit |
| `src/firestore-schema.ts` | Koleksiyon adları, doc ID yardımcıları |
| `src/birth.ts` | `normalizeBirthInput` |
| `src/cities.ts` | Şehir preset'leri |
| `src/ai/index.ts` | Paylaşılan Gemini runtime (direct AI) |
| `src/index.ts` | Public export |

**Önemli:** Değişiklikten sonra `npm run build --workspace=@asto/shared` veya `npm run sync:shared`.

### Firebase ve Functions

| Yol | Ne yazıyor / ne yapıyor |
|-----|-------------------------|
| `firebase/firestore.rules` | Firestore güvenlik kuralları |
| `firebase/firestore.indexes.json` | Index tanımları |
| `firebase.json` | Firebase proje config (`bnastro` DB) |
| `functions/src/index.ts` | Cloud Function `astoApi` entry |
| `functions/.env` | Deploy sırasında yazılır (gitignore) |

Veri modeli: [docs/DATABASE.md](./docs/DATABASE.md)

### Kök scriptler (`scripts/`)

| Script | Ne yapar |
|--------|----------|
| `dev-all.mjs` | API + Metro + shared sync (geliştirme) |
| `sync-shared.mjs` | Shared build → mobile/api |
| `sync-ios.mjs` | Native iOS sync |
| `sync-agent-skills.mjs` | `.cursor/skills` → qwen/claude/agents |
| `ios-prebuild` / `ios-open` / `ios-archive.mjs` | iOS native build |
| `verify-store-build.mjs` | Mağaza env doğrulama |
| `deploy-ai-api.mjs` | Cloud Functions deploy |
| `deploy-firestore-rules.mjs` | Firestore rules deploy |
| `test-mobile-auth-flow.mjs` | Auth + Firestore E2E |
| `test-ai-api.mjs` | AI API E2E |
| `test-birth-flow.mjs` | Harita hesaplama testi |
| `test-user-journey.mjs` | Tam kullanıcı yolculuğu |
| `check-secrets.mjs` | Git'e sızan anahtar kontrolü |

---

## Ortam değişkenleri

### Özet tablo

| Değişken | Dosya | Kim kullanır | Gizli mi? |
|----------|-------|--------------|-----------|
| `GEMINI_API_KEY` | `packages/api/.env` | AI API / Cloud Functions | **Evet** |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `packages/api/.env` | AI API Admin SDK | **Evet** |
| `EXPO_PUBLIC_FIREBASE_*` | `apps/mobile/.env` | Mobil Firebase client | Public (normal) |
| `EXPO_PUBLIC_AI_API_URL` | `apps/mobile/.env` | Mobil AI HTTP client | Public URL |
| `EXPO_PUBLIC_APP_ENV` | `apps/mobile/.env` | `development` / `production` | — |
| `EXPO_PUBLIC_GEMINI_API_KEY` | `apps/mobile/.env` | Yalnızca yerel test (gitignore) | **Evet — commit etme** |

Tam rehber: [docs/SECRETS.md](./docs/SECRETS.md)

### Production AI URL (sabit)

```
https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api
```

---

## Komut referansı

### Günlük geliştirme

```bash
npm run dev:all          # API + Metro + otomatik sync (önerilen)
npm run api              # Yalnızca AI API (8788)
npm run mobile           # Yalnızca Expo Metro
npm run sync:shared      # @asto/shared yeniden derle + kopyala
```

### iOS

```bash
npm run ios:prebuild     # Native ios/ oluştur (ilk kez / temiz)
npm run ios:open         # Xcode workspace aç
npm run ios:device       # CLI ile cihaza Release yükle
npm run ios:archive:store  # Mağaza archive (verify + archive)
npm run sync:ios         # Native config değişince
```

### Deploy

```bash
firebase login
npm run deploy:ai-api           # Cloud Functions
npm run deploy:firestore-rules  # Firestore kuralları
npm run setup:production        # Production kurulum yardımcısı
```

### Test

```bash
npm run test:auth      # Kayıt/giriş/harita Firestore
npm run test:birth     # Chart engine
npm run test:ai        # AI API + Firebase token
npm run test:journey   # Tam yolculuk
npm run verify:store   # Mağaza env kontrolü
npm run check:secrets  # Commit öncesi anahtar taraması
```

### Agent skills

```bash
npm run sync:skills    # .cursor/skills → .qwen, .claude, .agents
```

---

## Geliştirme akışları

### Yeni AI özelliği eklemek

1. Prompt → `packages/api/src/ai.ts`
2. Route → `packages/api/src/routes/ai-routes.ts`
3. Mobil HTTP → `apps/mobile/lib/ai-api.ts`
4. Orchestration → `apps/mobile/lib/ai-service.ts`
5. UI ekranı + `TOKEN_COSTS` (`packages/shared/src/constants.ts`)
6. `docs/API.md` güncelle
7. `npm run deploy:ai-api` (production)

### Yeni mobil ekran

1. `apps/mobile/app/...` (Expo Router)
2. `components/ui.tsx` bileşenlerini kullan
3. Gerekirse `app/(tabs)/_layout.tsx` tab ekle
4. JS değişince Xcode ⌘R veya `npm run ios:device`

### Shared sabit / tip değişikliği

1. `packages/shared/src/` düzenle
2. `npm run build --workspace=@asto/shared`
3. Mobile + API TypeScript kontrolü

### Firestore kural değişikliği

1. `firebase/firestore.rules` düzenle
2. `npm run deploy:firestore-rules`
3. `npm run test:auth` ile doğrula

---

## Test ve doğrulama

| Test | Komut | Ne doğrular |
|------|-------|-------------|
| Auth E2E | `npm run test:auth` | Kayıt, giriş, profil, ledger, kurallar |
| Harita | `npm run test:birth` | `computeNatalChart` |
| AI API | `npm run test:ai` | Gemini + Firebase token |
| Yolculuk | `npm run test:journey` | Register → harita → AI |
| API health | `curl localhost:8788/api/health` | `ai: true` |
| TypeScript | `cd packages/api && npx tsc --noEmit` | API tipleri |
| TypeScript | `cd apps/mobile && npx tsc --noEmit` | Mobil tipleri |

Manuel smoke: kayıt → doğum → öngörü → soru → partner sinastri → reklam.

Detay: [docs/TESTING.md](./docs/TESTING.md)  
Sorun giderme: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

---

## Production ve App Store

```
1. packages/api/.env → GEMINI_API_KEY
2. npm run deploy:ai-api
3. npm run deploy:firestore-rules
4. apps/mobile/.env → production (Firebase + HTTPS AI URL)
5. npm run ios:archive:store
6. Xcode → Distribute → App Store Connect
```

- **VPS gerekmez** — AI Cloud Functions üzerinde
- **Metro / Expo Go kullanılmaz** — gömülü JS bundle
- Gemini anahtarı **mobilde olmamalı** (GitHub scanning iptal eder)

Rehberler: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md), [docs/FIREBASE-PRODUCTION.md](./docs/FIREBASE-PRODUCTION.md)

---

## Dokümantasyon indeksi

| Dosya | İçerik |
|-------|--------|
| [README.md](./README.md) | Bu dosya — developer haritası |
| [AGENTS.md](./AGENTS.md) | AI agent'lar için kısa rehber |
| [CLAUDE.md](./CLAUDE.md) | Claude Code oturum bağlamı |
| [docs/README.md](./docs/README.md) | Dokümantasyon indeksi |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Mimari, veri akışı, güvenlik |
| [docs/MOBILE.md](./docs/MOBILE.md) | Mobil uygulama detay rehberi |
| [docs/API.md](./docs/API.md) | REST / AI endpoint referansı |
| [docs/DATABASE.md](./docs/DATABASE.md) | Firestore şema ve kurallar |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Kurulum, iOS, workspace |
| [docs/SECRETS.md](./docs/SECRETS.md) | Anahtarlar ve env |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | App Store, EAS, deploy |
| [docs/FIREBASE-PRODUCTION.md](./docs/FIREBASE-PRODUCTION.md) | Firebase-only production |
| [docs/TESTING.md](./docs/TESTING.md) | Test scriptleri |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Sık karşılaşılan sorunlar |

---

## AI agent / Cursor / Claude / Qwen

| Araç | Konfigürasyon |
|------|---------------|
| **Cursor** | `.cursor/rules/*.mdc`, `.cursor/skills/` |
| **Claude Code** | `CLAUDE.md`, `.claude/skills/`, `.claude/settings.json` |
| **Qwen Code** | `.qwen/skills/`, `.qwen/settings.json` |

Skill kaynağı: `.cursor/skills/` — düzenledikten sonra `npm run sync:skills`.

| Skill | Amaç |
|-------|------|
| `asto-project` | Proje özeti ve kurallar |
| `firebase-firestore` | Auth, Firestore, kurallar |
| `ai-features` | Gemini, AI route'ları |
| `ios-release` | Native build, archive |
| `verify-and-test` | Test komutları |
| `mobile-expo` | `apps/mobile/` scoped |

---

## Özellikler (ürün)

- Doğum haritası (cihazda hesaplanır, Firestore'a kaydedilir)
- Günlük transit öngörüsü (AI + cache)
- Haritaya dayalı soru-cevap (jetonlu)
- İlişki / sinastri analizi + bağlamlı sohbet
- Jeton paketleri, abonelik stub, ödüllü reklam simülasyonu

---

## Lisans ve marka

**Asto** — Astromatik markası, içeriği veya pixel-perfect UI kopyası değildir.
