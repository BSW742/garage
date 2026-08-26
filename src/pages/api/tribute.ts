import type { APIRoute } from 'astro';

export const prerender = false;

// The page lives on a subdomain and this lives on the apex, so every reply
// needs CORS — same arrangement as the chat widget.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

// Roughly 8MB of base64, which is a generous phone photo after the page has
// already shrunk it. Anything larger is not a family snapshot.
const MAX_CHARS = 8_000_000;
const PER_HOUR = 12;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    const bucket = env.IMAGES;
    if (!db || !bucket) return json({ error: 'not-configured' }, 503);

    const body = await request.json().catch(() => null);
    if (!body) return json({ error: 'Bad request' }, 400);

    const slug = String(body.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(slug)) return json({ error: 'Bad address' }, 400);

    // Only a tribute page accepts photographs. Everything else would be an
    // open write into somebody's site.
    const row = await db
      .prepare("SELECT config FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such page' }, 404);
    let style = '';
    try { style = String(JSON.parse(String(row.config) || '{}').style || ''); } catch {}
    if (style !== 'tribute') return json({ error: 'This page does not take photos' }, 403);

    const image = String(body.image || '');
    if (!image.startsWith('data:image/')) return json({ error: 'Send an image' }, 400);
    if (image.length > MAX_CHARS) return json({ error: 'That photo is too big' }, 413);

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const since = new Date(Date.now() - 3600_000).toISOString();
    const recent = await db
      .prepare('SELECT COUNT(*) AS n FROM tribute_photos WHERE sender_ip = ? AND created_at > ?')
      .bind(ip, since)
      .first();
    if (Number(recent?.n || 0) >= PER_HOUR) {
      return json({ error: 'That is a lot of photos at once — try again shortly.' }, 429);
    }

    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return json({ error: 'Send an image' }, 400);
    const contentType = match[1];
    if (!/^image\/(jpeg|png|webp|gif)$/.test(contentType)) {
      return json({ error: 'Send a JPEG, PNG or WebP' }, 400);
    }

    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // /images/[filename] is a single segment route, so the key stays flat —
    // a nested tribute/<slug>/... path would 404 on the way back out.
    const ext = contentType.split('/')[1];
    const key = `tribute-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await bucket.put(key, bytes.buffer, { httpMetadata: { contentType } });

    // Straight onto the wall. The family asked for it that way: at a funeral
    // photos arrive in a rush and a queue nobody is watching just means an
    // empty page. The take-down page is the safety net instead of a gate.
    await db
      .prepare(
        `INSERT INTO tribute_photos (id, slug, url, caption, who, status, sender_ip, created_at)
         VALUES (?, ?, ?, ?, ?, 'approved', ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        slug,
        `https://garage.co.nz/images/${key}`,
        String(body.caption || '').slice(0, 90),
        String(body.who || '').slice(0, 40),
        ip,
        new Date().toISOString()
      )
      .run();

    return json({ ok: true });
  } catch (error) {
    console.error('Tribute upload failed:', error);
    return json({ error: 'Could not save that, sorry' }, 500);
  }
};
