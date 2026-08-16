import type { APIRoute } from 'astro';
import { sendPushToAll } from '../../lib/web-push';

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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { name, email, time, meetingType } = await request.json();

    if (!name || !email || !time) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { DB } = (locals as { runtime: Runtime }).runtime.env;

    const sent = await sendPushToAll(DB);

    return new Response(JSON.stringify({ success: true, notified: sent }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Booking notify error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
