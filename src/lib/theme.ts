// THEME — a site wearing the business's own design language.
//
// The scrape has always taken a business's assets — logo, photos, words — and
// dressed them in our clothes. This takes their clothes too. Stage one of the
// path: fonts, palette and button shape, read off the real site once at scrape
// time, stored on the config, worn by whatever template renders it.
//
// The read happens in two parts, priced where the leverage is. The evidence is
// gathered mechanically and free: font-family declarations, @font-face names,
// colour frequencies and corner radii, regexed out of the page and its own
// stylesheets. Then one model call — once per site, ever — turns evidence into
// a theme: which of our free fonts stands in for their licensed one is a
// judgement, and it is the single biggest lever in whether the page reads as
// theirs. Everything downstream is deterministic CSS.
//
// A theme that cannot be read confidently is no theme at all: the model is
// told to return nothing rather than guess, because our templates in their own
// clothes beat our templates in the wrong ones.

export interface Theme {
  display?: string;       // Google family for headings, e.g. "Fraunces"
  body?: string;          // Google family for running text, e.g. "Figtree"
  transform?: 'none' | 'uppercase';  // how their headings are cased
  radius?: string;        // the corner language: "999px" pills, "0px" square, "12px" soft
  palette?: {
    primary?: string;     // buttons and accents
    deep?: string;
    page?: string;        // the ground behind everything
    card?: string;        // panels and cards
    ink?: string;
  };
  from?: string;          // the url this was read off
}

// The free fonts a licensed one may be mapped onto. A closed list, because an
// open one invites the model to invent families Google does not serve — and
// sixteen well-chosen families cover the personalities small-business sites
// actually have.
export const STAND_INS: Record<string, string> = {
  // family: the axis/weight query fragment it needs
  'Fraunces': ':opsz,wght@9..144,600;9..144,700',
  'Playfair Display': ':wght@600;700',
  'DM Serif Display': '',
  'Libre Baskerville': ':wght@400;700',
  'Arvo': ':wght@400;700',
  'Archivo Black': '',
  'Anton': '',
  'Baloo 2': ':wght@600;700',
  'Fredoka': ':wght@500;600',
  'Poppins': ':wght@400;600;700',
  'Montserrat': ':wght@400;600;700',
  'Figtree': ':wght@400;600;700',
  'Inter': ':wght@400;600;700',
  'Work Sans': ':wght@400;600;700',
  'Nunito Sans': ':opsz,wght@6..12,400;6..12,700',
  'Roboto Mono': ':wght@400;500',
};

const ok = (f: unknown): f is string => typeof f === 'string' && f in STAND_INS;

/** The &family= fragments the fonts link needs for this theme. */
export function themeFontQuery(theme: Theme | undefined): string {
  if (!theme) return '';
  const fams = [theme.display, theme.body].filter(ok);
  return [...new Set(fams)]
    .map((f) => `&family=${f.replace(/ /g, '+')}${STAND_INS[f]}`)
    .join('');
}

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const okHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

/**
 * The theme as CSS, emitted after everything else in the sheet so it wins on
 * cascade order. Palette travels through the variables every template already
 * reads. Fonts are the one place !important is used, deliberately: a theme's
 * typefaces are absolute, and half the templates name their own families at
 * higher specificity than any polite override could reach.
 */
export function themeCss(theme: Theme | undefined): string {
  if (!theme) return '';
  const parts: string[] = [];
  const p = theme.palette || {};

  const vars: string[] = [];
  if (okHex(p.primary)) vars.push(`--primary:${p.primary}`);
  if (okHex(p.deep)) vars.push(`--deep:${p.deep}`);
  if (okHex(p.page)) vars.push(`--page:${p.page}`, `--wash:${p.page}`);
  if (okHex(p.card)) vars.push(`--card:${p.card}`);
  if (okHex(p.ink)) vars.push(`--ink:${p.ink}`);
  if (ok(theme.display)) vars.push(`--display:'${theme.display}',Georgia,serif`);
  if (ok(theme.body)) vars.push(`--body:'${theme.body}',system-ui,sans-serif`);
  if (vars.length) parts.push(`:root{${vars.join(';')}}`);

  if (okHex(p.page)) parts.push(`body{background:${p.page}}`);
  if (ok(theme.body)) {
    parts.push(`body,p,li,a,input,textarea,button,td,span{font-family:'${theme.body}',system-ui,sans-serif!important}`);
  }
  if (ok(theme.display)) {
    parts.push(
      `h1,h2,h3,h4{font-family:'${theme.display}',Georgia,serif!important` +
        (theme.transform ? `;text-transform:${theme.transform}` : '') + `}`
    );
  }
  if (theme.radius && /^\d{1,4}px$/.test(theme.radius)) {
    // The shared button vocabulary across the templates. Best effort by
    // design: the mainstream templates are covered, the exotic ones keep
    // their own corners.
    parts.push(
      `.btn,.cta,.buy,.cf-book,.ph-book,.td-quote,.bt-book,.sn-book,.st-book{border-radius:${theme.radius}}`
    );
  }
  return parts.length ? `\n/* theme: ${theme.from || 'extracted'} */\n${parts.join('\n')}\n` : '';
}

// ── Extraction ────────────────────────────────────────────────────────

/**
 * The mechanical half: everything about how the site dresses, regexed out of
 * its HTML and its own stylesheets. Free, fast, and deliberately dumb — the
 * judgement happens in the one model call that reads this.
 */
export async function collectThemeEvidence(html: string, baseUrl: string): Promise<string> {
  let css = '';
  try {
    const hrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
      .map((m) => m[1])
      .concat([...html.matchAll(/href=["']([^"']+\.css[^"']*)["']/gi)].map((m) => m[1]));
    const seen = new Set<string>();
    for (const href of hrefs) {
      if (seen.size >= 4) break;
      let full: string;
      try { full = new URL(href, baseUrl).toString(); } catch { continue; }
      // Wherever the page keeps them. Small-business sites are mostly
      // Webflow, Wix and Squarespace, whose compiled CSS — fonts, colours
      // and all — lives on the platform CDN, not the business's own origin.
      // The only sheets not worth reading are ones that are not CSS at all.
      if (!/^https?:/.test(full)) continue;
      if (seen.has(full)) continue;
      seen.add(full);
      try {
        const res = await fetch(full, { signal: AbortSignal.timeout(6000) });
        if (res.ok) css += (await res.text()).slice(0, 90_000) + '\n';
      } catch { /* a sheet that will not come is just less evidence */ }
    }
  } catch { /* evidence is best effort from the first line to the last */ }

  const inline = [...html.matchAll(/<style[^>]*>([\s\S]{0,30000}?)<\/style>/gi)].map((m) => m[1]).join('\n');
  const all = css + '\n' + inline;

  const fonts = [...all.matchAll(/font-family\s*:\s*([^;}]{2,90})/gi)].map((m) => m[1].trim());
  const faces = [...all.matchAll(/@font-face\s*{[^}]*?font-family\s*:\s*["']?([^;"'}]+)/gi)].map((m) => m[1].trim());
  const colours = [...all.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase());
  const radii = [...all.matchAll(/border-radius\s*:\s*([^;}]{1,40})/gi)].map((m) => m[1].trim());
  const transforms = [...all.matchAll(/text-transform\s*:\s*(uppercase)/gi)].length;

  const tally = (list: string[], n: number) => {
    const c = new Map<string, number>();
    list.forEach((v) => c.set(v, (c.get(v) || 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([v, k]) => `${v} (x${k})`).join(', ');
  };

  return [
    `font-face names: ${[...new Set(faces)].slice(0, 8).join(', ') || 'none'}`,
    `font-family declarations: ${tally(fonts, 10) || 'none'}`,
    `colour frequency: ${tally(colours, 14) || 'none'}`,
    `border-radius values: ${tally(radii, 8) || 'none'}`,
    `uppercase text-transform count: ${transforms}`,
  ].join('\n');
}

/**
 * The judgement half: one call, once per site, to a model that is allowed to
 * say no. Returns a validated Theme or null.
 */
export async function askForTheme(
  apiKey: string,
  evidence: string,
  sourceUrl: string
): Promise<Theme | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content:
            `Below is design evidence scraped from ${sourceUrl} — the fonts, colours and shapes ` +
            `the business's real site uses. Distil it into a theme so our rebuild of their site ` +
            `wears their design language.\n\n${evidence}\n\n` +
            `Reply with ONLY a JSON object, no fences:\n` +
            `{"display": <heading font — the closest personality match from this list: ${Object.keys(STAND_INS).join(', ')}>,\n` +
            ` "body": <body font from the same list>,\n` +
            ` "transform": <"uppercase" if their headings are set in caps, else "none">,\n` +
            ` "radius": <their button corner language as px: "999px" for pills, "0px" for square, or the common value>,\n` +
            ` "palette": {"primary": <their accent hex>, "page": <their page background hex if it is clearly not plain white>, "card": <their panel hex if clearly used>, "ink": <their text hex if clearly not near-black>},\n` +
            ` "confidence": <"high"|"low">}\n\n` +
            `Rules: choose stand-ins by personality (chunky warm serif -> Fraunces; geometric sans -> Figtree or Poppins; ` +
            `elegant serif -> Playfair Display; brutal caps -> Archivo Black). Omit any palette field you are not sure of — ` +
            `ignore greys, near-whites and framework defaults when picking the accent. If the evidence is too thin to be ` +
            `sure of even the fonts, reply exactly null.`,
        }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const text = (data.content || []).map((b: any) => b.text || '').join('').trim();
    if (!text || text === 'null') return null;
    const raw = JSON.parse(text.replace(/^```json?|```$/g, '').trim());
    if (raw?.confidence === 'low') return null;

    const theme: Theme = { from: sourceUrl };
    if (ok(raw.display)) theme.display = raw.display;
    if (ok(raw.body)) theme.body = raw.body;
    if (!theme.display && !theme.body) return null;   // fonts are the point
    if (raw.transform === 'uppercase') theme.transform = 'uppercase';
    if (typeof raw.radius === 'string' && /^\d{1,4}px$/.test(raw.radius)) theme.radius = raw.radius;
    const p = raw.palette || {};
    const pal: Theme['palette'] = {};
    for (const k of ['primary', 'deep', 'page', 'card', 'ink'] as const) {
      if (okHex(p[k])) pal[k] = p[k].toLowerCase();
    }
    if (Object.keys(pal).length) theme.palette = pal;
    return theme;
  } catch {
    return null;
  }
}
