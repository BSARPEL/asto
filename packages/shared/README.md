# @asto/shared

Paylaşılan tipler, sabitler ve astroloji chart engine. Mobil ve API bu paketi kullanır.

## İçerik

| Modül | İçerik |
|-------|--------|
| `src/types.ts` | `Profile`, `Partner`, `ChartData`, `DailyReading`… |
| `src/constants.ts` | `TOKEN_COSTS`, `TOKEN_REWARDS`, `IAP_PRODUCTS` |
| `src/chart/engine.ts` | `computeNatalChart`, `computeSynastry`, transit |
| `src/firestore-schema.ts` | Koleksiyon adları, doc ID yardımcıları |
| `src/birth.ts` | `normalizeBirthInput` |
| `src/ai/` | Paylaşılan Gemini runtime |

## Build

```bash
npm run build --workspace=@asto/shared
# veya kökten:
npm run sync:shared
```

**Önemli:** `main` = `dist/index.js` — kaynak değişince build şart.

## Dokümantasyon

- [docs/DATABASE.md](../../docs/DATABASE.md)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
