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
    const data = await request.json();

    if (!data.image) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse base64 data URL or raw base64
    let base64Data = data.image;
    let contentType = 'image/jpeg';

    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64Data = matches[2];
      }
    }

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate unique filename
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload to R2
    await IMAGES.put(filename, bytes.buffer, {
      httpMetadata: { contentType }
    });

    // Return public URL
    const url = `https://garage.co.nz/images/${filename}`;

    return new Response(JSON.stringify({ success: true, url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
