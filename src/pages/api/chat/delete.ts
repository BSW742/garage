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

/**
 * An owner clearing a conversation out of their inbox.
 *
 * Marked rather than removed. Somebody tapping a bin on a phone is one
 * mis-tap away from losing a customer's phone number, and a row nobody can
 * see costs nothing to keep — so the thread and its messages stay in the
 * table and simply stop being listed.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').trim().toLowerCase();
    const key = String(body?.key || '').trim();
    const threadId = String(body?.threadId || '').trim();
    if (!/^[a-z0-9-]{1,63}$/.test(slug) || !key || !threadId) {
      return json({ error: 'Bad request' }, 400);
    }

    const site = await db
      .prepare('SELECT slug FROM site_claims WHERE slug = ? AND edit_token = ?')
      .bind(slug, key)
      .first();
    if (!site) return json({ error: 'Not your page' }, 403);

    // The slug is in the WHERE as well as the id, so a token for one site can
    // never reach another site's threads.
    const done = await db
      .prepare("UPDATE chat_threads SET status = 'deleted' WHERE id = ? AND slug = ?")
      .bind(threadId, slug)
      .run();

    if (!(done as any)?.meta?.changes) return json({ error: 'No such conversation' }, 404);
    return json({ ok: true });
  } catch (error) {
    console.error('Chat delete failed:', error);
    return json({ error: 'Could not delete that, sorry' }, 500);
  }
};
