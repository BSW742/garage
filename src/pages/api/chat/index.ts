import type { APIRoute } from 'astro';
import { json, preflight, cleanSlug, nowIso, replyTimeLabel } from '../../../lib/chat';
import { sendPushToAll } from '../../../lib/web-push';
import { sendMail, ownerEmail } from '../../../lib/mail';

const MAX_BODY = 2000;

// One place to change when we add email or SMS alerts. Today this is web
// push, which reaches whoever has subscribed rather than the individual site
// owner — see notes in the chat docs.
async function notifyOwner(
  db: any, env: any, slug: string, text: string, isNew: boolean
): Promise<void> {
  try {
    await sendPushToAll(db);
  } catch {
    // An alert failing must never lose the visitor's message.
  }

  // Only when a conversation starts. Emailing every line of a back and forth
  // would train them to ignore it, which is worse than not sending at all.
  if (!isNew) return;
  try {
    const owner = await ownerEmail(db, slug);
    if (!owner) return;
    await sendMail(env, {
      to: owner,
      subject: `Someone is asking on ${slug}.garage.co.nz`,
      text:
        `Somebody has started a chat on your site.\n\n` +
        `They said: ${text.slice(0, 400)}\n\n` +
        `Answer them here:  https://${slug}.garage.co.nz/admin\n\n` +
        `They are more likely to still be there if you are quick.\n`,
    });
  } catch {
    // Same again: the message is already saved.
  }
}

export const OPTIONS: APIRoute = async () => preflight();

// Visitor sends a message. First message creates the thread.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { slug: rawSlug, threadId, body, name, contact } = await request.json();

    const slug = cleanSlug(rawSlug);
    if (!slug) return json({ error: 'Unknown site' }, 400);

    const text = String(body ?? '').trim().slice(0, MAX_BODY);
    if (!text) return json({ error: 'Empty message' }, 400);

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const now = nowIso();
    let id = String(threadId ?? '').trim();
    let token: string | null = null;

    if (id) {
      const existing = await db
        .prepare('SELECT id FROM chat_threads WHERE id = ? AND slug = ?')
        .bind(id, slug)
        .first();
      if (!existing) id = '';
    }

    let startedNow = false;
    if (!id) {
      startedNow = true;
      id = crypto.randomUUID();
      token = crypto.randomUUID().replace(/-/g, '');
      await db
        .prepare(
          `INSERT INTO chat_threads
             (id, slug, token, visitor_name, visitor_contact, status, created_at, last_message_at)
           VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`
        )
        .bind(id, slug, token, name ?? null, contact ?? null, now, now)
        .run();
    } else if (name || contact) {
      // Contact details are asked for after the first message, not before it.
      await db
        .prepare(
          `UPDATE chat_threads
              SET visitor_name = COALESCE(?, visitor_name),
                  visitor_contact = COALESCE(?, visitor_contact)
            WHERE id = ?`
        )
        .bind(name ?? null, contact ?? null, id)
        .run();
    }

    await db
      .prepare(
        `INSERT INTO chat_messages (thread_id, sender, body, created_at)
         VALUES (?, 'visitor', ?, ?)`
      )
      .bind(id, text, now)
      .run();

    await db
      .prepare('UPDATE chat_threads SET last_message_at = ?, status = ? WHERE id = ?')
      .bind(now, 'open', id)
      .run();

    await notifyOwner(db, (locals.runtime?.env as any) || {}, slug, text, startedNow);

    return json({ threadId: id, replyTime: await replyTimeLabel(db, slug) });
  } catch (error) {
    console.error('Chat send error:', error);
    return json({ error: 'Could not send that message' }, 500);
  }
};

// Widget polls this while it is open.
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const id = String(url.searchParams.get('threadId') ?? '').trim();
    const slug = cleanSlug(url.searchParams.get('slug'));
    if (!slug) return json({ error: 'Unknown site' }, 400);

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const replyTime = await replyTimeLabel(db, slug);
    if (!id) return json({ messages: [], replyTime });

    const after = Number(url.searchParams.get('after') ?? 0) || 0;
    const { results } = await db
      .prepare(
        `SELECT m.id, m.sender, m.body, m.created_at
           FROM chat_messages m
           JOIN chat_threads t ON t.id = m.thread_id
          WHERE m.thread_id = ? AND t.slug = ? AND m.id > ?
          ORDER BY m.id`
      )
      .bind(id, slug, after)
      .all();

    return json({ messages: results ?? [], replyTime });
  } catch (error) {
    console.error('Chat poll error:', error);
    return json({ error: 'Could not load messages' }, 500);
  }
};

export const prerender = false;
