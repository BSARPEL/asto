# Asto — Claude Code proje bağlamı

Bu dosya her Claude Code oturumunda yüklenir. Detaylı rehber: [AGENTS.md](./AGENTS.md).

## Proje

**Asto** — Expo React Native astroloji uygulaması. Firebase Auth + Firestore (`bnastro`) + Gemini AI API. Monorepo: `apps/mobile`, `packages/api`, `packages/shared`, `firebase/`.

## Kurallar

- Mağaza build'leri production Firebase + HTTPS Cloud Functions kullanır
- Harita `computeNatalChart` ile cihazda hesaplanır; LLM'e JSON verilir
- Gemini/API secret'ları yalnızca `packages/api/.env`
- UI Türkçe; jeton maliyetleri `@asto/shared` `TOKEN_COSTS`
- iOS: Expo Go değil — `npm run ios:prebuild` → Xcode archive

## Agent skills

Proje skill'leri:

- `.claude/skills/` — Claude Code
- `.cursor/skills/` — Cursor (kaynak)
- `.qwen/skills/` — Qwen Code

Skill güncellemesi: `npm run sync:skills`

## Cursor rules

`.cursor/rules/*.mdc` — dosya-türüne özel kurallar (mobile, api, shared).

## Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| [README.md](./README.md) | Developer dosya haritası (ana giriş) |
| [docs/README.md](./docs/README.md) | Tüm doküman indeksi |
| [docs/MOBILE.md](./docs/MOBILE.md) | Mobil detay |
| [docs/TESTING.md](./docs/TESTING.md) | Test scriptleri |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Sorun giderme |
