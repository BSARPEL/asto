/**
 * Gemini AI endpoints — used by mobile `lib/ai-api.ts` (EXPO_PUBLIC_AI_API_URL).
 * Auth: Firebase ID token. Profile/chart/partners read from Firestore via store.
 */
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { TOKEN_COSTS, type Conversation } from '@asto/shared';
import { computeNatalChart, computeSynastry } from '@asto/shared';
import {
  answerQuestion,
  answerSynastryQuestion,
  aiStatus,
  generateChartNarrative,
  generateDailyReading,
  generateRelationshipAnalysis,
} from '../ai';
import { requireAuth, type AuthedRequest } from '../middleware';
import { store } from '../store';
import { localDateKey, userTimezone } from '../dates';
import {
  ensureDailyConversation,
  ensureSynastryConversation,
  partnerConversationFor,
  stripUser,
} from './helpers';

export function registerAiRoutes(router: Router): void {
  router.get('/health', (_req, res) => {
    const ai = aiStatus();
    res.json({
      ok: true,
      service: 'asto-ai-api',
      ai: ai.enabled,
      provider: ai.provider,
      model: ai.model,
    });
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
        analysisAt: new Date().toISOString(),
        conversationId: conv.id,
      });
      const profile = stripUser((await store.getUser(user.id))!);
      res.json({ partner: updated, synastry, conversation: conv, profile, cost, cached: false });
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
        res.status(400).json({ error: 'Önce doğum haritası kaydedin' });
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
          selfBirth: user.birth,
          partnerBirth: partner.birth,
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
}
