import type { APIRoute } from 'astro';

export const prerender = false;

// A chain that never reaches its target would otherwise stay sealed forever,
// so whoever started it can open it early. Guarded by the site's edit token,
// which only they have.
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const payload = await request.json().catch(() => null);
    const slug = String(payload?.slug || '').trim().toLowerCase();
    const key = String(payload?.key || '').trim();
    if (!/^[a-z0-9-]{1,63}$/.test(slug) || !key) return json({ error: 'Bad request' }, 400);

    const row = await db
      .prepare('SELECT edit_token, unlocked_at FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such page' }, 404);
    if (!row.edit_token || String(row.edit_token) !== key) {
      return json({ error: 'Not your page' }, 403);
    }
    if (row.unlocked_at) return json({ ok: true, already: true });

    await db
      .prepare('UPDATE site_claims SET unlocked_at = ? WHERE slug = ?')
      .bind(new Date().toISOString(), slug)
      .run();

    return json({ ok: true });
  } catch (error) {
    console.error('Chain unlock failed:', error);
    return json({ error: 'Could not open it, sorry' }, 500);
  }
};
