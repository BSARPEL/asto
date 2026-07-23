import OpenAI from 'openai';
import type { ChartData, Gender, SynastryResult } from '@asto/shared';
import { PLANET_LABELS_TR } from '@asto/shared';
import {
  chartSummaryForPrompt,
  computeTransits,
  relationshipKeySummaryForPrompt,
  synastryFocusAreasForPrompt,
  synastryScoreBreakdownForPrompt,
} from './chart/engine';

export type RelationshipAnalysisResult = {
  analysis: string;
  score: number;
  scoreNote: string;
  scoreSource: 'ai' | 'engine';
};

const SYSTEM = `Sen Asto adlı bir astroloji danışmanısın. Türkçe, sıcak ama abartısız bir dille yazarsın.
Kurallar:
- Sadece verilen harita / transit verisine dayan; gezegen konumunu uydurma.
- Kehanet gibi kesin gelecek vaat etme; eğilim ve farkındalık dili kullan.
- Kısa paragraflar ve okunabilir yapı kullan.
- Tıbbi, hukuki veya finansal kesin tavsiye verme.`;

type AiProvider = 'gemini' | 'openai' | 'mock';

function aiProvider(): AiProvider {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'mock';
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

async function geminiComplete(userPrompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY yok');

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': key,
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
    usageMetadata?: { totalTokenCount?: number; promptTokenCount?: number; candidatesTokenCount?: number };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
  if (!text) throw new Error('Gemini boş yanıt döndü');

  if (process.env.AI_LOG_USAGE === '1' && data.usageMetadata) {
    const u = data.usageMetadata;
    console.log(
      `[ai] gemini/${model} tokens: ${u.totalTokenCount ?? '?'} (prompt ${u.promptTokenCount ?? '?'}, out ${u.candidatesTokenCount ?? '?'})`,
    );
  }

  return text;
}

function openaiClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function openaiComplete(userPrompt: string): Promise<string> {
  const openai = openaiClient();
  if (!openai) throw new Error('OPENAI_API_KEY yok');

  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || 'Yanıt üretilemedi.';
}

async function complete(userPrompt: string): Promise<string> {
  const provider = aiProvider();
  if (provider === 'gemini') return geminiComplete(userPrompt);
  if (provider === 'openai') return openaiComplete(userPrompt);
  return mockComplete(userPrompt);
}

function mockComplete(prompt: string): string {
  if (prompt.includes('GÜNLÜK ÖNGÖRÜ')) {
    return [
      'Bugün enerjin biraz daha içe dönük ve farkındalık odaklı. Ay’ın geçişleri duygusal ihtiyaçlarını öne çıkarabilir; küçük bir mola veya yürüyüş dengeleme sağlar.',
      '',
      'İletişimde netlik önemli: aklındakini yumuşak ama açık söylemek gerilimi azaltır. İlişkilerde dinlemek, kariyer veya gündelik işlerde ise tek bir göreve odaklanmak verimini yükseltir.',
      '',
      'Akşam saatlerinde bedenini dinle; erken dinlenme yarının temposunu kolaylaştırır.',
    ].join('\n');
  }
  if (prompt.includes('SİNASTRİ SOHBETİ')) {
    return [
      'Sinastri yorumundaki Ay–Ay ve Venüs–Mars temalarına bakınca, duygusal ihtiyaçlarınız benzer bir ritimde ilerliyor; bu da günlük hayatta birbirinizi daha hızlı anlamanızı sağlar.',
      '',
      'Gerilim yaratabilecek kare açılar ise tempo ve beklenti farkı getiriyor. Tartışmada acele etmek yerine duyguyu adlandırmak ve küçük net adımlar atmak bağı güçlendirir.',
      '',
      '(Not: Demo yanıt — API anahtarı tanımlı değil.)',
    ].join('\n');
  }
  if (prompt.includes('İLİŞKİ ANALİZİ')) {
    return [
      '1) Genel dinamik: Haritalar arasında tamamlayıcı ve öğrenme alanı açan bir ritim var; duygusal ihtiyaçlar farklı tempoda ilerleyebilir.',
      '2) Kadın Güneş – Erkek Ay: Bu eksen temel “görülme / güvende hissetme” bağını kurar; açı varsa kimlik ve duygusal ihtiyaçlar birbirini besler.',
      '3) Ay – Ay: Ortak duygusal dil ve bakım biçimi buradan okunur; uyum rahatlık, gerilim ise yanlış anlaşılma riski getirir.',
      '4) Kadın Mars – Erkek Venüs: İstek ve çekim dili; tempo uyumu tutkuyu, tempo farkı ise sabırsızlığı artırabilir.',
      '5) Ay düğümleri: Ortak büyüme yönü ve tanıdık kalıplar; düğüm temasları “neden bu kişi?” hissini güçlendirebilir.',
      '6) Asc / Dsc: Yükselen üzerindeki faktörler ilk izlenimi, alçalan üzerindeki faktörler ilişki kapısını ve partner arketipini işaret eder.',
      '7) Güçlü yönler ve gelişim: Açık iletişim + kişisel alana saygı; varsayımları konuşmaya çevirmek bağı güçlendirir.',
      '8) Kısa öneri: Duyguyu adlandırıp küçük net adımlar atmak, hem Ay hem Güneş ihtiyaçlarını dengeler.',
      '',
      'SİNASTRİ_SKORU: 74',
      'SKOR_GEREKÇESİ: Uyumlu Ay ve Venüs-Mars temaları güçlü; birkaç kare açı ise tempo farkı getiriyor.',
    ].join('\n');
  }
  if (prompt.includes('HARİTA ANLATIMI')) {
    return [
      'Haritan, kimliğini Güneş burcun üzerinden kurarken duygusal dünyanı Ay burcunla besliyor. Yükselenin ise dışarıya yansıyan ilk izlenimini ve hayata giriş tarzını şekillendiriyor.',
      '',
      'Potansiyellerin: farkındalık, yaratıcı ifade ve ilişkilerde derin bağ kurma. Zorlayıcı temalar ise tempoyu ayarlamak ve kendi ihtiyaçlarını ertelememek olabilir.',
      '',
      'Bu dönem, haritandaki temel temaları bilinçli seçimlerle yaşamaya davet ediyor.',
    ].join('\n');
  }
  return [
    'Haritana baktığımda sorun, mevcut transitlerle birlikte “netlik ve denge” temasına bağlanıyor.',
    '',
    'Pratik öneri: bugün bir karar varsa acele etme; duygunu adlandır, sonra küçük bir adım at. Bu yaklaşım hem içsel güvenini hem de ilişkilerindeki akışı destekler.',
    '',
    '(Not: GEMINI_API_KEY veya OPENAI_API_KEY tanımlı değil; bu bir demo yanıttır.)',
  ].join('\n');
}

export async function generateDailyReading(natal: ChartData, displayName: string): Promise<{
  summary: string;
  themes: string[];
}> {
  const transits = computeTransits();
  const transitText = transits
    .map((p) => `${PLANET_LABELS_TR[p.name] ?? p.name}: ${p.sign} ${p.signDegree.toFixed(1)}°`)
    .join(', ');

  const prompt = `GÜNLÜK ÖNGÖRÜ
Kişi: ${displayName}
${chartSummaryForPrompt(natal, 'Natal harita')}
Bugünün transitleri: ${transitText}

3-4 kısa paragraf yaz. Son satırda virgülle ayrılmış 3 tema anahtar kelimesi ver: TEMALAR: ...`;

  const text = await complete(prompt);
  const themeMatch = text.match(/TEMALAR:\s*(.+)$/i);
  const themes = themeMatch
    ? themeMatch[1].split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5)
    : ['denge', 'iletişim', 'farkındalık'];
  const summary = text.replace(/\n?TEMALAR:[\s\S]*$/i, '').trim();
  return { summary, themes };
}

export async function generateChartNarrative(natal: ChartData, displayName: string): Promise<string> {
  return complete(
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
): Promise<string> {
  const transits = computeTransits();
  const transitText = transits
    .slice(0, 7)
    .map((p) => `${p.name}: ${p.sign}`)
    .join(', ');
  const hist = history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  return complete(
    `SORU-CEVAP
${chartSummaryForPrompt(natal)}
Transit özeti: ${transitText}
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

  return complete(
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
- Gerekirse önceki yorumdaki başlıklara atıf yap; çelişki yaratma.
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
    await complete(
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
- Her bölümde önce engine verisindeki bulguyu özetle, sonra kısa yorum yap.
- "majör açı yok" veya "faktör yok" yazıyorsa bunu açıkça belirt; yine de o başlık için 1–2 cümle yorum yap.
- Engine verisinde olmayan yeni açı, gezegen konumu veya burç uydurma.
- Motor skoru referans al; kendi değerlendirmenle 0–100 arası nihai sinastri skoru ver.
- Skoru yalnızca verilen verilere dayanarak ver; abartılı uç değerlerden kaçın (çoğu ilişki 45–85 aralığında).

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
