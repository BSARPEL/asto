# API Referansı

Base URL:

- Yerel: `http://localhost:8788/api`
- Production: `https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api`
- Mobil: `EXPO_PUBLIC_AI_API_URL` (`lib/config.ts`)

## Mobil hangi endpoint'leri kullanır?

| Mobil modül | Endpoint'ler |
|-------------|--------------|
| `lib/ai-api.ts` | `GET /health`, `POST /readings/daily`, `POST /readings/chart-narrative`, `POST /conversations/ask`, `POST /partners/:id/analyze`, `POST /partners/:id/ask` |
| `lib/ai-direct.ts` | Gemini doğrudan (yerel `.env` — Cloud Functions yerine) |
| Firebase SDK | Auth, profil, doğum, partner CRUD, jeton, okuma önbelleği |

**Auth (AI routes):** `Authorization: Bearer <Firebase ID token>`

Legacy REST (`routes/legacy-routes.ts`): `/auth/*`, `/me`, `PUT /me/birth`, partner CRUD, `/tokens/*` — yalnızca JSON store / eski istemciler. **Mobil production bunları kullanmaz.**

Başarısız yanıtlar: `{ "error": "mesaj" }`

---

## AI routes (production — `ai-routes.ts`)

### `GET /health`

Auth yok.

```json
{ "ok": true, "service": "asto-ai-api", "ai": true, "provider": "gemini", "model": "gemini-2.5-flash-lite" }
```

### `POST /readings/daily`

Body: `{ "force"?: boolean }`  
Natal chart gerekir. Aynı gün cache → `cached: true`.

→ `{ "reading", "conversation", "cached", "cost", "today", "profile" }`

### `POST /readings/chart-narrative`

Body: `{ "force"?: boolean }`  
Jeton: 2 (abone: 0). Cache: `profile.chartNarrative`.

→ `{ "text", "profile", "cost", "cached" }`

### `POST /conversations/ask`

Body: `{ "question", "conversationId?" }`  
Jeton: 1 (abone: 0).

→ `{ "conversation", "profile", "cost" }`

### `POST /partners/:id/analyze`

Body: `{ "force"?: boolean }`  
Jeton: 3 (abone: 0). Sinastri skoru + AI yorumu partner kaydına yazılır.

→ `{ "partner", "synastry", "conversation", "profile", "cost", "cached" }`

### `POST /partners/:id/ask`

Body: `{ "question", "conversationId?" }`  
Önce sinastri analizi gerekir.

→ `{ "conversation", "profile", "cost" }`

---

## Legacy REST (JSON store / dev only)

### `POST /auth/register`

Body: `{ "email", "password", "displayName" }`  
→ `{ "token", "profile" }` — başlangıç jetonu 5.

### `POST /auth/login`

Body: `{ "email", "password" }` → `{ "token", "profile" }`

## Profil

### `GET /me`

→ `{ profile, adClaimsToday, maxAdsPerDay, tokenCosts, products }`

### `PUT /me/birth`

Body (`BirthInput`):

```json
{
  "name": "Ada",
  "birthDate": "1995-06-15",
  "birthTime": "14:30",
  "city": "İstanbul",
  "latitude": 41.0082,
  "longitude": 28.9784,
  "timezone": "Europe/Istanbul"
}
```

Natal chart hesaplanır ve profile yazılır → `{ "profile" }`

## Chart (yardımcı)

### `POST /chart/compute`

Auth opsiyonel. Body: `BirthInput` → `{ "chart" }` (kaydetmez)

### `GET /chart/transits`

→ `{ "transits", "date" }`

## Öngörü / AI

### `GET /readings/daily`

Natal gerekir. Aynı gün cache döner → `{ "reading", "cached" }`

### `POST /readings/chart-narrative`

Jeton: 2 (abone: 0) → `{ "text", "profile", "cost" }`

### `GET /conversations`

→ `{ "conversations": [...] }`

### `POST /conversations/ask`

Body: `{ "question", "conversationId?" }`  
Jeton: 1 → `{ "conversation", "profile", "cost" }`

## İlişki

### `GET /partners`

### `POST /partners`

Body: `BirthInput` → `{ "partner" }`

### `POST /partners/:id/analyze`

Jeton: 3 → `{ "partner", "synastry", "profile", "cost" }`

`synastry`: `{ score, aspects, highlights }`

## Jeton

### `GET /tokens/ledger`

### `POST /tokens/rewarded-ad`

Günlük limit aşımında 400.

### `POST /tokens/purchase`

Body: `{ "productId" }`  
Ürün id’leri: `asto_tokens_5` | `asto_tokens_10` | `asto_tokens_50` | `asto_sub_monthly`  
(Dev stub — mağaza doğrulaması yok)

## ChartData şekli (özet)

```ts
{
  sunSign, moonSign, risingSign: string // TR burç
  planets: [{ name, longitude, sign, signDegree, house, retrograde? }]
  houses: number[12]  // cusp longitudes
  aspects: [{ planetA, planetB, type, orb }]
}
```
