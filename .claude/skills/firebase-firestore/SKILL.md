---
name: firebase-firestore
description: Firebase Auth, Firestore data layer, security rules, and user profile patterns for Asto. Use when working on login, register, tokens, partners, or firestore.rules.
paths:
  - apps/mobile/lib/firebase*.ts
  - apps/mobile/lib/auth.tsx
  - apps/mobile/lib/birth-service.ts
  - packages/api/src/store-firestore.ts
  - firebase/**
---

# Firebase & Firestore (Asto)

## Veritabanı

- Proje: `bn-astro`
- Database ID: `bnastro` (`EXPO_PUBLIC_FIREBASE_DATABASE_ID`)
- Mobil doğrudan Firestore SDK; API Admin SDK (`store-firestore.ts`)

## Koleksiyonlar

| Koleksiyon | Doc ID | İçerik |
|------------|--------|--------|
| `users` | Firebase UID | Profil, doğum, harita, jeton |
| `partners` | auto | `userId` ile ilişkili |
| `conversations` | auto | Günlük / sinastri sohbet |
| `readings` | `{uid}_{date}` | Günlük öngörü cache |
| `ledger` | auto | Jeton hareketleri |
| `adClaims` | `{uid}_{date}` | Reklam limiti |

## Mobil modüller

- `firebase-profile.ts` — kayıt, giriş, profil CRUD
- `firebase-data.ts` — partner, reading, conversation, jeton transaction
- `birth-service.ts` — doğum + `computeNatalChart` → Firestore

## Kayıt akışı

1. `createUserWithEmailAndPassword` (Auth)
2. `writeBatch`: `users/{uid}` + `ledger` signup_bonus
3. Hata olursa `deleteUser` ile Auth geri al

`auth.tsx` içinde `authBusyRef` — `onAuthStateChanged` kayıt sırasında erken logout yapmamalı.

## Kurallar

`firebase/firestore.rules` — kullanıcı yalnızca kendi verisine erişir. Deploy:

```bash
npm run deploy:firestore-rules
```

## Bilinen risk

`users` write kuralı alan kısıtlamıyor; `tokenBalance` / `isSubscribed` istemciden yazılabilir. Jeton işlemleri `firebaseAdjustTokens` transaction kullanır; production'da kuralları sıkılaştır.

## Test

```bash
node scripts/test-mobile-auth-flow.mjs
```
