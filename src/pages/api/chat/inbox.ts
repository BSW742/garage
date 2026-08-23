import type { APIRoute } from 'astro';
import { json, preflight, cleanSlug } from '../../../lib/chat';

export const OPTIONS: APIRoute = async () => preflight();

// The owner's inbox for one site. Authorised by the same edit_token that lets
// them reopen the site in the builder, so there is no second credential.
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const slug = cleanSlug(url.searchParams.get('slug'));
    const key = String(url.searchParams.get('key') ?? '').trim();
    if (!slug || !key) return json({ error: 'Missing site or key' }, 400);

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const site = await db
      .prepare('SELECT slug FROM site_claims WHERE slug = ? AND edit_token = ?')
      .bind(slug, key)
      .first();
    if (!site) return json({ error: 'Not your site' }, 403);

    const threadId = String(url.searchParams.get('threadId') ?? '').trim();

    // One conversation, in full.
    if (threadId) {
      const { results } = await db
        .prepare(
          `SELECT m.id, m.sender, m.body, m.created_at
             FROM chat_messages m
             JOIN chat_threads t ON t.id = m.thread_id
            WHERE m.thread_id = ? AND t.slug = ?
            ORDER BY m.id`
        )
        .bind(threadId, slug)
        .all();
      return json({ messages: results ?? [] });
    }

    // Every conversation for this site, newest first.
    const { results } = await db
      .prepare(
        `SELECT t.id, t.visitor_name, t.visitor_contact, t.last_message_at,
                (SELECT body FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_body,
                (SELECT sender FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_sender
           FROM chat_threads t
          WHERE t.slug = ?
          ORDER BY t.last_message_at DESC
          LIMIT 50`
      )
      .bind(slug)
      .all();

    return json({ threads: results ?? [] });
  } catch (error) {
    console.error('Chat inbox error:', error);
    return json({ error: 'Could not load your messages' }, 500);
  }
};

export const prerender = false;
