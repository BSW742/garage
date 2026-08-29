import type { APIRoute } from 'astro';
import { sendPushToAll } from '../../lib/web-push';
import { sendMail, keysEmail } from '../../lib/mail';

export const prerender = false;

const RESERVED = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'ftp', 'ns', 'ns1', 'ns2',
  'blog', 'shop', 'store', 'help', 'support', 'docs', 'status', 'cdn', 'static',
  'assets', 'img', 'images', 'media', 'files', 'dev', 'staging', 'test', 'demo',
  'garage', 'build', 'apply', 'login', 'signup', 'register', 'account', 'dashboard',
  'sell', 'buy', 'cars', 'listings', 'noticeboard', 'merch', 'booking', 'projects',
  'about', 'contact', 'me', 'my', 'new', 'edit', 'sites', 'site', 'web',
]);

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function ensureTable(db: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS site_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      email TEXT,
      source_url TEXT,
      config TEXT,
      edit_token TEXT,
      status TEXT DEFAULT 'live',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Older copies of the table predate these columns
  for (const column of ['edit_token TEXT', 'updated_at DATETIME']) {
    try {
      await db.prepare(`ALTER TABLE site_claims ADD COLUMN ${column}`).run();
    } catch {
      // already there
    }
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { slug, email, sourceUrl, site, token } = data as {
      slug?: string;
      email?: string;
      sourceUrl?: string;
      site?: Record<string, unknown>;
      token?: string;
    };

    if (!slug || !/^[a-z0-9-]{3,40}$/.test(slug) || RESERVED.has(slug)) {
      return json({ error: 'Invalid address' }, 400);
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'Invalid email' }, 400);
    }

    const url = `https://${slug}.garage.co.nz`;
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) {
      console.log('Site claim (no DB):', slug, email || '(no email yet)');
      return json({ success: true, url, token: 'no-db' });
    }

    await ensureTable(db);
    const existing = await db
      .prepare('SELECT slug, email, edit_token FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();

    // A row with no edit_token cannot be republished by anyone, including the
    // person who made it — the check below would refuse every possible token.
    // That is a broken record rather than a contested address, so say so.
    if (existing && !existing.edit_token) {
      return json({ error: 'no-key', slug }, 409);
    }

    // Somebody else's site
    if (existing && (!token || token !== existing.edit_token)) {
      return json({ error: 'taken' }, 409);
    }

    if (existing) {
      const updated = db.prepare(`
        UPDATE site_claims
        SET email = COALESCE(?, email), source_url = COALESCE(?, source_url),
            config = COALESCE(?, config), updated_at = CURRENT_TIMESTAMP
        WHERE slug = ? AND edit_token = ?
      `).bind(email || null, sourceUrl || null, site ? JSON.stringify(site) : null, slug, token);

      // A mismatch here writes nothing while still reporting success, which is
      // how a change can appear to publish and quietly not.
      const written = await updated.run();
      if (written?.meta && written.meta.changes === 0) {
        return json({ error: 'not-saved', slug }, 409);
      }

      if (email && !existing.email) {
        try {
          await sendPushToAll(db, { title: 'Site claimed', body: `${slug}.garage.co.nz — ${email}` });
        } catch (pushError) {
          console.error('Push notification error:', pushError);
        }
        // The screen has always said "keys on their way" — now they are.
        await mailKeys(env, db, slug, email, site);
      }

      return json({ success: true, url, token });
    }

    const editToken = crypto.randomUUID();
    // Empty string rather than null: the original table declared email NOT NULL
    await db.prepare(`
      INSERT INTO site_claims (slug, email, source_url, config, edit_token)
      VALUES (?, ?, ?, ?, ?)
    `).bind(slug, email || '', sourceUrl || null, JSON.stringify(site || {}), editToken).run();

    try {
      await sendPushToAll(db, {
        title: 'New site published',
        body: `${slug}.garage.co.nz just went live`,
      });
    } catch (pushError) {
      console.error('Push notification error:', pushError);
    }

    if (email) await mailKeys(env, db, slug, email, site, editToken);

    return json({ success: true, url, token: editToken });
  } catch (error) {
    console.error('Site claim error:', error);
    return json({ error: 'Failed to claim site' }, 500);
  }
};

/**
 * Post the owner their keys. Never allowed to fail the publish — the site being
 * live matters more than the receipt, and they can always ask again.
 */
async function mailKeys(env: any, db: any, slug: string, email: string, site: any, token?: string) {
  try {
    let key = token;
    if (!key) {
      const row = await db.prepare('SELECT edit_token FROM site_claims WHERE slug = ?').bind(slug).first();
      key = row?.edit_token;
    }
    if (!key) return;
    const mail = keysEmail(slug, key, site?.name, !!(site as any)?.waitlist?.on);
    const sent = await sendMail(env, {
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: `${slug}@garage.co.nz`,
    });
    if (!sent.ok) console.error('keys email failed:', sent.error);
  } catch (error) {
    console.error('keys email threw:', error);
  }
}
