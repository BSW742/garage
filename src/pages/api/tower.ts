import type { APIRoute } from 'astro';
import { sendMail, ownerContact } from '../../lib/mail';
import { sendPushToAll } from '../../lib/web-push';

/**
 * Somebody pulled a block on a published site.
 *
 * The visitor is never emailed. They handed over an address to spin a wheel,
 * not to join a list, so the details go to the owner and nowhere else — that is
 * what the form promises them and it would be a shabby thing to break.
 *
 * The owner is told about every spin, win or lose, because a name and an email
 * are worth having either way and a page full of near misses is worth knowing
 * about too.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

// Same caps as the wheel, for the same reason.
const PER_IP_HOUR = 5;
const PER_SITE_DAY = 200;

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    if (!body) return json({ error: 'Bad request' }, 400);

    const slug = clip(body.slug, 63).toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(slug)) return json({ error: 'Unknown site' }, 400);

    const name = clip(body.name, 80);
    const email = clip(body.email, 120);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'We need a name and an email' }, 400);
    }
    const phone = clip(body.phone, 40);
    const prize = clip(body.prize, 120);
    const won = body.won ? 1 : 0;

    // The site has to exist and have the widget switched on, or this is an
    // open endpoint for writing rows into somebody else's database.
    const row = await db
      .prepare("SELECT config FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such site' }, 404);
    let live = false;
    try { live = !!JSON.parse(String(row.config) || '{}')?.tower?.on; } catch { /* no */ }
    if (!live) return json({ error: 'The tower is not running on that site' }, 403);

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const recent = await db
      .prepare('SELECT COUNT(*) AS n FROM spins WHERE ip = ? AND created_at > ?')
      .bind(ip, hourAgo)
      .first();
    if (Number(recent?.n || 0) >= PER_IP_HOUR) {
      return json({ ok: true, throttled: true });
    }

    const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
    const today = await db
      .prepare('SELECT COUNT(*) AS n FROM spins WHERE slug = ? AND created_at > ?')
      .bind(slug, midnight.toISOString())
      .first();
    const overCap = Number(today?.n || 0) >= PER_SITE_DAY;

    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO spins (id, slug, name, email, phone, prize, won, ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, slug, name, email, phone || null, prize || null, won, ip, new Date().toISOString())
      .run();

    // Stored either way; the telling is what gets capped. A busy day should
    // not turn into two hundred emails.
    if (!overCap) {
      try { await sendPushToAll(db); } catch { /* an alert failing must not lose the lead */ }
      const owner = await ownerContact(db, slug);
      if (owner) {
        await sendMail(env, {
          to: owner.email,
          replyTo: email,
          subject: won
            ? `${name} walked away with "${prize}" on The Tower`
            : `${name} brought the tower down — ${prize}`,
          text:
            `${name} played The Tower on ${slug}.garage.co.nz.\n\n` +
            (won ? `They walked away holding: ${prize}\n` : `The tower came down and they dropped to: ${prize}\n`) +
            `\nName:  ${name}\nEmail: ${email}\n` +
            (phone ? `Phone: ${phone}\n` : '') +
            `\nThey have not been emailed by us — the game says you will be in touch,\n` +
            `so whatever they are holding, that part is yours.\n`,
        });
      }
    }

    return json({ ok: true, id });
  } catch (error) {
    console.error('Tower failed:', error);
    return json({ error: 'Could not record that' }, 500);
  }
};

export const prerender = false;
