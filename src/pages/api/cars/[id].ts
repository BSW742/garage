import type { APIRoute } from 'astro';
import { getListingById } from '../../../lib/listings';

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
  first<T = unknown>(): Promise<T | null>;
}

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Listing ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const listing = await getListingById(DB, id);

    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      id: listing.id,
      make: listing.make,
      model: listing.model,
      year: listing.year,
      price: listing.price,
      kms: listing.kms,
      location: listing.location,
      description: listing.description,
      photos: listing.photos,
      seller: {
        email: listing.sellerContact.email,
        phone: listing.sellerContact.phone || null,
      },
      url: `https://garage.co.nz/cars/${listing.id}`,
      listedAt: listing.createdAt,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
