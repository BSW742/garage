import type { APIRoute } from 'astro';
import { getListingByUploadCode } from '../../../../lib/listings';

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
  first<T>(): Promise<T | null>;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const { DB } = (locals as { runtime: Runtime }).runtime.env;
  const { uploadCode } = params;

  if (!uploadCode) {
    return new Response(JSON.stringify({ error: 'Upload code required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const listing = await getListingByUploadCode(DB, uploadCode);

  if (!listing) {
    return new Response(JSON.stringify({ error: 'Upload code not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    id: listing.id,
    photoUploaded: listing.photoUploaded,
    url: listing.photoUploaded ? `https://garage.co.nz/cars/${listing.id}` : null
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
