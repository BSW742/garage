import type { APIRoute } from 'astro';

export const prerender = false;

// The page lives on a subdomain and this lives on the apex, so every reply
// needs CORS — same arrangement as the tribute wall and the diary.
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

const MAX_IMAGE = 8_000_000;
const PER_HOUR = 15;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals.runtime?.env as any) || {};
    const db = env.DB;
    const bucket = env.IMAGES;
    if (!db) return json({ error: 'not-configured' }, 503);

    const payload = await request.json().catch(() => null);
    if (!payload) return json({ error: 'Bad request' }, 400);

    const slug = String(payload.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(slug)) return json({ error: 'Bad address' }, 400);

    // Only a chain page takes messages. Everything else would be an open
    // write into somebody else's site.
    const row = await db
      .prepare("SELECT config, unlocked_at FROM site_claims WHERE slug = ? AND status != 'archived'")
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such page' }, 404);

    let config: any = {};
    try { config = JSON.parse(String(row.config) || '{}'); } catch {}
    if (String(config.style || '') !== 'chain') {
      return json({ error: 'This page does not take messages' }, 403);
    }

    const body = String(payload.body || '').trim().slice(0, 900);
    const who = String(payload.who || '').trim().slice(0, 40);
    if (body.length < 2) return json({ error: 'Write something first' }, 400);
    if (!who) return json({ error: 'Put your name on it' }, 400);

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const since = new Date(Date.now() - 3600_000).toISOString();
    const recent = await db
      .prepare('SELECT COUNT(*) AS n FROM chain_notes WHERE sender_ip = ? AND created_at > ?')
      .bind(ip, since)
      .first();
    if (Number(recent?.n || 0) >= PER_HOUR) {
      return json({ error: 'That is a lot at once — try again shortly.' }, 429);
    }

    // A photo is optional, and a bad one should never cost somebody the words
    // they just wrote — so a failure here drops the picture, not the message.
    let url: string | null = null;
    const image = String(payload.image || '');
    if (image && bucket) {
      const match = image.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
      if (match && image.length <= MAX_IMAGE) {
        try {
          const binary = atob(match[2]);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          // /images/[filename] is a single segment route, so the key stays flat.
          const ext = match[1].split('/')[1];
          const key = `chain-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          await bucket.put(key, bytes.buffer, { httpMetadata: { contentType: match[1] } });
          url = `https://garage.co.nz/images/${key}`;
        } catch (error) {
          console.error('Chain photo failed, keeping the message:', error);
        }
      }
    }

    await db
      .prepare(
        `INSERT INTO chain_notes (id, slug, body, who, url, status, sender_ip, created_at)
         VALUES (?, ?, ?, ?, ?, 'live', ?, ?)`
      )
      .bind(crypto.randomUUID(), slug, body, who, url, ip, new Date().toISOString())
      .run();

    // What comes back drives the pass-it-on step, so it has to be the count
    // after this one landed, not before.
    const total = await db
      .prepare("SELECT COUNT(*) AS n FROM chain_notes WHERE slug = ? AND status = 'live'")
      .bind(slug)
      .first();
    const count = Number(total?.n || 0);
    const asked = Math.round(Number(config.target));
    const target = Number.isFinite(asked) && asked >= 1 ? Math.min(500, asked) : Math.max(10, count);
    const unlocked = !!row.unlocked_at || count >= target;

    return json({ ok: true, count, target, togo: Math.max(0, target - count), unlocked });
  } catch (error) {
    console.error('Chain note failed:', error);
    return json({ error: 'Could not save that, sorry' }, 500);
  }
};
