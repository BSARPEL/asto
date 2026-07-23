# Geliştirme rehberi

## Gereksinimler

- Node.js ≥ 20
- npm 10+
- iOS fiziksel cihaz: macOS + Xcode
- (Opsiyonel) Simülatör / canlı JS için Expo Metro

## İlk kurulum

```bash
git clone <repo>
cd asto
npm install
npm run build --workspace=@asto/shared
cp packages/api/.env.example packages/api/.env
# isteğe bağlı: OPENAI_API_KEY=
```

## Günlük komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run api` | API watch (`tsx`) port 8788 |
| `npm run mobile` | Expo Metro (simülatör / hot reload) |
| `npm run ios:prebuild` | Native `ios/` projesi (Metro gerekmez) |
| `npm run ios:open` | Xcode workspace aç |
| `npm run ios:device` | CLI ile cihaza Release build |
| `npm run build --workspace=@asto/shared` | Shared derle |
| `npx tsc --noEmit` (api veya mobile dizininde) | Tip kontrolü |

## Ortam değişkenleri

### `packages/api/.env`

```
PORT=8788
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### `apps/mobile/.env` (yerel geliştirme)

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_DATA_BACKEND=firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_DATABASE_ID=bnastro
EXPO_PUBLIC_AI_API_URL=http://192.168.x.x:8788/api
```

Harita kaydı REST API kullanmaz — `birth-service.ts` + Firestore.

### App Store build

`EXPO_PUBLIC_APP_ENV=production`, Firebase + HTTPS `EXPO_PUBLIC_AI_API_URL` — bkz. `.env.production.example` ve [DEPLOYMENT.md](./DEPLOYMENT.md).

## iOS — her zaman native standalone (Metro / Expo Go yok)

iOS build'leri **her zaman** gömülü `main.jsbundle` ile çıkar; TestFlight ve App Store'a doğrudan yüklenebilir.

**Nasıl sağlanır** (`plugins/withNativeIosStandalone.js`):
- `AppDelegate` → Metro dev server'a asla bağlanmaz
- Xcode bundle script → Debug dahil her build'de `export:embed`
- `unset SKIP_BUNDLING` (bash'te `=0` yine "atla" sayılır — bilinen RN tuzağı)
- EAS tüm profiller → `Release`

### İlk kurulum / native değişiklik

```bash
npm run ios:prebuild    # expo prebuild + pods + native-ios
npm run ios:open        # Xcode workspace
```

`app.json`, plugin veya native paket değişince: `npm run sync:ios:force`

### Cihazda test

```bash
npm run api             # API (fiziksel cihaz: .env LAN IP)
npm run ios:device      # Release + --no-bundler → telefona yükle
```

Xcode: Signing Team → **⌘R** (Debug/Release fark etmez; JS gömülü).

### TestFlight / App Store

1. `.env` → `EXPO_PUBLIC_APP_ENV=production` + HTTPS API URL
2. Xcode → **Any iOS Device** → **Product → Archive**
3. **Distribute App** → App Store Connect

Alternatif: `npm run build:ios` (EAS). Detay: [DEPLOYMENT.md](./DEPLOYMENT.md).

### JS değişikliği sonrası

Native build'de Fast Refresh yok. JS/TS değiştirdiysen Xcode'da yeniden **⌘R** veya `npm run ios:device` (bundle yeniden gömülür).

### Opsiyonel: simülatör + Metro hot reload

Yalnızca hızlı UI iterasyonu için: `npm run mobile` + simülatör. **Fiziksel cihaz ve mağaza bu akışı kullanmaz.**

## Workspace notları

- npm workspaces: kök `package.json` → `apps/*`, `packages/*`
- Metro `apps/mobile/metro.config.js` monorepo `watchFolders` ile shared’ı izler
- `@asto/shared` `main` = `dist/` — kaynak değişince build şart

## Kod stili

- TypeScript strict
- Mobil: fonksiyonel bileşenler, StyleSheet, mevcut UI primitives
- API: Express router, sync store + async AI
- Kullanıcıya dönük string’ler Türkçe

## Test önerisi (manuel smoke)

1. `npm run api` → `GET /api/health` (`ai: true` with GEMINI_API_KEY)
2. Firebase register + doğum haritası (mobil veya `npm run test:auth`)
3. Günlük öngörü + soru (`npm run test:ai`)
4. Partner ekle + sinastri analyze
5. Rewarded ad
6. Aynı akışı fiziksel cihazda (Xcode native build)

Chart unit smoke:

```bash
npm run test:birth
```

## EAS / App Store

**Mağaza sürümü** yerel ağa bağlı değildir; API internette HTTPS ile yayında olmalıdır.

Tam rehber: **[docs/DEPLOYMENT.md](./DEPLOYMENT.md)**

Özet:

```bash
# AI API deploy (Cloud Functions — bkz. DEPLOYMENT.md)
eas secret:create --name EXPO_PUBLIC_AI_API_URL --value https://.../astoApi/api
npm run build:ios
```

- `EXPO_PUBLIC_APP_ENV=production` → ATS sıkı (yalnızca HTTPS)
- `EXPO_PUBLIC_APP_ENV=development` → LAN HTTP (yerel Xcode testi)
- Config: `apps/mobile/eas.json`, `app.config.js`, `lib/config.ts`
- Native standalone: Metro/Expo Go gerekmez; JS bundle Xcode build'inde gömülür

Production checklist: şifre hash, Supabase/Postgres, RevenueCat webhook, AdMob unit id, rate limit, OpenAI maliyeti

## Katkı / PR

1. Küçük, odaklı değişiklik  
2. Shared API kırılımında mobile’ı güncelle  
3. `docs/API.md` endpoint değiştiyse güncelle  
4. Commit mesajında neden’i yaz  

## Cursor

Proje kuralları: `.cursor/rules/*.mdc`  
Agent özeti: kök `AGENTS.md`
