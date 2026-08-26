import type { APIRoute } from 'astro';

export const prerender = false;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

/** The family's own edit token is the only key. Same idea as the chat inbox. */
async function authorised(db: any, slug: string, key: string) {
  if (!/^[a-z0-9-]{1,63}$/.test(slug) || !key) return false;
  const row = await db.prepare('SELECT edit_token FROM site_claims WHERE slug = ?').bind(slug).first();
  return !!row?.edit_token && String(row.edit_token) === key;
}

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals.runtime?.env as any)?.DB;
  if (!db) return json({ error: 'not-configured' }, 503);
  const slug = String(url.searchParams.get('slug') || '').toLowerCase();
  const key = String(url.searchParams.get('key') || '');
  if (!(await authorised(db, slug, key))) return json({ error: 'no' }, 403);

  // ?all=1 includes the taken-down ones, so the family can put one back.
  const all = url.searchParams.get('all') === '1';
  const { results } = await db
    .prepare(
      all
        ? `SELECT id, url, caption, who, status, created_at FROM tribute_photos
             WHERE slug = ? ORDER BY created_at DESC LIMIT 400`
        : `SELECT id, url, caption, who, status, created_at FROM tribute_photos
             WHERE slug = ? AND status != 'hidden' ORDER BY created_at DESC LIMIT 400`
    )
    .bind(slug)
    .all();
  return json({ ok: true, photos: results || [] });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals.runtime?.env as any)?.DB;
  if (!db) return json({ error: 'not-configured' }, 503);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'bad' }, 400);

  const slug = String(body.slug || '').toLowerCase();
  if (!(await authorised(db, slug, String(body.key || '')))) return json({ error: 'no' }, 403);

  const action = String(body.action || '');
  if (action !== 'approved' && action !== 'hidden') return json({ error: 'bad action' }, 400);

  // Scoped by slug as well as id, so one family's key cannot touch another's.
  await db
    .prepare('UPDATE tribute_photos SET status = ?, reviewed_at = ? WHERE id = ? AND slug = ?')
    .bind(action, new Date().toISOString(), String(body.id || ''), slug)
    .run();
  return json({ ok: true });
};
