import type { APIRoute } from 'astro';
import { sendPushNotification } from '../../lib/web-push';

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

    // Get subscriptions
    let subs: any[] = [];
    try {
      const result = await DB.prepare('SELECT * FROM push_subscriptions').all();
      subs = result.results || [];
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'No subscriptions table',
        message: (e as Error).message
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (subs.length === 0) {
      return new Response(JSON.stringify({
        error: 'No subscriptions found'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to send to first subscription
    const sub = subs[0];
    const result = await sendPushNotification(
      {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth
      },
      {
        title: 'Test Notification',
        body: 'This is a test from Garage'
      }
    );

    return new Response(JSON.stringify({
      success: result,
      subscription: sub.endpoint.substring(0, 50) + '...'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed',
      message: (error as Error).message,
      stack: (error as Error).stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
