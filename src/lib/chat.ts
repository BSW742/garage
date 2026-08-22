// Shared helpers for the site chat widget. The widget runs on
// <slug>.garage.co.nz while the API lives on garage.co.nz, so every response
// needs CORS.

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

// A slug is the only thing a visitor sends us that names a site, so keep it
// tight rather than trusting it into a query.
export function cleanSlug(value: unknown): string | null {
  const slug = String(value ?? '').trim().toLowerCase();
  return /^[a-z0-9-]{1,63}$/.test(slug) ? slug : null;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// "usually replies in about 5 minutes", worked out from what actually
// happened rather than a number we made up. Needs a few replies before it
// will claim anything.
export async function replyTimeLabel(db: any, slug: string): Promise<string | null> {
  const { results } = await db
    .prepare(
      `SELECT v.created_at AS asked, MIN(o.created_at) AS answered
         FROM chat_messages v
         JOIN chat_threads t ON t.id = v.thread_id
         JOIN chat_messages o ON o.thread_id = v.thread_id
              AND o.sender = 'owner' AND o.id > v.id
        WHERE t.slug = ? AND v.sender = 'visitor'
        GROUP BY v.id
        ORDER BY v.id DESC
        LIMIT 20`
    )
    .bind(slug)
    .all();

  const gaps = (results || [])
    .map((r: any) => (Date.parse(r.answered) - Date.parse(r.asked)) / 60000)
    .filter((m: number) => Number.isFinite(m) && m >= 0)
    .sort((a: number, b: number) => a - b);

  if (gaps.length < 3) return null;

  const median = gaps[Math.floor(gaps.length / 2)];
  if (median < 2) return 'usually replies in a couple of minutes';
  if (median < 60) return `usually replies in about ${Math.round(median)} minutes`;
  if (median < 60 * 24) return `usually replies within ${Math.round(median / 60)} hours`;
  return 'usually replies within a day';
}
