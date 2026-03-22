import type { APIRoute } from 'astro';

interface Runtime {
  env: {
    IMAGES: R2Bucket;
  };
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { IMAGES } = (locals as { runtime: Runtime }).runtime.env;

    const formData = await request.formData();
    const photo = formData.get('photo') as File | null;
    const listingId = formData.get('listingId') as string | null;

    if (!photo || !listingId) {
      return new Response(JSON.stringify({ error: 'Missing photo or listing ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get file data
    const arrayBuffer = await photo.arrayBuffer();
    const contentType = photo.type || 'image/jpeg';

    // Generate filename based on listing ID
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `${listingId}-${Date.now()}.${ext}`;

    // Upload to R2
    await IMAGES.put(filename, arrayBuffer, {
      httpMetadata: { contentType }
    });

    // Return public URL
    const url = `https://garage.co.nz/images/${filename}`;

    return new Response(JSON.stringify({ success: true, url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload photo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
