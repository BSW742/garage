import type { APIRoute } from 'astro';
import { getAllListings, filterListings, type FilterOptions, type Listing } from '../../../lib/listings';

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
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  first<T = unknown>(): Promise<T | null>;
}

function formatListingForApi(listing: Listing) {
  return {
    id: listing.id,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    kms: listing.kms,
    location: listing.location,
    photo: listing.photos[0] || null,
    url: `https://garage.co.nz/cars/${listing.id}`,
  };
}

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;

    const maxPrice = url.searchParams.get('maxPrice');
    const minPrice = url.searchParams.get('minPrice');
    const location = url.searchParams.get('location');
    const make = url.searchParams.get('make');
    const limit = url.searchParams.get('limit');

    const hasFilters = maxPrice || minPrice || location || make;

    let listings: Listing[];
    if (hasFilters) {
      const options: FilterOptions = {};
      if (maxPrice) options.maxPrice = parseInt(maxPrice);
      if (minPrice) options.minPrice = parseInt(minPrice);
      if (location) options.location = location;
      if (make) options.make = make;
      listings = await filterListings(DB, options);
    } else {
      listings = await getAllListings(DB);
    }

    if (limit) {
      listings = listings.slice(0, parseInt(limit));
    }

    return new Response(JSON.stringify({
      count: listings.length,
      listings: listings.map(formatListingForApi),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch listings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
