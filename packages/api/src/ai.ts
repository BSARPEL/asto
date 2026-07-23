import OpenAI from 'openai';
import type { ChartData, SynastryResult } from '@asto/shared';
import { PLANET_LABELS_TR } from '@asto/shared';
import {
  chartSummaryForPrompt,
  computeTransits,
  synastryFocusAreasForPrompt,
} from './chart/engine';

const SYSTEM = `Sen Asto adlı bir astroloji danışmanısın. Türkçe, sıcak ama abartısız bir dille yazarsın.
Kurallar:
- Sadece verilen harita / transit verisine dayan; gezegen konumunu uydurma.
- Kehanet gibi kesin gelecek vaat etme; eğilim ve farkındalık dili kullan.
- Kısa paragraflar ve okunabilir yapı kullan.
- Tıbbi, hukuki veya finansal kesin tavsiye verme.`;

function client(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function complete(userPrompt: string): Promise<string> {
  const openai = client();
  if (!openai) return mockComplete(userPrompt);

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
    '(Not: OPENAI_API_KEY tanımlı değil; bu bir demo yanıttır. Gerçek AI için .env dosyasına anahtar ekleyin.)',
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

export async function generateRelationshipAnalysis(
  selfName: string,
  selfChart: ChartData,
  partnerName: string,
  partnerChart: ChartData,
  synastry: SynastryResult,
  options?: { selfGender?: string; partnerGender?: string },
): Promise<string> {
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

  return complete(
    `İLİŞKİ ANALİZİ
${selfName} (Kişi A):
${chartSummaryForPrompt(selfChart, 'Kişi A')}
${partnerName} (Kişi B):
${chartSummaryForPrompt(partnerChart, 'Kişi B')}
${genderLine ? `${genderLine}\n` : ''}Sinastri skoru: ${synastry.score}/100
Öne çıkanlar: ${synastry.highlights.join(' | ')}
Kesişen açılar: ${topAspects}

ÖNCELİKLİ SİNASTRİ ODAKLARI (engine hesapladı; açı uydurma):
${synastryFocusAreasForPrompt(synastry.focusAreas)}

Şu başlıklarla yaz; her odak başlığını mutlaka yorumla (veri yoksa kısaca belirt):
1) Genel dinamik
2) Kadın Güneş – Erkek Ay bağı
3) Ay – Ay duygusal uyum
4) Kadın Mars – Erkek Venüs çekimi
5) Ay düğümleri ve ortak yol
6) Yükselen (Asc) ve Alçalan (Dsc) üzeri kesişimler
7) Güçlü yönler ve gelişime açık alanlar
8) Kısa öneri`,
  );
}
