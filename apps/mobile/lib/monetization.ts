import { IAP_PRODUCTS } from '@asto/shared';
import { api } from './api';

/**
 * RevenueCat + AdMob entegrasyonu için ince sarmalayıcı.
 * Anahtar yokken geliştirme modunda API üzerinden jeton/abonelik simüle eder.
 */
const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const ADMOB_REWARDED_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID;

export const monetization = {
  isRevenueCatConfigured: () => Boolean(REVENUECAT_KEY),
  isAdMobConfigured: () => Boolean(ADMOB_REWARDED_ID),

  products: IAP_PRODUCTS,

  async purchaseProduct(token: string, productId: string) {
    // Production: Purchases.purchasePackage(...) then confirm on backend webhook.
    // Dev: grant via API stub.
    if (!REVENUECAT_KEY) {
      return api.purchase(token, productId);
    }
    // Placeholder until native RevenueCat SDK is linked in a dev client / EAS build.
    return api.purchase(token, productId);
  },

  async showRewardedAd(token: string) {
    // Production: load + show AdMob rewarded, onEarnedReward -> api.rewardedAd
    if (!ADMOB_REWARDED_ID) {
      // Simulate short ad watch in Expo Go
      await new Promise((r) => setTimeout(r, 900));
      return api.rewardedAd(token);
    }
    await new Promise((r) => setTimeout(r, 900));
    return api.rewardedAd(token);
  },
};
