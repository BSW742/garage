import type { APIRoute } from 'astro';

/**
 * They pressed play.
 *
 * This is the number the whole outreach idea turns on: not whether the email
 * opened — open tracking is a blocked pixel half the time — but whether a
 * person actually watched. `furthest` keeps the deepest second reached, so the
 * point where people stop watching is answerable later, and that is the thing
 * that improves the next video.
 *
 * Ben's own views are not counted. The recorder sets a flag in his browser,
 * and a play carrying it is ignored, so the count means them and not him.
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
    const raw = Math.round(Number(body?.at) || 0);
    const opened = raw === -1;                   // opened the film; not yet a play
    const grew = raw === -2;                     // opened the growth sheet
    const at = Math.max(0, Math.min(3600, raw));
    const mine = !!body?.mine;
    if (!/^[a-z0-9-]{2,63}$/.test(slug)) return json({ ok: false }, 400);
    if (mine) return json({ ok: true, counted: false });

    if (grew) {
      await db.prepare(
        "UPDATE recordings SET grew = grew + 1 WHERE slug = ? AND status = 'live'"
      ).bind(slug).run();
      return json({ ok: true, counted: true, grew: true });
    }

    if (opened) {
      await db.prepare(
        "UPDATE recordings SET opened = opened + 1 WHERE slug = ? AND status = 'live'"
      ).bind(slug).run();
      return json({ ok: true, counted: true, opened: true });
    }

    // First play stamps the site too, so /admin/sites can show it at a glance.
    await db.prepare(
      `UPDATE recordings
          SET plays = plays + CASE WHEN ? = 0 THEN 1 ELSE 0 END,
              first_play = COALESCE(first_play, datetime('now')),
              last_play = datetime('now'),
              furthest = MAX(furthest, ?)
        WHERE slug = ? AND status = 'live'`
    ).bind(at, at, slug).run();

    if (at === 0) {
      await db.prepare(
        `UPDATE site_claims
            SET owner_seen_at = COALESCE(owner_seen_at, datetime('now')),
                owner_seen_last = datetime('now'),
                owner_seen_count = COALESCE(owner_seen_count, 0) + 1
          WHERE slug = ?`
      ).bind(slug).run();
    }
    return json({ ok: true, counted: true });
  } catch {
    return json({ ok: false }, 500);
  }
};
