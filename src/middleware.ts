import { defineMiddleware } from 'astro:middleware';
import { renderSite, renderAvailable, type SiteConfig } from './lib/site-render';

// Hostnames that must keep serving the main app rather than a claimed site
const RESERVED_HOSTS = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'mx', 'ftp', 'ns', 'ns1', 'ns2',
  'cdn', 'static', 'assets', 'dev', 'staging', 'preview', 'test', 'local',
]);

/**
 * Everything under /admin is behind a password.
 *
 * These pages were open to anyone who guessed the path, and they hold the lot:
 * every site's edit token, which is the key to editing that site, alongside the
 * owners' email addresses. A lock on /admin/sites alone would have been
 * decorative, since /admin/outreach carries the same emails, so the gate sits
 * over the whole section.
 *
 * Basic auth, because it needs no form, no cookie and no session table, and the
 * browser remembers it. The password is a secret on the Pages project, never in
 * this file. If the secret is missing the section is shut rather than open — a
 * misconfiguration must not be the thing that unlocks it.
 */
function guardAdmin(context: any): Response | null {
  const url = new URL(context.request.url);
  // /record can send email to real businesses and attach video to their sites,
  // so it belongs behind the same door as /admin. The play ping stays open —
  // it is called from every published subdomain by people who are not Ben.
  const guarded =
    /^\/admin(\/|$)/.test(url.pathname) ||
    /^\/record(\/|$)/.test(url.pathname) ||
    // A box that will mail anybody belongs behind the same door as /admin.
    /^\/api\/mail(\/|$)/.test(url.pathname) ||
    // seen and like are called from every published subdomain by the business
    // owner, who does not have the password and never will. Everything else
    // under /api/record can send mail or attach video, so it stays shut.
    (/^\/api\/record(\/|$)/.test(url.pathname) &&
      !/^\/api\/record\/(seen|like|want)$/.test(url.pathname));
  if (!guarded) return null;

  const shut = (why: string) =>
    new Response(why, {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="garage admin", charset="UTF-8"',
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  const want = (context.locals as any).runtime?.env?.ADMIN_PASSWORD;
  if (!want) return shut('Admin password is not configured.');

  const header = context.request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (!/^basic$/i.test(scheme || '') || !encoded) return shut('Sign in.');

  let given = '';
  try {
    // The username is ignored; anything will do. atob is fine for ASCII, and a
    // password outside it would not survive basic auth anyway.
    given = atob(encoded).split(':').slice(1).join(':');
  } catch {
    return shut('Sign in.');
  }

  // Constant time, so a wrong password cannot be narrowed a character at a time.
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(String(want));
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  if (diff !== 0) return shut('Sign in.');

  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const locked = guardAdmin(context);
  if (locked) return locked;

  const host = (context.request.headers.get('host') || '').toLowerCase().split(':')[0];
  const match = host.match(/^([a-z0-9-]{1,63})\.garage\.co\.nz$/);

  if (!match || RESERVED_HOSTS.has(match[1])) return next();

  const slug = match[1];
  const db = (context.locals as any).runtime?.env?.DB;

  const page = (html: string, status: number) =>
    new Response(html, {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
      },
    });

  if (!db) return page(renderAvailable(slug), 404);

  try {
    const row = await db
      .prepare('SELECT config FROM site_claims WHERE slug = ? AND status != ?')
      .bind(slug, 'disabled')
      .first();

    if (!row || !row.config) return page(renderAvailable(slug), 404);

    const site = JSON.parse(row.config as string) as SiteConfig;
    return page(renderSite(site, slug), 200);
  } catch (error) {
    console.error('Subdomain render error:', slug, error);
    return page(renderAvailable(slug), 404);
  }
});
