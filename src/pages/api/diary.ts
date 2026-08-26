import type { APIRoute } from 'astro';

export const prerender = false;

// The page lives on a subdomain and this lives on the apex, so every reply
// needs CORS — same arrangement as the tribute wall.
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

// Photos come through shrunk, so 8MB of base64 is generous. Video cannot be
// shrunk in a browser, so it gets its own ceiling — about ten seconds off a
// phone. The page warns before sending rather than letting it fail up here.
const MAX_IMAGE = 8_000_000;
const MAX_VIDEO = 13_000_000;
const PER_HOUR = 20;

const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif)$/;
const VIDEO_TYPES = /^video\/(mp4|quicktime|webm)$/;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

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

    // Only a diary page takes posts. Everything else would be an open write
    // into somebody else's site.
    const row = await db
      .prepare("SELECT config FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such page' }, 404);
    let style = '';
    try { style = String(JSON.parse(String(row.config) || '{}').style || ''); } catch {}
    if (style !== 'diet') return json({ error: 'This page does not take posts' }, 403);

    const payload = String(body.file || '');
    const match = payload.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return json({ error: 'Send a photo or a video' }, 400);

    const contentType = match[1];
    const isVideo = VIDEO_TYPES.test(contentType);
    if (!isVideo && !IMAGE_TYPES.test(contentType)) {
      return json({ error: 'Send a JPEG, PNG, WebP or an MP4' }, 400);
    }
    if (payload.length > (isVideo ? MAX_VIDEO : MAX_IMAGE)) {
      return json(
        { error: isVideo ? 'That clip is too long — try under ten seconds.' : 'That photo is too big' },
        413
      );
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const since = new Date(Date.now() - 3600_000).toISOString();
    const recent = await db
      .prepare('SELECT COUNT(*) AS n FROM diary_posts WHERE sender_ip = ? AND created_at > ?')
      .bind(ip, since)
      .first();
    if (Number(recent?.n || 0) >= PER_HOUR) {
      return json({ error: 'That is a lot of meals at once — try again shortly.' }, 429);
    }

    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // /images/[filename] is a single segment route, so the key stays flat —
    // a nested diary/<slug>/... path would 404 on the way back out.
    const ext = EXTENSIONS[contentType] || 'bin';
    const key = `diary-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await bucket.put(key, bytes.buffer, { httpMetadata: { contentType } });

    await db
      .prepare(
        `INSERT INTO diary_posts (id, slug, url, kind, verdict, caption, who, status, sender_ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'live', ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        slug,
        `https://garage.co.nz/images/${key}`,
        isVideo ? 'video' : 'photo',
        String(body.verdict) === 'bad' ? 'bad' : 'good',
        String(body.caption || '').slice(0, 90),
        String(body.who || '').slice(0, 40),
        ip,
        new Date().toISOString()
      )
      .run();

    return json({ ok: true });
  } catch (error) {
    console.error('Diary post failed:', error);
    return json({ error: 'Could not save that, sorry' }, 500);
  }
};
