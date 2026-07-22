import OpenAI from 'openai';
import type { ChartData, SynastryResult } from '@asto/shared';
import { PLANET_LABELS_TR } from '@asto/shared';
import { chartSummaryForPrompt, computeTransits } from './chart/engine';

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
      'Bu iki harita arasında hem tamamlayıcı hem de öğrenme alanı açan bir dinamik görünüyor. Duygusal ihtiyaçlar ve ifade biçimleri farklı hızlarda ilerleyebilir; bu zıtlık doğru yönetilirse ilişkiyi zenginleştirir.',
      '',
      'Güçlü yönler: karşılıklı çekim, ortak büyüme isteği ve kriz anlarında birbirini toparlama potansiyeli.',
      'Gelişime açık alanlar: beklentileri varsaymadan konuşmak, kişisel alan ihtiyacına saygı ve küçük çatışmaları büyütmeden çözmek.',
      '',
      'İletişimde “ne hissettiğini” anlatmak, “ne yanlış yaptığını” söylemekten daha çok bağ kurar.',
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
): Promise<string> {
  const topAspects = synastry.aspects
    .slice(0, 10)
    .map((a) => `${a.planetA}(${a.personA})-${a.planetB}(${a.personB}) ${a.type} orb ${a.orb}`)
    .join('; ');

  return complete(
    `İLİŞKİ ANALİZİ
${selfName}:
${chartSummaryForPrompt(selfChart, 'Kişi A')}
${partnerName}:
${chartSummaryForPrompt(partnerChart, 'Kişi B')}
Sinastri skoru: ${synastry.score}/100
Öne çıkanlar: ${synastry.highlights.join(' | ')}
Kesişen açılar: ${topAspects}

Şu başlıklarla yaz:
1) Genel dinamik
2) Güçlü yönler
3) Gelişime açık alanlar
4) İletişim ve duygusal bağ
5) Kısa öneri`,
  );
}
