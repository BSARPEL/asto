# Asto — AI Astroloji

Astromatik benzeri özellik setine sahip **Expo (React Native)** uygulaması: **Firebase** (veri) + **Gemini AI API** (yorumlar).

Yeni gelen developer veya AI agent için: **[AGENTS.md](./AGENTS.md)** ve **[docs/](./docs/)**.

## Özellikler

- Doğum haritası (cihazda hesaplanır, Firestore’a kaydedilir)
- Günlük transit öngörüsü (AI API + Gemini)
- Haritaya dayalı soru-cevap (jetonlu)
- İlişki / sinastri analizi
- Jeton paketleri, abonelik stub, ödüllü reklam

## Kurulum

```bash
npm install
npm run build --workspace=@asto/shared
cp packages/api/.env.example packages/api/.env
# packages/api/.env → GEMINI_API_KEY, Firebase Admin (AI API için)
```

### AI API (yerel)

```bash
npm run api
```

`http://localhost:8788/api` — `GET /health` ile Gemini durumunu kontrol edin.

### Mobil

Firebase + AI URL: `apps/mobile/.env` (bkz. `.env.development` / `.env.production.example`).

Fiziksel cihazda yerel AI testi:

```env
EXPO_PUBLIC_AI_API_URL=http://<bilgisayar-ip>:8788/api
```

**App Store:** Firebase + HTTPS AI API — [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Yapı

```
asto/
  apps/mobile/       Expo — Firebase SDK + ai-service
  packages/api/      Gemini AI API (Express / Cloud Functions)
  packages/shared/   Chart engine, tipler, TOKEN_COSTS
  firebase/          Firestore rules, Functions
  docs/
```

## Ortam değişkenleri

| Değişken | Nerede | Açıklama |
|----------|--------|----------|
| `EXPO_PUBLIC_FIREBASE_*` | Mobile | Auth + Firestore |
| `EXPO_PUBLIC_AI_API_URL` | Mobile | Gemini AI API (HTTPS prod) |
| `GEMINI_API_KEY` | API | Gemini (mobilde yok) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | API | Admin SDK → Firestore |

## Dokümantasyon

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Firebase + AI ayrımı
- [docs/API.md](./docs/API.md) — endpoint referansı
- [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) — geliştirme / iOS
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — production deploy
- [AGENTS.md](./AGENTS.md) — AI agent bağlamı
