import type { APIRoute } from 'astro';
import { json, preflight, cleanSlug, nowIso } from '../../../lib/chat';
import { sendPushToAll } from '../../../lib/web-push';

export const OPTIONS: APIRoute = async () => preflight();

/**
 * Someone has filled a cart on a published site and asked to be contacted.
 *
 * No payment details are taken here and none should ever be: the whole promise
 * is that a person checks stock and gets in touch. Anything that looked like a
 * card field would be a lie about what happens next.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const slug = cleanSlug((body as any)?.slug);
    if (!slug) return json({ error: 'Unknown site' }, 400);

    const items = Array.isArray((body as any)?.items) ? (body as any).items : [];
    if (!items.length) return json({ error: 'Nothing in the cart' }, 400);

    const name = String((body as any)?.name ?? '').trim().slice(0, 80);
    const email = String((body as any)?.email ?? '').trim().slice(0, 120);
    const phone = String((body as any)?.phone ?? '').trim().slice(0, 40);
    if (!name || (!email && !phone)) {
      return json({ error: 'We need a name and a way to reach you' }, 400);
    }

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'Database unavailable' }, 500);

    const clean = items.slice(0, 40).map((i: any) => ({
      name: String(i?.name ?? '').slice(0, 120),
      price: String(i?.price ?? '').slice(0, 40),
      qty: Math.max(1, Math.min(99, Number(i?.qty) || 1)),
    }));

    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO orders (id, slug, name, email, phone, note, items, total, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
      )
      .bind(
        id, slug, name, email || null, phone || null,
        String((body as any)?.note ?? '').trim().slice(0, 800) || null,
        JSON.stringify(clean),
        String((body as any)?.total ?? '').slice(0, 40) || null,
        nowIso()
      )
      .run();

    // Same shared push list the chat uses. Reaching the individual owner still
    // needs a way to send mail, which nothing here has yet.
    try { await sendPushToAll(db); } catch { /* an alert failing must not lose the order */ }

    return json({ ok: true, id });
  } catch (error) {
    console.error('Order error:', error);
    return json({ error: 'Could not send that through' }, 500);
  }
};

export const prerender = false;
