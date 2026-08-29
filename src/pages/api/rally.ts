import type { APIRoute } from 'astro';

export const prerender = false;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

const PER_HOUR = 20;

/**
 * Where an event is up to. The widget needs the count on every page without
 * signing anybody up for it, so this is the read half of the same thing.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);
    const slug = String(url.searchParams.get('slug') || '').toLowerCase();
    const path = String(url.searchParams.get('path') || '').toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(slug) || !/^[a-z0-9-]{1,40}$/.test(path)) {
      return json({ error: 'Bad address' }, 400);
    }
    const row = await db
      .prepare("SELECT config FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug).first();
    if (!row) return json({ error: 'No such page' }, 404);
    // Campaigns live in an array — a site can run more than one — so this
    // looks the same way the sign-up half does rather than guessing.
    let target = 0;
    try {
      const found = (JSON.parse(String(row.config) || '{}')?.campaigns || []).find(
        (c: any) => String(c?.path || '').toLowerCase() === path
      );
      target = Number(found?.target) || 0;
    } catch { /* no campaign */ }
    if (!target) return json({ error: 'No such page' }, 404);

    const tally = await db
      .prepare('SELECT COUNT(*) AS n FROM rally_signups WHERE slug = ? AND path = ?')
      .bind(slug, path).first();
    const count = Number(tally?.n || 0);

    // Hearts are interest, not commitment, and are counted apart from the
    // target on purpose: an owner who turns up to an empty room because a
    // tap was allowed to tip it over would never use this again.
    const loved = await db
      .prepare('SELECT COUNT(*) AS n FROM event_hearts WHERE slug = ? AND path = ?')
      .bind(slug, path).first();

    // First names only. They are already public on the campaign page and they
    // are what makes a row of initials mean anything.
    const recent = await db
      .prepare(
        `SELECT name FROM rally_signups WHERE slug = ? AND path = ?
          ORDER BY created_at DESC LIMIT 3`
      )
      .bind(slug, path).all();

    return json({
      ok: true, count, target, togo: Math.max(0, target - count), on: count >= target,
      hearts: Number(loved?.n || 0),
      names: (recent?.results || []).map((r: any) => String(r.name || '').trim()).filter(Boolean),
    });
  } catch (error) {
    console.error('Event read failed:', error);
    return json({ error: 'Could not read that' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const payload = await request.json().catch(() => null);
    if (!payload) return json({ error: 'Bad request' }, 400);

    const slug = String(payload.slug || '').trim().toLowerCase();
    const path = String(payload.path || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    if (!/^[a-z0-9-]{1,63}$/.test(slug)) return json({ error: 'Bad address' }, 400);
    if (!/^[a-z0-9-]{1,40}$/.test(path)) return json({ error: 'Bad address' }, 400);

    const row = await db
      .prepare("SELECT config FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such page' }, 404);

    let config: any = {};
    try { config = JSON.parse(String(row.config) || '{}'); } catch {}
    const campaign = (config.campaigns || []).find(
      (c: any) => String(c?.path || '').toLowerCase().replace(/^\/+|\/+$/g, '') === path
    );
    if (!campaign) return json({ error: 'No such page' }, 404);

    const name = String(payload.name || '').trim().slice(0, 40);
    const email = String(payload.email || '').trim().toLowerCase().slice(0, 120);
    if (!name) return json({ error: 'Put your name in' }, 400);
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) return json({ error: 'That email looks wrong' }, 400);

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const since = new Date(Date.now() - 3600_000).toISOString();
    const recent = await db
      .prepare('SELECT COUNT(*) AS n FROM rally_signups WHERE sender_ip = ? AND created_at > ?')
      .bind(ip, since)
      .first();
    if (Number(recent?.n || 0) >= PER_HOUR) {
      return json({ error: 'That is a lot at once — try again shortly.' }, 429);
    }

    // Signing up twice is a person checking it worked, not a second hand up.
    // The unique index makes that a no-op rather than an error.
    await db
      .prepare(
        `INSERT INTO rally_signups (id, slug, path, name, email, status, sender_ip, created_at)
         VALUES (?, ?, ?, ?, ?, 'live', ?, ?)
         ON CONFLICT(slug, path, email) DO UPDATE SET name = excluded.name, status = 'live'`
      )
      .bind(crypto.randomUUID(), slug, path, name, email, ip, new Date().toISOString())
      .run();

    const tally = await db
      .prepare("SELECT COUNT(*) AS n FROM rally_signups WHERE slug = ? AND path = ? AND status = 'live'")
      .bind(slug, path)
      .first();
    const count = Number(tally?.n || 0);
    const asked = Math.round(Number(campaign.target));
    const target = Math.max(1, Math.min(500, Number.isFinite(asked) && asked >= 1 ? asked : 10));

    return json({ ok: true, count, target, togo: Math.max(0, target - count), on: count >= target });
  } catch (error) {
    console.error('Event signup failed:', error);
    return json({ error: 'Could not add you, sorry' }, 500);
  }
};
