import type { APIRoute } from 'astro';

/**
 * Put a message away.
 *
 * A stamp rather than a DELETE: the volume here will never be a reason to
 * destroy anything, and a message archived by mistake should be one SQL
 * statement from coming back rather than gone for good. Bookings already had
 * a status column, so they use it.
 */

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ ok: false, message: 'not-configured' }, 503);
    const body = (await request.json().catch(() => null)) as any;
    const id = String(body?.id || '');
    const kind = String(body?.kind || '');
    if (!id) return json({ ok: false, message: 'which one?' }, 400);

    if (kind === 'in') {
      await db.prepare("UPDATE site_mail SET archived_at = datetime('now') WHERE id = ?").bind(id).run();
    } else if (kind === 'out') {
      await db.prepare("UPDATE outbox SET archived_at = datetime('now') WHERE id = ?").bind(id).run();
    } else if (kind === 'booking') {
      await db.prepare("UPDATE bookings SET status = 'done' WHERE id = ?").bind(id).run();
    } else {
      return json({ ok: false, message: 'unknown kind' }, 400);
    }
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, message: String(e?.message || e) }, 500);
  }
};
