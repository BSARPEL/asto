# Mimari

## Genel bakış

Production mobil uygulama **iki bağımsız backend** kullanır:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Expo Mobile (apps/mobile)                    │
├────────────────────────────┬────────────────────────────────────┤
│  Firebase SDK              │  AI HTTP client (lib/ai-api.ts)     │
│  Auth + Firestore          │  Bearer: Firebase ID token          │
└─────────────┬──────────────┴──────────────────┬─────────────────┘
              │                                  │
              ▼                                  ▼
   ┌──────────────────────┐        ┌──────────────────────────┐
   │ Firebase (bn-astro)  │        │ AI API (Express / CF)    │
   │ Firestore: bnastro   │        │ packages/api             │
   └──────────────────────┘        │  ai.ts (Gemini)          │
                                   │  routes/ai-routes.ts     │
                                   └──────────────────────────┘
                                              │
                                   @asto/shared (chart engine, tipler)
```

| Veri / işlem | Nerede |
|--------------|--------|
| Kayıt, giriş, profil | Firebase Auth + Firestore (`users`) |
| Doğum haritası hesaplama | **Mobil** — `computeNatalChart` (`@asto/shared`) |
| Partner CRUD | Firestore (mobil SDK) |
| Jeton, reklam ödülü | Firestore (mobil SDK) |
| Günlük öngörü, soru, sinastri AI | AI API + Gemini |
| AI sonuç önbelleği | Firestore (okuma/yazma mobil + API Admin SDK) |

Yerel geliştirmede AI API `npm run api` (port 8788). Production: Cloud Functions (`npm run deploy:ai-api`) veya Docker/VPS.

## Katmanlar

### Mobil (`apps/mobile`)

| Modül | Sorumluluk |
|-------|------------|
| `app/` | Expo Router ekranları |
| `lib/auth.tsx` | Firebase Auth + profil state |
| `lib/birth-service.ts` | Harita hesapla + Firestore kaydet |
| `lib/firebase-data.ts` | Partner, okuma önbelleği, jeton |
| `lib/ai-service.ts` | Firebase veri + AI üretimini birleştirir |
| `lib/ai-api.ts` | AI endpoint HTTP çağrıları |
| `lib/config.ts` | `EXPO_PUBLIC_AI_API_URL`, `usesFirebaseDirect()` |
| `lib/monetization.ts` | IAP / AdMob (Firebase veya stub) |

**Akış:** `index` → login/register → birth onboarding → tabs.

### AI API (`packages/api`)

| Modül | Sorumluluk |
|-------|------------|
| `routes/ai-routes.ts` | Mobil AI endpoint’leri |
| `routes/legacy-routes.ts` | Eski tam REST (JSON store / dev) |
| `ai.ts` | Prompt + Gemini / OpenAI / mock |
| `store-firestore.ts` | Firestore (Firebase ID token auth) |
| `middleware.ts` | Bearer → Firebase Admin verify |

### Shared (`packages/shared`)

Tipler, jeton sabitleri, `chart/engine.ts` (astronomy-engine), Firestore şema sabitleri.

## Harita motoru

1. Doğum yerel saati → timezone → UTC  
2. Gezegenler: geocentric ecliptic (`GeoVector` + `Ecliptic`)  
3. ASC/MC + whole-sign evler  
4. Sinastri skoru ve açılar

Hem mobil hem AI API aynı `computeNatalChart` fonksiyonunu kullanır.

## AI sözleşmesi

- Türkçe, eğilim dili; kehanet değil  
- Girdi: hesaplanmış natal/transit/sinastri JSON  
- `GEMINI_API_KEY` yoksa mock metin  
- Modelden ephemeris istenmez

## Veri modeli (Firestore)

- **users:** profil, birth, natalChart, chartNarrative, tokenBalance  
- **partners:** birth, natalChart, analysis, synastryScore  
- **readings:** günlük öngörü cache (`userId_date`)  
- **conversations:** günlük / sinastri mesajları  
- **ledger, adClaims:** jeton ekonomisi  

Kurallar: `firebase/firestore.rules` — kullanıcı yalnızca kendi `users/{uid}` ve alt koleksiyonlarına erişir.

## Monetizasyon

Jeton maliyetleri `@asto/shared` `TOKEN_COSTS`. Kayıt bonusu, soru, harita yorumu, sinastri, rewarded ad — bkz. shared sabitleri.

Production: RevenueCat + AdMob (şu an kısmen simüle).

## Güvenlik notları

- Mobil: Firebase Auth; AI API: Firebase ID token doğrulama (Admin SDK)  
- Gemini anahtarı yalnızca sunucuda  
- Legacy JSON store (`STORE_BACKEND=json`) yalnızca yerel dev için
