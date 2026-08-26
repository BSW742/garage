import type { APIRoute } from 'astro';

export const prerender = false;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

const REFERRAL_REWARD = 250_000;

/**
 * Somebody saying "this is mine". The edit token is the credential — it only
 * ever went to the address on the site — so holding it is the claim.
 *
 * This is also where a referral pays out. Not on send: sending an email costs
 * nothing and would be farmed within a day. Somebody taking ownership of a
 * page is a thing only the real business does.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as any)?.DB;
    if (!db) return json({ error: 'not-configured' }, 503);

    const body = (await request.json().catch(() => null)) as any;
    const slug = String(body?.slug || '').trim().toLowerCase();
    const key = String(body?.key || '').trim();
    if (!/^[a-z0-9-]{1,63}$/.test(slug) || !key) return json({ error: 'Bad request' }, 400);

    const row = await db
      .prepare(
        `SELECT edit_token, claimed_at, referred_by, referral_paid_at
           FROM site_claims WHERE slug = ? AND status != 'disabled'`
      )
      .bind(slug)
      .first();
    if (!row) return json({ error: 'No such page' }, 404);
    if (!row.edit_token || String(row.edit_token) !== key) {
      return json({ error: 'Not your page' }, 403);
    }

    const now = new Date().toISOString();
    if (!row.claimed_at) {
      await db
        .prepare('UPDATE site_claims SET claimed_at = ? WHERE slug = ?')
        .bind(now, slug)
        .run();
    }

    // Pay the person who put them forward, once, ever.
    let paid = 0;
    if (row.referred_by && !row.referral_paid_at) {
      const marked = await db
        .prepare(
          `UPDATE site_claims SET referral_paid_at = ?
            WHERE slug = ? AND referral_paid_at IS NULL`
        )
        .bind(now, slug)
        .run();
      // Only the update that actually changed the row grants the tokens, so
      // two clicks at once cannot pay twice.
      if ((marked as any)?.meta?.changes) {
        await db
          .prepare(
            `INSERT INTO token_grants (id, slug, tokens, reason, ref_slug, created_at)
             VALUES (?, ?, ?, 'referral', ?, ?)`
          )
          .bind(crypto.randomUUID(), String(row.referred_by), REFERRAL_REWARD, slug, now)
          .run();
        paid = REFERRAL_REWARD;
      }
    }

    return json({ ok: true, claimed: true, paidReferrer: paid });
  } catch (error) {
    console.error('Claim failed:', error);
    return json({ error: 'Could not do that, sorry' }, 500);
  }
};
