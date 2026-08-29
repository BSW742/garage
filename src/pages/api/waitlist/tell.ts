import type { APIRoute } from 'astro';
import { sendMail } from '../../../lib/mail';

/**
 * A time opened up. Tell the list.
 *
 * Everybody hears at once and the first to say yes takes it, which is the
 * honest version of ringing down a pad — except nobody is left sitting by a
 * phone that never rings.
 */

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    if (!body) return json({ error: 'Bad request' }, 400);

    const slug = String(body.slug || '').trim().toLowerCase();
    const key = String(body.key || '').trim();
    const slot = String(body.slot || '').trim().slice(0, 80);
    if (!slot) return json({ error: 'Say when the slot is' }, 400);

    // Only the owner can tell the list, and the edit token is what proves it.
    const site = await db
      .prepare('SELECT slug, config, email FROM site_claims WHERE slug = ? AND edit_token = ?')
      .bind(slug, key).first();
    if (!site) return json({ error: 'Not allowed' }, 403);

    let cfg: any = {};
    try { cfg = JSON.parse(String(site.config) || '{}'); } catch { /* no */ }
    const who = cfg?.name || slug;

    const people = await db
      .prepare('SELECT id, name, email FROM waitlist WHERE slug = ? AND left_at IS NULL ORDER BY created_at')
      .bind(slug).all();
    const list = (people?.results || []) as any[];
    if (!list.length) return json({ ok: false, why: 'nobody on the list yet' });

    const id = crypto.randomUUID();
    await db
      .prepare('INSERT INTO slot_offers (id, slug, slot, created_at, told) VALUES (?, ?, ?, ?, ?)')
      .bind(id, slug, slot, new Date().toISOString(), list.length)
      .run();

    // One at a time rather than one mail to everybody: each needs its own claim
    // link, and nobody should see who else is on the list.
    let sent = 0;
    for (const person of list) {
      const link = `https://garage.co.nz/grab/${id}.${person.id}`;
      const out = await sendMail(env, {
        to: person.email,
        subject: `A time has opened up at ${who} — ${slot}`,
        text:
          `Hello ${person.name || 'there'},\n\n` +
          `You said you could come at short notice. This has just opened up:\n\n` +
          `    ${slot}\n\n` +
          `First to say yes takes it:\n${link}\n\n` +
          `If it does not suit, do nothing — you stay on the list for the next one.\n\n` +
          `To come off the list altogether: https://garage.co.nz/grab/${id}.${person.id}?off=1\n`,
      });
      if (out.ok) sent++;
    }

    return json({ ok: true, id, told: sent, of: list.length });
  } catch (error) {
    console.error('Waitlist tell failed:', error);
    return json({ error: 'Could not tell the list' }, 500);
  }
};

export const prerender = false;
