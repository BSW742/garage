import type { APIRoute } from 'astro';
import { sendMail, keysEmail } from '../../lib/mail';

export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Send an owner their keys again. Guarded by the edit token, so only somebody
 * who already holds the keys can post them — otherwise this is a machine for
 * mailing strangers on demand.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const { slug, token, to } = (await request.json()) as {
      slug?: string;
      token?: string;
      to?: string;
    };
    if (!slug || !token) return json({ error: 'slug and token required' }, 400);

    const db = env.DB;
    if (!db) return json({ error: 'no database' }, 500);

    const row = await db
      .prepare('SELECT email, edit_token, config FROM site_claims WHERE slug = ? AND status != ?')
      .bind(slug, 'disabled')
      .first();

    if (!row) return json({ error: 'no such site' }, 404);
    if (!row.edit_token) return json({ error: 'no-key' }, 409);
    if (row.edit_token !== token) return json({ error: 'wrong key' }, 403);

    // Default to the address on file; an override still has to hold the key.
    const address = String(to || row.email || '').trim();
    if (!address || !address.includes('@')) return json({ error: 'no address on file' }, 422);

    let name: string | undefined;
    let onWaitlist = false;
    try {
      const cfg = JSON.parse(row.config || '{}');
      name = cfg?.name || undefined;
      onWaitlist = !!cfg?.waitlist?.on;
    } catch {
      /* the slug will do */
    }

    const mail = keysEmail(slug, row.edit_token, name, onWaitlist);
    const sent = await sendMail(env, {
      to: address,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: `${slug}@garage.co.nz`,
    });

    if (!sent.ok) return json({ error: sent.error || 'send failed' }, 502);
    return json({ success: true, to: address });
  } catch (error) {
    console.error('send-keys failed', error);
    return json({ error: 'failed' }, 500);
  }
};
