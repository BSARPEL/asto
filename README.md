# Asto — AI Astroloji

Astromatik benzeri özellik setine sahip, **Expo (React Native)** + **Node API** ile iOS/Android astroloji uygulaması.

Yeni gelen developer veya AI agent için: **[AGENTS.md](./AGENTS.md)** ve **[docs/](./docs/)**.

## Özellikler

- Doğum haritası (natal gezegenler, whole-sign evler, açılar)
- Günlük transit öngörüsü (AI)
- Haritaya dayalı soru-cevap (jetonlu)
- İlişki / sinastri analizi
- Jeton paketleri, abonelik stub, ödüllü reklam stub

## Kurulum

```bash
npm install
npm run build --workspace=@asto/shared
cp packages/api/.env.example packages/api/.env
```

### API

```bash
# İsteğe bağlı: packages/api/.env içine OPENAI_API_KEY=
npm run api
```

API: `http://localhost:8788/api`

Anahtar yoksa AI yanıtları demo metin üretir; harita hesaplama çalışır.

### Mobil

```bash
npm run mobile
```

Android emülatörde API adresi otomatik `10.0.2.2:8788` olur. Fiziksel cihazda (yerel test):

```bash
# apps/mobile/.env — EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://<bilgisayar-ip>:8788/api
```

**App Store:** API internette HTTPS ile deploy edilir; bkz. [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Yapı

```
asto/
  .cursor/rules/     Cursor AI kuralları (.mdc)
  AGENTS.md          Agent’lar için hızlı rehber
  docs/              Mimari, API, geliştirme
  apps/mobile/       Expo uygulaması
  packages/api/      Chart + AI + jeton API
  packages/shared/   Tipler ve sabitler
  supabase/          İsteğe bağlı Postgres şeması
```

Varsayılan depolama: `packages/api/data/db.json`.

## Ortam değişkenleri

| Değişken | Nerede | Açıklama |
|----------|--------|----------|
| `OPENAI_API_KEY` | API | Gerçek AI yorumları |
| `EXPO_PUBLIC_API_URL` | Mobile | Backend URL |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | Mobile | RevenueCat (yoksa simülasyon) |
| `EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID` | Mobile | AdMob (yoksa simülasyon) |

## Dokümantasyon

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — sistem tasarımı
- [docs/API.md](./docs/API.md) — endpoint referansı
- [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) — geliştirme / EAS
- [AGENTS.md](./AGENTS.md) — AI agent bağlamı

## Mağaza

`apps/mobile/eas.json` ile EAS Build. Privacy/Terms ekranları yer tutucu metin içerir; yayın öncesi güncellenmeli.
