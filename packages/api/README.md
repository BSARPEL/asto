# @asto/api

Express AI API — Gemini öngörü, sinastri, sohbet. Production'da Firebase Cloud Functions (`astoApi`) olarak deploy edilir.

## Giriş noktaları

| Dosya | Rol |
|-------|-----|
| `src/index.ts` | HTTP sunucu (port 8788) |
| `src/routes/ai-routes.ts` | Mobil AI endpoint'leri |
| `src/routes/legacy-routes.ts` | Eski REST (JSON store) |
| `src/ai.ts` | Gemini prompt'ları |
| `src/store-firestore.ts` | Firestore Admin |

## Komutlar

```bash
npm run dev          # tsx watch
npm run build        # tsc → dist/
npm run db:init      # Firestore _meta/schema
```

Kökten: `npm run api`, `npm run deploy:ai-api`

## Env

`cp .env.example .env` — bkz. [docs/SECRETS.md](../../docs/SECRETS.md)

## Dokümantasyon

- [docs/API.md](../../docs/API.md)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
