import type { APIRoute } from 'astro';
import { verifyPin, getListingById } from '../../../lib/listings';

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
  first<T = unknown>(): Promise<T | null>;
}

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Listing ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();

    // Get current listing to verify PIN
    const listing = await getListingById(DB, id);
    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify PIN if listing has one
    if (listing.pin) {
      if (!data.pin) {
        return new Response(JSON.stringify({ error: 'PIN required to edit this listing' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const valid = await verifyPin(data.pin, listing.pin);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.year !== undefined) {
      updates.push('year = ?');
      values.push(data.year);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(data.price);
    }
    if (data.kms !== undefined) {
      updates.push('kms = ?');
      values.push(data.kms);
    }
    if (data.location !== undefined) {
      updates.push('location = ?');
      values.push(data.location);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.photos !== undefined) {
      updates.push('photos = ?');
      values.push(JSON.stringify(data.photos));
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    values.push(id);

    await DB.prepare(
      `UPDATE listings SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Listing ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current listing to verify PIN
    const listing = await getListingById(DB, id);
    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify PIN if listing has one
    if (listing.pin) {
      const data = await request.json().catch(() => ({}));
      if (!data.pin) {
        return new Response(JSON.stringify({ error: 'PIN required to delete this listing' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const valid = await verifyPin(data.pin, listing.pin);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    await DB.prepare('DELETE FROM listings WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
