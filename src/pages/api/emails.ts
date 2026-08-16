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
  all(): Promise<{ results: Email[] }>;
  first(): Promise<Email | null>;
}

interface Email {
  id: number;
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  read: number;
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { results } = await DB.prepare(
      'SELECT * FROM emails ORDER BY received_at DESC LIMIT 50'
    ).all();

    return new Response(JSON.stringify({ emails: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id, read } = await request.json();

    await DB.prepare('UPDATE emails SET read = ? WHERE id = ?')
      .bind(read ? 1 : 0, id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id } = await request.json();

    await DB.prepare('DELETE FROM emails WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST endpoint for the email worker to store incoming emails
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const email = await request.json();

    await DB.prepare(`
      INSERT INTO emails (from_address, from_name, to_address, subject, body_text, body_html, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      email.from_address,
      email.from_name || null,
      email.to_address,
      email.subject || null,
      email.body_text || null,
      email.body_html || null,
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
