import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { orgName, mission, hasWebsite, currentUrl, need, contactName, contactEmail } = data;

    if (!orgName || !mission || !contactName || !contactEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    if (!contactEmail.includes('@') || !contactEmail.includes('.')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = (locals.runtime?.env as any)?.DB;
    if (!db) {
      console.log('Charity application (no DB):', data);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS charity_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_name TEXT NOT NULL,
        mission TEXT NOT NULL,
        has_website TEXT,
        current_url TEXT,
        need TEXT,
        contact_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Insert application
    await db.prepare(`
      INSERT INTO charity_applications (org_name, mission, has_website, current_url, need, contact_name, contact_email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(orgName, mission, hasWebsite || null, currentUrl || null, need || null, contactName, contactEmail).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Charity application error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save application' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
