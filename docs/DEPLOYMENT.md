# Dağıtım — App Store ve production API

Asto **native standalone** olarak yayınlanır: JS bundle uygulama içine gömülür, Expo Go veya Metro gerekmez. Kullanıcılar internet üzerinden **deploy edilmiş HTTPS API**'ye bağlanır.

## Mimari

```
[iPhone App Store]  ──HTTPS──►  [api.asto.app / Fly / Railway]
                                      │
                                 packages/api
                                 (chart + AI + auth)
```

Yerel geliştirme (Xcode + LAN) ayrı bir akıştır; mağaza sürümü LAN IP kullanmaz.

## 1. API'yi internete aç

### Docker (önerilen)

Kök dizinden:

```bash
docker build -f packages/api/Dockerfile -t asto-api .
docker run -p 8788:8788 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY=... \
  -v asto-data:/app/packages/api/data \
  asto-api
```

Fly.io, Railway, Render veya bir VPS'e deploy edin. **HTTPS** zorunlu (Let's Encrypt / platform TLS).

Ortam değişkenleri (`packages/api/.env.example`):

| Değişken | Açıklama |
|----------|----------|
| `NODE_ENV` | `production` |
| `PORT` | Genelde `8788` veya platform atar |
| `GEMINI_API_KEY` | AI için |
| `CORS_ORIGINS` | İsteğe bağlı web origin'leri |

Production checklist: şifre hash, Postgres/Supabase, rate limit, yedekleme, loglama.

## 2. Mobil — production build

### EAS Build (App Store / TestFlight)

```bash
cd apps/mobile
npm i -g eas-cli
eas login
eas build:configure   # ilk kez

# Production API URL (HTTPS) — EAS secret
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.asto.app/api

# iOS App Store build
eas build --platform ios --profile production

# TestFlight / App Store Connect
eas submit --platform ios --profile production
```

`eas.json` → `production` profili:

- `EXPO_PUBLIC_APP_ENV=production`
- `EXPO_PUBLIC_API_URL` → EAS secret (build sırasında bundle'a gömülür)
- Release + gömülü `main.jsbundle` (Metro yok)

### Xcode Archive (manuel)

```bash
cp apps/mobile/.env.production.example apps/mobile/.env
# EXPO_PUBLIC_API_URL=https://... düzenle

npm run ios:prebuild
npm run ios:open
```

Xcode: **Product → Archive** → Distribute App.

`.env` değişince mutlaka yeniden build — `EXPO_PUBLIC_*` compile-time gömülür.

## 3. Ortam özeti

| Ortam | `EXPO_PUBLIC_APP_ENV` | API URL | Metro |
|-------|----------------------|---------|-------|
| Simülatör + hot reload | `development` | localhost / LAN | Evet |
| Fiziksel cihaz (yerel test) | `development` | `http://192.168.x.x:8788/api` | Hayır |
| TestFlight / App Store | `production` | `https://api.../api` | Hayır |

## 4. Native standalone nasıl çalışır?

- `plugins/withNativeIosStandalone.js` → AppDelegate + Xcode her build'de gömülü `main.jsbundle`
- `native-ios/.xcode.env.local` → `unset SKIP_BUNDLING` + NODE_BINARY (Xcode Dock fix)
- `updates.enabled: false` → OTA yok; mağaza güncellemesi App Store üzerinden

## 5. Yayın öncesi kontrol listesi

- [ ] API HTTPS ve 7/24 erişilebilir
- [ ] `EXPO_PUBLIC_API_URL` production secret'ta doğru
- [ ] Privacy / Terms metinleri güncel
- [ ] RevenueCat + AdMob production anahtarları
- [ ] App Store ekran görüntüleri, açıklama, yaş derecelendirmesi
- [ ] Apple Developer Team + `com.asto.app` signing

Detaylı geliştirme: [DEVELOPMENT.md](./DEVELOPMENT.md)
