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

// GET - fetch all booked slots
export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = (locals as { runtime?: Runtime }).runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ slots: {} }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_key TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        email TEXT,
        name TEXT,
        topic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const result = await db.prepare('SELECT slot_key, status FROM bookings').all();
    const slots: Record<string, string> = {};

    for (const row of result.results as Array<{ slot_key: string; status: string }>) {
      slots[row.slot_key] = row.status;
    }

    return new Response(JSON.stringify({ slots }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Bookings GET error:', error);
    return new Response(JSON.stringify({ slots: {}, error: (error as Error).message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST - create a booking
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { slotKey, status, email, name, topic } = await request.json();

    if (!slotKey || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = (locals as { runtime?: Runtime }).runtime?.env?.DB;

    if (!db) {
      console.log('Booking (no DB):', { slotKey, status, email, name, topic });
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_key TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        email TEXT,
        name TEXT,
        topic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Insert or replace the booking
    await db.prepare(`
      INSERT OR REPLACE INTO bookings (slot_key, status, email, name, topic)
      VALUES (?, ?, ?, ?, ?)
    `).bind(slotKey, status, email || null, name || null, topic || null).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Bookings POST error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
