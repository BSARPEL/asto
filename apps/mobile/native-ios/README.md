# Native iOS şablonları

`withNativeIosStandalone` config plugin prebuild sırasında bunları otomatik yazar.  
`apply-native-ios.mjs` yerel sync için şablonları tekrar kopyalar.

| Dosya | Amaç |
|-------|------|
| `.xcode.env.local` | NVM/Homebrew `NODE_BINARY` + `unset SKIP_BUNDLING` |
| `.xcode.env.updates` | Expo Debug `SKIP_BUNDLING=1` override'ını iptal eder |

Plugin ayrıca:
- `AppDelegate` → yalnızca gömülü `main.jsbundle` (Metro yok)
- `project.pbxproj` → Debug `SKIP_BUNDLING=1` satırını kaldırır
- `EX_DEV_CLIENT_NETWORK_INSPECTOR=false`

Kaynak: `plugins/withNativeIosStandalone.js`
