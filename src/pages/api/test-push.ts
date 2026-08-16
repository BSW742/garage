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

const VAPID_PUBLIC_KEY = 'BBP9B25Ny3m94KXNqwRKBvRBAGnSSDQHpQSjPFSbpua5pTgK0XAIGT7fFjLY6b1lxAWgzj90dGX-gHHOrXfuo-I';
const VAPID_PRIVATE_KEY = 'DxCWwFqe6tsBVquPSyxbTFhRfY0hoUQj61yPfoDRfts';

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;

    const result = await DB.prepare('SELECT * FROM push_subscriptions ORDER BY id DESC LIMIT 1').all();
    const subs = result.results || [];

    if (subs.length === 0) {
      return new Response(JSON.stringify({ error: 'No subscriptions' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sub = subs[0] as { endpoint: string; p256dh: string; auth: string };

    // Create simple JWT
    const url = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const header = { typ: 'JWT', alg: 'ES256' };
    const now = Math.floor(Date.now() / 1000);
    const payload = { aud: audience, exp: now + 3600, sub: 'mailto:admin@garage.co.nz' };

    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    const publicKeyBytes = base64UrlDecode(VAPID_PUBLIC_KEY);
    const x = publicKeyBytes.slice(1, 33);
    const y = publicKeyBytes.slice(33, 65);

    const privateKey = await crypto.subtle.importKey(
      'jwk',
      { kty: 'EC', crv: 'P-256', d: VAPID_PRIVATE_KEY, x: base64UrlEncode(x.buffer), y: base64UrlEncode(y.buffer) },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      new TextEncoder().encode(unsignedToken)
    );

    const jwt = `${unsignedToken}.${base64UrlEncode(signature)}`;

    // Send raw request to see full response
    const response = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Length': '0',
        'TTL': '60'
      }
    });

    const responseText = await response.text();

    return new Response(JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      endpoint: sub.endpoint.substring(0, 60) + '...',
      hasP256dh: !!sub.p256dh,
      hasAuth: !!sub.auth
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: (error as Error).message,
      stack: (error as Error).stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
