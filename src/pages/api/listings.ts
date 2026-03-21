import type { APIRoute } from 'astro';
import { addListing } from '../../lib/listings';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.make || !data.model || !data.year || !data.price || !data.location || !data.description || !data.sellerContact?.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const listing = addListing(data);

    return new Response(JSON.stringify({ success: true, listing }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
