---
name: ai-features
description: Add or fix Gemini AI features in Asto (daily reading, chart narrative, Q&A, synastry). Use when touching ai.ts, ai-routes, ai-api, ai-service, or ai-direct.
paths:
  - packages/api/src/ai.ts
  - packages/api/src/routes/ai-routes.ts
  - apps/mobile/lib/ai-api.ts
  - apps/mobile/lib/ai-service.ts
  - apps/mobile/lib/ai-direct.ts
---

# AI özellikleri (Asto)

## Katmanlar

| Ortam | Yol |
|-------|-----|
| Production | HTTPS Cloud Functions → `packages/api` + `GEMINI_API_KEY` |
| Yerel dev | `npm run api` → `http://localhost:8788/api` |
| Geçici mobil | `EXPO_PUBLIC_GEMINI_API_KEY` → `ai-direct.ts` (gitignore `.env`) |

Mobil orchestration: `lib/ai-service.ts`. HTTP client: `lib/ai-api.ts`.

## Yeni AI özelliği checklist

1. Prompt / logic → `packages/api/src/ai.ts`
2. Route → `packages/api/src/routes/ai-routes.ts`
3. Mobil client → `apps/mobile/lib/ai-api.ts`
4. Orchestration → `apps/mobile/lib/ai-service.ts`
5. UI ekranı + `TOKEN_COSTS` (`@asto/shared`)
6. `docs/API.md` güncelle

## Kurallar

- Gezegen konumunu LLM'e hesaplatma — `computeNatalChart` / `chartSummaryForPrompt`
- Anahtarlar yalnızca `packages/api/.env`; mobile'a secret koyma
- Türkçe çıktı; kehanet dili kullanma (prompt'larda tanımlı)
- Veri Firestore'da kalıcı: readings, conversations, partner.analysis

## Deploy

```bash
firebase login
npm run deploy:ai-api
```

Health: `GET /api/health` (yerel veya Cloud Functions URL).

## Test

```bash
npm run test:ai
node scripts/test-ai-api.mjs
```
