# Native iOS şablonları

Native iOS şablonları (`native-ios/`) prebuild sonrası `ios/` altına kopyalanır:

| Dosya | Amaç |
|-------|------|
| `.xcode.env.local` | `SKIP_BUNDLING=0` — build sırasında JS bundle göm |
| `.xcode.env.updates` | Debug `SKIP_BUNDLING=1` override'ından sonra tekrar 0 |

`plugins/withStandaloneBundle.js` → AppDelegate gömülü `main.jsbundle` kullanır (Metro gerekmez).
