import type { APIRoute } from 'astro';
import { json, preflight, cleanSlug, nowIso, replyTimeLabel } from '../../../lib/chat';
import { sendPushToAll } from '../../../lib/web-push';
import { sendMail, ownerContact } from '../../../lib/mail';
import { askBot, briefFor, withinCaps, BOT_SENDER, BOT_MODEL } from '../../../lib/chat-bot';
import { ONLINE_WINDOW_MS } from './presence';

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
    const owner = await ownerContact(db, slug);
    if (!owner) return;
    await sendMail(env, {
      to: owner.email,
      subject: `Someone is asking on ${slug}.garage.co.nz`,
      text:
        `Somebody has started a chat on your site.\n\n` +
        `They said: ${text.slice(0, 400)}\n\n` +
        `Answer them here:  ${owner.inbox}\n\n` +
        `They are more likely to still be there if you are quick.\n`,
    });
  } catch {
    // Same again: the message is already saved.
  }
}

/**
 * Answer the visitor, if we are allowed to spend anything on it.
 *
 * The order matters. Caps are checked before the config is even loaded, so a
 * site that has run out costs one cheap COUNT and nothing else.
 */
async function maybeAnswer(
  db: any, env: any, slug: string, threadId: string
): Promise<{ body: string; handOver: boolean } | null> {
  const allowed = await withinCaps(db, slug, threadId);
  if (!allowed.ok) return null;

  const site = await db
    .prepare("SELECT config, chat_online_at FROM site_claims WHERE slug = ? AND status != 'disabled'")
    .bind(slug)
    .first();
  if (!site?.config) return null;

  let config: any;
  try { config = JSON.parse(String(site.config)); } catch { return null; }
  // The owner turned the widget off; nothing here should be running.
  if (!config.chat) return null;

  const stamp = Date.parse(String(site.chat_online_at || ''));
  const online = Number.isFinite(stamp) && Date.now() - stamp < ONLINE_WINDOW_MS;

  const { results } = await db
    .prepare(
      'SELECT sender, body FROM chat_messages WHERE thread_id = ? ORDER BY id DESC LIMIT 8'
    )
    .bind(threadId)
    .all();
  const history = (results || []).reverse();

  const thread = await db
    .prepare('SELECT visitor_name FROM chat_threads WHERE id = ?')
    .bind(threadId)
    .first();
  const known = String(thread?.visitor_name || '').trim() || null;

  const turn = await askBot(env, briefFor(config, slug, online), history, known);
  if (!turn) return null;

  // A name, asked for in conversation rather than in a form. "Someone on your
  // site" is a poor thing to greet an owner with when the person is right
  // there and happy to say who they are.
  if (turn.name && !known) {
    try {
      await db
        .prepare('UPDATE chat_threads SET visitor_name = ? WHERE id = ? AND visitor_name IS NULL')
        .bind(turn.name, threadId)
        .run();
    } catch (error) {
      console.error('Could not save the visitor name:', error);
    }
  }

  // What happens next is a fact about this site, not a guess. The owner has
  // already been notified above, so saying so is true either way.
  const tail = turn.handOver
    ? online
      ? ' They are online now, so should pick this up shortly.'
      : ' I have passed this to them and they will come back to you.'
    : '';

  const body = (turn.reply + tail).slice(0, 900);
  const now = nowIso();

  // Logged beside the builder's spend so both show up in one place. Failing to
  // record it must not cost the visitor their answer.
  try {
    await db
      .prepare(
        `INSERT INTO agent_usage
           (id, slug, model, steps, input_tokens, output_tokens, cache_read, cache_write,
            message_chars, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(), slug, BOT_MODEL,
        turn.usage.input, turn.usage.output, turn.usage.cacheRead, turn.usage.cacheWrite,
        body.length, now
      )
      .run();
  } catch (error) {
    console.error('Assistant usage log failed:', error);
  }
  await db
    .prepare('INSERT INTO chat_messages (thread_id, sender, body, created_at) VALUES (?, ?, ?, ?)')
    .bind(threadId, BOT_SENDER, body, now)
    .run();

  return { body, handOver: turn.handOver };
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

    // Everything above has already happened: the message is stored and the
    // owner has been told. The assistant is a bonus on top, so every failure
    // from here down is swallowed — a visitor must never lose a message
    // because a model was slow.
    let bot: { body: string; handOver: boolean } | null = null;
    try {
      bot = await maybeAnswer(db, (locals.runtime?.env as any) || {}, slug, id);
    } catch (error) {
      console.error('Assistant skipped:', error);
    }

    return json({
      threadId: id,
      replyTime: await replyTimeLabel(db, slug),
      bot: bot ? { body: bot.body, handOver: bot.handOver } : undefined,
    });
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
