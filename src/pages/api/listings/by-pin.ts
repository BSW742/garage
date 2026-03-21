import type { APIRoute } from 'astro';
import { getListingsByPinAndEmail } from '../../../lib/listings';

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
  all<T>(): Promise<{ results: T[] }>;
}

// Rate limiting: simple in-memory store (resets on deploy)
const attempts: Map<string, { count: number; resetAt: number }> = new Map();

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const { DB } = (locals as { runtime: Runtime }).runtime.env;

  // Rate limiting: 5 attempts per hour per IP
  const ip = clientAddress || 'unknown';
  const now = Date.now();
  const attempt = attempts.get(ip);

  if (attempt) {
    if (now < attempt.resetAt) {
      if (attempt.count >= 5) {
        return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      attempt.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + 3600000 });
    }
  } else {
    attempts.set(ip, { count: 1, resetAt: now + 3600000 });
  }

  const data = await request.json();

  if (!data.pin || !data.email) {
    return new Response(JSON.stringify({ error: 'PIN and email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate PIN format
  if (!/^\d{4}$/.test(data.pin)) {
    return new Response(JSON.stringify({ error: 'Invalid PIN format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const listings = await getListingsByPinAndEmail(DB, data.pin, data.email);

  if (listings.length === 0) {
    return new Response(JSON.stringify({ error: 'No listings found with this PIN and email' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Return listings without sensitive data
  const safeListings = listings.map(l => ({
    id: l.id,
    make: l.make,
    model: l.model,
    year: l.year,
    price: l.price,
    kms: l.kms,
    location: l.location,
    description: l.description,
    photos: l.photos,
    photoUploaded: l.photoUploaded,
    url: `https://garage.co.nz/cars/${l.id}`
  }));

  return new Response(JSON.stringify({ listings: safeListings }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
