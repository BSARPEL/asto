/** @type {import('expo/config').ConfigContext} */
module.exports = ({ config }) => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'production';
  const dataBackend = process.env.EXPO_PUBLIC_DATA_BACKEND || 'firebase';
  const isProduction = appEnv === 'production';
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  const geminiModel = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash-lite';

  return {
    ...config,
    extra: {
      ...config.extra,
      appEnv,
      dataBackend,
      /** Cloud Functions AI API kullanılmıyor */
      aiApiUrl: '',
      geminiApiKey,
      geminiModel,
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
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
