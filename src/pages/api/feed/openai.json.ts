import type { APIRoute } from 'astro';
import { getAllListings, type Listing } from '../../../lib/listings';

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
}

// OpenAI Product Feed format
// https://developers.openai.com/commerce/specs/feed/
function listingToOpenAIProduct(listing: Listing) {
  return {
    // OpenAI flags
    is_eligible_search: true,
    is_eligible_checkout: false, // We don't handle checkout

    // Required fields
    item_id: listing.id,
    title: `${listing.year} ${listing.make} ${listing.model}`,
    description: listing.description || `${listing.year} ${listing.make} ${listing.model} with ${listing.kms.toLocaleString()} km. Located in ${listing.location}, New Zealand.`,
    url: `https://garage.co.nz/cars/${listing.id}`,
    brand: listing.make,
    price: {
      amount: listing.price,
      currency: 'NZD',
    },
    availability: 'in_stock',
    image_url: listing.photos[0] || `https://placehold.co/800x500/0066ff/white?text=${encodeURIComponent(`${listing.year} ${listing.make} ${listing.model}`)}`,

    // Seller info
    seller_name: 'garage.co.nz',
    seller_url: 'https://garage.co.nz',

    // Location
    target_countries: ['NZ'],
    store_country: 'NZ',

    // Optional but useful
    condition: 'used',
    product_type: 'Vehicles > Cars',

    // Car-specific custom attributes
    custom_attributes: {
      year: listing.year,
      make: listing.make,
      model: listing.model,
      kilometers: listing.kms,
      location: listing.location,
      ...(listing.source === 'trademe' && {
        source: 'trademe',
        trademe_url: listing.sourceUrl,
      }),
    },
  };
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const listings = await getAllListings(DB);

    const products = listings.map(listingToOpenAIProduct);

    return new Response(JSON.stringify({
      feed_version: '1.0',
      feed_type: 'products',
      generated_at: new Date().toISOString(),
      merchant: {
        name: 'garage.co.nz',
        url: 'https://garage.co.nz',
        country: 'NZ',
        description: 'AI-native car marketplace for New Zealand',
      },
      products,
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900', // 15 min cache (OpenAI refresh rate)
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate feed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
