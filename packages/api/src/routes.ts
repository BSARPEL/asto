import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  IAP_PRODUCTS,
  TOKEN_COSTS,
  TOKEN_REWARDS,
  normalizeBirthInput,
  type BirthInput,
  type Conversation,
} from '@asto/shared';
import {
  computeNatalChart,
  computeSynastry,
  computeTransits,
} from '@asto/shared';
import {
  answerQuestion,
  answerSynastryQuestion,
  aiStatus,
  generateChartNarrative,
  generateDailyReading,
  generateRelationshipAnalysis,
} from './ai';
import { requireAuth, type AuthedRequest } from './middleware';
import { store, storeBackend } from './store';
import { localDateKey, userTimezone } from './dates';

async function ensureDailyConversation(
  userId: string,
  date: string,
  conversationId?: string,
): Promise<Conversation> {
  if (conversationId) {
    const existing = await store.getConversation(conversationId, userId);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: nanoid(),
    userId,
    kind: 'daily',
    title: `Öngörü ${date}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  await store.saveConversation(conv);
  return conv;
}

async function ensureSynastryConversation(
  userId: string,
  partnerId: string,
  partnerName: string,
  conversationId?: string,
): Promise<Conversation> {
  if (conversationId) {
    const existing = await store.getConversation(conversationId, userId);
    if (existing) return existing;
  }
  const now = new Date().toISOString();
  const conv: Conversation = {
    id: nanoid(),
    userId,
    kind: 'synastry',
    partnerId,
    title: `Sinastri · ${partnerName}`,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  await store.saveConversation(conv);
  return conv;
}

async function partnerConversationFor(
  userId: string,
  partner: { id: string; birth: { name: string }; conversationId?: string; analysis?: string },
) {
  if (!partner.analysis) return null;
  const conv = await ensureSynastryConversation(
    userId,
    partner.id,
    partner.birth.name,
    partner.conversationId,
  );
  if (!partner.conversationId) {
    await store.updatePartner(partner.id, { conversationId: conv.id });
  }
  return conv;
}

export const router = Router();

router.get('/health', (_req, res) => {
  const ai = aiStatus();
  res.json({
    ok: true,
    service: 'asto-api',
    store: storeBackend,
    ai: ai.enabled,
    provider: ai.provider,
    model: ai.model,
  });
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

router.post('/readings/daily', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const user = await store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
      return;
    }
    const force = Boolean(req.body?.force);
    const tz = userTimezone(user.birth);
    const date = localDateKey(tz);
    const existing = await store.getReading(user.id, date);

    if (existing && existing.date === date && !force) {
      const conv = await ensureDailyConversation(user.id, date, existing.conversationId);
      res.json({
        reading: existing,
        conversation: conv,
        cached: true,
        cost: 0,
        today: date,
        profile: stripUser(user),
      });
      return;
    }

    let profile = stripUser(user);
    const cost =
      existing && force && !user.isSubscribed ? TOKEN_COSTS.dailyReadingRefresh : 0;
    if (cost > 0) profile = await store.adjustTokens(user.id, -cost, 'daily_reading_refresh');

    const { summary, themes } = await generateDailyReading(user.natalChart, user.displayName);
    const conv = await ensureDailyConversation(user.id, date);
    const reading = {
      id: nanoid(),
      userId: user.id,
      date,
      summary,
      themes,
      conversationId: conv.id,
      createdAt: new Date().toISOString(),
    };
    await store.saveReading(reading);
    res.json({ reading, conversation: conv, cached: false, cost, today: date, profile });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post('/readings/chart-narrative', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const user = await store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
      return;
    }
    const force = Boolean(req.body?.force);

    if (user.chartNarrative && !force) {
      res.json({
        text: user.chartNarrative,
        profile: stripUser(user),
        cost: 0,
        cached: true,
      });
      return;
    }

    const cost = user.isSubscribed ? 0 : TOKEN_COSTS.chartNarrative;
    if (cost > 0) await store.adjustTokens(user.id, -cost, 'chart_narrative');
    const text = await generateChartNarrative(user.natalChart, user.displayName);
    const profile = await store.updateUser(user.id, { chartNarrative: text });
    res.json({ text, profile, cost, cached: false });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get('/conversations', requireAuth, async (req: AuthedRequest, res) => {
  res.json({ conversations: await store.listConversations(req.user!.id) });
});

router.post('/conversations/ask', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { question, conversationId } = req.body ?? {};
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'question gerekli' });
      return;
    }
    const user = await store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
      return;
    }

    const cost = user.isSubscribed ? 0 : TOKEN_COSTS.askQuestion;
    if (cost > 0) await store.adjustTokens(user.id, -cost, 'ask_question');

    const tz = userTimezone(user.birth);
    const date = localDateKey(tz);
    const todayReading = await store.getReading(user.id, date);

    let conv: Conversation | null = conversationId
      ? await store.getConversation(String(conversationId), user.id)
      : null;

    if (!conv && todayReading?.conversationId) {
      conv = await store.getConversation(todayReading.conversationId, user.id);
    }

    const now = new Date().toISOString();
    if (!conv) {
      conv = await ensureDailyConversation(user.id, date, todayReading?.conversationId);
      if (todayReading && !todayReading.conversationId) {
        await store.saveReading({ ...todayReading, conversationId: conv.id });
      }
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
    await store.saveConversation(conv);

    const profile = stripUser((await store.getUser(user.id))!);
    res.json({ conversation: conv, profile, cost });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
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

router.post('/partners/:id/analyze', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const user = await store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce kendi doğum haritanızı kaydedin' });
      return;
    }
    const partnerId = String(req.params.id);
    const partner = await store.getPartner(partnerId, user.id);
    if (!partner) {
      res.status(404).json({ error: 'Partner bulunamadı' });
      return;
    }

    const force = Boolean(req.body?.force);

    const selfChart = user.birth ? computeNatalChart(user.birth) : user.natalChart;
    const partnerChart = computeNatalChart(partner.birth);
    if (user.birth) {
      await store.updateUser(user.id, { natalChart: selfChart });
    }
    await store.updatePartner(partner.id, { natalChart: partnerChart });

    const synastry = computeSynastry(selfChart, partnerChart, {
      selfGender: user.birth?.gender,
      partnerGender: partner.birth.gender,
    });

    if (partner.analysis && !force) {
      const fresh = (await store.getPartner(partner.id, user.id))!;
      const conversation = await partnerConversationFor(user.id, fresh);
      const profile = stripUser((await store.getUser(user.id))!);
      res.json({ partner: fresh, synastry, conversation, profile, cost: 0, cached: true });
      return;
    }

    const cost = user.isSubscribed ? 0 : TOKEN_COSTS.relationshipAnalysis;
    let charged = false;
    if (cost > 0) {
      await store.adjustTokens(user.id, -cost, 'relationship_analysis');
      charged = true;
    }

    let result: Awaited<ReturnType<typeof generateRelationshipAnalysis>>;
    try {
      result = await generateRelationshipAnalysis(
        user.displayName,
        selfChart,
        partner.birth.name,
        partnerChart,
        synastry,
        {
          selfGender: user.birth?.gender,
          partnerGender: partner.birth.gender,
        },
      );
    } catch (e) {
      if (charged) await store.adjustTokens(user.id, cost, 'relationship_analysis_refund');
      throw e;
    }

    const conv = await ensureSynastryConversation(
      user.id,
      partner.id,
      partner.birth.name,
      partner.conversationId,
    );

    const updated = await store.updatePartner(partner.id, {
      synastryScore: result.score,
      synastryScoreNote: result.scoreNote || undefined,
      analysis: result.analysis,
      conversationId: conv.id,
    });
    const profile = stripUser((await store.getUser(user.id))!);
    res.json({ partner: updated, synastry, conversation: conv, profile, cost, cached: false });
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

router.post('/partners/:id/ask', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { question, conversationId } = req.body ?? {};
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'question gerekli' });
      return;
    }

    const user = await store.getUser(req.user!.id);
    if (!user?.natalChart) {
      res.status(400).json({ error: 'Önce doğum haritanızı kaydedin' });
      return;
    }

    const partner = await store.getPartner(String(req.params.id), user.id);
    if (!partner) {
      res.status(404).json({ error: 'Partner bulunamadı' });
      return;
    }
    if (!partner.analysis) {
      res.status(400).json({ error: 'Önce sinastri yorumu alın' });
      return;
    }

    const cost = user.isSubscribed ? 0 : TOKEN_COSTS.askQuestion;
    if (cost > 0) await store.adjustTokens(user.id, -cost, 'synastry_ask');

    let conv: Conversation | null = conversationId
      ? await store.getConversation(String(conversationId), user.id)
      : null;
    if (!conv && partner.conversationId) {
      conv = await store.getConversation(partner.conversationId, user.id);
    }
    if (!conv) {
      conv = await ensureSynastryConversation(
        user.id,
        partner.id,
        partner.birth.name,
        partner.conversationId,
      );
      if (!partner.conversationId) {
        await store.updatePartner(partner.id, { conversationId: conv.id });
      }
    }

    const now = new Date().toISOString();
    conv.messages.push({
      id: nanoid(),
      role: 'user',
      content: question,
      createdAt: now,
    });

    const selfChart = user.birth ? computeNatalChart(user.birth) : user.natalChart;
    const partnerChart = computeNatalChart(partner.birth);

    const answer = await answerSynastryQuestion(
      user.displayName,
      selfChart,
      partner.birth.name,
      partnerChart,
      partner.analysis,
      partner.synastryScore,
      question,
      conv.messages.map((m) => ({ role: m.role, content: m.content })),
      {
        selfGender: user.birth?.gender,
        partnerGender: partner.birth.gender,
      },
    );

    conv.messages.push({
      id: nanoid(),
      role: 'assistant',
      content: answer,
      createdAt: new Date().toISOString(),
    });
    conv.updatedAt = new Date().toISOString();
    await store.saveConversation(conv);

    const profile = stripUser((await store.getUser(user.id))!);
    res.json({ conversation: conv, profile, cost });
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

function stripUser<T extends { password?: string; passwordHash?: string; updatedAt?: string }>(
  user: T,
): Omit<T, 'password' | 'passwordHash' | 'updatedAt'> {
  const { password: _, passwordHash: __, updatedAt: ___, ...rest } = user;
  return rest;
}
