import type { APIRoute } from 'astro';
import { sendMail, referralEmail } from '../../lib/mail';

export const prerender = false;

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

const WELCOME = 500_000;
const MAX_AT_ONCE = 8;

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

const emailOf = (contact: string) => {
  const m = String(contact || '').match(/[^\s<>@]+@[^\s<>@.]+\.[^\s<>@]+/);
  return m ? m[0].toLowerCase() : null;
};

/**
 * Turn "we work alongside" entries into real pages, and tell those businesses
 * they were named. Runs on publish, never on typing: nobody should get an
 * email about a site that was abandoned half-built.
 *
 * Only the businesses we can email get contacted. A phone number still earns
 * them a page — it just sits there until somebody claims it.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const from = String(body?.slug || '').trim().toLowerCase();
    const key = String(body?.key || '').trim();
    const partners = Array.isArray(body?.partners) ? body.partners.slice(0, MAX_AT_ONCE) : [];
    if (!/^[a-z0-9-]{1,63}$/.test(from) || !key) return json({ error: 'Bad request' }, 400);

    const me = await db
      .prepare('SELECT edit_token, email, config FROM site_claims WHERE slug = ?')
      .bind(from)
      .first();
    if (!me) return json({ error: 'No such page' }, 404);
    if (!me.edit_token || String(me.edit_token) !== key) return json({ error: 'Not your page' }, 403);

    const fromName = (() => {
      try { return String(JSON.parse(String(me.config) || '{}').name || from); } catch { return from; }
    })();
    const myEmail = String(me.email || '').toLowerCase();

    const out: { name: string; slug?: string; sent?: boolean }[] = [];

    for (const raw of partners) {
      const name = String(raw?.name || '').trim().slice(0, 60);
      if (!name) continue;
      if (raw?.slug) { out.push({ name, slug: String(raw.slug), sent: !!raw.sent }); continue; }

      const contact = String(raw?.contact || '').trim().slice(0, 120);
      const email = emailOf(contact);

      // Already here? Point at them rather than making a second page.
      const existing = email
        ? await db.prepare('SELECT slug FROM site_claims WHERE lower(email) = ?').bind(email).first()
        : await db
            .prepare("SELECT slug FROM site_claims WHERE lower(json_extract(config,'$.name')) = ?")
            .bind(name.toLowerCase())
            .first();
      if (existing?.slug) { out.push({ name, slug: String(existing.slug), sent: true }); continue; }

      // Naming yourself is not working alongside anybody.
      if (email && email === myEmail) { out.push({ name }); continue; }

      let slug = slugify(name);
      if (!slug || RESERVED.has(slug)) slug = 'biz' + Math.random().toString(36).slice(2, 7);
      for (let i = 0; i < 30; i++) {
        const taken = await db.prepare('SELECT 1 FROM site_claims WHERE slug = ?').bind(slug).first();
        if (!taken) break;
        slug = slugify(name).slice(0, 36) + (i + 2);
      }

      const config = {
        name,
        headline: name,
        lede: `${fromName} works alongside us. This page is a start — say what you want on it.`,
        cta: 'Get in touch',
        style: 'modern',
        tone: 'light',
        palette: { primary: '#2563eb', deep: '#1e40af', wash: '#f6f8fb' },
        contact: email ? { email } : {},
        sections: [{ type: 'alongside', partners: [{ name: fromName, slug: from }] }],
        images: [],
      };

      const editToken = token();
      const unsubToken = token();
      const viewToken = token();
      const now = new Date().toISOString();

      try {
        await db
          .prepare(
            `INSERT INTO site_claims
               (slug, email, config, status, edit_token, updated_at, unsub_token, view_token, referred_by)
             VALUES (?, ?, ?, 'live', ?, datetime('now'), ?, ?, ?)`
          )
          .bind(slug, email || `${slug}@garage.co.nz`, JSON.stringify(config), editToken,
                unsubToken, viewToken, from)
          .run();
        await db
          .prepare(
            `INSERT INTO token_grants (id, slug, tokens, reason, ref_slug, created_at)
             VALUES (?, ?, ?, 'welcome', ?, ?)`
          )
          .bind(crypto.randomUUID(), slug, WELCOME, from, now)
          .run();
      } catch (error) {
        console.error('Alongside page failed:', name, error);
        out.push({ name });
        continue;
      }

      let sent = false;
      if (email) {
        const mail = referralEmail(
          slug, editToken, name, fromName, unsubToken, viewToken, 1_000_000 + WELCOME
        );
        const res = await sendMail(env, { to: email, ...mail });
        sent = !!res.ok;
        if (sent) {
          await db
            .prepare('UPDATE site_claims SET owner_sent_at = ?, owner_sent_to = ? WHERE slug = ?')
            .bind(now, email, slug)
            .run()
            .catch(() => {});
        } else {
          console.error('Alongside email failed:', email, res.error);
        }
      }

      out.push({ name, slug, sent });
    }

    // Write the slugs back into their own page, so the links work without
    // making them publish a second time for something they did not do.
    try {
      const config = JSON.parse(String(me.config) || '{}');
      let touched = false;
      for (const section of config.sections || []) {
        if (!section || section.type !== 'alongside') continue;
        section.partners = (section.partners || []).map((p: any) => {
          const found = out.find((o) => o.name === String(p?.name || ''));
          if (found && found.slug && p.slug !== found.slug) {
            touched = true;
            return { ...p, slug: found.slug, sent: !!found.sent };
          }
          return p;
        });
      }
      if (touched) {
        await db
          .prepare('UPDATE site_claims SET config = ?, updated_at = datetime(\'now\') WHERE slug = ?')
          .bind(JSON.stringify(config), from)
          .run();
      }
    } catch (error) {
      console.error('Alongside writeback failed:', error);
    }

    return json({ ok: true, partners: out });
  } catch (error) {
    console.error('Alongside failed:', error);
    return json({ error: 'Could not do that, sorry' }, 500);
  }
};
