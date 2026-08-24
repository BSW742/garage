// Sending email, as opposed to answering it.
//
// Cloudflare can receive mail and reply to a message it is holding, but it
// cannot start a conversation — which is what an order landing at 2am needs.
// That is what this is for.

export interface MailOut {
  to: string;
  subject: string;
  text: string;
  /** Optional rich version. Mail clients that can render it will prefer it. */
  html?: string;
  replyTo?: string;
}

/**
 * Sends through Mailgun. Does nothing, quietly, until the keys are set, so the
 * features that use it work either way and simply go unannounced until then.
 */
export async function sendMail(env: any, mail: MailOut): Promise<{ ok: boolean; error?: string }> {
  const key = env?.MAILGUN_API_KEY;
  const domain = env?.MAILGUN_DOMAIN;
  if (!key || !domain) return { ok: false, error: 'mail not configured' };
  if (!mail.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.to)) {
    return { ok: false, error: 'no usable address' };
  }

  // Mailgun keeps EU accounts on their own host, and sending to the wrong one
  // fails in a way that looks like a bad key.
  const host = String(env?.MAILGUN_REGION || '').toLowerCase() === 'eu'
    ? 'https://api.eu.mailgun.net'
    : 'https://api.mailgun.net';

  const form = new URLSearchParams();
  form.set('from', env?.MAILGUN_FROM || `garage.co.nz <no-reply@${domain}>`);
  form.set('to', mail.to);
  form.set('subject', mail.subject.slice(0, 200));
  form.set('text', mail.text);
  if (mail.html) form.set('html', mail.html);
  if (mail.replyTo) form.set('h:Reply-To', mail.replyTo);

  try {
    const res = await fetch(`${host}/v3/${encodeURIComponent(domain)}/messages`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa('api:' + key),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    if (!res.ok) {
      return { ok: false, error: `mailgun ${res.status}: ${(await res.text()).slice(0, 160)}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String((error as Error)?.message || error).slice(0, 160) };
  }
}

/**
 * Where a site's owner reads mail, and the key that gets them into their inbox.
 *
 * The link has to carry the key. Their inbox is not behind a login — the key
 * in the address is the whole credential — so pointing them at a bare /admin
 * lands them on a page telling them to use the link they are already reading.
 */
export async function ownerContact(
  db: any, slug: string
): Promise<{ email: string; inbox: string } | null> {
  try {
    const row = await db
      .prepare('SELECT email, edit_token FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();
    const address = String((row as any)?.email || '').trim();
    if (!address) return null;
    const token = String((row as any)?.edit_token || '').trim();
    return {
      email: address,
      inbox: `https://${slug}.garage.co.nz/admin${token ? '?k=' + encodeURIComponent(token) : ''}`,
    };
  } catch {
    return null;
  }
}

/**
 * The keys email. Every link in here carries the edit key, because a link that
 * lands on "who are you" is the same as no link at all.
 */
export function keysEmail(slug: string, token: string, name?: string) {
  const site = `https://${slug}.garage.co.nz`;
  const inbox = `${site}/admin?k=${encodeURIComponent(token)}`;
  const editor = `https://garage.co.nz/ai?edit=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}`;
  const label = name || `${slug}.garage.co.nz`;

  const text = [
    `${label} is live at ${site}`,
    '',
    'Two links, and they both open straight up — no password, no login screen.',
    '',
    `YOUR MESSAGES  ${inbox}`,
    'Everything customers send you: chat messages and orders. Reply to anyone',
    'right from the page. On your phone, open that link and use Share then',
    '"Add to Home Screen" — it installs like an app and opens straight to your',
    'messages.',
    '',
    `CHANGE THE SITE  ${editor}`,
    'Tell it what you want in plain words: "make the headline shorter", "add a',
    'photo of the new van", "we do Cambridge too". It does it while you watch.',
    '',
    `OR JUST EMAIL US  ${slug}@garage.co.nz`,
    'Send that address a note and we will make the change. Attach photos and',
    'they go on the site. Send a YouTube link and it goes in the video reel.',
    'Only email sent from this address can change your site.',
    '',
    'Keep this email — it is the only copy of your keys.',
    '',
    '— Garage',
  ].join('\n');

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;max-width:540px;margin:0 auto;color:#0a0a0a;line-height:1.55">
  <p style="font-size:1.12rem;margin:0 0 1.4rem"><strong>${esc(label)}</strong> is live at
    <a href="${esc(site)}" style="color:#2563eb">${esc(slug)}.garage.co.nz</a></p>
  <p style="margin:0 0 1.6rem;color:#525252">Two links below. Both open straight up — no password, no login screen.</p>

  <div style="border:1px solid #e5e5e5;border-radius:12px;padding:1.1rem 1.2rem;margin-bottom:1rem">
    <div style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;margin-bottom:.5rem">Your messages</div>
    <p style="margin:0 0 .7rem"><a href="${esc(inbox)}" style="color:#2563eb;font-weight:600;word-break:break-all">${esc(slug)}.garage.co.nz/admin</a></p>
    <p style="margin:0;color:#525252;font-size:.93rem">Everything customers send you — chat messages and orders — and you can reply to anyone right there.
    On your phone, open it and tap Share then <strong>Add to Home Screen</strong>. It installs like an app and opens straight to your messages.</p>
  </div>

  <div style="border:1px solid #e5e5e5;border-radius:12px;padding:1.1rem 1.2rem;margin-bottom:1rem">
    <div style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;margin-bottom:.5rem">Change the site</div>
    <p style="margin:0 0 .7rem"><a href="${esc(editor)}" style="color:#2563eb;font-weight:600;word-break:break-all">Open the editor</a></p>
    <p style="margin:0;color:#525252;font-size:.93rem">Say what you want in plain words — “make the headline shorter”, “add a photo of the new van”, “we do Cambridge too”. It happens while you watch.</p>
  </div>

  <div style="border:1px solid #e5e5e5;border-radius:12px;padding:1.1rem 1.2rem;margin-bottom:1.6rem">
    <div style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;margin-bottom:.5rem">Or just email us</div>
    <p style="margin:0 0 .7rem"><strong>${esc(slug)}@garage.co.nz</strong></p>
    <p style="margin:0;color:#525252;font-size:.93rem">Send that address a note and we will make the change. Attach photos and they go on the site; send a YouTube link and it goes in the video reel. Only email from this address can change your site.</p>
  </div>

  <p style="color:#8a8a8a;font-size:.85rem;margin:0">Keep this email — it is the only copy of your keys.</p>
</div>`;

  return { subject: `Your keys for ${slug}.garage.co.nz`, text, html };
}

function esc(v: string): string {
  return String(v == null ? '' : v).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]
  );
}
