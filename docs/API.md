# API Referansı

Base URL: `http://localhost:8788/api`  
Auth: `Authorization: Bearer <token>` (register/login sonrası)

Başarısız yanıtlar: `{ "error": "mesaj" }`

## Health

### `GET /health`

Auth yok.

```json
{ "ok": true, "service": "asto-api", "ai": false }
```

`ai: true` → `OPENAI_API_KEY` tanımlı.

## Auth

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
