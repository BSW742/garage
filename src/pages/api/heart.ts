import type { APIRoute } from 'astro';

/**
 * A tap that means "I like the look of this".
 *
 * Deliberately not a sign-up: no name, no email, nothing to fill in. It is the
 * cheapest thing somebody can do, which is the point — the count moves early,
 * and a number that is already moving is what makes the next person bother.
 *
 * It never counts towards the target. That number has to stay honest or the
 * owner turns up to an empty room.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').toLowerCase();
    const path = String(body?.path || '').toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(slug) || !/^[a-z0-9-]{1,40}$/.test(path)) {
      return json({ error: 'Bad address' }, 400);
    }

    const site = await db
      .prepare("SELECT config FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug).first();
    if (!site) return json({ error: 'No such page' }, 404);
    let real = false;
    try {
      real = (JSON.parse(String(site.config) || '{}')?.campaigns || [])
        .some((c: any) => String(c?.path || '').toLowerCase() === path);
    } catch { /* no */ }
    if (!real) return json({ error: 'No such page' }, 404);

    // One per address. Imperfect on a shared network and that is fine — this
    // is a vanity count, not a vote, and the honest number lives elsewhere.
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const had = await db
      .prepare('SELECT id FROM event_hearts WHERE slug = ? AND path = ? AND ip = ?')
      .bind(slug, path, ip).first();

    if (had) {
      await db.prepare('DELETE FROM event_hearts WHERE id = ?').bind(had.id).run();
    } else {
      await db
        .prepare('INSERT INTO event_hearts (id, slug, path, ip, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), slug, path, ip, new Date().toISOString())
        .run();
    }

    const tally = await db
      .prepare('SELECT COUNT(*) AS n FROM event_hearts WHERE slug = ? AND path = ?')
      .bind(slug, path).first();
    return json({ ok: true, hearts: Number(tally?.n || 0), mine: !had });
  } catch (error) {
    console.error('Heart failed:', error);
    return json({ error: 'Could not do that' }, 500);
  }
};

export const prerender = false;
