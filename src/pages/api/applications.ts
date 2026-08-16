import type { APIRoute } from 'astro';

interface Runtime {
  env: {
    DB: D1Database;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all(): Promise<{ results: unknown[] }>;
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;

    // Create table if it doesn't exist
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS charity_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_name TEXT NOT NULL,
        mission TEXT NOT NULL,
        has_website TEXT,
        current_url TEXT,
        need TEXT,
        contact_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const result = await DB.prepare(`
      SELECT * FROM charity_applications
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({ applications: result.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    return new Response(JSON.stringify({ applications: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id, status } = await request.json();

    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'Missing id or status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await DB.prepare(
      'UPDATE charity_applications SET status = ? WHERE id = ?'
    ).bind(status, id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Status update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
