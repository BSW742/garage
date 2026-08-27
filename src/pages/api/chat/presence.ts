import type { APIRoute } from 'astro';
import { json, preflight } from '../../../lib/chat';

export const prerender = false;

export const OPTIONS: APIRoute = async () => preflight();

// Fresh enough to mean somebody is sitting there. The inbox stamps every 30s,
// so this tolerates one missed beat and no more.
export const ONLINE_WINDOW_MS = 90_000;

/**
 * The owner's inbox saying "I am here". Guarded by the site's edit token, so
 * nobody else can claim somebody is available.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').trim().toLowerCase();
    const key = String(body?.key || '').trim();
    const on = body?.on !== false;
    if (!/^[a-z0-9-]{1,63}$/.test(slug) || !key) return json({ error: 'Bad request' }, 400);

    const done = await db
      .prepare('UPDATE site_claims SET chat_online_at = ? WHERE slug = ? AND edit_token = ?')
      .bind(on ? new Date().toISOString() : null, slug, key)
      .run();
    if (!(done as any)?.meta?.changes) return json({ error: 'Not your page' }, 403);

    return json({ ok: true, online: on });
  } catch (error) {
    console.error('Presence failed:', error);
    return json({ error: 'Could not do that' }, 500);
  }
};
