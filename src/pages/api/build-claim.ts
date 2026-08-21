import type { APIRoute } from 'astro';
import { sendPushToAll } from '../../lib/web-push';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { slug, email, sourceUrl, site } = data as {
      slug?: string;
      email?: string;
      sourceUrl?: string;
      site?: Record<string, unknown>;
    };

    if (!slug || !email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Slug and a valid email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) {
      console.log('Site claim (no DB):', slug, email);
      return new Response(JSON.stringify({ success: true, url: `https://${slug}.garage.co.nz` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS site_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        source_url TEXT,
        config TEXT,
        status TEXT DEFAULT 'live',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    try {
      await db.prepare(`
        INSERT INTO site_claims (slug, email, source_url, config)
        VALUES (?, ?, ?, ?)
      `).bind(slug, email, sourceUrl || null, JSON.stringify(site || {})).run();
    } catch (e) {
      // UNIQUE constraint — someone grabbed it between the check and the claim
      return new Response(JSON.stringify({ error: 'taken' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      await sendPushToAll(db, {
        title: 'New site built',
        body: `${slug}.garage.co.nz just went live`,
      });
    } catch (pushError) {
      console.error('Push notification error:', pushError);
    }

    return new Response(JSON.stringify({ success: true, url: `https://${slug}.garage.co.nz` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Site claim error:', error);
    return new Response(JSON.stringify({ error: 'Failed to claim site' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
