import type { APIRoute } from 'astro';
import { json, preflight } from '../../../lib/chat';

export const OPTIONS: APIRoute = async () => preflight();

// Everything the owner's reply page needs, addressed by magic-link token.
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const key = String(url.searchParams.get('token') ?? '').trim();
    if (!key) return json({ error: 'Missing token' }, 400);

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const thread = await db
      .prepare(
        `SELECT id, slug, visitor_name, visitor_contact, created_at
           FROM chat_threads WHERE token = ?`
      )
      .bind(key)
      .first();
    if (!thread) return json({ error: 'That link is not valid' }, 404);

    const { results } = await db
      .prepare(
        `SELECT id, sender, body, created_at FROM chat_messages
          WHERE thread_id = ? ORDER BY id`
      )
      .bind(thread.id)
      .all();

    return json({ thread, messages: results ?? [] });
  } catch (error) {
    console.error('Chat thread error:', error);
    return json({ error: 'Could not load that conversation' }, 500);
  }
};

export const prerender = false;
