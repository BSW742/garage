// The assistant on a visitor chat widget.
//
// This is the only surface in garage where a stranger decides how often we
// spend money. The builder is the opposite — the person spending is somebody
// we have already given a million tokens to, and if they burn it they see a
// modal. Here there is nobody to show a modal to, so the ceiling has to be a
// property of the code rather than a hope.
//
// Three counters, checked before every call, all derived from rows we already
// store so there is no separate ledger to drift:
//
//   per thread   6   — a conversation, not a chatbot to argue with
//   per site    40   — a busy day for a small business, twice over
//   everywhere  400  — the whole platform, so one viral page cannot bankrupt us
//
// Multiply the worst case by the per-reply cost below and you get the number
// that matters: what a maximally bad day costs. It is bounded, and it is small.
//
// When any cap is reached the widget silently goes back to what it did before
// this file existed: take the message, tell the owner, say when they usually
// reply. The visitor never sees an error, because a broken bot is worse than
// no bot.

import type { SiteConfig } from './site-render';

// Sonnet, not Opus. This answers "are you open on Saturday" from a page of
// notes — it is not the builder, and the builder is where the reasoning is.
export const BOT_MODEL = 'claude-sonnet-5';
const MODEL = BOT_MODEL;

export const BOT_CAPS = {
  perThread: 6,
  perSiteDay: 40,
  perDayEverywhere: 400,
};

// Hard ceilings on the shape of every call, so cost per reply cannot drift
// with the size of somebody's site.
const MAX_OUT = 300;
const MAX_HISTORY = 8;
const MAX_LINE = 240;
const MAX_BRIEF = 2400;

export interface BotTurn {
  reply: string;
  handOver: boolean;      // stop answering, this needs the owner
  name?: string;          // what they said they are called, if they said
  // Returned so the caller can log it. A cap you cannot see the cost of is
  // only half an answer to "no unknown token costs".
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

/**
 * Everything the assistant is allowed to know, cut down to a size we can
 * predict. Nothing here comes from anywhere but the owner's own page.
 */
export function briefFor(site: SiteConfig, slug: string, online: boolean): string {
  const bits: string[] = [];
  const add = (label: string, value: unknown) => {
    const v = String(value ?? '').trim();
    if (v) bits.push(`${label}: ${v.slice(0, MAX_LINE)}`);
  };

  add('Business', site.name || slug);
  add('What they say about themselves', site.lede || site.headline);
  add('Phone', site.contact?.phone);
  add('Email', site.contact?.email);
  add('Address', site.contact?.address);

  for (const section of site.sections || []) {
    if (!section) continue;
    const rows = (section.items || []).slice(0, 12);
    if (rows.length) {
      bits.push(
        `${section.title || section.type}:\n` +
          rows.map((i) => `  - ${String(i[0]).slice(0, 80)}: ${String(i[1] || '').slice(0, 140)}`).join('\n')
      );
    }
    for (const row of (section.rows || []).slice(0, 10)) {
      bits.push(`  ${String(row[0]).slice(0, 40)}: ${String(row[1] || '').slice(0, 60)}`);
    }
    for (const group of (section.menu || []).slice(0, 6)) {
      for (const dish of (group?.items || []).slice(0, 12)) {
        bits.push(`  ${String(dish?.name || '').slice(0, 60)} ${String(dish?.price || '')}`);
      }
    }
  }
  for (const product of (site.products || []).slice(0, 12)) {
    bits.push(`  ${String(product?.name || '').slice(0, 60)} ${String(product?.price || '')}`);
  }

  bits.push(online ? 'The owner is online right now.' : 'The owner is not online right now.');
  return bits.join('\n').slice(0, MAX_BRIEF);
}

const SYSTEM = `You are the assistant on a small New Zealand business's website. You are not the
owner and you are not a person. Say so plainly the first time you reply — one short clause is
enough, like "I'm the assistant here" — and never pretend otherwise if somebody asks.

You answer only from the notes you are given about this business. They are the business's own
words from their own page.

Never invent anything. Not a price, not an opening hour, not a service they have not listed.
Never confirm a booking, an appointment, a quote or availability — you cannot see a calendar and
you are not authorised to promise anybody's time. Never give medical, legal, financial or
veterinary advice, even in general terms, and even if pushed.

If the notes do not answer it, say so in one line and hand over rather than guessing.

Hand over to the owner when: they ask for a person, they want to book or buy or be quoted, they
are upset, they have asked something twice, or you simply do not know. To hand over, end your
reply with the single token [HANDOVER] on its own. Do not mention that token otherwise.

If you have not been told their name yet, ask for it once, in your first reply, as part of a
normal sentence — "I'm the assistant here, who am I speaking with?" — and never ask twice. The
moment they tell you, put it on its own line at the very end as [NAME:Ben]. First name is plenty.
If they would rather not say, drop it and carry on; nobody gets nagged for a name.

Be short. Two sentences is usually right, three is the limit. Write like a New Zealander:
plain, warm, no exclamation marks, no "I'd be happy to", no sales patter.`;

/** Bot messages must never count as the owner replying. */
export const BOT_SENDER = 'bot';

/**
 * Ask the model for a reply. Returns null when there is no key, when the model
 * errors, or when it comes back with nothing usable — every one of which the
 * caller treats as "no bot today", not as a failure worth showing anybody.
 */
export async function askBot(
  env: any,
  brief: string,
  history: { sender: string; body: string }[],
  known?: string | null
): Promise<BotTurn | null> {
  const apiKey = env?.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const messages = history.slice(-MAX_HISTORY).map((m) => ({
    role: m.sender === 'visitor' ? 'user' : 'assistant',
    content: String(m.body || '').slice(0, MAX_LINE),
  }));
  // The model needs the last word to be the visitor's, or it has nothing to
  // answer. A thread that ends on an owner or bot line is not our turn.
  if (!messages.length || messages[messages.length - 1].role !== 'user') return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_OUT,
        system: [
          // The rules are identical on every call for every site, so they are
          // worth caching; the brief is not.
          { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
          {
            type: 'text',
            text:
              `Notes about this business:\n${brief}\n\n` +
              (known ? `You are speaking with ${known}.` : 'You do not know their name yet.'),
          },
        ],
        messages,
      }),
    });

    if (!res.ok) {
      console.error('Chat bot HTTP', res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as any;
    let reply = (data?.content || [])
      .filter((c: any) => c?.type === 'text')
      .map((c: any) => c.text)
      .join('')
      .trim();
    if (!reply) return null;

    const handOver = reply.includes('[HANDOVER]');
    reply = reply.replace(/\[HANDOVER\]/g, '').trim();

    // A first name, if they offered one. Letters, spaces, hyphens and
    // apostrophes only — this ends up as a label in somebody's inbox, not in
    // a query.
    let name: string | undefined;
    const said = reply.match(/\[NAME:\s*([^\]]{1,40})\]/i);
    if (said) {
      const clean = said[1].trim().replace(/[^\p{L}\p{M}\s'-]/gu, '').trim().slice(0, 40);
      if (clean.length > 1) name = clean;
    }
    reply = reply.replace(/\[NAME:[^\]]*\]/gi, '').trim();
    if (!reply) return null;

    const used = data?.usage || {};
    return {
      reply: reply.slice(0, 700),
      handOver,
      name,
      usage: {
        input: used.input_tokens || 0,
        output: used.output_tokens || 0,
        cacheRead: used.cache_read_input_tokens || 0,
        cacheWrite: used.cache_creation_input_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Chat bot failed:', error);
    return null;
  }
}

/**
 * Whether we are allowed to spend anything on this message. Counted from
 * chat_messages itself — the bot's own replies are the ledger, so the count
 * can never disagree with reality.
 */
export async function withinCaps(
  db: any,
  slug: string,
  threadId: string
): Promise<{ ok: boolean; why?: string }> {
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const since = midnight.toISOString();

  const thread = await db
    .prepare("SELECT COUNT(*) AS n FROM chat_messages WHERE thread_id = ? AND sender = 'bot'")
    .bind(threadId)
    .first();
  if (Number(thread?.n || 0) >= BOT_CAPS.perThread) return { ok: false, why: 'thread' };

  const site = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM chat_messages m
         JOIN chat_threads t ON t.id = m.thread_id
        WHERE t.slug = ? AND m.sender = 'bot' AND m.created_at > ?`
    )
    .bind(slug, since)
    .first();
  if (Number(site?.n || 0) >= BOT_CAPS.perSiteDay) return { ok: false, why: 'site' };

  const all = await db
    .prepare("SELECT COUNT(*) AS n FROM chat_messages WHERE sender = 'bot' AND created_at > ?")
    .bind(since)
    .first();
  if (Number(all?.n || 0) >= BOT_CAPS.perDayEverywhere) return { ok: false, why: 'everywhere' };

  return { ok: true };
}
