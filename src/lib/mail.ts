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
  /** Files to send along. Small ones only — an invite, a receipt. */
  attachments?: { filename: string; type: string; content: string }[];
  /** Which site this was about, and what kind of message it was. For the log. */
  slug?: string;
  kind?: string;
}

/**
 * Sends through Mailgun. Does nothing, quietly, until the keys are set, so the
 * features that use it work either way and simply go unannounced until then.
 */
/**
 * Keep a copy of everything that leaves.
 *
 * sendMail is the only door out, so the log lives in here rather than in the
 * dozen places that call it — otherwise the CRM shows inbound mail beside an
 * empty space where the replies should be, which is half a conversation and
 * worse than none. Failures are kept too: a send that bounced is a thing you
 * need to know about, and it is the first thing you look for when somebody
 * says they never heard from you.
 */
async function keepCopy(env: any, mail: MailOut, ok: boolean, error?: string): Promise<void> {
  const db = env?.DB;
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO outbox (id, to_address, subject, body, reply_to, slug, kind, ok, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        String(mail.to || '').slice(0, 200),
        String(mail.subject || '').slice(0, 300),
        String(mail.text || '').slice(0, 20000),
        String(mail.replyTo || '').slice(0, 200) || null,
        (mail as any).slug || null,
        (mail as any).kind || null,
        ok ? 1 : 0,
        error ? String(error).slice(0, 300) : null
      )
      .run();
  } catch {
    // A mail that went out but was not written down still went out.
  }
}

export async function sendMail(env: any, mail: MailOut): Promise<{ ok: boolean; error?: string }> {
  const key = env?.MAILGUN_API_KEY;
  const domain = env?.MAILGUN_DOMAIN;
  if (!key || !domain) {
    await keepCopy(env, mail, false, 'mail not configured');
    return { ok: false, error: 'mail not configured' };
  }
  if (!mail.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.to)) {
    await keepCopy(env, mail, false, 'no usable address');
    return { ok: false, error: 'no usable address' };
  }

  // Mailgun keeps EU accounts on their own host, and sending to the wrong one
  // fails in a way that looks like a bad key.
  const host = String(env?.MAILGUN_REGION || '').toLowerCase() === 'eu'
    ? 'https://api.eu.mailgun.net'
    : 'https://api.mailgun.net';

  const from = env?.MAILGUN_FROM || `garage.co.nz <no-reply@${domain}>`;

  // Attachments have to go as multipart, so the body is built two ways. The
  // urlencoded path is kept for everything else because it is what every other
  // mail in here has always used and there is no reason to churn it.
  let body: BodyInit;
  const headers: Record<string, string> = { Authorization: 'Basic ' + btoa('api:' + key) };

  if (mail.attachments?.length) {
    const form = new FormData();
    form.set('from', from);
    form.set('to', mail.to);
    form.set('subject', mail.subject.slice(0, 200));
    form.set('text', mail.text);
    if (mail.html) form.set('html', mail.html);
    if (mail.replyTo) form.set('h:Reply-To', mail.replyTo);
    for (const file of mail.attachments) {
      form.append('attachment', new Blob([file.content], { type: file.type }), file.filename);
    }
    body = form;   // fetch sets the boundary itself; setting it by hand breaks it
  } else {
    const form = new URLSearchParams();
    form.set('from', from);
    form.set('to', mail.to);
    form.set('subject', mail.subject.slice(0, 200));
    form.set('text', mail.text);
    if (mail.html) form.set('html', mail.html);
    if (mail.replyTo) form.set('h:Reply-To', mail.replyTo);
    body = form.toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  try {
    const res = await fetch(`${host}/v3/${encodeURIComponent(domain)}/messages`, {
      method: 'POST',
      headers,
      body,
    });
    if (!res.ok) {
      const why = `mailgun ${res.status}: ${(await res.text()).slice(0, 160)}`;
      await keepCopy(env, mail, false, why);
      return { ok: false, error: why };
    }
    await keepCopy(env, mail, true);
    return { ok: true };
  } catch (error) {
    const why = String((error as Error)?.message || error).slice(0, 160);
    await keepCopy(env, mail, false, why);
    return { ok: false, error: why };
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
export function keysEmail(slug: string, token: string, name?: string, waitlist = false) {
  const site = `https://${slug}.garage.co.nz`;
  const inbox = `${site}/admin?k=${encodeURIComponent(token)}`;
  const editor = `https://garage.co.nz/ai?edit=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}`;
  // Only in the email when the waitlist is actually on, because a link to a
  // feature somebody is not using is one more thing to skip past.
  const slot = `https://garage.co.nz/slot?s=${encodeURIComponent(slug)}&k=${encodeURIComponent(token)}`;
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
    ...(waitlist
      ? [
          `A TIME OPENED UP  ${slot}`,
          'Type when it is and everyone on your short notice list hears at once.',
          'First to say yes takes it and we tell you who. Nothing is discounted —',
          'they already wanted that time.',
          '',
        ]
      : []),
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


/**
 * First contact. This goes to somebody who has never heard of us, about a
 * website they did not ask for, so it does two things and stops: shows them
 * the page, and makes clear it is theirs to take or ignore.
 *
 * No pitch. The page is the pitch — that is the whole reason for building it
 * properly before sending anything.
 *
 * The unsubscribe is not decoration. A commercial email in New Zealand needs
 * accurate sender details and a working unsubscribe, and the address we are
 * writing to is one the business published themselves.
 */
export function offerEmail(
  slug: string,
  token: string,
  name: string | undefined,
  unsubToken: string,
  viewToken: string
) {
  // The ?v= is how we know they looked. It is a token only this email carries,
  // so a visit through it is the owner rather than passing traffic.
  const site = `https://${slug}.garage.co.nz/?v=${encodeURIComponent(viewToken)}`;
  const editor = `https://garage.co.nz/ai?edit=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}&src=owner`;
  // Not /u/ — that path already belongs to car listing codes, and the two
  // dynamic routes silently collide.
  const unsub = `https://garage.co.nz/unsubscribe/${encodeURIComponent(slug)}?t=${encodeURIComponent(unsubToken)}`;
  const label = name || slug;

  const text = [
    `Kia ora,`,
    '',
    `I have rebuilt ${label}'s website. It is sitting here:`,
    '',
    `    ${site}`,
    '',
    'Have a look before you decide anything. Everything on it came off your own',
    'website and public listings, so if something is wrong it is my mistake and',
    'I will fix it.',
    '',
    'If you want it, it is yours — no charge to look, and you can change any of',
    'it by typing what you want in plain words here:',
    '',
    `    ${editor}`,
    '',
    'If you would rather I did not, ignore this and it comes down. No hard',
    'feelings and I will not chase you.',
    '',
    'Ben',
    'garage.co.nz',
    '',
    '—',
    `Not interested in hearing from us again? ${unsub}`,
  ].join('\n');

  const esc = (v: string) =>
    String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

  const html = `<div style="font-family:-apple-system,Segoe UI,Inter,sans-serif;font-size:15px;line-height:1.65;color:#14161a;max-width:34rem">
<p>Kia ora,</p>
<p>I have rebuilt <b>${esc(label)}</b>'s website. It is sitting here:</p>
<p><a href="${esc(site)}" style="display:inline-block;background:#1f6feb;color:#fff;text-decoration:none;padding:.75rem 1.4rem;border-radius:8px;font-weight:600">${esc(slug)}.garage.co.nz</a></p>
<p>Have a look before you decide anything. Everything on it came off your own website and public listings, so if something is wrong it is my mistake and I will fix it.</p>
<p>If you want it, it is yours — no charge to look, and you can change any of it by typing what you want in plain words: <a href="${esc(editor)}">edit your site</a>.</p>
<p>If you would rather I did not, ignore this and it comes down. No hard feelings and I will not chase you.</p>
<p>Ben<br/>garage.co.nz</p>
<hr style="border:0;border-top:1px solid #e4e7ec;margin:1.6rem 0"/>
<p style="font-size:12px;color:#697184">Not interested in hearing from us again? <a href="${esc(unsub)}" style="color:#697184">Unsubscribe</a>.</p>
</div>`;

  return { subject: `I rebuilt ${label}'s website — have a look`, text, html };
}


/**
 * A business putting another business forward. The important difference from
 * offerEmail is whose name is at the top: somebody they know said this, and we
 * only built the page. Lead with us and it reads as a cold pitch, which is
 * exactly what it is not.
 */
export function referralEmail(
  slug: string,
  token: string,
  name: string | undefined,
  fromName: string,
  unsubToken: string,
  viewToken: string,
  bonus: number
) {
  const site = `https://${slug}.garage.co.nz/?v=${encodeURIComponent(viewToken)}`;
  const editor = `https://garage.co.nz/ai?edit=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}&src=owner`;
  const unsub = `https://garage.co.nz/unsubscribe/${encodeURIComponent(slug)}?t=${encodeURIComponent(unsubToken)}`;
  const label = name || slug;
  const tidy = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const text = [
    `Kia ora,`,
    '',
    `${fromName} put ${label} forward, so we have made you a start of a website.`,
    'It is here:',
    '',
    `    ${site}`,
    '',
    'It is yours if you want it. Nothing to install, nothing to pay, and you',
    'change it by typing what you want in plain words:',
    '',
    `    ${editor}`,
    '',
    `Because ${fromName} vouched for you, there is ${tidy(bonus)} of free use on it`,
    'rather than the usual amount.',
    '',
    'If you would rather it did not exist, say so with the link at the bottom',
    'and it comes down. We will not chase you.',
    '',
    'Ben',
    'garage.co.nz',
    '',
    '—',
    `${fromName} put you forward. We only built the page.`,
    `Not interested in hearing from us again? ${unsub}`,
  ].join('\n');

  const esc = (v: string) =>
    String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

  const html = `<div style="font-family:-apple-system,Segoe UI,Inter,sans-serif;font-size:15px;line-height:1.65;color:#14161a;max-width:34rem">
<p>Kia ora,</p>
<p><b>${esc(fromName)}</b> put <b>${esc(label)}</b> forward, so we have made you a start of a website. It is here:</p>
<p><a href="${esc(site)}" style="display:inline-block;background:#1f6feb;color:#fff;text-decoration:none;padding:.75rem 1.4rem;border-radius:8px;font-weight:600">${esc(slug)}.garage.co.nz</a></p>
<p>It is yours if you want it. Nothing to install, nothing to pay, and you change it by typing what you want in plain words: <a href="${esc(editor)}">edit your site</a>.</p>
<p>Because ${esc(fromName)} vouched for you, there is <b>${esc(tidy(bonus))}</b> of free use on it rather than the usual amount.</p>
<p>If you would rather it did not exist, say so with the link below and it comes down. We will not chase you.</p>
<p>Ben<br />garage.co.nz</p>
<hr style="border:0;border-top:1px solid #e6e8ec;margin:1.5rem 0" />
<p style="font-size:12px;color:#6b7280">${esc(fromName)} put you forward. We only built the page.<br />
Not interested in hearing from us again? <a href="${esc(unsub)}">unsubscribe</a>.</p>
</div>`;

  return { subject: `${fromName} put ${label} forward`, text, html };
}
