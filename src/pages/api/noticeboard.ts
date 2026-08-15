import type { APIRoute } from 'astro';

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
  run(): Promise<unknown>;
  all(): Promise<{ results: unknown[] }>;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

async function uploadBase64Image(IMAGES: R2Bucket, base64Data: string): Promise<string> {
  let data = base64Data;
  let contentType = 'image/jpeg';

  if (data.startsWith('data:')) {
    const matches = data.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      data = matches[2];
    }
  }

  const binaryString = atob(data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = contentType.split('/')[1] || 'jpg';
  const filename = `nb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  await IMAGES.put(filename, bytes.buffer, {
    httpMetadata: { contentType }
  });

  return `https://garage.co.nz/images/${filename}`;
}

// GET - Load all noticeboard items
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;

    const result = await DB.prepare(
      'SELECT id, slot_id, type, content, created_at, views, hearts FROM noticeboard ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({ items: result.results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ items: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST - Save a noticeboard item
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { DB, IMAGES } = (locals as { runtime: Runtime }).runtime.env;
    const data = await request.json();

    const { slot_id, type, content } = data;

    if (!slot_id || !type || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If content has base64 photo data, upload to R2
    let processedContent = content;
    if (content.photoData?.startsWith('data:')) {
      const imageUrl = await uploadBase64Image(IMAGES, content.photoData);
      processedContent = { ...content, photoData: imageUrl };
    }

    const id = `nb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const created_at = new Date().toISOString();

    // Upsert - replace if slot already has content
    await DB.prepare(
      'DELETE FROM noticeboard WHERE slot_id = ?'
    ).bind(slot_id).run();

    await DB.prepare(
      'INSERT INTO noticeboard (id, slot_id, type, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, slot_id, type, JSON.stringify(processedContent), created_at).run();

    return new Response(JSON.stringify({
      success: true,
      id,
      content: processedContent
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Noticeboard save error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT - Update a noticeboard item
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id, content } = await request.json();

    if (!id || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await DB.prepare(
      'UPDATE noticeboard SET content = ? WHERE id = ?'
    ).bind(JSON.stringify(content), id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE - Remove a noticeboard item
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id } = await request.json();

    await DB.prepare(
      'DELETE FROM noticeboard WHERE id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH - Increment views or toggle hearts
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id, action, delta } = await request.json();

    if (!id || !action) {
      return new Response(JSON.stringify({ error: 'Missing id or action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'view') {
      await DB.prepare(
        'UPDATE noticeboard SET views = COALESCE(views, 0) + 1 WHERE id = ?'
      ).bind(id).run();
    } else if (action === 'heart') {
      // delta: 1 to add heart, -1 to remove
      const change = delta === -1 ? -1 : 1;
      await DB.prepare(
        'UPDATE noticeboard SET hearts = MAX(0, COALESCE(hearts, 0) + ?) WHERE id = ?'
      ).bind(change, id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
