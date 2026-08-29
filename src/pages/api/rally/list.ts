import type { APIRoute } from 'astro';

export const prerender = false;

// The sign-up list, including emails. Guarded by the site's edit token, which
// only the owner has. Nothing here is ever rendered into a public page.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const payload = await request.json().catch(() => null);
    const slug = String(payload?.slug || '').trim().toLowerCase();
    const path = String(payload?.path || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    const key = String(payload?.key || '').trim();
    if (!/^[a-z0-9-]{1,63}$/.test(slug) || !key) return json({ error: 'Bad request' }, 400);

    const row = await db
      .prepare('SELECT edit_token, config FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such page' }, 404);
    if (!row.edit_token || String(row.edit_token) !== key) {
      return json({ error: 'Not your page' }, 403);
    }

    const rowsFor = async (at: string) => {
      const { results } = await db
        .prepare(
          `SELECT name, email, created_at FROM rally_signups
            WHERE slug = ? AND path = ? AND status = 'live' ORDER BY created_at ASC LIMIT 2000`
        )
        .bind(slug, at)
        .all();
      return results || [];
    };

    // One campaign when the page asks for itself; all of them when the owner's
    // dashboard asks, so they never have to know a path to find their list.
    if (path) return json({ ok: true, rows: await rowsFor(path) });

    let config: any = {};
    try { config = JSON.parse(String(row.config) || '{}'); } catch {}
    const campaigns = [];
    for (const c of config.campaigns || []) {
      const at = String(c?.path || '').toLowerCase().replace(/^\/+|\/+$/g, '');
      if (!at) continue;
      campaigns.push({
        path: at,
        title: String(c?.title || at),
        target: Math.max(1, Math.min(500, Math.round(Number(c?.target)) || 10)),
        rows: await rowsFor(at),
      });
    }
    return json({ ok: true, campaigns });
  } catch (error) {
    console.error('Event list failed:', error);
    return json({ error: 'Could not read the list' }, 500);
  }
};
