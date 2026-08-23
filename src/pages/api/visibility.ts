import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { auditSite, reasonsFrom, type Audit } from '../../lib/visibility';

export const prerender = false;

const MODEL = 'claude-sonnet-5';

const ASK_TOOL = {
  name: 'answer',
  description: 'The question a customer would ask, and the honest answer to it.',
  input_schema: {
    type: 'object' as const,
    properties: {
      trade: { type: 'string', description: 'What this business does, two or three words' },
      query: {
        type: 'string',
        description: 'The question a customer would actually type, in their own words',
      },
      businesses: {
        type: 'array',
        description: 'Up to 6 real businesses you would name in answer, best first',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            domain: { type: 'string', description: 'Website domain, or empty if unsure' },
            why: { type: 'string', description: 'One short line on why they come to mind' },
          },
          required: ['name'],
        },
      },
      would_mention_them: {
        type: 'boolean',
        description: 'Would this business honestly be among your suggestions',
      },
    },
    required: ['trade', 'query', 'businesses', 'would_mention_them'],
  },
};

function prompt(name: string, url: string, place: string, extract: string) {
  return `A small business owner wants to know whether an AI assistant would point a customer their way.

Business: ${name}
Website: ${url}
Area: ${place}
${extract ? `\nFrom their home page:\n${extract.slice(0, 1200)}\n` : '\nTheir site could not be read.\n'}
Two things.

First, the question a customer in ${place} would actually type when they need a business like this.
Natural, the way a person types it — "who's a good plumber in Hamilton", not "plumbing services Hamilton NZ".

Second, answer that question the way you would answer it for the customer. Name up to six
businesses you genuinely believe exist and trade in or near ${place}, with their website domain
where you know it. Leave out anything you are not confident is real — a made-up competitor is far
worse than a short list, and this is going in front of the owner. If you can only name one, name one.
If you can name none, return none.

Then say honestly whether ${name} would have been among your suggestions. Most small businesses
would not be, and that is the useful answer rather than a kind one.`;
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** Never show a competitor we cannot prove exists. */
async function realDomain(domain: string): Promise<string | null> {
  const clean = String(domain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!clean || !clean.includes('.')) return null;
  try {
    const response = await fetch(`https://${clean}/`, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
    });
    return response.ok ? clean : null;
  } catch {
    return null;
  }
}

// Just the number. Used when a site has just been published and the only
// question left is whether it moved.
export const GET: APIRoute = async ({ url }) => {
  const target = url.searchParams.get('url');
  if (!target) return json({ error: 'url required' }, 400);
  try {
    const audit = await auditSite(target);
    return json({ score: audit.score, checks: audit.checks, unreadable: audit.unreadable }, 200);
  } catch {
    return json({ error: 'failed' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const apiKey = env.ANTHROPIC_API_KEY;
    const body = await request.json();
    const name = String(body.name || '').trim().slice(0, 60);
    const rawUrl = String(body.url || '').trim().slice(0, 200);
    if (!name || !rawUrl) {
      return json({ error: 'name and url are required' }, 400);
    }

    // Cloudflare knows roughly where they are, so nobody has to type it.
    const cf = (request as any).cf || {};
    const place =
      String(body.location || '').trim() ||
      [cf.city, cf.country === 'NZ' ? 'New Zealand' : cf.country].filter(Boolean).join(', ') ||
      'New Zealand';

    // Their own site first — it feeds the question and it is half the answer.
    const theirs = await auditSite(rawUrl);
    let extract = '';
    if (!theirs.unreadable) {
      try {
        const page = await fetch(theirs.url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
        const html = await page.text();
        extract = html
          .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch {
        /* the audit already knows */
      }
    }

    if (!apiKey) return json({ error: 'no-key' }, 503);

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      tools: [ASK_TOOL as any],
      tool_choice: { type: 'tool', name: 'answer' },
      messages: [{ role: 'user', content: prompt(name, rawUrl, place, extract) }],
    });

    const call = (response.content as any[]).find((b) => b.type === 'tool_use');
    const said = call?.input || {};

    // Verify every name before it goes in front of them, then score the ones
    // that stand up. A league table is only frightening if it is true.
    const named = (said.businesses || []).slice(0, 6);
    const checked = await Promise.all(
      named.map(async (b: any) => {
        const domain = await realDomain(b.domain || '');
        if (!domain) return null;
        if (domain.replace(/^www\./, '') === theirs.domain) return null;
        const audit = await auditSite(domain);
        if (audit.unreadable) return null;
        return { name: String(b.name || domain).slice(0, 60), domain, score: audit.score, why: String(b.why || '').slice(0, 90) };
      })
    );

    const rivals = (checked.filter(Boolean) as any[])
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const result = {
      askedAt: new Date().toISOString(),
      model: MODEL,
      place,
      trade: String(said.trade || '').slice(0, 40),
      query: String(said.query || '').slice(0, 140),
      mentioned: !!said.would_mention_them,
      rivals,
      you: { name, domain: theirs.domain, score: theirs.score, unreadable: theirs.unreadable },
      checks: theirs.checks,
      reasons: reasonsFrom(theirs),
      beatenBy: rivals.filter((r) => r.score > theirs.score).length,
    };

    // Keep the lead. This is the whole point of running it.
    try {
      const db = env.DB;
      if (db) {
        await db
          .prepare(
            `INSERT INTO leads (id, created_at, domain, url, score, score_meta, score_robots,
               score_llms_txt, score_llm_ld, score_schema, score_structure, score_https,
               score_speed, ab_variant, converted, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'visibility', 0, ?)`
          )
          .bind(
            crypto.randomUUID(), result.askedAt, theirs.domain, theirs.url, theirs.score,
            theirs.checks.meta.score, theirs.checks.robots.score, theirs.checks.llms_txt.score,
            theirs.checks.llm_ld.score, theirs.checks.schema.score, theirs.checks.structure.score,
            theirs.checks.https.score, theirs.checks.speed.score,
            `${name} · ${place} · ${result.query}`
          )
          .run();
      }
    } catch (dbError) {
      console.error('lead insert failed', dbError);
    }

    return json(result, 200);
  } catch (error) {
    console.error('visibility failed', error);
    return json({ error: 'failed', detail: error instanceof Error ? error.message : 'unknown' }, 500);
  }
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
