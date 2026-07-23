# Asto — Dokümantasyon indeksi

Bu klasör projenin **insan tarafından okunan** teknik dokümantasyonunu içerir. Yeni developer için başlangıç noktası: kök [README.md](../README.md).

## Hızlı yönlendirme

| Soru | Doküman |
|------|---------|
| Projeye yeni geldim, nereden başlarım? | [../README.md](../README.md) |
| Mimari nasıl? Firebase vs AI API? | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Mobil ekranlar ve lib modülleri? | [MOBILE.md](./MOBILE.md) |
| API endpoint'leri neler? | [API.md](./API.md) |
| Firestore şeması ve kurallar? | [DATABASE.md](./DATABASE.md) |
| Kurulum, iOS, env? | [DEVELOPMENT.md](./DEVELOPMENT.md) |
| Anahtarlar nerede? | [SECRETS.md](./SECRETS.md) |
| App Store / deploy? | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Firebase-only production? | [FIREBASE-PRODUCTION.md](./FIREBASE-PRODUCTION.md) |
| Test scriptleri? | [TESTING.md](./TESTING.md) |
| Hata alıyorum? | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| AI agent (Cursor/Claude)? | [../AGENTS.md](../AGENTS.md) |

## Tüm dosyalar

| Dosya | Hedef kitle | İçerik |
|-------|-------------|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Herkes | İki katmanlı mimari, modül haritası, güvenlik |
| [MOBILE.md](./MOBILE.md) | Mobil developer | Ekranlar, lib, navigation, UI kit |
| [API.md](./API.md) | Backend / full-stack | AI routes, legacy REST, auth |
| [DATABASE.md](./DATABASE.md) | Backend / mobil | Firestore koleksiyonları, kurallar |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Developer | Kurulum, komutlar, iOS, workspace |
| [SECRETS.md](./SECRETS.md) | DevOps / lead | Gemini, Admin SDK, env checklist |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Release | EAS, Xcode archive, production |
| [FIREBASE-PRODUCTION.md](./FIREBASE-PRODUCTION.md) | Release | Cloud Functions, VPS yok |
| [TESTING.md](./TESTING.md) | QA / developer | E2E scriptler, smoke |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Herkes | Sık hatalar ve çözümler |

## Repo dışı dokümantasyon

| Konum | İçerik |
|-------|--------|
| [../README.md](../README.md) | Ana developer README (dosya haritası) |
| [../AGENTS.md](../AGENTS.md) | AI agent özet rehberi |
| [../CLAUDE.md](../CLAUDE.md) | Claude Code bağlamı |
| [../packages/api/README.md](../packages/api/README.md) | API paket özeti |
| [../packages/shared/README.md](../packages/shared/README.md) | Shared paket özeti |
| [../apps/mobile/AGENTS.md](../apps/mobile/AGENTS.md) | Mobil paket agent rehberi |
| [../.cursor/rules/](../.cursor/rules/) | Cursor IDE kuralları (`.mdc`) |
| [../.cursor/skills/](../.cursor/skills/) | Agent skills (kaynak) |
| [../apps/mobile/CLAUDE.md](../apps/mobile/CLAUDE.md) | Mobil paket Claude bağlamı |
| [../apps/mobile/native-ios/README.md](../apps/mobile/native-ios/README.md) | Native iOS şablonları |

## Güncelleme kuralı

Kod değişince ilgili dokümanı da güncelleyin:

- Yeni AI endpoint → `API.md` + `ARCHITECTURE.md`
- Yeni Firestore koleksiyon → `DATABASE.md` + `packages/shared/src/firestore-schema.ts`
- Yeni env değişkeni → `SECRETS.md` + `README.md` tablosu
- Yeni npm script → `README.md` + `DEVELOPMENT.md`
- Yeni mobil ekran → `MOBILE.md`
