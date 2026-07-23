import type { ChartData, Gender, SynastryResult } from '../types';
import { PLANET_LABELS_TR } from '../constants';
import { chartSummaryForPrompt } from '../chart/engine';
import { computeTransits } from '../chart/engine';
import {
  relationshipKeySummaryForPrompt,
  synastryFocusAreasForPrompt,
  synastryScoreBreakdownForPrompt,
} from '../chart/engine';

export type RelationshipAnalysisResult = {
  analysis: string;
  score: number;
  scoreNote: string;
  scoreSource: 'ai' | 'engine';
};

export type AiRuntime = {
  complete: (userPrompt: string) => Promise<string>;
};

const SYSTEM = `Sen Asto adlı bir astroloji danışmanısın. Türkçe, sıcak ama abartısız bir dille yazarsın.
Kurallar:
- Sadece verilen harita / transit verisine dayan; gezegen konumunu uydurma.
- Kehanet gibi kesin gelecek vaat etme; eğilim ve farkındalık dili kullan.
- Kısa paragraflar ve okunabilir yapı kullan.
- Tıbbi, hukuki veya finansal kesin tavsiye verme.`;

/** Google AI Studio — generativelanguage.googleapis.com (Firebase değil). */
export async function geminiComplete(
  userPrompt: string,
  apiKey: string,
  model = 'gemini-2.5-flash-lite',
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1800,
      },
    }),
  });

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
  if (!text) throw new Error('Gemini boş yanıt döndü');
  return text;
}

export function createGeminiRuntime(apiKey: string, model?: string): AiRuntime {
  return {
    complete: (prompt) => geminiComplete(prompt, apiKey, model),
  };
}

function mockComplete(prompt: string): string {
  if (prompt.includes('GÜNLÜK ÖNGÖRÜ')) {
    return [
      'Bugün enerjin biraz daha içe dönük ve farkındalık odaklı.',
      '',
      'İletişimde netlik önemli.',
      '',
      'Akşam saatlerinde dinlenmeye zaman ayır.',
      '',
      'TEMALAR: denge, iletişim, farkındalık',
    ].join('\n');
  }
  if (prompt.includes('HARİTA ANLATIMI')) {
    return 'Haritan kişilik ve potansiyellerini anlatan kısa bir demo metnidir. (Gemini anahtarı yok)';
  }
  return 'Demo yanıt — Gemini API anahtarı tanımlı değil.';
}

export const mockRuntime: AiRuntime = { complete: async (p) => mockComplete(p) };

export async function generateDailyReading(
  natal: ChartData,
  displayName: string,
  runtime: AiRuntime,
): Promise<{ summary: string; themes: string[] }> {
  const transits = computeTransits();
  const transitText = transits
    .map((p) => `${PLANET_LABELS_TR[p.name] ?? p.name}: ${p.sign} ${p.signDegree.toFixed(1)}°`)
    .join(', ');

  const prompt = `GÜNLÜK ÖNGÖRÜ
Kişi: ${displayName}
${chartSummaryForPrompt(natal, 'Natal harita')}
Bugünün transitleri: ${transitText}

3-4 kısa paragraf yaz. Son satırda virgülle ayrılmış 3 tema anahtar kelimesi ver: TEMALAR: ...`;

  const text = await runtime.complete(prompt);
  const themeMatch = text.match(/TEMALAR:\s*(.+)$/i);
  const themes = themeMatch
    ? themeMatch[1].split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5)
    : ['denge', 'iletişim', 'farkındalık'];
  const summary = text.replace(/\n?TEMALAR:[\s\S]*$/i, '').trim();
  return { summary, themes };
}

export async function generateChartNarrative(
  natal: ChartData,
  displayName: string,
  runtime: AiRuntime,
): Promise<string> {
  return runtime.complete(
    `HARİTA ANLATIMI
Kişi: ${displayName}
${chartSummaryForPrompt(natal)}
Kişilik, potansiyeller ve dikkat edilmesi gereken temaları 3-4 paragrafta anlat.`,
  );
}

export async function answerQuestion(
  natal: ChartData,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  runtime: AiRuntime,
): Promise<string> {
  const transits = computeTransits()
    .slice(0, 7)
    .map((p) => `${p.name}: ${p.sign}`)
    .join(', ');
  const hist = history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  return runtime.complete(
    `SORU-CEVAP
${chartSummaryForPrompt(natal)}
Transit özeti: ${transits}
Önceki mesajlar:
${hist || '(yok)'}

Kullanıcı sorusu: ${question}
Haritaya dayalı, net ve uygulanabilir bir yanıt ver.`,
  );
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
  runtime: AiRuntime,
  options?: { selfGender?: Gender; partnerGender?: Gender },
): Promise<string> {
  const genderLine = [
    options?.selfGender ? `Kişi A cinsiyet: ${options.selfGender === 'female' ? 'kadın' : 'erkek'}` : null,
    options?.partnerGender
      ? `Kişi B cinsiyet: ${options.partnerGender === 'female' ? 'kadın' : 'erkek'}`
      : null,
  ]
    .filter(Boolean)
    .join(' | ');

  const hist = history
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  return runtime.complete(
    `SİNASTRİ SOHBETİ
${selfName} (Kişi A):
${chartSummaryForPrompt(selfChart, 'Kişi A')}
${partnerName} (Kişi B):
${chartSummaryForPrompt(partnerChart, 'Kişi B')}
${genderLine ? `${genderLine}\n` : ''}${synastryScore != null ? `Sinastri skoru: ${synastryScore}/100\n` : ''}
ÖNCEDEN ÜRETİLEN SİNASTRİ YORUMU (referans; tutarlı kal):
${analysis}

Önceki sohbet:
${hist || '(yok)'}

Kullanıcı sorusu: ${question}

Kurallar:
- Yalnızca verilen harita ve sinastri yorumuna dayan; yeni gezegen konumu veya açı uydurma.
- İlişki dinamiğini ${selfName} ve ${partnerName} isimleriyle, sıcak ve net anlat.
- Kısa paragraflar; kehanet dili kullanma.`,
  );
}

export function parseRelationshipAnalysis(
  text: string,
  fallbackScore: number,
): RelationshipAnalysisResult {
  const scoreMatch =
    text.match(/SİNASTRİ_SKORU:\s*(\d{1,3})/i) ?? text.match(/SKOR:\s*(\d{1,3})/i);
  const noteMatch = text.match(/SKOR_GEREKÇESİ:\s*(.+)$/im);

  const analysis = text
    .replace(/\n?SİNASTRİ_SKORU:\s*\d{1,3}.*$/gim, '')
    .replace(/\n?SKOR:\s*\d{1,3}.*$/gim, '')
    .replace(/\n?SKOR_GEREKÇESİ:\s*.+$/gim, '')
    .trim();

  const parsedScore = scoreMatch ? Number(scoreMatch[1]) : NaN;
  const score = Number.isFinite(parsedScore)
    ? Math.max(0, Math.min(100, Math.round(parsedScore)))
    : fallbackScore;

  return {
    analysis: analysis || text.trim(),
    score,
    scoreNote: noteMatch?.[1]?.trim() ?? '',
    scoreSource: scoreMatch ? 'ai' : 'engine',
  };
}

export async function generateRelationshipAnalysis(
  selfName: string,
  selfChart: ChartData,
  partnerName: string,
  partnerChart: ChartData,
  synastry: SynastryResult,
  runtime: AiRuntime,
  options?: { selfGender?: Gender; partnerGender?: Gender },
): Promise<RelationshipAnalysisResult> {
  const topAspects = synastry.aspects
    .slice(0, 10)
    .map(
      (a) =>
        `${PLANET_LABELS_TR[a.planetA] ?? a.planetA}(${a.personA === 'self' ? 'A' : 'B'})-${PLANET_LABELS_TR[a.planetB] ?? a.planetB}(${a.personB === 'self' ? 'A' : 'B'}) ${a.type} orb ${a.orb}`,
    )
    .join('; ');

  const genderLine = [
    options?.selfGender ? `Kişi A cinsiyet: ${options.selfGender === 'female' ? 'kadın' : 'erkek'}` : null,
    options?.partnerGender
      ? `Kişi B cinsiyet: ${options.partnerGender === 'female' ? 'kadın' : 'erkek'}`
      : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return parseRelationshipAnalysis(
    await runtime.complete(
      `İLİŞKİ ANALİZİ (SİNASTRİ)
${selfName} (Kişi A):
${chartSummaryForPrompt(selfChart, 'Kişi A')}
${partnerName} (Kişi B):
${chartSummaryForPrompt(partnerChart, 'Kişi B')}
${genderLine ? `${genderLine}\n` : ''}Motor referans skoru (yalnızca rehber): ${synastry.score}/100
Motor skor detayı:
${synastryScoreBreakdownForPrompt(synastry.scoreBreakdown)}
Öne çıkanlar: ${synastry.highlights.join(' | ')}
Kesişen açılar (özet): ${topAspects}

İLİŞKİ ODAK NOKTALARI — KİŞİ BİLGİLERİ (engine hesapladı):
${relationshipKeySummaryForPrompt(selfChart, partnerChart, options?.selfGender, options?.partnerGender)}

ENGINE SİNASTRİ VERİSİ — 6 ZORUNLU ODAK (açı uydurma; yalnızca bunları kullan):
${synastryFocusAreasForPrompt(synastry.focusAreas)}

ZORUNLU KURALLAR:
- Yukarıdaki 6 odak başlığının HER BİRİNİ aşağıdaki sırayla, ayrı bölüm olarak yaz; atlama.
- Engine verisinde olmayan yeni açı, gezegen konumu veya burç uydurma.
- Motor skoru referans al; kendi değerlendirmenle 0–100 arası nihai sinastri skoru ver.

BAŞLIKLAR (sırayla):
1) Genel dinamik
2) Kadın Güneş – Erkek Ay ilişkisi
3) Ay + Ay ilişkisi
4) Kadın Mars – Erkek Venüs ilişkisi
5) Ay düğümleri arasındaki ilişki
6) Yükselen (Asc) üzerinde diğer kişinin faktörü var mı?
7) Alçalan (Dsc) üzerinde diğer kişinin faktörü var mı?
8) Güçlü yönler ve gelişime açık alanlar
9) Kısa öneri

METİN BİTTİKTEN SONRA (ayrı satırlar, zorunlu):
SİNASTRİ_SKORU: <0-100 tam sayı>
SKOR_GEREKÇESİ: <1-2 cümle, neden bu puan>`,
    ),
    synastry.score,
  );
}
