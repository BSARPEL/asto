---
name: asto-project
description: Asto monorepo overview, architecture, and agent conventions. Use when onboarding, planning work, or unsure where code lives in this astrology app (Expo + Firebase + Gemini).
---

# Asto — proje özeti

## Ne bu?

AI destekli astroloji uygulaması (**Asto**). Expo RN + Firebase Auth/Firestore + Gemini AI API. Jeton/abonelik ekonomisi var.

**Değil:** Astromatik marka/UI klonu.

## Monorepo

| Paket | Rol |
|-------|-----|
| `apps/mobile` | Expo RN — Firebase veri + AI client |
| `packages/api` | Express / Cloud Functions — AI + Firestore Admin |
| `packages/shared` | Tipler, chart engine, TOKEN_COSTS |
| `firebase/` | Firestore rules, Functions bundle |
| `docs/` | Mimari, secrets, deployment |

## İki katman

1. **Firebase** — auth, profil, harita, partner, jeton (`lib/firebase-*.ts`, `auth.tsx`)
2. **AI API** — öngörü, sinastri, sohbet (`lib/ai-api.ts`, `ai-service.ts`)

Harita **cihazda** `computeNatalChart` ile hesaplanır; LLM'e hazır JSON verilir.

## Temel kurallar

- Mağaza build'leri LAN/localhost kullanmaz; AI = HTTPS Cloud Functions
- Gemini anahtarı yalnızca `packages/api/.env` (mobilde commit etme)
- `TOKEN_COSTS` / `TOKEN_REWARDS` → `@asto/shared`; hardcode etme
- Shared değişince: `npm run build --workspace=@asto/shared` veya `npm run sync:shared`
- Native değişince: `npm run sync:ios`
- UI metinleri Türkçe; kod İngilizce veya Türkçe tutarlı

## Hızlı komutlar

```bash
npm run dev:all
npm run test:auth
npm run test:birth
npm run deploy:firestore-rules
npm run ios:archive:store
```

Detay: `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/SECRETS.md`.
