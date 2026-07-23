const { withAppDelegate } = require('expo/config-plugins');

/**
 * Prefer embedded main.jsbundle when present (Xcode device build without Metro).
 * Falls back to Metro in Debug when no bundle was embedded.
 */
function withStandaloneBundle(config) {
  return withAppDelegate(config, (cfg) => {
    const contents = cfg.modResults.contents;
    const replacement = `  override func bundleURL() -> URL? {
#if DEBUG
    if let embedded = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
      return embedded
    }
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }`;

    const pattern = /override func bundleURL\(\) -> URL\? \{[\s\S]*?\n  \}/;
    if (!pattern.test(contents)) {
      throw new Error('withStandaloneBundle: bundleURL() not found in AppDelegate');
    }

    cfg.modResults.contents = contents.replace(pattern, replacement);
    return cfg;
  });
}

module.exports = withStandaloneBundle;
