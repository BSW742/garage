// Sending email, as opposed to answering it.
//
// Cloudflare can receive mail and reply to a message it is holding, but it
// cannot start a conversation — which is what an order landing at 2am needs.
// That is what this is for.

export interface MailOut {
  to: string;
  subject: string;
  text: string;
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

/** The address a site was claimed with — where its owner actually reads mail. */
export async function ownerEmail(db: any, slug: string): Promise<string | null> {
  try {
    const row = await db
      .prepare('SELECT email FROM site_claims WHERE slug = ?')
      .bind(slug)
      .first();
    const address = String((row as any)?.email || '').trim();
    return address || null;
  } catch {
    return null;
  }
}
