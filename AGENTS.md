# AGENTS.md — Asto için AI / agent rehberi

Bu dosya Cursor ve diğer AI agent’ların projeyi hızlı kavraması içindir.

## Proje nedir?

**Asto**: Expo (React Native) + Node/Express API ile AI astroloji uygulaması.

Kullanıcı doğum bilgisi girer → natal harita hesaplanır → günlük öngörü, soru-cevap ve ilişki (sinastri) analizi alır. Jeton / abonelik / ödüllü reklam ekonomisi vardır.

**Değil:** Astromatik klonu markası; pixel-perfect UI kopyası; production-grade auth (şifreler şu an local JSON’da düz).

## Hızlı harita

| Ne | Nerede |
|----|--------|
| Mobil ekranlar | `apps/mobile/app/` |
| UI kit | `apps/mobile/components/ui.tsx` |
| API client | `apps/mobile/lib/api.ts` |
| Auth context | `apps/mobile/lib/auth.tsx` |
| Chart engine | `packages/api/src/chart/engine.ts` |
| AI prompts | `packages/api/src/ai.ts` |
| HTTP routes | `packages/api/src/routes.ts` |
| DB (JSON) | `packages/api/src/store.ts` → `data/db.json` |
| Shared types | `packages/shared/src/` |
| Cursor rules | `.cursor/rules/*.mdc` |
| İnsan dokümantasyonu | `docs/` |

## Agent çalışma kuralları

1. Shared sabiti değiştirirsen api/mobile’ı senkron tut; shared’ı build et.
2. Gezegen konumunu LLM’e hesaplatma — engine’den ver.
3. API secret’larını mobile’a koyma.
4. Mevcut tema/UI bileşenlerini tercih et; yeni tasarım sistemi icat etme.
5. Plan dosyasını (`.cursor/plans/`) kullanıcı istemedikçe düzenleme.
6. Commit yalnızca kullanıcı istediğinde.

## Tipik görev akışları

**Yeni AI özelliği:** `packages/api/src/ai.ts` + route + `lib/api.ts` + ilgili tab ekranı + jeton maliyeti (`TOKEN_COSTS`).

**Yeni ekran:** `apps/mobile/app/...` + gerekirse tab layout; `Screen`/`Card`/`Button` kullan.

**Harita hassasiyeti:** `chart/engine.ts` (ASC/MC, ev sistemi, ephemeris). Test için `npx tsx` ile `computeNatalChart` çağır.

**Supabase’e geçiş:** `supabase/schema.sql` hazır; `store.ts` arkasını değiştir, route imzalarını koru.

## Doğrulama

```bash
npm run build --workspace=@asto/shared
npm run api                    # health: GET /api/health
cd packages/api && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

Smoke: register → PUT `/me/birth` → GET `/readings/daily` → POST `/conversations/ask` → partner analyze → rewarded-ad.

## Daha fazla

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/API.md](docs/API.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- [README.md](README.md)
