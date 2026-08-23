import type { APIRoute } from 'astro';
import { json, preflight } from '../../../lib/chat';

export const OPTIONS: APIRoute = async () => preflight();

const MAX_BYTES = 3_000_000;
const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

/**
 * Take a copy of a logo found on the customer's existing site.
 *
 * Hotlinking it would work right up until they cancel the hosting for the site
 * we are replacing — which is the entire point of them being here — and their
 * new site would quietly lose its logo.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { url } = await request.json();
    const source = String(url ?? '').trim();
    if (!/^https?:\/\//i.test(source)) return json({ error: 'Not a usable address' }, 400);

    const bucket = (locals.runtime?.env as any)?.IMAGES;
    if (!bucket) return json({ error: 'Storage unavailable' }, 503);

    const res = await fetch(source, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*' },
    });
    if (!res.ok) return json({ error: 'Could not fetch that image' }, 502);

    const type = (res.headers.get('content-type') || '').split(';')[0].toLowerCase();
    if (!OK_TYPES.includes(type)) return json({ error: 'That is not an image we can use' }, 415);

    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return json({ error: 'That image is too big' }, 413);

    const ext = type === 'image/svg+xml' ? 'svg' : type.split('/')[1].replace('jpeg', 'jpg');
    const key = `logo-kept-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: type } });

    return json({ url: `https://garage.co.nz/images/${key}` });
  } catch (error) {
    console.error('Logo adopt error:', error);
    return json({ error: 'Could not keep that image' }, 500);
  }
};

export const prerender = false;
