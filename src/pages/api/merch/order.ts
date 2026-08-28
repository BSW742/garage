import type { APIRoute } from 'astro';
import { sendMail } from '../../../lib/mail';
import { sendPushToAll } from '../../../lib/web-push';

/**
 * Somebody has ordered merch from garage.co.nz itself.
 *
 * Until now this went nowhere at all. The checkout waited two seconds, invented
 * an order number and cleared the basket — so anybody who used it believed they
 * had bought something and nobody ever found out. The card fields went with it,
 * because a form that takes a card and cannot charge it is worse than no form.
 *
 * No payment details are taken here and none should ever be, which is the same
 * rule /api/shop/order.ts already holds for every published site. The promise
 * is that a person reads the order and gets in touch to sort payment.
 */

const WHO = 'ben@bridgepoint.co.nz';

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json().catch(() => null)) as any;
    if (!body) return json({ error: 'Bad request' }, 400);

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return json({ error: 'Nothing in the cart' }, 400);

    const name = clip([body.firstName, body.lastName].filter(Boolean).join(' '), 80);
    const email = clip(body.email, 120);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'We need a name and an email' }, 400);
    }

    const phone = clip(body.phone, 40);
    const post = [clip(body.address, 160), clip(body.city, 80), clip(body.postcode, 20)]
      .filter(Boolean)
      .join(', ');

    const clean = items.slice(0, 40).map((i: any) => ({
      name: clip(i?.name, 120),
      size: clip(i?.size, 40) || undefined,
      price: Number(i?.price) || 0,
      qty: Math.max(1, Math.min(99, Number(i?.quantity ?? i?.qty) || 1)),
    }));
    const total = clean.reduce((sum, i) => sum + i.price * i.qty, 0);

    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    const id = crypto.randomUUID();

    // Stored first. The email is the thing that gets noticed, but a send that
    // fails must not be the only record that the order happened.
    if (db) {
      await db
        .prepare(
          `INSERT INTO orders (id, slug, name, email, phone, note, items, total, status, created_at)
           VALUES (?, 'garage-merch', ?, ?, ?, ?, ?, ?, 'new', ?)`
        )
        .bind(id, name, email, phone || null, post || null,
              JSON.stringify(clean), `$${total}`, new Date().toISOString())
        .run();
      try { await sendPushToAll(db); } catch { /* an alert failing must not lose the order */ }
    }

    const lines = clean
      .map((i) => `  ${i.qty} x ${i.name}${i.size ? ` (${i.size})` : ''}   $${i.price * i.qty}`)
      .join('\n');

    const sent = await sendMail(env, {
      to: WHO,
      replyTo: email,
      subject: `Merch order from ${name} — $${total}`,
      text:
        `${name} has ordered from the merch page.\n\n` +
        `${lines}\n\n` +
        `Total: $${total} NZD\n\n` +
        `Email: ${email}\n` +
        (phone ? `Phone: ${phone}\n` : '') +
        (post ? `Post to: ${post}\n` : '') +
        `\nNobody has paid anything — the checkout does not take payment.\n` +
        `Reply to this email to reach them and sort it.\n\n` +
        `Order ${id.slice(0, 8)}\n`,
    });

    // The customer is told the order arrived either way; a mail outage is ours
    // to notice, not theirs. But say so in the response so it is visible.
    return json({ ok: true, id: id.slice(0, 8), emailed: sent.ok });
  } catch (error) {
    console.error('Merch order failed:', error);
    return json({ error: 'Could not send that through' }, 500);
  }
};

export const prerender = false;
