import type { APIRoute } from 'astro';

/** Somebody wants in sooner. Name on the list, nothing else happens yet. */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    if (!body) return json({ error: 'Bad request' }, 400);

    const slug = clip(body.slug, 63).toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(slug)) return json({ error: 'Unknown site' }, 400);

    const name = clip(body.name, 80);
    const email = clip(body.email, 120);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'We need a name and an email' }, 400);
    }

    // The site has to exist and have the list switched on, or this is an open
    // endpoint for writing rows into somebody else's database.
    const row = await db
      .prepare("SELECT config FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug).first();
    if (!row) return json({ error: 'No such site' }, 404);
    let live = false;
    try { live = !!JSON.parse(String(row.config) || '{}')?.waitlist?.on; } catch { /* no */ }
    if (!live) return json({ error: 'That list is not open' }, 403);

    // Joining twice is a person checking rather than a person cheating, so it
    // updates what is there instead of making a second entry to email twice.
    const already = await db
      .prepare('SELECT id FROM waitlist WHERE slug = ? AND lower(email) = lower(?) AND left_at IS NULL')
      .bind(slug, email).first();
    if (already) {
      await db
        .prepare('UPDATE waitlist SET name = ?, phone = ?, note = ? WHERE id = ?')
        .bind(name, clip(body.phone, 40) || null, clip(body.note, 120) || null, already.id)
        .run();
      return json({ ok: true, id: already.id, already: true });
    }

    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO waitlist (id, slug, name, email, phone, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, slug, name, email, clip(body.phone, 40) || null,
            clip(body.note, 120) || null, new Date().toISOString())
      .run();

    return json({ ok: true, id });
  } catch (error) {
    console.error('Waitlist join failed:', error);
    return json({ error: 'Could not add you' }, 500);
  }
};

export const prerender = false;
