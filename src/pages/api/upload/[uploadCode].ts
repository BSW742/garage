import type { APIRoute } from 'astro';
import { getListingByUploadCode, markPhotoUploaded } from '../../../lib/listings';

interface Runtime {
  env: {
    DB: D1Database;
    IMAGES: R2Bucket;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { DB, IMAGES } = (locals as { runtime: Runtime }).runtime.env;
  const { uploadCode } = params;

  if (!uploadCode) {
    return new Response(JSON.stringify({ error: 'Upload code required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify upload code exists
  const listing = await getListingByUploadCode(DB, uploadCode);
  if (!listing) {
    return new Response(JSON.stringify({ error: 'Invalid upload code' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if already uploaded
  if (listing.photoUploaded) {
    return new Response(JSON.stringify({ error: 'Photo already uploaded' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await request.json();

  if (!data.image) {
    return new Response(JSON.stringify({ error: 'Missing image data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Parse base64
  let base64Data = data.image;
  let contentType = 'image/jpeg';

  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      base64Data = matches[2];
    }
  }

  // Decode and upload to R2
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = contentType.split('/')[1] || 'jpg';
  const filename = `${listing.id}-${Date.now()}.${ext}`;

  await IMAGES.put(filename, bytes.buffer, {
    httpMetadata: { contentType }
  });

  const photoUrl = `https://garage.co.nz/images/${filename}`;

  // Update listing
  await markPhotoUploaded(DB, uploadCode, photoUrl);

  return new Response(JSON.stringify({
    success: true,
    url: `https://garage.co.nz/cars/${listing.id}`,
    photoUrl
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
