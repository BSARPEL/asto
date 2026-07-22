import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  IAP_PRODUCTS,
  TOKEN_COSTS,
  TOKEN_REWARDS,
  type BirthInput,
  type Conversation,
} from '@asto/shared';
import {
  computeNatalChart,
  computeSynastry,
  computeTransits,
} from './chart/engine';
import {
  answerQuestion,
  generateChartNarrative,
  generateDailyReading,
  generateRelationshipAnalysis,
} from './ai';
import { requireAuth, type AuthedRequest } from './middleware';
import { store } from './store';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'asto-api', ai: Boolean(process.env.OPENAI_API_KEY) });
});

router.post('/auth/register', (req, res) => {
  try {
    const { email, password, displayName } = req.body ?? {};
    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'email, password, displayName gerekli' });
      return;
    }
    const profile = store.createUser(String(email), String(password), String(displayName));
    const { token } = store.authenticate(String(email), String(password));
    res.json({ token, profile });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const result = store.authenticate(String(email), String(password));
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: (e as Error).message });
  }
});

router.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({
    profile: req.user,
    adClaimsToday: store.getAdCount(req.user!.id),
    maxAdsPerDay: TOKEN_REWARDS.maxRewardedAdsPerDay,
    tokenCosts: TOKEN_COSTS,
    products: IAP_PRODUCTS,
  });
});

router.put('/me/birth', requireAuth, (req: AuthedRequest, res) => {
  try {
    const birth = req.body as BirthInput;
    if (!birth?.birthDate || !birth?.birthTime || birth.latitude == null || birth.longitude == null) {
      res.status(400).json({ error: 'Doğum bilgileri eksik' });
      return;
    }
    const natalChart = computeNatalChart(birth);
    const profile = store.updateUser(req.user!.id, {
      birth,
      natalChart,
      displayName: birth.name || req.user!.displayName,
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
    const user = store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const cached = store.getReading(user.id, date);
    if (cached) {
      res.json({ reading: cached, cached: true });
      return;
    }

    if (!user.isSubscribed) {
      // free daily reading — no token charge on first of day
    }

    const { summary, themes } = await generateDailyReading(user.natalChart, user.displayName);
    const reading = {
      id: nanoid(),
      userId: user.id,
      date,
      summary,
      themes,
      createdAt: new Date().toISOString(),
    };
    store.saveReading(reading);
    res.json({ reading, cached: false });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/readings/chart-narrative', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const user = store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
      return;
    }
    const cost = user.isSubscribed ? 0 : TOKEN_COSTS.chartNarrative;
    if (cost > 0) store.adjustTokens(user.id, -cost, 'chart_narrative');
    const text = await generateChartNarrative(user.natalChart, user.displayName);
    res.json({ text, profile: stripUser(store.getUser(user.id)!), cost });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get('/conversations', requireAuth, (req: AuthedRequest, res) => {
  res.json({ conversations: store.listConversations(req.user!.id) });
});

router.post('/conversations/ask', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { question, conversationId } = req.body ?? {};
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'question gerekli' });
      return;
    }
    const user = store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
      return;
    }

    const cost = user.isSubscribed ? 0 : TOKEN_COSTS.askQuestion;
    if (cost > 0) store.adjustTokens(user.id, -cost, 'ask_question');

    let conv: Conversation | null = conversationId
      ? store.getConversation(String(conversationId), user.id)
      : null;

    const now = new Date().toISOString();
    if (!conv) {
      conv = {
        id: nanoid(),
        userId: user.id,
        title: question.slice(0, 48),
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
    }

    conv.messages.push({
      id: nanoid(),
      role: 'user',
      content: question,
      createdAt: now,
    });

    const answer = await answerQuestion(
      user.natalChart,
      question,
      conv.messages.map((m) => ({ role: m.role, content: m.content })),
    );

    conv.messages.push({
      id: nanoid(),
      role: 'assistant',
      content: answer,
      createdAt: new Date().toISOString(),
    });
    conv.updatedAt = new Date().toISOString();
    store.saveConversation(conv);

    const profile = stripUser(store.getUser(user.id)!);
    res.json({ conversation: conv, profile, cost });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get('/partners', requireAuth, (req: AuthedRequest, res) => {
  res.json({ partners: store.listPartners(req.user!.id) });
});

router.post('/partners', requireAuth, (req: AuthedRequest, res) => {
  try {
    const birth = req.body as BirthInput;
    if (!birth?.name || !birth?.birthDate) {
      res.status(400).json({ error: 'Partner doğum bilgileri eksik' });
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
    store.savePartner(partner);
    res.json({ partner });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/partners/:id/analyze', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const user = store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce kendi doğum haritanızı kaydedin' });
      return;
    }
    const partnerId = String(req.params.id);
    const partner = store.getPartner(partnerId, user.id);
    if (!partner) {
      res.status(404).json({ error: 'Partner bulunamadı' });
      return;
    }

    const cost = user.isSubscribed ? 0 : TOKEN_COSTS.relationshipAnalysis;
    if (cost > 0) store.adjustTokens(user.id, -cost, 'relationship_analysis');

    const synastry = computeSynastry(user.natalChart, partner.natalChart);
    const analysis = await generateRelationshipAnalysis(
      user.displayName,
      user.natalChart,
      partner.birth.name,
      partner.natalChart,
      synastry,
    );

    const updated = store.updatePartner(partner.id, {
      synastryScore: synastry.score,
      analysis,
    });
    const profile = stripUser(store.getUser(user.id)!);
    res.json({ partner: updated, synastry, profile, cost });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get('/tokens/ledger', requireAuth, (req: AuthedRequest, res) => {
  res.json({ ledger: store.getLedger(req.user!.id) });
});

router.post('/tokens/rewarded-ad', requireAuth, (req: AuthedRequest, res) => {
  try {
    const result = store.claimAdReward(req.user!.id);
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
router.post('/tokens/purchase', requireAuth, (req: AuthedRequest, res) => {
  try {
    const { productId } = req.body ?? {};
    const userId = req.user!.id;

    if (productId === IAP_PRODUCTS.monthly.id) {
      const profile = store.updateUser(userId, { isSubscribed: true });
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

    const profile = store.adjustTokens(userId, pack.tokens, `iap:${productId}`);
    res.json({ profile, granted: pack.tokens });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

function stripUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...rest } = user;
  return rest;
}
