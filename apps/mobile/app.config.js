/** @type {import('expo/config').ConfigContext} */
module.exports = ({ config }) => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';
  const isProduction = appEnv === 'production';

  return {
    ...config,
    extra: {
      ...config.extra,
      appEnv,
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
