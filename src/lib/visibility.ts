// How visible a business is to an AI that gets asked about it.
//
// The score is deliberately plain: eight things we can check ourselves, weighted
// by how much they actually matter when a model is trying to work out what a
// business is and who it serves. Every one of them is a fact about their site we
// can point at, not an opinion.

export interface Check {
  score: number;
  found: boolean;
  details?: string;
}

export interface AuditChecks {
  meta: Check;
  robots: Check;
  llms_txt: Check;
  llm_ld: Check;
  schema: Check;
  structure: Check;
  https: Check;
  speed: Check;
}

export interface Audit {
  url: string;
  domain: string;
  score: number;
  checks: AuditChecks;
  /** We never actually read the page — the score means nothing */
  unreadable: boolean;
}

export const WEIGHTS = {
  meta: 20,
  robots: 10,
  llms_txt: 20,
  llm_ld: 15,
  schema: 15,
  structure: 10,
  https: 5,
  speed: 5,
};

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function grab(url: string, ms: number): Promise<{ ok: boolean; body: string; type: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    const response = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'en-NZ,en;q=0.9' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const body = await response.text();
    return {
      ok: response.ok,
      body,
      type: (response.headers.get('content-type') || '').toLowerCase(),
    };
  } catch {
    return { ok: false, body: '', type: '' };
  }
}

// A 200 is not proof the file exists. WordPress hands back its own page for
// anything missing, and a bot challenge answers every path with a challenge —
// so a site with no llms.txt scores full marks on the check that matters most.
// A text file that opens with a doctype is not a text file.
function reallyThere(r: { ok: boolean; body: string; type: string }, kind: 'text' | 'json'): boolean {
  if (!r.ok) return false;
  const head = r.body.slice(0, 400).trim().toLowerCase();
  if (!head) return false;
  if (r.type.includes('text/html') || head.startsWith('<!doctype') || head.startsWith('<html')) {
    return false;
  }
  if (kind === 'json') {
    try {
      JSON.parse(r.body);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

function metaCheck(html: string): Check {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const text = (m?.[1] || '').trim();
  if (!text) return { score: 0, found: false };
  if (text.length < 50) return { score: 50, found: true, details: `${text.length} characters` };
  return { score: 100, found: true, details: `${text.length} characters` };
}

function schemaCheck(html: string): Check {
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  if (!blocks.length) return { score: 0, found: false };
  const types: string[] = [];
  for (const block of blocks) {
    const body = block.replace(/<[^>]+>/g, '');
    try {
      const parsed = JSON.parse(body);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of list) if (entry && entry['@type']) types.push(String(entry['@type']));
    } catch {
      /* a broken block is no block */
    }
  }
  if (!types.length) return { score: 0, found: false, details: 'present but unreadable' };
  const local = types.some((t) => /LocalBusiness|Organization|Store|Service/i.test(t));
  return { score: local ? 100 : 50, found: true, details: types.slice(0, 3).join(', ') };
}

function structureCheck(html: string): Check {
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  const h2 = (html.match(/<h2[\s>]/gi) || []).length;
  const lists = (html.match(/<(ul|ol)[\s>]/gi) || []).length;
  const hits = [h1 > 0, h2 > 0, lists > 0].filter(Boolean).length;
  return {
    score: hits === 3 ? 100 : hits === 2 ? 65 : hits === 1 ? 30 : 0,
    found: hits > 0,
    details: `H1 ${h1 ? '✓' : '✗'} · H2 ${h2 ? '✓' : '✗'} · lists ${lists ? '✓' : '✗'}`,
  };
}

function robotsCheck(r: { ok: boolean; body: string; type: string }): Check {
  if (!reallyThere(r, 'text')) return { score: 0, found: false, details: 'no robots.txt' };
  const body = r.body.toLowerCase();
  // Turning away the AI crawlers is the one thing here that actively hurts.
  const blocked = /user-agent:\s*(gptbot|claudebot|perplexitybot|google-extended)[\s\S]{0,120}?disallow:\s*\//i.test(
    r.body
  );
  if (blocked) return { score: 0, found: true, details: 'AI crawlers are blocked' };
  const sitemap = body.includes('sitemap:');
  return { score: sitemap ? 100 : 70, found: true, details: sitemap ? 'with a sitemap' : 'no sitemap listed' };
}

export async function auditSite(rawUrl: string): Promise<Audit> {
  const target = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  const base = `${target.protocol}//${target.host}`;

  const started = Date.now();
  const [home, robots, llms, llmLd] = await Promise.all([
    grab(`${base}/`, 10000),
    grab(`${base}/robots.txt`, 5000),
    grab(`${base}/llms.txt`, 5000),
    grab(`${base}/.well-known/llm-index.json`, 5000),
  ]);
  const ms = Date.now() - started;

  const html = home.ok ? home.body : '';
  // A page too small to hold a business is a refusal or a shell, and scoring it
  // produces a confident number about something we never saw.
  const unreadable = !home.ok || html.trim().length < 500;

  const checks: AuditChecks = {
    meta: metaCheck(html),
    robots: robotsCheck(robots),
    llms_txt: reallyThere(llms, 'text')
      ? { score: 100, found: true, details: `${llms.body.trim().length} characters` }
      : { score: 0, found: false, details: 'not there' },
    llm_ld: reallyThere(llmLd, 'json')
      ? { score: 100, found: true }
      : { score: 0, found: false, details: 'not there' },
    schema: schemaCheck(html),
    structure: structureCheck(html),
    https: { score: target.protocol === 'https:' ? 100 : 0, found: target.protocol === 'https:' },
    speed: {
      score: ms < 1000 ? 100 : ms < 3000 ? 50 : 0,
      found: ms < 3000,
      details: `${ms}ms`,
    },
  };

  const score = Object.entries(checks).reduce(
    (sum, [key, check]) => sum + (check.score / 100) * WEIGHTS[key as keyof typeof WEIGHTS],
    0
  );

  return {
    url: target.href,
    domain: target.hostname.replace(/^www\./, ''),
    score: unreadable ? 0 : Math.round(score),
    checks,
    unreadable,
  };
}

// What each shortfall costs them, said the way you would say it to the owner
// rather than the way an SEO tool would.
const PLAIN: Record<keyof AuditChecks, { title: string; detail: string }> = {
  meta: {
    title: 'Nothing for AI to quote',
    detail:
      'Your home page has no short description of the business, so when AI wants a sentence about you it has to make one up or skip you.',
  },
  llms_txt: {
    title: 'No note to the AI',
    detail:
      'There is a standard file that tells AI what you do, where you work and who to send. Yours has not got one, so AI is left guessing from the layout.',
  },
  llm_ld: {
    title: 'Your details are not machine readable',
    detail:
      'Your hours, phone number and service area are on the page for people, but not in the form AI reads. It cannot repeat what it cannot parse.',
  },
  schema: {
    title: 'AI cannot tell what kind of business you are',
    detail:
      'Nothing on the site states you are a local business, what trade, or which towns you cover — so you do not come up as an answer to a local question.',
  },
  structure: {
    title: 'The page has no shape',
    detail:
      'No headings and no lists means AI reads one long run of text and struggles to pull out your services.',
  },
  robots: {
    title: 'AI is being turned away at the door',
    detail: 'Your site is telling the AI crawlers not to read it, so nothing else here can help.',
  },
  https: {
    title: 'The site is not secure',
    detail: 'Without HTTPS both browsers and AI treat the site as untrustworthy.',
  },
  speed: {
    title: 'The site is slow to answer',
    detail: 'Crawlers give up on slow pages, so some of your content may never be read at all.',
  },
};

export function reasonsFrom(audit: Audit, limit = 4) {
  return (Object.keys(audit.checks) as (keyof AuditChecks)[])
    .filter((key) => audit.checks[key].score < 100)
    .sort(
      (a, b) =>
        (100 - audit.checks[b].score) * WEIGHTS[b] - (100 - audit.checks[a].score) * WEIGHTS[a]
    )
    .slice(0, limit)
    .map((key) => ({
      key,
      title: PLAIN[key].title,
      detail: PLAIN[key].detail,
      cost: Math.round(((100 - audit.checks[key].score) / 100) * WEIGHTS[key]),
    }));
}
