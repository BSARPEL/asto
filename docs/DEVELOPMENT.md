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

### `apps/mobile/.env` (fiziksel iPhone için zorunlu)

```
# Mac LAN IP: ipconfig getifaddr en0
EXPO_PUBLIC_API_URL=http://192.168.x.x:8788/api
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID=
```

Build sırasında `EXPO_PUBLIC_*` JS bundle’a gömülür. Telefonda `localhost` çalışmaz.

## iOS — Xcode (Metro / Expo Go yok)

Telefonda **native standalone** (Expo dev server bağlantısı yok):

```bash
cd apps/mobile
cp .env.example .env          # LAN IP'yi düzenle
npm run ios:prebuild          # ios/ + CocoaPods + SKIP_BUNDLING=0
```

Kökten API: `npm run api` (0.0.0.0:8788, telefon ile aynı Wi‑Fi).

Xcode: `npm run ios:open` → cihazı seç → Signing Team → **⌘R**.

Her build’de JS bundle uygulamaya gömülür (`ios/.xcode.env.local` → `SKIP_BUNDLING=0`). Metro açmanız gerekmez.

`app.json` veya native plugin değişince: `npm run sync:ios:force` (kökten).

Simülatör + canlı Metro: `npm run mobile` (ayrı geliştirme akışı).

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

1. API ayağa kalksın: `GET /api/health`
2. Register + birth kaydı
3. Daily reading + bir soru
4. Partner ekle + analyze
5. Rewarded ad + token purchase
6. Aynı akışı fiziksel cihazda (Xcode native build) tekrarla

Chart unit smoke:

```bash
cd packages/api
npx tsx -e "import { computeNatalChart } from './src/chart/engine.ts'; console.log(computeNatalChart({ name:'T', birthDate:'1995-06-15', birthTime:'14:30', city:'Istanbul', latitude:41.0082, longitude:28.9784, timezone:'Europe/Istanbul' }).sunSign)"
```

Beklenen: `İkizler` (15 Haziran 1995).

## EAS / mağaza

- Config: `apps/mobile/eas.json`, `app.json` (`com.asto.app`)
- Privacy/Terms: uygulama içi placeholder — yayın öncesi hukuki metin
- Production checklist: şifre hash, Supabase/Postgres, RevenueCat webhook, AdMob unit id, rate limit, OpenAI maliyeti

## Katkı / PR

1. Küçük, odaklı değişiklik  
2. Shared API kırılımında mobile’ı güncelle  
3. `docs/API.md` endpoint değiştiyse güncelle  
4. Commit mesajında neden’i yaz  

## Cursor

Proje kuralları: `.cursor/rules/*.mdc`  
Agent özeti: kök `AGENTS.md`
