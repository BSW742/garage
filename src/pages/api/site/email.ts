import type { APIRoute } from 'astro';
import { json, preflight, cleanSlug } from '../../../lib/chat';

export const OPTIONS: APIRoute = async () => preflight();

// Set the address a site's owner sends from. Without it, the email-in feature
// has nothing to check against and refuses everything.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { slug: rawSlug, key, email } = await request.json();
    const slug = cleanSlug(rawSlug);
    const owner = String(key ?? '').trim();
    if (!slug || !owner) return json({ error: 'Missing site or key' }, 400);

    const address = String(email ?? '').trim().toLowerCase();
    if (address && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      return json({ error: 'That is not an email address' }, 400);
    }

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const site = await db
      .prepare('SELECT slug FROM site_claims WHERE slug = ? AND edit_token = ?')
      .bind(slug, owner)
      .first();
    if (!site) return json({ error: 'Not your site' }, 403);

    await db
      .prepare('UPDATE site_claims SET email = ?, updated_at = ? WHERE slug = ?')
      .bind(address, new Date().toISOString(), slug)
      .run();

    return json({ ok: true, email: address });
  } catch (error) {
    console.error('Set owner email error:', error);
    return json({ error: 'Could not save that address' }, 500);
  }
};

export const prerender = false;
