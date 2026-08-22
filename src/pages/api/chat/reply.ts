import type { APIRoute } from 'astro';
import { json, preflight, nowIso } from '../../../lib/chat';

const MAX_BODY = 2000;

export const OPTIONS: APIRoute = async () => preflight();

// The owner replies from their magic link. The token is the only credential,
// so it has to match a thread exactly.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { token, body } = await request.json();

    const key = String(token ?? '').trim();
    const text = String(body ?? '').trim().slice(0, MAX_BODY);
    if (!key || !text) return json({ error: 'Missing reply' }, 400);

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const thread = await db
      .prepare('SELECT id FROM chat_threads WHERE token = ?')
      .bind(key)
      .first();
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
