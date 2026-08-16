// Simple Web Push - no payload encryption, just pings
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

async function createVapidJwt(audience: string): Promise<string> {
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

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

// Send push ping (no payload - service worker shows default message)
export async function sendPushNotification(
  subscription: { endpoint: string },
  _payload?: { title: string; body: string }
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await createVapidJwt(audience);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Length': '0',
        'TTL': '86400'
      }
    });

    return response.status === 201 || response.status === 200;
  } catch (error) {
    console.error('Push error:', error);
    return false;
  }
}

// Send to all subscribers
export async function sendPushToAll(db: any): Promise<number> {
  try {
    const result = await db.prepare('SELECT endpoint FROM push_subscriptions').all();
    const subscriptions = result.results || [];
    let sent = 0;

    for (const sub of subscriptions) {
      const success = await sendPushNotification(sub as { endpoint: string });
      if (success) sent++;
    }

    return sent;
  } catch (error) {
    console.error('Send to all error:', error);
    return 0;
  }
}

export { VAPID_PUBLIC_KEY };
