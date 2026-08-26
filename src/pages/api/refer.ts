import type { APIRoute } from 'astro';
import { sendMail, referralEmail } from '../../lib/mail';

export const prerender = false;

// The builder lives on the apex and a site's editor can be opened from a
// subdomain, so this answers CORS like the rest of them.
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

// What each side gets. The referrer is paid when the business actually takes
// the page, never for sending — sending is free to do and would be farmed.
export const REFERRAL_REWARD = 250_000;
export const REFERRAL_WELCOME = 500_000;
const MAX_REFERRALS = 10;

const RESERVED = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'mx', 'ftp', 'ns', 'ns1', 'ns2',
  'cdn', 'static', 'assets', 'dev', 'staging', 'preview', 'test', 'local',
]);

function slugify(name: string): string {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);
}

const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    if (!body) return json({ error: 'Bad request' }, 400);

    const from = String(body.slug || '').trim().toLowerCase();
    const key = String(body.key || '').trim();
    const name = String(body.name || '').trim().slice(0, 60);
    const email = String(body.email || '').trim().toLowerCase().slice(0, 120);

    if (!/^[a-z0-9-]{1,63}$/.test(from) || !key) return json({ error: 'Bad request' }, 400);
    if (!name) return json({ error: 'What are they called?' }, 400);
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) return json({ error: 'That email looks wrong' }, 400);

    // Only the owner of a site can put businesses forward from it.
    const me = await db
      .prepare('SELECT edit_token, email, config FROM site_claims WHERE slug = ?')
      .bind(from)
      .first();
    if (!me) return json({ error: 'No such page' }, 404);
    if (!me.edit_token || String(me.edit_token) !== key) return json({ error: 'Not your page' }, 403);

    // Recommending yourself is not a recommendation.
    if (String(me.email || '').toLowerCase() === email) {
      return json({ error: 'That is your own address' }, 400);
    }

    const already = await db
      .prepare("SELECT COUNT(*) AS n FROM site_claims WHERE referred_by = ?")
      .bind(from)
      .first();
    if (Number(already?.n || 0) >= MAX_REFERRALS) {
      return json({ error: `That is the lot — ${MAX_REFERRALS} is the limit.` }, 429);
    }

    // Never mail the same address twice off the back of a recommendation, and
    // never touch a business that already has a page of its own.
    const seen = await db
      .prepare('SELECT slug, referred_by, unsubscribed_at FROM site_claims WHERE lower(email) = ?')
      .bind(email)
      .first();
    if (seen) {
      if (seen.unsubscribed_at) return json({ error: 'They have asked us not to contact them.' }, 409);
      return json({ error: 'They are already on here.' }, 409);
    }

    // A free address for them. Numbers only if the plain one has gone.
    let slug = slugify(name);
    if (!slug || RESERVED.has(slug)) slug = 'biz' + Math.random().toString(36).slice(2, 7);
    for (let i = 0; i < 30; i++) {
      const taken = await db.prepare('SELECT 1 FROM site_claims WHERE slug = ?').bind(slug).first();
      if (!taken) break;
      slug = slugify(name).slice(0, 36) + (i + 2);
    }

    const fromName = (() => {
      try { return String(JSON.parse(String(me.config) || '{}').name || from); } catch { return from; }
    })();

    // A start, not a finished site. The email says as much — promising more
    // than is there is the fastest way to lose somebody on the first click.
    const config = {
      name,
      headline: name,
      lede: `${fromName} put us forward. This page is a start — say what you want on it.`,
      cta: 'Get in touch',
      style: 'modern',
      tone: 'light',
      palette: { primary: '#2563eb', deep: '#1e40af', wash: '#f6f8fb' },
      contact: { email },
      sections: [],
      images: [],
    };

    const editToken = token();
    const unsubToken = token();
    const viewToken = token();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO site_claims
           (slug, email, config, status, edit_token, updated_at, unsub_token, view_token,
            referred_by, owner_sent_at, owner_sent_to)
         VALUES (?, ?, ?, 'live', ?, datetime('now'), ?, ?, ?, ?, ?)`
      )
      .bind(slug, email, JSON.stringify(config), editToken, unsubToken, viewToken, from, now, email)
      .run();

    // The welcome bonus is granted now so the email can name it honestly.
    await db
      .prepare(
        `INSERT INTO token_grants (id, slug, tokens, reason, ref_slug, created_at)
         VALUES (?, ?, ?, 'welcome', ?, ?)`
      )
      .bind(crypto.randomUUID(), slug, REFERRAL_WELCOME, from, now)
      .run();

    const mail = referralEmail(
      slug, editToken, name, fromName, unsubToken, viewToken, 1_000_000 + REFERRAL_WELCOME
    );
    const sent = await sendMail(env, { to: email, ...mail });
    if (!sent.ok) {
      // Do not leave a page and a grant behind for an email that never went.
      await db.prepare('DELETE FROM site_claims WHERE slug = ?').bind(slug).run().catch(() => {});
      await db.prepare('DELETE FROM token_grants WHERE slug = ?').bind(slug).run().catch(() => {});
      return json({ error: sent.error || 'Could not send that, sorry' }, 502);
    }

    return json({ ok: true, slug, name, reward: REFERRAL_REWARD });
  } catch (error) {
    console.error('Referral failed:', error);
    return json({ error: 'Could not send that, sorry' }, 500);
  }
};
