import type { APIRoute } from 'astro';

/**
 * "I want that one."
 *
 * The most useful thing on the whole page, because it answers a question the
 * thumbs up cannot: not whether they liked the site, but what they think their
 * business is short of. Somebody who taps the short notice list is telling you
 * they are booked out; somebody who taps spin to win is telling you they are
 * not. That is the difference between a follow-up email that guesses and one
 * that already knows.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export const prerender = false;
export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

const THINGS = new Set(['spinner', 'waitlist', 'event', 'chat', 'shop']);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ ok: false }, 503);
    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').toLowerCase().trim();
    const thing = String(body?.thing || '').toLowerCase().trim();
    if (!/^[a-z0-9-]{2,63}$/.test(slug) || !THINGS.has(thing)) return json({ ok: false }, 400);
    if (body?.mine) return json({ ok: true, counted: false });

    // Twice is not twice as interested; the first tap is the fact.
    const already = await db
      .prepare('SELECT id FROM interest WHERE slug = ? AND thing = ?')
      .bind(slug, thing)
      .first();
    if (!already) {
      await db
        .prepare('INSERT INTO interest (id, slug, thing) VALUES (?, ?, ?)')
        .bind(crypto.randomUUID(), slug, thing)
        .run();
    }
    return json({ ok: true, counted: true });
  } catch {
    return json({ ok: false }, 500);
  }
};
