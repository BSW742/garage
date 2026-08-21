import { renderSite, renderAvailable, type SiteConfig } from '../../src/lib/site-render';

// Hostnames that belong to the main app, not to a claimed site
const RESERVED_HOSTS = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'mx', 'ftp', 'ns', 'ns1', 'ns2',
  'cdn', 'static', 'assets', 'dev', 'staging', 'preview', 'test', 'local',
]);

interface Env {
  DB: D1Database;
}

const html = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const match = host.match(/^([a-z0-9-]{1,63})\.garage\.co\.nz$/);

    // Anything that isn't a site subdomain goes back to the main app
    if (!match || RESERVED_HOSTS.has(match[1])) {
      return Response.redirect('https://garage.co.nz' + url.pathname + url.search, 302);
    }

    const slug = match[1];

    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nAllow: /\n', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    if (url.pathname === '/favicon.ico' || url.pathname === '/favicon.svg') {
      return Response.redirect('https://garage.co.nz/favicon.svg', 302);
    }
    // Single-page sites: asset-looking paths simply don't exist
    if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) {
      return new Response('Not found', { status: 404 });
    }

    try {
      const row = await env.DB
        .prepare('SELECT config FROM site_claims WHERE slug = ? AND status != ?')
        .bind(slug, 'disabled')
        .first<{ config: string }>();

      if (!row || !row.config) return html(renderAvailable(slug), 404);

      return html(renderSite(JSON.parse(row.config) as SiteConfig, slug), 200);
    } catch (error) {
      console.error('Site render error:', slug, error);
      return html(renderAvailable(slug), 404);
    }
  },
};
