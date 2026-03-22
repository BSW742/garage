import type { APIRoute } from 'astro';

interface Runtime {
  env: {
    IMAGES: R2Bucket;
  };
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
}

interface R2Object {
  body: ReadableStream;
  httpMetadata?: {
    contentType?: string;
  };
}

// Handle CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
};

export const GET: APIRoute = async ({ params, locals }) => {
  const { IMAGES } = (locals as { runtime: Runtime }).runtime.env;
  const { filename } = params;

  if (!filename) {
    return new Response('Not found', { status: 404 });
  }

  const object = await IMAGES.get(filename);

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = object.httpMetadata?.contentType || 'image/jpeg';

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
