import type { APIRoute } from 'astro';

/**
 * Take the recording and hang it on that site.
 *
 * The body is the webm itself rather than a multipart form: it is one file
 * from one recorder, and a form would only wrap it in a boundary for the sake
 * of it. R2 already serves everything else through /images/<key>.
 *
 * Behind the /admin password? No — this sits under /api, which the middleware
 * does not guard. It checks the site exists and caps the size, and a stranger
 * who guesses it can attach a video to a site nobody has claimed. Worth
 * revisiting the moment this is doing anything but Ben's own outreach.
 */

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

const MAX_BYTES = 60 * 1024 * 1024;   // a minute of 720p webm is nowhere near this

export const prerender = false;

export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    const bucket = env.IMAGES;
    if (!db || !bucket) return json({ ok: false, message: 'not-configured' }, 503);

    const slug = String(url.searchParams.get('s') || '').toLowerCase().trim();
    const seconds = Math.max(0, Math.min(600, Number(url.searchParams.get('secs')) || 0));
    if (!/^[a-z0-9-]{2,63}$/.test(slug)) return json({ ok: false, message: 'bad slug' }, 400);

    const site = await db.prepare("SELECT slug FROM site_claims WHERE slug = ? AND status != 'disabled'")
      .bind(slug).first();
    if (!site) return json({ ok: false, message: 'no such site' }, 404);

    const body = await request.arrayBuffer();
    if (!body.byteLength) return json({ ok: false, message: 'empty' }, 400);
    if (body.byteLength > MAX_BYTES) return json({ ok: false, message: 'too big' }, 413);

    // The extension follows the actual file. It was hardcoded to .webm, which
    // was harmless right up until the format had to change — and it had to,
    // because Safari does not play VP9 in WebM and every browser on an iPhone
    // is Safari underneath.
    const type = (request.headers.get('content-type') || 'video/mp4').split(';')[0].trim();
    const ext = type === 'video/webm' ? 'webm' : type === 'video/quicktime' ? 'mov' : 'mp4';
    const id = crypto.randomUUID();
    const key = `rec-${slug}-${id.slice(0, 8)}.${ext}`;
    await bucket.put(key, body, { httpMetadata: { contentType: type } });

    // One live take per site. A second recording replaces the first rather
    // than stacking, because the page shows one and the rest would be litter.
    await db.prepare("UPDATE recordings SET status = 'replaced' WHERE slug = ? AND status = 'live'")
      .bind(slug).run();
    await db.prepare(
      `INSERT INTO recordings (id, slug, key, seconds, bytes, status)
       VALUES (?, ?, ?, ?, ?, 'live')`
    ).bind(id, slug, key, seconds, body.byteLength).run();

    return json({ ok: true, key, url: `https://garage.co.nz/images/${key}` });
  } catch (e: any) {
    return json({ ok: false, message: String(e?.message || e) }, 500);
  }
};
