// Web Push implementation for Cloudflare Workers
// Uses Web Crypto API (no Node.js dependencies)

const VAPID_PUBLIC_KEY = 'BBP9B25Ny3m94KXNqwRKBvRBAGnSSDQHpQSjPFSbpua5pTgK0XAIGT7fFjLY6b1lxAWgzj90dGX-gHHOrXfuo-I';
const VAPID_PRIVATE_KEY = 'DxCWwFqe6tsBVquPSyxbTFhRfY0hoUQj61yPfoDRfts';

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Base64URL encode/decode
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

// Create VAPID JWT
async function createVapidJwt(audience: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 3600,
    sub: 'mailto:admin@garage.co.nz'
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Decode the public key to get x and y coordinates
  const publicKeyBytes = base64UrlDecode(VAPID_PUBLIC_KEY);
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

  // Import private key as JWK
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: VAPID_PRIVATE_KEY,
    x: base64UrlEncode(x.buffer),
    y: base64UrlEncode(y.buffer)
  };

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

// Generate encryption keys and encrypt payload
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlDecode(p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    'raw',
    subscriberPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Auth secret
  const authSecret = base64UrlDecode(auth);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for key derivation
  const sharedSecretKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveBits']
  );

  // PRK
  const authInfo = new TextEncoder().encode('WebPush: info\0');
  const authInfoFull = new Uint8Array(authInfo.length + subscriberPublicKeyBytes.length + localPublicKey.length);
  authInfoFull.set(authInfo);
  authInfoFull.set(subscriberPublicKeyBytes, authInfo.length);
  authInfoFull.set(localPublicKey, authInfo.length + subscriberPublicKeyBytes.length);

  const ikm = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: authInfoFull },
    sharedSecretKey,
    256
  );

  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);

  // Derive CEK and nonce
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');

  const cek = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: cekInfo },
    ikmKey,
    128
  );

  const nonce = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: nonceInfo },
    ikmKey,
    96
  );

  // Encrypt with AES-GCM
  const cekKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);

  // Add padding (single byte with value 2)
  const paddedPayload = new Uint8Array(payload.length + 1);
  paddedPayload.set(new TextEncoder().encode(payload));
  paddedPayload[payload.length] = 2; // Delimiter

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    cekKey,
    paddedPayload
  );

  return {
    ciphertext: new Uint8Array(encrypted),
    salt,
    localPublicKey
  };
}

// Build encrypted body with aes128gcm header
function buildBody(ciphertext: Uint8Array, salt: Uint8Array, localPublicKey: Uint8Array): Uint8Array {
  // Header: salt (16) + rs (4) + idlen (1) + keyid (65)
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKey.length);
  header.set(salt, 0);
  header[16] = (rs >> 24) & 0xff;
  header[17] = (rs >> 16) & 0xff;
  header[18] = (rs >> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = localPublicKey.length;
  header.set(localPublicKey, 21);

  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header);
  body.set(ciphertext, header.length);
  return body;
}

// Send push notification
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string }
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Create VAPID JWT
    const jwt = await createVapidJwt(audience);

    // Encrypt payload
    const payloadStr = JSON.stringify(payload);
    const { ciphertext, salt, localPublicKey } = await encryptPayload(
      payloadStr,
      subscription.p256dh,
      subscription.auth
    );

    const body = buildBody(ciphertext, salt, localPublicKey);

    // Send request
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'TTL': '86400'
      },
      body: body
    });

    if (response.status === 201 || response.status === 200) {
      return true;
    }

    console.error('Push failed:', response.status, await response.text());
    return false;
  } catch (error) {
    console.error('Push error:', error);
    return false;
  }
}

// Send to all subscribers
export async function sendPushToAll(
  db: any,
  payload: { title: string; body: string }
): Promise<number> {
  try {
    const result = await db.prepare(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions'
    ).all();

    const subscriptions = result.results || [];
    let sent = 0;

    for (const sub of subscriptions) {
      const success = await sendPushNotification(sub as PushSubscription, payload);
      if (success) sent++;
    }

    return sent;
  } catch (error) {
    console.error('Send to all error:', error);
    return 0;
  }
}

export { VAPID_PUBLIC_KEY };
