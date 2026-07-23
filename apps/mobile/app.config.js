/** @type {import('expo/config').ConfigContext} */
module.exports = ({ config }) => {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'production';
  const dataBackend = process.env.EXPO_PUBLIC_DATA_BACKEND || 'firebase';
  const productionAiUrl =
    'https://europe-west1-bn-astro.cloudfunctions.net/astoApi/api';
  const aiApiUrl =
    process.env.EXPO_PUBLIC_AI_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    (appEnv === 'production' ? productionAiUrl : '');
  const isProduction = appEnv === 'production';
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  const geminiModel = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash-lite';

  return {
    ...config,
    extra: {
      ...config.extra,
      appEnv,
      dataBackend,
      aiApiUrl,
      geminiApiKey,
      geminiModel,
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        // Yerel HTTP yalnızca development build'lerinde (mağaza sürümü HTTPS zorunlu).
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
