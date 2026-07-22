# Mimari

## Genel bakış

```
┌─────────────────┐     HTTPS/JSON      ┌──────────────────┐
│  Expo Mobile    │ ──────────────────► │  Express API     │
│  apps/mobile    │ ◄────────────────── │  packages/api    │
└────────┬────────┘                     └────────┬─────────┘
         │                                       │
         │ @asto/shared                          ├── chart/engine (astronomy-engine)
         │                                       ├── ai.ts (OpenAI | mock)
         ▼                                       └── store.ts → data/db.json
┌─────────────────┐
│ packages/shared │
└─────────────────┘
```

Mobil istemci doğum verisini API’ye gönderir. Harita **sunucuda** hesaplanır ve saklanır. AI yorumları hesaplanmış chart/transit JSON’u ile üretilir.

## Katmanlar

### Mobil (`apps/mobile`)

| Katman | Sorumluluk |
|--------|------------|
| `app/` | Expo Router ekranları ve navigasyon |
| `components/` | Paylaşılan UI (`ui.tsx`, `BirthForm`) |
| `lib/api.ts` | Backend HTTP client |
| `lib/auth.tsx` | Oturum + profil state |
| `lib/monetization.ts` | IAP / AdMob stub |
| `constants/theme.ts` | Renk, spacing, radius |

**Akış:** `index` → login/register → birth onboarding (natal yoksa) → tabs (`chart`, `forecast`, `relationship`, `tokens`, `profile`).

### API (`packages/api`)

| Modül | Sorumluluk |
|-------|------------|
| `chart/engine.ts` | Natal, transit, sinastri skoru/açıları |
| `ai.ts` | Prompt + OpenAI veya mock metin |
| `store.ts` | Kullanıcı, partner, konuşma, jeton ledger |
| `routes.ts` | REST endpoint’ler |
| `middleware.ts` | Bearer auth |

### Shared (`packages/shared`)

Tek kaynak: TypeScript tipleri, jeton ekonomisi sabitleri, Türkçe burç/gezegen etiketleri, şehir preset’leri.

## Harita motoru

1. Doğum yerel saati → timezone offset → UTC  
2. Gezegenler: geocentric ecliptic longitude (`GeoVector` + `Ecliptic`; Ay: `EclipticGeoMoon`)  
3. ASC/MC: local sidereal time + enlem  
4. Evler: **whole sign** (yükselen burcun 0°’si 1. ev)  
5. Açılar: conjunction, opposition, trine, square, sextile (orb limitleri kodda)

Sinastri: iki natal arasındaki açılar + kaba uyum skoru (35–98).

## AI sözleşmesi

- Sistem prompt: Türkçe, abartısız, kehanet değil eğilim dili  
- Girdi: natal özeti (+ transit / sinastri)  
- `OPENAI_API_KEY` yoksa tutarlı demo metinler  
- Modelden ham ephemeris istenmez

## Veri modeli (özet)

- **Profile:** email, displayName, tokenBalance, isSubscribed, birth, natalChart  
- **Partner:** birth, natalChart, synastryScore, analysis  
- **Conversation / messages:** soru-cevap geçmişi  
- **DailyReading:** userId + date cache  
- **TokenLedger:** delta + reason  

Opsiyonel SQL: `supabase/schema.sql`.

## Monetizasyon

| Olay | Varsayılan |
|------|------------|
| Kayıt | +5 jeton |
| Soru | −1 (abone: 0) |
| Harita anlatımı | −2 |
| İlişki analizi | −3 |
| Günlük öngörü | günde 1 cache, ücretsiz |
| Rewarded ad | +1, günde max 5 |
| IAP | +5 / +10 / +50; aylık abonelik |

Production’da RevenueCat webhook + AdMob; şu an API stub.

## Güvenlik notları (MVP)

- Şifreler hash’siz local JSON’da — production’a çıkmadan hash + gerçek auth şart  
- CORS açık; rate limit yok  
- Secret’lar `.env` (git’e ekleme)
