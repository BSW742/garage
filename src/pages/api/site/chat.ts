import type { APIRoute } from 'astro';
import { json, preflight, cleanSlug } from '../../../lib/chat';

export const OPTIONS: APIRoute = async () => preflight();

// Turn the chat widget on or off for one site. Gated on the site's own
// edit_token, same as the inbox.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { slug: rawSlug, key, on } = await request.json();
    const slug = cleanSlug(rawSlug);
    const owner = String(key ?? '').trim();
    if (!slug || !owner) return json({ error: 'Missing site or key' }, 400);

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const row = await db
      .prepare('SELECT config FROM site_claims WHERE slug = ? AND edit_token = ?')
      .bind(slug, owner)
      .first();
    if (!row) return json({ error: 'Not your site' }, 403);

    const config = JSON.parse(row.config || '{}');
    config.chat = !!on;

    await db
      // datetime('now'), not toISOString(). The column is sorted as text and
      // mixing the two formats silently breaks the order: 'T' sorts above ' ',
      // so any ISO stamp beat every SQLite one on the same day whatever the
      // actual time. A site edited at 8am outranked one published at 6pm.
      .prepare("UPDATE site_claims SET config = ?, updated_at = datetime('now') WHERE slug = ?")
      .bind(JSON.stringify(config), slug)
      .run();

    return json({ ok: true, chat: config.chat });
  } catch (error) {
    console.error('Chat toggle error:', error);
    return json({ error: 'Could not change that setting' }, 500);
  }
};

export const prerender = false;
