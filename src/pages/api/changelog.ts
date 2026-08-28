import type { APIRoute } from 'astro';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** What has shipped. Public — it is the point of the page. */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ entries: [] });
    const { results } = await db
      .prepare('SELECT id, title, body, created_at FROM changelog ORDER BY created_at DESC LIMIT 40')
      .all();
    return json({ entries: results || [] });
  } catch {
    return json({ entries: [] });
  }
};

/**
 * Add one. Guarded by garage.co.nz's own edit token, which the admin page
 * holds — the same key that already lets it read the inbox.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const key = String(body?.key || '').trim();
    const title = String(body?.title || '').trim().slice(0, 120);
    const note = String(body?.body || '').trim().slice(0, 600);
    if (!title) return json({ error: 'Needs a title' }, 400);

    const site = await db
      .prepare("SELECT slug FROM site_claims WHERE slug = 'garage' AND edit_token = ?")
      .bind(key)
      .first();
    if (!site) return json({ error: 'Not allowed' }, 403);

    await db
      .prepare('INSERT INTO changelog (title, body, created_at) VALUES (?, ?, ?)')
      .bind(title, note || null, new Date().toISOString())
      .run();

    return json({ ok: true });
  } catch (error) {
    console.error('Changelog failed:', error);
    return json({ error: 'Could not save that' }, 500);
  }
};

/** Remove one, same guard. */
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    const body = (await request.json().catch(() => null)) as any;
    const key = String(body?.key || '').trim();
    const id = Number(body?.id || 0);
    if (!db || !id) return json({ error: 'Bad request' }, 400);

    const site = await db
      .prepare("SELECT slug FROM site_claims WHERE slug = 'garage' AND edit_token = ?")
      .bind(key)
      .first();
    if (!site) return json({ error: 'Not allowed' }, 403);

    await db.prepare('DELETE FROM changelog WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch {
    return json({ error: 'Could not delete that' }, 500);
  }
};
