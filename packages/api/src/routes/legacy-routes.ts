/**
 * Legacy REST API — local dev / JSON store / pre-Firebase clients.
 * Mobile production uses Firebase for auth, profile, birth, partners, tokens.
 */
import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  IAP_PRODUCTS,
  TOKEN_COSTS,
  TOKEN_REWARDS,
  normalizeBirthInput,
  type BirthInput,
} from '@asto/shared';
import { computeNatalChart, computeSynastry, computeTransits } from '@asto/shared';
import { requireAuth, type AuthedRequest } from '../middleware';
import { store, storeBackend } from '../store';
import { localDateKey, userTimezone } from '../dates';
import {
  ensureDailyConversation,
  ensureSynastryConversation,
  partnerConversationFor,
  stripUser,
} from './helpers';

export function registerLegacyRoutes(router: Router): void {
  router.get('/health/legacy', (_req, res) => {
    res.json({ ok: true, service: 'asto-api', store: storeBackend });
  });

  router.post('/auth/register', async (req, res) => {
    try {
      const { email, password, displayName } = req.body ?? {};
      if (!email || !password || !displayName) {
        res.status(400).json({ error: 'email, password, displayName gerekli' });
        return;
      }
      const profile = await store.createUser(String(email), String(password), String(displayName));
      const { token } = await store.authenticate(String(email), String(password));
      res.json({ token, profile });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      const result = await store.authenticate(String(email), String(password));
      res.json(result);
    } catch (e) {
      res.status(401).json({ error: (e as Error).message });
    }
  });

  router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
    res.json({
      profile: req.user,
      adClaimsToday: await store.getAdCount(req.user!.id),
      maxAdsPerDay: TOKEN_REWARDS.maxRewardedAdsPerDay,
      tokenCosts: TOKEN_COSTS,
      products: IAP_PRODUCTS,
    });
  });

  router.put('/me/birth', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const birth = normalizeBirthInput(req.body as BirthInput);
      if (!birth?.birthDate || !birth?.birthTime || birth.latitude == null || birth.longitude == null) {
        res.status(400).json({ error: 'Doğum bilgileri eksik' });
        return;
      }
      if (!birth.country || !birth.countryName || !birth.city) {
        res.status(400).json({ error: 'Ülke ve şehir gerekli' });
        return;
      }
      const natalChart = computeNatalChart(birth);
      const profile = await store.updateUser(req.user!.id, {
        birth,
        natalChart,
        displayName: birth.name || req.user!.displayName,
        chartNarrative: undefined,
      });
      res.json({ profile });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.post('/chart/compute', (req, res) => {
    try {
      const birth = req.body as BirthInput;
      const chart = computeNatalChart(birth);
      res.json({ chart });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.get('/chart/transits', (_req, res) => {
    res.json({ transits: computeTransits(), date: new Date().toISOString() });
  });

  router.get('/readings/daily', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = await store.getUser(req.user!.id);
      if (!user?.natalChart) {
        res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
        return;
      }
      const tz = userTimezone(user.birth);
      const date = localDateKey(tz);
      let cached = await store.getReading(user.id, date);

      if (cached && cached.date === date) {
        const conv = await ensureDailyConversation(user.id, date, cached.conversationId);
        if (!cached.conversationId) {
          cached = { ...cached, conversationId: conv.id };
          await store.saveReading(cached);
        }
        res.json({ reading: cached, conversation: conv, cached: true, today: date });
        return;
      }

      res.json({ reading: null, conversation: null, cached: false, today: date });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  router.get('/conversations', requireAuth, async (req: AuthedRequest, res) => {
    res.json({ conversations: await store.listConversations(req.user!.id) });
  });

  router.get('/partners', requireAuth, async (req: AuthedRequest, res) => {
    res.json({ partners: await store.listPartners(req.user!.id) });
  });

  router.post('/partners', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const birth = normalizeBirthInput(req.body as BirthInput);
      if (!birth?.name || !birth?.birthDate) {
        res.status(400).json({ error: 'Partner doğum bilgileri eksik' });
        return;
      }
      if (!birth.country || !birth.countryName || !birth.city) {
        res.status(400).json({ error: 'Ülke ve şehir gerekli' });
        return;
      }
      const natalChart = computeNatalChart(birth);
      const partner = {
        id: nanoid(),
        userId: req.user!.id,
        birth,
        natalChart,
        createdAt: new Date().toISOString(),
      };
      await store.savePartner(partner);
      res.json({ partner });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.put('/partners/:id', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const partnerId = String(req.params.id);
      const partner = await store.getPartner(partnerId, req.user!.id);
      if (!partner) {
        res.status(404).json({ error: 'Partner bulunamadı' });
        return;
      }
      const birth = normalizeBirthInput(req.body as BirthInput);
      if (!birth?.name || !birth?.birthDate) {
        res.status(400).json({ error: 'Partner doğum bilgileri eksik' });
        return;
      }
      if (!birth.country || !birth.countryName || !birth.city) {
        res.status(400).json({ error: 'Ülke ve şehir gerekli' });
        return;
      }
      const natalChart = computeNatalChart(birth);
      if (partner.conversationId) {
        await store.deleteConversation(partner.conversationId, req.user!.id);
      }
      const updated = await store.updatePartner(partner.id, {
        birth,
        natalChart,
        synastryScore: undefined,
        synastryScoreNote: undefined,
        analysis: undefined,
        conversationId: undefined,
      });
      res.json({ partner: updated });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.get('/partners/:id/conversation', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const partner = await store.getPartner(String(req.params.id), req.user!.id);
      if (!partner) {
        res.status(404).json({ error: 'Partner bulunamadı' });
        return;
      }
      if (!partner.analysis) {
        res.status(400).json({ error: 'Önce sinastri yorumu alın' });
        return;
      }
      const conversation = await partnerConversationFor(req.user!.id, partner);
      const fresh = (await store.getPartner(partner.id, req.user!.id))!;
      res.json({ partner: fresh, conversation });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.get('/tokens/ledger', requireAuth, async (req: AuthedRequest, res) => {
    res.json({ ledger: await store.getLedger(req.user!.id) });
  });

  router.post('/tokens/rewarded-ad', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const result = await store.claimAdReward(req.user!.id);
      res.json({
        ...result,
        reward: TOKEN_REWARDS.rewardedAd,
        maxPerDay: TOKEN_REWARDS.maxRewardedAdsPerDay,
      });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  /** Dev / RevenueCat webhook stub — grants tokens or subscription */
  router.post('/tokens/purchase', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { productId } = req.body ?? {};
      const userId = req.user!.id;

      if (productId === IAP_PRODUCTS.monthly.id) {
        const profile = await store.updateUser(userId, { isSubscribed: true });
        res.json({ profile, granted: 'subscription' });
        return;
      }

      const pack = Object.values(IAP_PRODUCTS).find(
        (p) => 'tokens' in p && p.id === productId,
      ) as { id: string; tokens: number } | undefined;

      if (!pack || !('tokens' in pack)) {
        res.status(400).json({ error: 'Geçersiz ürün' });
        return;
      }

      const profile = await store.adjustTokens(userId, pack.tokens, `iap:${productId}`);
      res.json({ profile, granted: pack.tokens });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
}
