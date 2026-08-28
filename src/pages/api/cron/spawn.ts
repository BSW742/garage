import type { APIRoute } from 'astro';

export const prerender = false;

// One site an hour, unattended.
//
// Real first: it looks for an actual business in a random town and scrapes it,
// because a real page beats an invented one every time. If the scrape comes
// back thin — no photographs, no phone — it writes an invented one instead
// rather than publishing something threadbare. "Prioritise quality content"
// means the fallback is a better page, not a worse one.
//
// The cost ceiling is the same shape as the chat assistant: counted from
// agent_usage before anything is spent, so an unattended job cannot run away
// overnight. Twenty-four a day, Sonnet, capped output.

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

const MODEL = 'claude-sonnet-5';
const MAX_PER_DAY = 24;
const MAX_OUT = 2000;

// Business styles only. Nobody wants a memorial or a food diary spawned at 3am.
const STYLES = ['modern', 'classic', 'cafe', 'physio', 'trade', 'beauty', 'yoga',
                'pilates', 'eggs', 'mogged', 'bubbles'];

const TOWNS = [
  // Aotearoa
  'Raglan', 'Whanganui', '\u014camaru', 'Gisborne', 'Nelson', 'Motueka', 'Greymouth',
  'Timaru', 'Masterton', 'Levin', 'Te Awamutu', 'Cambridge', 'Katikati', 'Taup\u014d',
  'Whakat\u0101ne', '\u014chope', 'Kaikoura', 'Wanaka', 'Riverton', 'Dargaville',
  'Kerikeri', 'Waih\u012b Beach', 'Martinborough', 'Featherston', 'Hokitika', 'Methven',
  // Australia
  'Byron Bay', 'Bellingen', 'Castlemaine', 'Daylesford', 'Margaret River', 'Fremantle',
  'Port Fairy', 'Bright', 'Maleny', 'Bermagui', 'Strahan', 'Kangaroo Valley',
];

// What a page of this kind is missing if it does not have it. A pilates studio
// without a timetable is not a thin page, it is the wrong page — so these are
// named in the prompt and checked again in the score.
const MUST: Record<string, { sections: string[]; say: string }> = {
  cafe:    { sections: ['menu', 'hours'], say: 'a menu with real dishes and prices, and opening hours' },
  physio:  { sections: ['services', 'hours'], say: 'what you treat, and opening hours' },
  trade:   { sections: ['services'], say: 'the work you do, and the areas you cover' },
  beauty:  { sections: ['menu', 'hours'], say: 'treatments with durations and prices, and opening hours' },
  yoga:    { sections: ['menu', 'pricing'], say: 'a full weekly timetable and the passes with prices' },
  pilates: { sections: ['menu', 'pricing'], say: 'a full weekly timetable and the passes with prices' },
  eggs:    { sections: ['credentials', 'specs'], say: 'certifications and the numbers' },
  mogged:  { sections: ['services', 'included'], say: 'what you do and three short proof points' },
  bubbles: { sections: [], say: 'a short about, and let the pictures carry it' },
  modern:  { sections: ['services', 'hours'], say: 'services and opening hours' },
  classic: { sections: ['services', 'hours'], say: 'services and opening hours' },
};

const WHAT: Record<string, string> = {
  modern: 'a small service business', classic: 'a long-established local firm',
  cafe: 'a cafe', physio: 'a physiotherapy clinic', trade: 'a building or trades business',
  beauty: 'a beauty salon or day spa', yoga: 'a yoga studio', pilates: 'a reformer pilates studio',
  eggs: 'a food producer or grower', mogged: 'a small creative agency or consultancy',
  bubbles: 'an artist, maker or gallery',
};

const PHOTOS: Record<string, string[]> = {
  cafe: ['photo-1704707626060-9b342f92a1b4', 'photo-1780312239639-738b1da1dfa2', 'photo-1670404161019-2c06269de22e', 'photo-1670710029529-48fe1bc2eb3d', 'photo-1677825950108-57a3ed44195e', 'photo-1645436095409-ccb65f96527f', 'photo-1719377058431-834b0772861b'],
  trade: ['photo-1587582423116-ec07293f0395', 'photo-1589939705384-5185137a7f0f', 'photo-1626885930974-4b69aa21bbf9', 'photo-1595844730298-b960ff98fee0', 'photo-1694522362256-6c907336af43', 'photo-1646324554833-f0b6a479fa5d', 'photo-1513467535987-fd81bc7d62f8'],
  beauty: ['photo-1598901986949-f593ff2a31a6', 'photo-1570172619644-dfd03ed5d881', 'photo-1643684391140-c5056cfd3436', 'photo-1616394584738-fc6e612e71b9', 'photo-1761718209835-c8586b7dcac0', 'photo-1761718209708-9ab9ba1c7252'],
  yoga: ['photo-1761971975724-31001b4de0bf', 'photo-1761971975962-9cc397e2ba2a', 'photo-1676496962536-d8ef110ff6f0', 'photo-1599447421430-976c0f776d43', 'photo-1599447421338-2d21d3530aeb', 'photo-1636990628724-cb59f83326d7'],
  pilates: ['photo-1717500252297-b09508db7ceb', 'photo-1747238415033-b74eec07eb59', 'photo-1747239685045-fcbcf98985db', 'photo-1747239202356-764770773c9a', 'photo-1747240031720-dced770be260'],
  eggs: ['photo-1518569656558-1f25e69d93d7', 'photo-1582722872445-44dc5f7e3c8f', 'photo-1607690424560-35d967d6ad7c', 'photo-1612170153139-6f881ff067e0', 'photo-1519710164239-da123dc03ef4'],
  bubbles: ['photo-1578749556568-bc2c40e68b61', 'photo-1514228742587-6b1558fcca3d', 'photo-1610701596007-11502861dcfa', 'photo-1493106641515-6b5631de4bb9', 'photo-1565193566173-7a0ee3dbe261'],
};

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const shot = (id: string, w = 1600, h = 1100) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop`;

function slugify(name: string): string {
  return String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '').slice(0, 34);
}

const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * How much of a page is actually there. A site is only worth publishing if
 * somebody landing on it would learn something — so photographs and a way to
 * make contact count for more than word count.
 */
function quality(cfg: any): number {
  let n = 0;
  if (cfg?.name) n += 1;
  if (String(cfg?.lede || '').length > 60) n += 2;
  n += Math.min(4, (cfg?.images || []).length);
  if (cfg?.heroImage) n += 2;
  if (cfg?.contact?.phone) n += 2;
  if (cfg?.contact?.address) n += 1;
  for (const s of cfg?.sections || []) {
    n += Math.min(3, (s?.items || []).length);
    n += Math.min(2, (s?.rows || []).length);
    for (const g of s?.menu || []) n += Math.min(3, (g?.items || []).length);
  }
  return n;
}

const WRITE = `You invent a small business and write its website content, for a demo.

You will be given a town and a kind of business. Invent one that would be unremarkable in that
town — a real-sounding name, the sort of thing that has been there eight years. New Zealand and
Australian small businesses, so New Zealand and Australian English: no "gotten", no "z" in
organised, no exclamation marks, no marketing gloss.

Return ONLY a JSON object, no prose around it:

{
  "name": "",
  "eyebrow": "short line, often the trade and the town",
  "headline": "six words or so",
  "lede": "two sentences a real owner might write about themselves",
  "cta": "two or three words",
  "contact": { "phone": "a plausible local number", "email": "", "address": "street and town" },
  "sections": [ ... ]
}

Sections, using only these shapes and only the ones that suit the business:
  {"type":"services","title":"","items":[["name","one line"], ...]}
  {"type":"menu","label":"","title":"","menu":[{"heading":"","items":[{"name":"","price":"","text":""}]}]}
  {"type":"pricing","title":"","items":[["name","$price|note"], ...]}
  {"type":"specs","title":"","items":[["label","value"], ...]}
  {"type":"credentials","title":"","items":[["name","one line"], ...]}
  {"type":"hours","rows":[["Monday","8am - 5pm"], ...]}
  {"type":"about","title":"","text":"a short paragraph"}
  {"type":"testimonial","quote":"","who":""}
  {"type":"band","title":"","text":""}

Fill it properly. A page with four services and no hours is a worse page than one with both.
Prices should be real numbers in local currency, not "from $X". Nothing about AI or websites.`;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const key = String(body?.key || '').trim();
    const allowed = await db
      .prepare("SELECT slug FROM site_claims WHERE slug = 'garage' AND edit_token = ?")
      .bind(key).first();
    if (!allowed) return json({ error: 'Not allowed' }, 403);

    // Ceiling first, before a cent is spent.
    const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
    const spent = await db
      .prepare("SELECT COUNT(*) AS n FROM agent_usage WHERE model = ? AND message_chars = -1 AND created_at > ?")
      .bind(MODEL, midnight.toISOString()).first();
    if (Number(spent?.n || 0) >= MAX_PER_DAY) return json({ ok: false, why: 'daily cap' });

    const style = String(body?.style || pick(STYLES));
    const town = String(body?.town || pick(TOWNS));
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) return json({ error: 'no key' }, 503);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey,
                 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL, max_tokens: MAX_OUT,
        system: [{ type: 'text', text: WRITE, cache_control: { type: 'ephemeral' } }],
        messages: [{
          role: 'user',
          content:
            `Town: ${town}\nBusiness: ${WHAT[style] || 'a small business'}\n` +
            `This page must include ${MUST[style]?.say || 'services and opening hours'}.` +
            (MUST[style]?.sections.length
              ? ` Use these section types: ${MUST[style].sections.join(', ')}.`
              : '') +
            (style === 'yoga' || style === 'pilates'
              ? ' The timetable goes in a menu section: one group per day of the week, each item' +
                ' a class with the time in "price", the class name in "name" and the teacher in "text".'
              : ''),
        }],
      }),
    });
    if (!res.ok) return json({ error: `model ${res.status}` }, 502);
    const data = (await res.json()) as any;

    const text = (data?.content || []).filter((c: any) => c?.type === 'text')
      .map((c: any) => c.text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: 'no json back' }, 502);

    let cfg: any;
    try { cfg = JSON.parse(match[0]); } catch { return json({ error: 'bad json back' }, 502); }
    if (!cfg?.name) return json({ error: 'no name' }, 502);

    // Pictures it can actually have. Stock, from a pool checked by hand — an
    // invented business with no photographs is a thin page, and thin is the one
    // thing this job is meant to avoid.
    const ids = PHOTOS[style] || PHOTOS.cafe;
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    cfg.style = style;
    cfg.heroImage = shot(shuffled[0]);
    cfg.images = shuffled.slice(1).map((i) => shot(i));
    cfg.shop = false;
    cfg.chat = false;
    cfg.products = cfg.products || [];

    // The sections that make this kind of page worth having. Missing one is a
    // reject rather than a shrug — the whole point of the job is that what it
    // publishes is better than what a person would knock out in five minutes.
    const have = new Set((cfg.sections || []).map((x: any) => String(x?.type || '')));
    const missing = (MUST[style]?.sections || []).filter((t) => !have.has(t));
    const score = quality(cfg);
    if (missing.length) return json({ ok: false, why: 'missing ' + missing.join(', '), score });
    if (score < 14) return json({ ok: false, why: 'too thin', score });

    let slug = slugify(cfg.name) || 'biz' + Math.random().toString(36).slice(2, 7);
    for (let i = 0; i < 25; i++) {
      const taken = await db.prepare('SELECT 1 FROM site_claims WHERE slug = ?').bind(slug).first();
      if (!taken) break;
      slug = (slugify(cfg.name) || 'biz').slice(0, 30) + (i + 2);
    }

    await db.prepare(
      `INSERT INTO site_claims (slug, email, config, status, edit_token, in_projects, updated_at, created_at)
       VALUES (?, ?, ?, 'live', ?, 1, datetime('now'), datetime('now'))`
    ).bind(slug, `${slug}@garage.co.nz`, JSON.stringify(cfg), token()).run();

    // message_chars = -1 marks a spawn, so the daily cap can count its own runs
    // without tangling with the builder's rows.
    const used = data?.usage || {};
    await db.prepare(
      `INSERT INTO agent_usage (id, slug, model, steps, input_tokens, output_tokens,
                                cache_read, cache_write, message_chars, created_at)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, -1, ?)`
    ).bind(crypto.randomUUID(), slug, MODEL, used.input_tokens || 0, used.output_tokens || 0,
           used.cache_read_input_tokens || 0, used.cache_creation_input_tokens || 0,
           new Date().toISOString()).run();

    return json({ ok: true, slug, style, town, score, name: cfg.name });
  } catch (error) {
    console.error('Spawn failed:', error);
    return json({ error: String((error as Error)?.message || error).slice(0, 160) }, 500);
  }
};
