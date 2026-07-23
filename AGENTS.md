# AGENTS.md — Asto için AI / agent rehberi

Bu dosya Cursor ve diğer AI agent’ların projeyi hızlı kavraması içindir.

## Proje nedir?

**Asto**: Expo (React Native) + Firebase (Auth/Firestore) + Gemini AI API ile astroloji uygulaması.

Kullanıcı doğum bilgisi girer → natal harita cihazda hesaplanır (Firestore’a yazılır) → günlük öngörü, soru-cevap ve ilişki (sinastri) analizi **AI API** üzerinden üretilir. Jeton / abonelik / ödüllü reklam ekonomisi vardır.

**Değil:** Astromatik klonu markası; pixel-perfect UI kopyası.

## İki katman (önemli)

| Katman | Env | Mobil modüller | Sorumluluk |
|--------|-----|----------------|------------|
| **Firebase** | `EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_DATA_BACKEND=firebase` | `firebase*.ts`, `birth-service.ts`, `auth.tsx`, `monetization.ts` | Auth, profil, harita kaydı, partner CRUD, önbellek, jeton |
| **AI API** | `EXPO_PUBLIC_GEMINI_API_KEY` (doğrudan Gemini) | `ai-direct.ts`, `ai-service.ts` | Gemini: günlük öngörü, harita yorumu, soru-cevap, sinastri — Cloud Functions yok |

## Hızlı harita

| Ne | Nerede |
|----|--------|
| Mobil ekranlar | `apps/mobile/app/` |
| UI kit | `apps/mobile/components/ui.tsx` |
| AI orchestration | `apps/mobile/lib/ai-service.ts` |
| AI HTTP client | `apps/mobile/lib/ai-api.ts` |
| Firebase veri | `apps/mobile/lib/firebase-data.ts` |
| Doğum / harita | `apps/mobile/lib/birth-service.ts` |
| Auth context | `apps/mobile/lib/auth.tsx` |
| Chart engine | `packages/shared/src/chart/engine.ts` |
| AI prompts | `packages/api/src/ai.ts` |
| AI routes | `packages/api/src/routes/ai-routes.ts` |
| Legacy REST | `packages/api/src/routes/legacy-routes.ts` |
| Firestore (server) | `packages/api/src/store-firestore.ts` |
| Shared types | `packages/shared/src/` |
| Cursor rules | `.cursor/rules/*.mdc` |
| Agent skills (kaynak) | `.cursor/skills/` → `npm run sync:skills` |
| Qwen Code | `.qwen/skills/`, `.qwen/settings.json` |
| Claude Code | `.claude/skills/`, `CLAUDE.md`, `.claude/settings.json` |
| İnsan dokümantasyonu | `docs/` — indeks: `docs/README.md` |

## Agent çalışma kuralları

1. **Yayın odaklı düşün:** Mağaza build'leri LAN/localhost kullanmaz; AI = HTTPS Cloud Functions, veri = Firebase. Yerel API yalnızca `.env.development`.
2. Shared sabiti değiştirirsen `npm run sync:shared` çalıştır (veya `dev:all` açıksa otomatik olur). Skill düzenlediysen `npm run sync:skills`.
3. `apps/mobile/app.json`, mobile `package.json` veya native paket eklersen `npm run sync:ios` çalıştır.
4. Gezegen konumunu LLM’e hesaplatma — `computeNatalChart` engine’den ver.
5. API secret’larını mobile’a koyma — bkz. [docs/SECRETS.md](docs/SECRETS.md).
6. Mevcut tema/UI bileşenlerini tercih et; yeni tasarım sistemi icat etme.
7. Plan dosyasını (`.cursor/plans/`) kullanıcı istemedikçe düzenleme.
8. Commit yalnızca kullanıcı istediğinde.
9. **iOS:** Metro/Expo Go kullanılmaz. `withNativeIosStandalone` plugin gömülü bundle zorunlu kılar. JS değişince Xcode ⌘R veya `ios:device`. Native değişince `sync:ios`.

## Tipik görev akışları

**Yeni AI özelliği:** `packages/api/src/ai.ts` + `routes/ai-routes.ts` + `lib/ai-api.ts` + `lib/ai-service.ts` + tab ekranı + `TOKEN_COSTS`.

**App Store build:** `npm run setup:production` → `npm run deploy:ai-api` → `npm run ios:archive:store`. Bkz. [docs/FIREBASE-PRODUCTION.md](mdc:docs/FIREBASE-PRODUCTION.md).

**Yeni ekran:** `apps/mobile/app/...` + gerekirse tab layout; `Screen`/`Card`/`Button` kullan.

**Harita hassasiyeti:** `packages/shared/src/chart/engine.ts`. Test: `npm run test:birth`.

## Doğrulama

```bash
npm run dev:all              # API + Metro + otomatik sync (önerilen)
npm run build --workspace=@asto/shared
npm run sync:ios             # native config değiştiyse
npm run api                  # health: GET /api/health
npm run test:auth            # Firebase auth akışı
npm run test:birth           # Harita (Firebase yolu)
npm run test:ai              # AI API + Firebase token
cd packages/api && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

Smoke (Firebase modu): register → doğum haritası → günlük öngörü (AI) → soru → partner analyze → rewarded-ad.

## Daha fazla

- [README.md](README.md) — developer dosya haritası
- [docs/README.md](docs/README.md) — dokümantasyon indeksi
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/MOBILE.md](docs/MOBILE.md)
- [docs/API.md](docs/API.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- [docs/SECRETS.md](docs/SECRETS.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
