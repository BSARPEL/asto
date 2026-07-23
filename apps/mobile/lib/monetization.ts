import { IAP_PRODUCTS, TOKEN_REWARDS } from '@asto/shared';
import { firebaseClaimAdReward, firebaseSimulatePurchase } from './firebase-data';

/**
 * Jeton / abonelik — Firebase Firestore (AI API değil).
 */
const REVENUECAT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const ADMOB_REWARDED_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID;

export const monetization = {
  isRevenueCatConfigured: () => Boolean(REVENUECAT_KEY),
  isAdMobConfigured: () => Boolean(ADMOB_REWARDED_ID),

  products: IAP_PRODUCTS,

  async purchaseProduct(userId: string, productId: string) {
    if (!REVENUECAT_KEY) {
      return firebaseSimulatePurchase(userId, productId);
    }
    return firebaseSimulatePurchase(userId, productId);
  },

  async showRewardedAd(userId: string) {
    if (!ADMOB_REWARDED_ID) {
      await new Promise((r) => setTimeout(r, 900));
    } else {
      await new Promise((r) => setTimeout(r, 900));
    }
    const { profile, count } = await firebaseClaimAdReward(userId);
    return {
      profile,
      count,
      reward: TOKEN_REWARDS.rewardedAd,
      maxPerDay: TOKEN_REWARDS.maxRewardedAdsPerDay,
    };
  },
};
