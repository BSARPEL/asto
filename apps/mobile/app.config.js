/** @type {import('expo/config').ConfigContext} */
module.exports = ({ config }) => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';
  const dataBackend = process.env.EXPO_PUBLIC_DATA_BACKEND || 'firebase';
  const aiApiUrl =
    process.env.EXPO_PUBLIC_AI_API_URL || process.env.EXPO_PUBLIC_API_URL || '';
  const isProduction = appEnv === 'production';

  return {
    ...config,
    extra: {
      ...config.extra,
      appEnv,
      dataBackend,
      aiApiUrl,
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        // Yerel HTTP (LAN) yalnızca geliştirme build'lerinde; App Store HTTPS zorunlu.
        ...(isProduction
          ? {}
          : {
              NSAppTransportSecurity: {
                NSAllowsLocalNetworking: true,
              },
            }),
      },
    },
  };
};
