import OpenAI from 'openai';
import {
  answerQuestion as sharedAnswerQuestion,
  answerSynastryQuestion as sharedAnswerSynastry,
  createGeminiRuntime,
  generateChartNarrative as sharedChartNarrative,
  generateDailyReading as sharedDailyReading,
  generateRelationshipAnalysis as sharedRelationshipAnalysis,
  mockRuntime,
  type RelationshipAnalysisResult,
} from '@asto/shared';
import type { ChartData, Gender, SynastryResult } from '@asto/shared';

export type { RelationshipAnalysisResult };

type AiProvider = 'gemini' | 'openai' | 'mock';

function aiProvider(): AiProvider {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'mock';
}

function runtime() {
  const provider = aiProvider();
  if (provider === 'gemini') {
    return createGeminiRuntime(
      process.env.GEMINI_API_KEY!,
      process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    );
  }
  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    return {
      complete: async (userPrompt: string) => {
        const res = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content:
                'Sen Asto adlı bir astroloji danışmanısın. Türkçe, sıcak ama abartısız bir dille yazarsın.',
            },
            { role: 'user', content: userPrompt },
          ],
        });
        return res.choices[0]?.message?.content?.trim() || 'Yanıt üretilemedi.';
      },
    };
  }
  return mockRuntime;
}

export function aiStatus(): { enabled: boolean; provider: AiProvider; model: string | null } {
  const provider = aiProvider();
  if (provider === 'gemini') {
    return {
      enabled: true,
      provider,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    };
  }
  if (provider === 'openai') {
    return {
      enabled: true,
      provider,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }
  return { enabled: false, provider, model: null };
}

export async function generateDailyReading(natal: ChartData, displayName: string) {
  return sharedDailyReading(natal, displayName, runtime());
}

export async function generateChartNarrative(natal: ChartData, displayName: string) {
  return sharedChartNarrative(natal, displayName, runtime());
}

export async function answerQuestion(
  natal: ChartData,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
) {
  return sharedAnswerQuestion(natal, question, history, runtime());
}

export async function answerSynastryQuestion(
  selfName: string,
  selfChart: ChartData,
  partnerName: string,
  partnerChart: ChartData,
  analysis: string,
  synastryScore: number | undefined,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: { selfGender?: Gender; partnerGender?: Gender },
) {
  return sharedAnswerSynastry(
    selfName,
    selfChart,
    partnerName,
    partnerChart,
    analysis,
    synastryScore,
    question,
    history,
    runtime(),
    options,
  );
}

export { parseRelationshipAnalysis } from '@asto/shared';

export async function generateRelationshipAnalysis(
  selfName: string,
  selfChart: ChartData,
  partnerName: string,
  partnerChart: ChartData,
  synastry: SynastryResult,
  options?: { selfGender?: Gender; partnerGender?: Gender },
) {
  return sharedRelationshipAnalysis(
    selfName,
    selfChart,
    partnerName,
    partnerChart,
    synastry,
    runtime(),
    options,
  );
}
