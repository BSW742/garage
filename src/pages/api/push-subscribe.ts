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
  first(): Promise<unknown>;
}

// Store push subscription
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return new Response(JSON.stringify({ error: 'Invalid subscription' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create table if needed
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Upsert subscription
    await DB.prepare(`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES (?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `).bind(
      subscription.endpoint,
      subscription.keys?.p256dh || '',
      subscription.keys?.auth || ''
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Remove subscription
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { endpoint } = await request.json();

    await DB.prepare(
      'DELETE FROM push_subscriptions WHERE endpoint = ?'
    ).bind(endpoint).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to remove subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
