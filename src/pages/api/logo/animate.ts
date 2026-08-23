import type { APIRoute } from 'astro';
import { json, preflight } from '../../../lib/chat';

export const OPTIONS: APIRoute = async () => preflight();

const MODEL = 'grok-imagine-video-1.5';

// Animating costs about twenty times what drawing a still does, so this gets a
// tighter leash than the image endpoint.
const VIDEO_PER_IP_HOUR = 4;
const VIDEO_PER_DAY = 30;

// Cloudflare will not hold a request open indefinitely, so give up in good time
// rather than being cut off mid-poll.
const POLL_LIMIT_MS = 78_000;
const POLL_EVERY_MS = 3_000;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env as any) || {};
  const db = env.DB;
  const key = env.XAI_API_KEY;
  const bucket = env.IMAGES;

  if (!key) return json({ error: 'Animation is not configured' }, 503);
  if (!db || !bucket) return json({ error: 'Storage unavailable' }, 503);

  const body = await request.json().catch(() => ({}));
  const source = String((body as any)?.url ?? '').trim();
  if (!/^https?:\/\//i.test(source)) return json({ error: 'No logo to animate' }, 400);

  const slug = String((body as any)?.slug ?? '').slice(0, 63) || null;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const mine = await db
    .prepare("SELECT COUNT(*) AS n FROM logo_jobs WHERE ip = ? AND prompt LIKE 'animate:%' AND created_at > ?")
    .bind(ip, hourAgo)
    .first();
  if ((mine?.n ?? 0) >= VIDEO_PER_IP_HOUR) {
    return json({ error: 'That is a few animations in one hour. Try again shortly.' }, 429);
  }
  const all = await db
    .prepare("SELECT COUNT(*) AS n FROM logo_jobs WHERE prompt LIKE 'animate:%' AND created_at > ?")
    .bind(dayAgo)
    .first();
  if ((all?.n ?? 0) >= VIDEO_PER_DAY) {
    return json({ error: 'No more animations today. Try again tomorrow.' }, 429);
  }

  const id = crypto.randomUUID();
  // Lettering is the thing that warps when a still is animated, so say plainly
  // that it must not.
  const prompt =
    'Gently animate this logo. The artwork moves subtly and playfully. ' +
    'Any text or lettering stays completely still, sharp and unchanged. ' +
    'Keep the background plain and the composition exactly as it is.';

  let url: string | null = null;
  let failure: string | null = null;

  try {
    const started = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, image: { url: source }, duration: 5 }),
    });
    if (!started.ok) {
      failure = `video service returned ${started.status}`;
    } else {
      const { request_id: requestId } = await started.json();
      if (!requestId) {
        failure = 'video service gave us nothing to follow up';
      } else {
        const deadline = Date.now() + POLL_LIMIT_MS;
        let videoUrl: string | null = null;
        while (Date.now() < deadline) {
          await wait(POLL_EVERY_MS);
          const poll = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
            headers: { Authorization: `Bearer ${key}` },
          });
          if (!poll.ok) continue;
          const state = await poll.json();
          if (state?.status === 'done') { videoUrl = state?.video?.url || null; break; }
          if (state?.status === 'failed' || state?.status === 'expired') {
            failure = `animation ${state.status}`;
            break;
          }
        }
        if (!videoUrl && !failure) failure = 'animation took too long';

        if (videoUrl) {
          const film = await fetch(videoUrl);
          if (!film.ok) {
            failure = 'could not collect the finished animation';
          } else {
            const bytes = await film.arrayBuffer();
            const objectKey = `logo-${slug || 'new'}-${id.slice(0, 8)}.mp4`;
            await bucket.put(objectKey, bytes, { httpMetadata: { contentType: 'video/mp4' } });
            url = `https://garage.co.nz/images/${objectKey}`;
          }
        }
      }
    }
  } catch (error) {
    failure = String((error as Error)?.message || error).slice(0, 200);
  }

  try {
    await db
      .prepare(
        `INSERT INTO logo_jobs (id, slug, ip, prompt, url, error, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, slug, ip, 'animate: ' + source.slice(0, 200), url, failure, new Date().toISOString())
      .run();
  } catch { /* never lose the film over bookkeeping */ }

  if (!url) return json({ error: failure || 'animation failed' }, 502);
  return json({ id, url });
};

export const prerender = false;
