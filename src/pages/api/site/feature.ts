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

    await db.prepare('UPDATE site_claims SET in_projects = ? WHERE slug = ?').bind(on, slug).run();
    return json({ ok: true, on: !!on });
  } catch {
    return json({ error: 'Could not do that' }, 500);
  }
};
