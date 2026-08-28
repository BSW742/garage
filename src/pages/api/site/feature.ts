import type { APIRoute } from 'astro';

export const prerender = false;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

/** Show or hide a site on the public work page. */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    const body = (await request.json().catch(() => null)) as any;
    const key = String(body?.key || '').trim();
    const slug = String(body?.slug || '').trim().toLowerCase();
    const on = body?.on ? 1 : 0;
    if (!db || !slug || !key) return json({ error: 'Bad request' }, 400);

    const allowed = await db
      .prepare("SELECT slug FROM site_claims WHERE slug = 'garage' AND edit_token = ?")
      .bind(key)
      .first();
    if (!allowed) return json({ error: 'Not allowed' }, 403);

    // Starring is also the approval. Sites the hourly job scraped from a real
    // business land disabled and invisible; putting one on the work page is the
    // moment somebody decided it should exist, so it goes live at the same
    // time. Unstarring does not take it down again — that is a separate call,
    // and quietly disabling somebody's page from a tidy-up would surprise.
    if (on) {
      await db.prepare(
        "UPDATE site_claims SET in_projects = 1, status = CASE WHEN status = 'disabled' THEN 'live' ELSE status END WHERE slug = ?"
      ).bind(slug).run();
    } else {
      await db.prepare('UPDATE site_claims SET in_projects = 0 WHERE slug = ?').bind(slug).run();
    }
    return json({ ok: true, on: !!on });
  } catch {
    return json({ error: 'Could not do that' }, 500);
  }
};
