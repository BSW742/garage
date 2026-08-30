import type { APIRoute } from 'astro';
import { sendMail } from '../../../lib/mail';

/**
 * Send one message, by hand, from the CRM.
 *
 * The app could show what came in and had no way to answer it, so replying
 * meant leaving for a different mail client and the thread was only ever half
 * written down. Everything sent through here is kept in the outbox like any
 * other send, because a reply nobody logged is the same problem again.
 *
 * Behind the admin password, and deliberately not reachable from anywhere a
 * visitor can get to: this is a box that will mail anybody.
 */

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const body = (await request.json().catch(() => null)) as any;
    const to = String(body?.to || '').trim();
    const subject = String(body?.subject || '').trim().slice(0, 300);
    const text = String(body?.text || '').trim().slice(0, 20000);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ ok: false, message: 'Not an address.' }, 400);
    if (!subject || !text) return json({ ok: false, message: 'Needs a subject and something to say.' }, 400);

    const sent = await sendMail(env, {
      to, subject, text,
      replyTo: 'ben@garage.co.nz',
      kind: 'reply',
    });
    return sent.ok ? json({ ok: true }) : json({ ok: false, message: sent.error || 'did not send' });
  } catch (e: any) {
    return json({ ok: false, message: String(e?.message || e) }, 500);
  }
};
