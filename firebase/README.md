# Firebase — BN Astro (`bnastro`)

## Schema v2 (Harmony funnel)

`partners/{partnerId}` alanları:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `relationshipType` | `love \| friendship \| family \| work` | AI yorum dili |
| `analysisFocus` | string? | Odak sorusu |
| `previewSummary` | string? | Ücretsiz ön izleme |
| `fullUnlocked` | boolean? | Tam rapor kilidi |
| `analysis` / `synastryScore` | … | AI sinastri cache |

Meta dokümanlar (Admin SDK `npm run db:init`):

- `_meta/schema` — schemaVersion, collections
- `_meta/collections` — koleksiyon özeti
- `_meta/partner_fields` — alan kataloğu

## Deploy

```bash
npm run firebase:setup
# = sync:shared + db:init + deploy:firestore-rules + deploy:firestore-indexes
```

**Not:** Composite index deploy için Firebase projede **Owner/Editor** hesabı gerekir (`firebase login`). Service account yalnızca rules + `_meta` yazabiliyorsa indeksleri [Console → Firestore → Indexes](https://console.firebase.google.com/project/bn-astro/firestore/indexes) üzerinden `firebase/firestore.indexes.json` içeriğiyle ekleyin.

Mevcut mobil sorgular (`partners where userId ==`) tek alan indeksi kullanır; composite’ler opsiyonel (tür / unlock filtreleri için hazır).
