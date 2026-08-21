import { defineMiddleware } from 'astro:middleware';
import { renderSite, renderAvailable, type SiteConfig } from './lib/site-render';

// Hostnames that must keep serving the main app rather than a claimed site
const RESERVED_HOSTS = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'mx', 'ftp', 'ns', 'ns1', 'ns2',
  'cdn', 'static', 'assets', 'dev', 'staging', 'preview', 'test', 'local',
]);

export const onRequest = defineMiddleware(async (context, next) => {
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
