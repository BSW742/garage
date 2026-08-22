import type { APIRoute } from 'astro';

export const prerender = false;

// Hands a published site's config back so the builder can reopen it.
// Content only — the edit token is never returned here, so having this URL
// lets you look, not change. Editing still needs the token.
export const GET: APIRoute = async ({ params, locals }) => {
  const slug = String(params.slug || '').toLowerCase();
  const db = (locals.runtime?.env as any)?.DB;

  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'bad-slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!db) {
    return new Response(JSON.stringify({ error: 'no-db' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const row = await db
      .prepare('SELECT slug, config, source_url, status FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();

    if (!row) {
      return new Response(JSON.stringify({ error: 'not-found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        slug: row.slug,
        site: JSON.parse((row.config as string) || '{}'),
        sourceUrl: row.source_url || null,
        status: row.status,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    // Nothing has ever been published against this database
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return new Response(JSON.stringify({ error: 'not-found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Site fetch error:', slug, error);
    return new Response(JSON.stringify({ error: 'failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
