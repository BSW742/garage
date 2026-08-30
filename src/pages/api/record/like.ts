import type { APIRoute } from 'astro';

/**
 * A thumbs up.
 *
 * The lowest-friction yes there is: no typing, no reply, no email client. It
 * is not as strong a signal as somebody writing back, but it is a signal a
 * busy café owner will actually give, and it is the difference between knowing
 * they liked it and guessing from silence.
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ ok: false }, 503);
    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').toLowerCase().trim();
    if (!/^[a-z0-9-]{2,63}$/.test(slug)) return json({ ok: false }, 400);
    if (body?.mine) return json({ ok: true, counted: false });

    // COALESCE, so a second click cannot move the date the first one happened.
    await db
      .prepare("UPDATE recordings SET liked_at = COALESCE(liked_at, datetime('now')) WHERE slug = ? AND status = 'live'")
      .bind(slug)
      .run();
    return json({ ok: true, counted: true });
  } catch {
    return json({ ok: false }, 500);
  }
};
