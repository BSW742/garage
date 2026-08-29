import type { APIRoute } from 'astro';
import { sendMail } from '../../../lib/mail';

/**
 * The email. One button, one site, no typing.
 *
 * The address is built from the slug rather than typed, because in an email
 * where the link IS the product, a mistyped domain wastes the whole send —
 * and the first draft of this email had exactly that typo in it.
 *
 * Every send carries a working unsubscribe. NZ's Unsolicited Electronic
 * Messages Act requires one on commercial mail, and the practical reason bites
 * sooner than the legal one: cold mail with no way out gets marked as spam,
 * and then the replies this whole exercise is for stop arriving too.
 */

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) return json({ ok: false, message: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').toLowerCase().trim();
    const dryRun = !!body?.preview;
    if (!/^[a-z0-9-]{2,63}$/.test(slug)) return json({ ok: false, message: 'bad slug' }, 400);

    const site: any = await db
      .prepare(
        `SELECT slug, email, config, source_url, unsub_token, unsubscribed_at, owner_sent_at
           FROM site_claims WHERE slug = ? AND status != 'disabled'`
      )
      .bind(slug)
      .first();
    if (!site) return json({ ok: false, message: 'no such site' }, 404);
    if (site.unsubscribed_at) return json({ ok: false, message: 'They asked not to be emailed.' });

    let cfg: any = {};
    try { cfg = JSON.parse(site.config || '{}'); } catch { /* a bad config is still a real site */ }
    const to = String(cfg?.contact?.email || site.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return json({ ok: false, message: 'No email address on this one.' });
    }

    // Who is actually on the other end of this address?
    //
    // Half the estate is invented — the cron writes a plausible business with a
    // plausible address to match, and info@alpineheatandplunge.co.nz is a
    // domain nobody owns. Sending there bounces, and bouncing is how a sending
    // domain gets itself filtered. Worse, some scraped addresses belong to
    // somebody else entirely: Kokako's listed contact is their web agency, and
    // Credaro's is a stranger. So the address has to be traceable to the site
    // we actually read, and anything else needs a human to look at it first.
    const emailHost = to.split('@')[1].toLowerCase();
    const sourceHost = String(site.source_url || '')
      .replace(/^https?:\/\//, '').split('/')[0].toLowerCase().replace(/^www\./, '');
    const root = (h: string) => {
      const p = h.split('.');
      return p.length > 2 && ['co', 'com', 'org', 'net', 'govt', 'ac'].includes(p[p.length - 2])
        ? p.slice(-3).join('.')
        : p.slice(-2).join('.');
    };
    const matched = !!sourceHost && root(emailHost) === root(sourceHost);
    const invented = !site.source_url;

    if (!body?.force) {
      if (invented) {
        return json({
          ok: false, needsEye: true,
          message: `${slug} is one of the invented ones — there is no real business behind it, ` +
                   `and ${to} is an address the model made up. Sending would bounce at best.`,
        });
      }
      if (!matched) {
        return json({
          ok: false, needsEye: true,
          message: `${to} does not belong to ${sourceHost}, which is the site we read. ` +
                   `It is often their web agency rather than them. Check it, then send with force.`,
        });
      }
    }

    const name = String(cfg?.name || slug);
    const home = `https://${slug}.garage.co.nz`;

    // Made once, kept, so the link in an email sent today still works next year.
    let unsub = site.unsub_token;
    if (!unsub) {
      unsub = crypto.randomUUID().replace(/-/g, '');
      await db.prepare('UPDATE site_claims SET unsub_token = ? WHERE slug = ?').bind(unsub, slug).run();
    }
    const out = `https://garage.co.nz/unsubscribe/${slug}?t=${unsub}`;

    const subject = `I made ${name} a new website`;
    const text =
`Kia ora — I build websites for New Zealand businesses, and I made you one to look at. Nothing to pay, no catch.

${home}

There is a 60-second video on it of me putting it together, so you can see how easy it is to change.

Like it? Reply and I will send you the link to edit it — it is yours.
Rather I took it down? Say so and it is gone today.

Ben
garage.co.nz

--
Not interested in hearing from me again: ${out}`;

    if (dryRun) return json({ ok: true, preview: true, to, subject, text });

    const sent = await sendMail(env, { to, subject, text, replyTo: 'ben@garage.co.nz' });
    if (!sent.ok) return json({ ok: false, message: sent.error || 'send failed' });

    await db
      .prepare("UPDATE site_claims SET owner_sent_at = datetime('now'), owner_sent_to = ? WHERE slug = ?")
      .bind(to, slug)
      .run();

    return json({ ok: true, to, resent: !!site.owner_sent_at });
  } catch (e: any) {
    return json({ ok: false, message: String(e?.message || e) }, 500);
  }
};
