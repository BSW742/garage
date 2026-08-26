import type { APIRoute } from 'astro';
import { sendMail, offerEmail } from '../../../lib/mail';

export const prerender = false;

const json = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

/**
 * Send a business owner the site we built for them. Guarded by the site's own
 * edit token so this cannot be turned into a machine for mailing strangers,
 * and it refuses to send twice or to anyone who has unsubscribed.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) return json({ error: 'no database' }, 500);

    const { slug, key, to, again } = (await request.json()) as {
      slug?: string; key?: string; to?: string; again?: boolean;
    };
    if (!slug || !key) return json({ error: 'slug and key required' }, 400);

    const row = await db
      .prepare(
        `SELECT email, edit_token, config, owner_sent_at, unsubscribed_at, unsub_token
              , view_token
           FROM site_claims WHERE slug = ? AND status != 'disabled'`
      )
      .bind(slug)
      .first();

    if (!row) return json({ error: 'no such site' }, 404);
    if (!row.edit_token) return json({ error: 'no-key' }, 409);
    if (row.edit_token !== key) return json({ error: 'wrong key' }, 403);
    if (row.unsubscribed_at) return json({ error: 'they asked not to be contacted' }, 409);
    if (row.owner_sent_at && !again) {
      return json({ error: `already sent ${String(row.owner_sent_at).slice(0, 10)}` }, 409);
    }

    let config: any = {};
    try { config = JSON.parse(row.config || '{}'); } catch { /* fine */ }

    // The address on the site we built is the one they publish themselves.
    const address = String(to || config?.contact?.email || row.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      return json({ error: 'no usable address on this site' }, 422);
    }

    const unsubToken = String(row.unsub_token || crypto.randomUUID().replace(/-/g, ''));
    const viewToken = String(row.view_token || crypto.randomUUID().replace(/-/g, '').slice(0, 12));
    const mail = offerEmail(slug, String(row.edit_token), config?.name, unsubToken, viewToken);

    const sent = await sendMail(env, {
      to: address,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: `${slug}@garage.co.nz`,
    });
    if (!sent.ok) return json({ error: sent.error || 'send failed' }, 502);

    await db
      .prepare(
        `UPDATE site_claims
            SET owner_sent_at = ?, owner_sent_to = ?, unsub_token = ?, view_token = ?
          WHERE slug = ?`
      )
      .bind(new Date().toISOString(), address, unsubToken, viewToken, slug)
      .run();

    return json({ ok: true, to: address });
  } catch (error) {
    console.error('offer send failed', error);
    return json({ error: 'failed' }, 500);
  }
};
