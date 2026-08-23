import type { APIRoute } from 'astro';
import { json, preflight, nowIso, cleanSlug } from '../../../lib/chat';

const MAX_BODY = 2000;

export const OPTIONS: APIRoute = async () => preflight();

// The owner replies from their magic link. The token is the only credential,
// so it has to match a thread exactly.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { token, body, slug: rawSlug, key: siteKey, threadId } = await request.json();

    const text = String(body ?? '').trim().slice(0, MAX_BODY);
    if (!text) return json({ error: 'Missing reply' }, 400);

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    // Two ways in: the per-conversation magic link, or the owner's site key
    // from their inbox. Both have to land on a thread that really is theirs.
    let thread: { id: string } | null = null;

    const link = String(token ?? '').trim();
    if (link) {
      thread = await db
        .prepare('SELECT id FROM chat_threads WHERE token = ?')
        .bind(link)
        .first();
    } else {
      const slug = cleanSlug(rawSlug);
      const owner = String(siteKey ?? '').trim();
      const id = String(threadId ?? '').trim();
      if (!slug || !owner || !id) return json({ error: 'Missing reply' }, 400);

      const site = await db
        .prepare('SELECT slug FROM site_claims WHERE slug = ? AND edit_token = ?')
        .bind(slug, owner)
        .first();
      if (!site) return json({ error: 'Not your site' }, 403);

      thread = await db
        .prepare('SELECT id FROM chat_threads WHERE id = ? AND slug = ?')
        .bind(id, slug)
        .first();
    }

    if (!thread) return json({ error: 'That link is not valid' }, 404);

    const now = nowIso();
    await db
      .prepare(
        `INSERT INTO chat_messages (thread_id, sender, body, created_at)
         VALUES (?, 'owner', ?, ?)`
      )
      .bind(thread.id, text, now)
      .run();

    await db
      .prepare('UPDATE chat_threads SET last_message_at = ? WHERE id = ?')
      .bind(now, thread.id)
      .run();

    return json({ ok: true });
  } catch (error) {
    console.error('Chat reply error:', error);
    return json({ error: 'Could not send that reply' }, 500);
  }
};

export const prerender = false;
