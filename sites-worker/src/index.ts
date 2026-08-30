import { renderSite, renderTeam, renderCases, renderAvailable, renderEventPage, setPageNote, llmsTxt, llmIndex, type SiteConfig } from '../../src/lib/site-render';
import { renderInbox, inboxManifest } from '../../src/lib/chat-admin';
import { renderPhotoQueue } from '../../src/lib/tribute-admin';

// Hostnames that belong to the main app, not to a claimed site
const RESERVED_HOSTS = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'mx', 'ftp', 'ns', 'ns1', 'ns2',
  'cdn', 'static', 'assets', 'dev', 'staging', 'preview', 'test', 'local',
]);

interface Env {
  DB: D1Database;
}

// The worker types are not pulled in here, and only waitUntil is needed.
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
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
  /**
   * Hourly. The worker holds no secret of its own — it reads garage.co.nz's
   * edit token out of the database it already has open, which is the same key
   * the admin page uses, and calls the endpoint with it.
   */
  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          const row = await env.DB
            .prepare("SELECT edit_token FROM site_claims WHERE slug = 'garage'")
            .first<{ edit_token: string }>();
          if (!row?.edit_token) return;
          const res = await fetch('https://garage.co.nz/api/cron/spawn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: row.edit_token }),
          });
          console.log('spawn:', res.status, (await res.text()).slice(0, 200));
        } catch (error) {
          // A missed hour is a missed hour. Nothing here is worth retrying into.
          console.error('Scheduled spawn failed:', error);
        }
      })()
    );
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

    // Installing the inbox on a phone only helps if the icon opens it unlocked,
    // so the key travels in the manifest's start_url.
    if (url.pathname === '/admin/manifest.webmanifest') {
      const key = url.searchParams.get('k') || '';
      return new Response(inboxManifest(slug, key), {
        headers: {
          'Content-Type': 'application/manifest+json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Where the family reviews what people have sent in. Public page, but it
    // shows nothing without the edit token in ?k=.
    if (url.pathname === '/photos' || url.pathname === '/photos/') {
      return html(renderPhotoQueue(slug), 200);
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
      for (const campaign of config?.campaigns || []) {
        const at = String(campaign?.path || '').replace(/^\/+|\/+$/g, '');
        if (at) paths.push('/' + at);
      }
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
        .prepare('SELECT config, unlocked_at FROM site_claims WHERE slug = ? AND status != ?')
        .bind(slug, 'disabled')
        .first<{ config: string; unlocked_at: string | null }>();

      if (!row || !row.config) return html(renderAvailable(slug), 404);

      const config = JSON.parse(row.config) as SiteConfig;
      const path = url.pathname.replace(/\/+$/, '') || '/';

      // A campaign hanging off this site. It is looked up before the fixed
      // pages below so a business can call theirs whatever they like.
      if (path !== '/') {
        const wanted = path.replace(/^\/+/, '').toLowerCase();
        const campaign = (config.campaigns || []).find(
          (c) => String(c?.path || '').replace(/^\/+|\/+$/g, '').toLowerCase() === wanted
        );
        if (campaign) {
          let count = 0;
          let names: string[] = [];
          let latest: string | undefined;
          try {
            // First names only. The email addresses never come near the HTML.
            const { results } = await env.DB
              .prepare(
                `SELECT name, created_at FROM rally_signups
                  WHERE slug = ? AND path = ? AND status = 'live'
                  ORDER BY created_at ASC LIMIT 500`
              )
              .bind(slug, wanted)
              .all<{ name: string; created_at: string }>();
            const rows = results || [];
            count = rows.length;
            names = rows.map((r) => String(r.name || '').split(/\s+/)[0]).filter(Boolean);
            latest = rows.length ? rows[rows.length - 1].created_at : undefined;
          } catch {
            // An empty rally still beats a page that 500s
          }
          return html(renderEventPage(config, slug, campaign, { count, names, latest }), 200);
        }
      }

      // These are real pages, but only for sites that have something to put on
      // them. Everywhere else still falls through to the single page.
      if (path === '/team' && (config.team || []).length) {
        return html(renderTeam(config, slug), 200);
      }
      if ((path === '/case-studies' || path === '/cases') && (config.cases || []).length) {
        return html(renderCases(config, slug), 200);
      }

      // A tribute page also carries whatever people have sent in and the
      // family has approved. Never the pending ones.
      let sent: any[] = [];
      if (config.style === 'tribute' || config.style === 'montage') {
        try {
          const { results } = await env.DB
            .prepare(
              `SELECT url, caption, who FROM tribute_photos
                WHERE slug = ? AND status = 'approved' ORDER BY created_at ASC LIMIT 300`
            )
            .bind(slug)
            .all();
          sent = results || [];
        } catch {
          // A page that loses the sent-in photos still beats a page that 500s
        }
      }
      // A diary page carries every day posted so far. Ordered oldest first so
      // the renderer's day map and streak walk read naturally.
      if (config.style === 'diet') {
        try {
          const { results } = await env.DB
            .prepare(
              `SELECT url, kind, verdict, caption, who, created_at FROM diary_posts
                WHERE slug = ? AND status = 'live' ORDER BY created_at ASC LIMIT 400`
            )
            .bind(slug)
            .all();
          sent = results || [];
        } catch {
          // A page that loses the feed still beats a page that 500s
        }
      }

      // A sixty-second video Ben recorded about this site, if there is one.
      // Cleared every request: a worker instance is reused across sites, and a
      // note left behind would appear on the next business's page.
      setPageNote(null);
      try {
        const take = await env.DB
          .prepare("SELECT key, seconds, liked_at FROM recordings WHERE slug = ? AND status = 'live' ORDER BY created_at DESC LIMIT 1")
          .bind(slug)
          .first<{ key: string; seconds: number; liked_at: string | null }>();
        if (take?.key) setPageNote({ key: take.key, seconds: take.seconds, liked: !!take.liked_at });
      } catch {
        // A page without the video still beats a page that 500s.
      }

      // An insta wall carries whatever the owner has pasted in. The paste box
      // itself only appears when the edit token is in the address, so a
      // visitor never sees it.
      let canAdd = false;
      if (config.style === 'insta') {
        try {
          const { results } = await env.DB
            .prepare(
              `SELECT code, kind FROM insta_posts
                WHERE slug = ? AND status = 'live' ORDER BY created_at DESC LIMIT 200`
            )
            .bind(slug)
            .all();
          sent = results || [];
        } catch {
          // An empty wall still beats a page that 500s
        }
        const key = url.searchParams.get('add') || '';
        if (key) {
          try {
            const own = await env.DB
              .prepare('SELECT edit_token FROM site_claims WHERE slug = ?')
              .bind(slug)
              .first<{ edit_token: string }>();
            canAdd = !!own?.edit_token && own.edit_token === key;
          } catch {
            canAdd = false;
          }
        }
      }

      // A chain page. While it is still filling up the bodies are never
      // selected — hiding them in CSS would not be hiding them at all — so a
      // locked page only ever learns who has added, and how many.
      let unlocked = false;
      if (config.style === 'chain') {
        try {
          const tally = await env.DB
            .prepare("SELECT COUNT(*) AS n FROM chain_notes WHERE slug = ? AND status = 'live'")
            .bind(slug)
            .first<{ n: number }>();
          const count = Number(tally?.n || 0);
          const asked = Math.round(Number((config as any).target));
          const target = Number.isFinite(asked) && asked >= 1 ? Math.min(500, asked) : Math.max(10, count);
          unlocked = !!row.unlocked_at || count >= target;

          const { results } = await env.DB
            .prepare(
              unlocked
                ? `SELECT body, who, url, created_at FROM chain_notes
                    WHERE slug = ? AND status = 'live' ORDER BY created_at ASC LIMIT 500`
                : `SELECT who, created_at FROM chain_notes
                    WHERE slug = ? AND status = 'live' ORDER BY created_at ASC LIMIT 500`
            )
            .bind(slug)
            .all();
          sent = results || [];
        } catch {
          // An empty chain still beats a page that 500s
        }
      }

      // A visit carrying the token from the offer email is the owner looking at
      // what we sent. Recorded after the response goes out — knowing they
      // looked is never worth making them wait.
      const seen = url.searchParams.get('v');
      if (seen) {
        ctx.waitUntil(
          env.DB
            .prepare(
              `UPDATE site_claims
                  SET owner_seen_at = COALESCE(owner_seen_at, ?),
                      owner_seen_last = ?,
                      owner_seen_count = owner_seen_count + 1
                WHERE slug = ? AND view_token = ?`
            )
            .bind(new Date().toISOString(), new Date().toISOString(), slug, seen)
            .run()
            .catch(() => {})
        );
      }

      return html(renderSite(config, slug, sent, { unlocked, canAdd }), 200);
    } catch (error) {
      console.error('Site render error:', slug, error);
      return html(renderAvailable(slug), 404);
    }
  },
};
