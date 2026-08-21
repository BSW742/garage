import type { APIRoute } from 'astro';

export const prerender = false;

// Names we never hand out as subdomains
const RESERVED = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'ftp', 'ns', 'ns1', 'ns2',
  'blog', 'shop', 'store', 'help', 'support', 'docs', 'status', 'cdn', 'static',
  'assets', 'img', 'images', 'media', 'files', 'dev', 'staging', 'test', 'demo',
  'garage', 'build', 'apply', 'login', 'signup', 'register', 'account', 'dashboard',
  'sell', 'buy', 'cars', 'listings', 'noticeboard', 'merch', 'booking', 'projects',
  'about', 'contact', 'me', 'my', 'new', 'edit', 'sites', 'site', 'web',
]);

// Sites already generated in this repo
const EXISTING = new Set([
  'flow-line', 'flowline-plumbers', 'flp', 'pohlen-hospital', 'pohlen',
  'bridgepoint', 'waltonboxing', 'raglanders',
]);

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\.(garage\.co\.nz|co\.nz|nz|com)$/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function isTaken(db: any, slug: string): Promise<boolean> {
  if (RESERVED.has(slug) || EXISTING.has(slug)) return true;
  if (!db) return false;
  try {
    const row = await db
      .prepare('SELECT slug FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();
    return !!row;
  } catch {
    // Table doesn't exist yet — nothing is claimed
    return false;
  }
}

export const GET: APIRoute = async ({ url, locals }) => {
  const raw = url.searchParams.get('slug') || '';
  const slug = slugify(raw);
  const db = (locals.runtime?.env as any)?.DB;

  const json = (body: Record<string, unknown>) =>
    new Response(JSON.stringify({ slug, ...body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

  if (slug.length < 3) return json({ available: false, reason: 'too-short', suggestions: [] });
  if (slug.length > 40) return json({ available: false, reason: 'too-long', suggestions: [] });

  const taken = await isTaken(db, slug);
  if (!taken) return json({ available: true, reason: 'ok', suggestions: [] });

  // Offer a few nearby names that are actually free
  const candidates = [`${slug}nz`, `${slug}-nz`, `get${slug}`, `${slug}hq`, `the${slug}`, `${slug}co`];
  const suggestions: string[] = [];
  for (const c of candidates) {
    if (suggestions.length >= 3) break;
    if (!(await isTaken(db, c))) suggestions.push(c);
  }

  return json({ available: false, reason: 'taken', suggestions });
};
