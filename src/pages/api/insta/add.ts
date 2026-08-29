import type { APIRoute } from 'astro';

/**
 * Put an Instagram post on an insta wall.
 *
 * The gate is Instagram's own oEmbed. It answers without a token again as of
 * June 2026, and — the part that makes it useful — it returns 400 for a
 * shortcode that does not exist or is not public. So nothing lands on a page
 * unless Instagram has confirmed it is a real, public, embeddable post. That
 * is the same job oembed does for the reel template, and it is what stops a
 * wall filling up with dead grey squares nobody notices for a week.
 *
 * Writing needs the site's edit token, so only the owner can add. The wall is
 * meant for your own posts.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export const prerender = false;

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

// Posts, reels and the old tv links all carry the same kind of shortcode.
const LINK = /instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,24})/i;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ ok: false, message: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').toLowerCase().trim();
    const key = String(body?.key || '').trim();
    const raw = String(body?.url || '').trim();
    if (!slug || !key) return json({ ok: false, message: 'Missing site or key.' }, 400);

    const hit = raw.match(LINK);
    if (!hit) {
      return json({ ok: false, message: "That is not an Instagram post link — it should have /p/ or /reel/ in it." });
    }
    const kind = hit[1].toLowerCase().startsWith('reel') ? 'reel' : 'p';
    const code = hit[2];

    const site: any = await db
      .prepare('SELECT edit_token FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();
    if (!site || !site.edit_token || site.edit_token !== key) {
      return json({ ok: false, message: 'Not your page.' }, 403);
    }

    // Ask Instagram whether this is real and public before it goes anywhere.
    let live = false;
    try {
      const r = await fetch(
        'https://graph.facebook.com/v25.0/instagram_oembed?omitscript=true&url=' +
          encodeURIComponent(`https://www.instagram.com/${kind}/${code}/`)
      );
      live = r.ok;
    } catch {
      return json({ ok: false, message: 'Could not reach Instagram just now. Try again.' });
    }
    if (!live) {
      return json({
        ok: false,
        message: 'Instagram will not embed that one. It is usually a private account, a deleted post, or a story.',
      });
    }

    const done = await db
      .prepare(
        `INSERT INTO insta_posts (slug, code, kind) VALUES (?, ?, ?)
           ON CONFLICT (slug, code) DO NOTHING`
      )
      .bind(slug, code, kind)
      .run();

    if (!done.meta?.changes) return json({ ok: false, message: 'That one is already on the wall.' });
    return json({ ok: true, code });
  } catch (e) {
    return json({ ok: false, message: 'Something went wrong.' }, 500);
  }
};
