# Geliştirme rehberi

## Gereksinimler

- Node.js ≥ 20
- npm 10+
- Expo Go veya emülatör (iOS için macOS)

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
| `npm run mobile` | Expo Dev Server |
| `npm run build --workspace=@asto/shared` | Shared derle |
| `npx tsc --noEmit` (api veya mobile dizininde) | Tip kontrolü |

## Ortam değişkenleri

### `packages/api/.env`

```
PORT=8788
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### `apps/mobile/.env` (opsiyonel)

```
EXPO_PUBLIC_API_URL=http://localhost:8788/api
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID=
```

Fiziksel cihazda bilgisayarın LAN IP’sini kullan. Android emülatörde kod zaten `10.0.2.2` kullanır.

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
6. Expo’da aynı akışı UI’dan tekrarla

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
