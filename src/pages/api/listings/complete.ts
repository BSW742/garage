import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { id, pin, price, location, photoUrl } = await request.json();

    if (!id || !pin || !price || !location) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { DB } = (locals as any).runtime.env;

    // Get listing and verify PIN
    const listing = await DB.prepare(
      'SELECT * FROM listings WHERE id = ?'
    ).bind(id).first();

    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (listing.pin !== pin) {
      return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update listing with price, location, photo, and set status to active
    const photos = photoUrl ? JSON.stringify([photoUrl]) : '[]';

    await DB.prepare(`
      UPDATE listings
      SET price = ?, location = ?, photos = ?, status = 'active', photo_uploaded = 1
      WHERE id = ?
    `).bind(price, location, photos, id).run();

    return new Response(JSON.stringify({
      success: true,
      listing: {
        id,
        price,
        location,
        photoUrl
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Complete listing error:', error);
    return new Response(JSON.stringify({ error: 'Failed to complete listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
