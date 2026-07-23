# Sorun giderme

Sık karşılaşılan hatalar ve çözümleri.

## Auth / kayıt / giriş

| Belirti | Olası neden | Çözüm |
|---------|-------------|-------|
| Kayıt sırasında veritabanı hatası | Firestore rules deploy edilmemiş | `npm run deploy:firestore-rules` |
| "Bu e-posta zaten kayıtlı" ama giriş olmuyor | Yarım kayıt (Auth var, profil yok) | Firebase Console → Authentication → kullanıcıyı sil; tekrar kayıt |
| "Sunucuya ulaşılamadı" | Ağ / Firebase API key | İnternet, `EXPO_PUBLIC_FIREBASE_*` kontrol |
| Giriş sonrası hemen çıkış | Eski race condition (düzeltildi) | Güncel kod + yeni build |

Kayıt akışı: `firebase-profile.ts` → `writeBatch` (users + ledger). Test: `npm run test:auth`.

## AI / öngörü

| Belirti | Olası neden | Çözüm |
|---------|-------------|-------|
| "Öngörü alınamadı" / AI 404 | Cloud Functions deploy edilmemiş | `firebase login && npm run deploy:ai-api` |
| `ai: false` health | Geçersiz `GEMINI_API_KEY` | Yeni anahtar → `packages/api/.env` → redeploy |
| Yerel AI bağlanamıyor | API çalışmıyor veya yanlış IP | `npm run api`; `.env` → `EXPO_PUBLIC_AI_API_URL=http://<LAN-IP>:8788/api` |
| 401 AI istekleri | Oturum yok / token süresi dolmuş | Yeniden giriş |

**Önemli:** `EXPO_PUBLIC_GEMINI_API_KEY` GitHub'a commit edilirse Google anahtarı iptal eder. Yalnızca gitignore `.env` içinde yerel test için.

## iOS build

| Belirti | Olası neden | Çözüm |
|---------|-------------|-------|
| Beyaz ekran / Metro hatası | Gömülü bundle yok | `npm run ios:prebuild`; Xcode ⌘R |
| Env değişikliği yansımıyor | `EXPO_PUBLIC_*` compile-time | Yeniden archive / ⌘R |
| Signing hatası | Apple Team seçilmemiş | Xcode → Signing & Capabilities |
| `ios/` yok | Prebuild yapılmamış | `npm run ios:prebuild` |

JS değişikliği: Fast Refresh yok — her seferinde yeniden build.

## Firestore

| Belirti | Olası neden | Çözüm |
|---------|-------------|-------|
| `permission-denied` | Rules veya yanlış DB | `bnastro` database ID; rules deploy |
| Veri görünmüyor | Yanlış Firebase projesi | `EXPO_PUBLIC_FIREBASE_PROJECT_ID=bn-astro` |

Güvenlik notu: `users` kuralları `tokenBalance` alanını kısıtlamıyor — production öncesi sıkılaştırılmalı.

## Deploy

| Belirti | Çözüm |
|---------|-------|
| `deploy:ai-api` 403 | `firebase login`; Blaze plan |
| Rules deploy fail | `packages/api/.secrets/firebase-adminsdk.json` var mı |
| Health 404 | Function adı/region: `europe-west1`, `astoApi` |

## Debug komutları

```bash
npm run check:secrets
npm run verify:store
npm run verify:ai-api
npm run test:auth
curl http://localhost:8788/api/health
```

## Daha fazla

- [SECRETS.md](./SECRETS.md)
- [FIREBASE-PRODUCTION.md](./FIREBASE-PRODUCTION.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
