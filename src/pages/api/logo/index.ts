import type { APIRoute } from 'astro';
import { json, preflight } from '../../../lib/chat';
import { logoPrompt, cleanBrief, RATE_PER_IP_HOUR, RATE_PER_DAY } from '../../../lib/logo';

export const OPTIONS: APIRoute = async () => preflight();

const MODEL = 'grok-imagine-image-2.0';

/**
 * Generation takes well over a minute, which is long enough for a plain
 * request to be cut off in transit. Streaming keeps the connection alive and
 * gives the builder something honest to show while it waits.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env as any) || {};
  const db = env.DB;
  const key = env.XAI_API_KEY;
  const bucket = env.IMAGES;

  if (!key) return json({ error: 'Logo drawing is not configured' }, 503);
  if (!db || !bucket) return json({ error: 'Storage unavailable' }, 503);

  const body = await request.json().catch(() => ({}));
  const brief = cleanBrief(body);
  if (!brief) return json({ error: 'Tell me the business name first' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const slug = String((body as any)?.slug ?? '').slice(0, 63) || null;

  // Drawing costs real money and /ai is a public page.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const mine = await db
    .prepare('SELECT COUNT(*) AS n FROM logo_jobs WHERE ip = ? AND created_at > ?')
    .bind(ip, hourAgo)
    .first();
  if ((mine?.n ?? 0) >= RATE_PER_IP_HOUR) {
    return json({ error: 'That is a lot of logos in one hour. Try again shortly.' }, 429);
  }
  const all = await db
    .prepare('SELECT COUNT(*) AS n FROM logo_jobs WHERE created_at > ?')
    .bind(dayAgo)
    .first();
  if ((all?.n ?? 0) >= RATE_PER_DAY) {
    return json({ error: 'The drawing desk is flat out today. Try again tomorrow.' }, 429);
  }

  const id = crypto.randomUUID();
  const prompt = logoPrompt(brief);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      // Something has to travel down the wire while the model works, or the
      // connection looks idle and gets closed.
      const beat = setInterval(() => {
        try { send('drawing', { id }); } catch { /* closed */ }
      }, 5000);

      let url: string | null = null;
      let failure: string | null = null;

      try {
        send('drawing', { id });
        const res = await fetch('https://api.x.ai/v1/images/generations', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: MODEL, prompt, n: 1 }),
        });

        if (!res.ok) {
          failure = `image service returned ${res.status}`;
        } else {
          const data = await res.json();
          const temporary = data?.data?.[0]?.url;
          if (!temporary) {
            failure = 'image service returned nothing usable';
          } else {
            // That URL is short-lived, so take a copy before answering.
            const picture = await fetch(temporary);
            if (!picture.ok) {
              failure = 'could not collect the finished image';
            } else {
              const bytes = await picture.arrayBuffer();
              const type = picture.headers.get('content-type') || 'image/jpeg';
              const ext = type.includes('png') ? 'png' : 'jpg';
              const objectKey = `logo-${slug || 'new'}-${id.slice(0, 8)}.${ext}`;
              await bucket.put(objectKey, bytes, { httpMetadata: { contentType: type } });
              url = `https://garage.co.nz/images/${objectKey}`;
            }
          }
        }
      } catch (error) {
        failure = String((error as Error)?.message || error).slice(0, 200);
      }

      clearInterval(beat);

      try {
        await db
          .prepare(
            `INSERT INTO logo_jobs (id, slug, ip, prompt, url, error, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(id, slug, ip, prompt, url, failure, new Date().toISOString())
          .run();
      } catch { /* never lose the image over bookkeeping */ }

      if (url) send('done', { id, url });
      else send('failed', { id, error: failure || 'drawing failed' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
};

export const prerender = false;
