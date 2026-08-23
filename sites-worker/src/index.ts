import { renderSite, renderTeam, renderCases, renderAvailable, llmsTxt, llmIndex, type SiteConfig } from '../../src/lib/site-render';
import { renderInbox } from '../../src/lib/chat-admin';

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

    // The owner's message inbox. The page itself is public; everything it
    // shows needs the site's edit_token, which it asks for as ?k=.
    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      return html(renderInbox(slug), 200);
    }

    if (url.pathname === '/robots.txt') {
      return new Response(
        `User-agent: *\nAllow: /\n\nSitemap: https://${slug}.garage.co.nz/sitemap.xml\n`,
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // The brief for anything arriving to read rather than to look. These sit
    // above the asset check below, which would otherwise 404 them on the dot.
    if (url.pathname === '/llms.txt' || url.pathname === '/.well-known/llm-index.json') {
      const row = await env.DB
        .prepare('SELECT config FROM site_claims WHERE slug = ? AND status != ?')
        .bind(slug, 'disabled')
        .first<{ config: string }>();
      if (!row || !row.config) return new Response('Not found', { status: 404 });
      const config = JSON.parse(row.config) as SiteConfig;

      if (url.pathname === '/llms.txt') {
        return new Response(llmsTxt(config, slug), {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
        });
      }
      return new Response(JSON.stringify(llmIndex(config, slug), null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      });
    }

    if (url.pathname === '/sitemap.xml') {
      const row = await env.DB
        .prepare('SELECT config FROM site_claims WHERE slug = ? AND status != ?')
        .bind(slug, 'disabled')
        .first<{ config: string }>();
      const config = row?.config ? (JSON.parse(row.config) as SiteConfig) : null;
      const base = `https://${slug}.garage.co.nz`;
      const paths = ['/'];
      if ((config?.team || []).length) paths.push('/team');
      if ((config?.cases || []).length) paths.push('/case-studies');
      const body =
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        paths.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n') +
        `\n</urlset>\n`;
      return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
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

      const config = JSON.parse(row.config) as SiteConfig;
      const path = url.pathname.replace(/\/+$/, '') || '/';

      // These are real pages, but only for sites that have something to put on
      // them. Everywhere else still falls through to the single page.
      if (path === '/team' && (config.team || []).length) {
        return html(renderTeam(config, slug), 200);
      }
      if ((path === '/case-studies' || path === '/cases') && (config.cases || []).length) {
        return html(renderCases(config, slug), 200);
      }

      return html(renderSite(config, slug), 200);
    } catch (error) {
      console.error('Site render error:', slug, error);
      return html(renderAvailable(slug), 404);
    }
  },
};
