import PostalMime from 'postal-mime';
// @ts-expect-error — provided by the Workers runtime, not by node types.
import { EmailMessage } from 'cloudflare:email';
import {
  mailboxSlug, bareAddress, authVerdict, isAutomated, buildReplyMime,
  MAX_IMAGES_PER_EMAIL, addToGallery, youtubeId, addVideo, usablePhotos, instaLinks,
} from '../../src/lib/site-mail';

// Declared here rather than pulled in wholesale, matching how the API routes
// in src/pages/api describe their own bindings.
interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
}

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

interface EmailMessageIn {
  readonly from: string;
  readonly to: string;
  readonly headers: Headers;
  readonly raw: ReadableStream;
  reply(message: EmailMessage): Promise<void>;
}

const SITE_ORIGIN = 'https://garage.co.nz';

export default {
  async email(message: EmailMessageIn, env: Env): Promise<void> {
    const slug = mailboxSlug(message.to);

    // Not a site mailbox — behave exactly as this worker always has.
    if (!slug) return storeAsInboxMail(message, env);

    try {
      await handleSiteMail(message, env, slug);
    } catch (error) {
      console.error('Site mail failed:', slug, error);
    }
  },
};

/**
 * What is sitting in their inbox that nobody has looked at.
 *
 * A reply cannot be banked — it has to go out inside the handler for the
 * message being answered — so there is no way to email someone the moment an
 * order arrives. What there is, is their next email: they are already writing
 * to add a photo, so the confirmation can carry the news back with it.
 */
async function waitingFor(env: Env, slug: string): Promise<string> {
  try {
    const orders = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM orders WHERE slug = ? AND status = 'new'")
      .bind(slug)
      .first<{ n: number }>();
    const asked = await env.DB
      .prepare(
        `SELECT COUNT(*) AS n FROM chat_threads t
          WHERE t.slug = ?
            AND (SELECT sender FROM chat_messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) = 'visitor'`
      )
      .bind(slug)
      .first<{ n: number }>();

    const bits: string[] = [];
    const o = orders?.n ?? 0;
    const a = asked?.n ?? 0;
    if (o) bits.push(`${o} order${o === 1 ? '' : 's'}`);
    if (a) bits.push(`${a} ${a === 1 ? 'person' : 'people'} waiting on a reply`);
    if (!bits.length) return '';

    return `\n\nWhile you are here: ${bits.join(' and ')}.\n` +
      `Have a look:  https://${slug}.garage.co.nz/admin`;
  } catch {
    return '';
  }
}

// ── The site mailbox ────────────────────────────────────────────────────────

async function handleSiteMail(message: EmailMessageIn, env: Env, slug: string): Promise<void> {
  const from = bareAddress(message.from);
  const mailbox = `${slug}@garage.co.nz`;
  const automated = isAutomated(message.headers);
  const messageId = message.headers.get('message-id') || crypto.randomUUID();

  // A retried delivery must not append the same photos twice.
  const seen = await env.DB
    .prepare('SELECT id FROM site_mail WHERE message_id = ?')
    .bind(messageId)
    .first();
  if (seen) return;

  const record = {
    id: crypto.randomUUID(),
    slug,
    from,
    subject: message.headers.get('subject') || '',
    messageId,
    auth: '',
    intent: 'rejected',
    applied: 0,
    prevConfig: null as string | null,
    undoToken: null as string | null,
    note: '',
    replyError: null as string | null,
  };

  // Only reply once we know the sender is real. Before that, a From address is
  // just a claim, and answering it mails whoever the spammer named instead.
  let verified = false;
  const say = async (note: string) => {
    // Anything unattended rides along with the answer they were getting anyway.
    if (verified && !automated) note += await waitingFor(env, slug);
    record.note = note;
    if (verified && !automated) {
      record.replyError = await sendReply(message, mailbox, from, note, messageId);
    } else if (!verified) {
      record.replyError = 'not sent: sender unverified';
    } else {
      record.replyError = 'not sent: automated message';
    }
    await saveMail(env, record);
  };

  const site = await env.DB
    .prepare('SELECT slug, email, config, edit_token FROM site_claims WHERE slug = ? AND status != ?')
    .bind(slug, 'disabled')
    .first<{ slug: string; email: string; config: string; edit_token: string }>();

  if (!site) {
    // With a catch-all in front of this, unknown mailboxes are overwhelmingly
    // spam. Log it and stay quiet rather than confirming the address is live.
    record.note = `no site called ${slug}`;
    return saveMail(env, record);
  }

  // 1. Did the message really come from where it claims?
  const verdict = authVerdict(message.headers.get('authentication-results'), from);
  record.auth = verdict.detail;
  if (!verdict.ok) {
    // The From address may well be forged, so a reply would go to whoever was
    // spoofed. Record it instead — it shows up in site_mail for follow-up.
    record.note = `unverified sender (${verdict.detail})`;
    return saveMail(env, record);
  }
  verified = true;

  // 2. Is the sender the owner of this site?
  if (bareAddress(site.email) !== from) {
    return say(
      `${from} is not the address registered for ${slug}.garage.co.nz, so nothing was changed.\n\n` +
      `Send from the address you signed up with and it will go straight up.`
    );
  }

  // 3. What did they send?
  const parsed = await PostalMime.parse(message.raw);
  const attachments = usablePhotos(parsed.attachments || []);
  const heic = (parsed.attachments || []).some((a: any) =>
    /hei[cf]/i.test(String(a?.mimeType || '') + String(a?.filename || ''))
  );

  const video = youtubeId(`${parsed.text || ''} ${parsed.html || ''} ${record.subject}`);

  // An insta wall takes Instagram links instead. Share a post to Mail on the
  // phone and the link arrives in the body — this is the whole point of the
  // mailbox: no copying, no pasting, no browser.
  let wall = false;
  try { wall = JSON.parse(site.config || '{}')?.style === 'insta'; } catch { wall = false; }
  const posts = wall
    ? instaLinks(`${parsed.text || ''} ${parsed.html || ''} ${record.subject}`)
    : [];

  if (wall && posts.length) {
    const added: string[] = [];
    const refused: string[] = [];
    for (const post of posts.slice(0, 12)) {
      // Instagram's own oembed is the gate. It answers without a token and
      // returns 400 for anything that is not a real, public, embeddable post,
      // so a dead square never reaches the wall.
      let live = false;
      try {
        const check = await fetch(
          'https://graph.facebook.com/v25.0/instagram_oembed?omitscript=true&url=' +
            encodeURIComponent(`https://www.instagram.com/${post.kind}/${post.code}/`)
        );
        live = check.ok;
      } catch {
        live = false;
      }
      if (!live) { refused.push(post.code); continue; }
      const done = await env.DB
        .prepare(
          `INSERT INTO insta_posts (slug, code, kind) VALUES (?, ?, ?)
             ON CONFLICT (slug, code) DO NOTHING`
        )
        .bind(slug, post.code, post.kind)
        .run();
      if (done.meta?.changes) added.push(post.code);
    }

    record.intent = 'insta';
    record.applied = added.length ? 1 : 0;
    const lines: string[] = [];
    if (added.length) lines.push(`${added.length} post${added.length === 1 ? '' : 's'} went up.`);
    if (!added.length && !refused.length) lines.push('Already on the wall — nothing to do.');
    if (refused.length) {
      lines.push(
        `${refused.length} would not embed (private account, deleted, or a story): ${refused.join(', ')}.`
      );
    }
    return say(
      `${lines.join('\n')}\n\nSee it:  https://${slug}.garage.co.nz\n\n` +
      `A heads up: reels using licensed music show a still and send people to ` +
      `Instagram to watch. Your own audio plays right on the page.`
    );
  }

  if (!attachments.length && !video && !(wall && posts.length)) {
    record.intent = 'held';
    return say(
      heic
        ? `Those photos are in a format websites cannot show (HEIC). On an iPhone: Settings > Camera > Formats > Most Compatible, then send them again.`
        : wall
          ? `Nothing was changed.\n\nShare a post from Instagram to Mail and send it here — the link in the body is all this needs.`
          : `Nothing was changed.\n\nAttach photos and they go into your gallery, with the subject line as the caption. Or send a YouTube link and it goes up as a video.`
    );
  }

  const config = JSON.parse(site.config || '{}');
  record.prevConfig = site.config || '{}';
  const done: string[] = [];

  if (video) {
    addVideo(config, video, (record.subject || '').trim());
    done.push('Your video is up');
  }

  const use = attachments.slice(0, MAX_IMAGES_PER_EMAIL);
  const urls: string[] = [];
  for (const attachment of use) {
    const type = String(attachment.mimeType).toLowerCase();
    const ext = type.split('/')[1].replace('jpeg', 'jpg');
    const key = `${slug}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await env.IMAGES.put(key, attachment.content as ArrayBuffer, {
      httpMetadata: { contentType: type },
    });
    urls.push(`${SITE_ORIGIN}/images/${key}`);
  }

  if (urls.length) {
    addToGallery(config, urls, (record.subject || '').trim());
    done.push(`${use.length} photo${use.length === 1 ? '' : 's'} went up`);
  }

  record.undoToken = crypto.randomUUID().replace(/-/g, '');
  record.intent = video && urls.length ? 'video+gallery' : video ? 'video' : 'gallery';
  record.applied = 1;

  await env.DB
    .prepare('UPDATE site_claims SET config = ?, updated_at = ? WHERE slug = ?')
    .bind(JSON.stringify(config), new Date().toISOString(), slug)
    .run();

  const skipped = attachments.length > use.length
    ? `\n\nThe other ${attachments.length - use.length} did not fit in one email — send them separately.`
    : '';
  // Only offer the builder link when the site actually has a key for it.
  const editLine = site.edit_token
    ? `Change anything:  ${SITE_ORIGIN}/ai?edit=${slug}&t=${site.edit_token}\n`
    : '';

  await say(
    `${done.join(' and ')} on your site.${skipped}\n\n` +
    `See it:  https://${slug}.garage.co.nz\n` +
    editLine +
    `Undo this:  ${SITE_ORIGIN}/mail/undo/${record.undoToken}\n\n` +
    `Send more photos or a video link any time.`
  );
}

async function saveMail(env: Env, r: any): Promise<void> {
  await env.DB
    .prepare(
      `INSERT OR IGNORE INTO site_mail
         (id, slug, from_address, subject, message_id, auth_result, intent, applied,
          prev_config, undo_token, note, reply_error, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(r.id, r.slug, r.from, r.subject, r.messageId, r.auth, r.intent, r.applied,
          r.prevConfig, r.undoToken, r.note, r.replyError ?? null, new Date().toISOString())
    .run();
}

async function sendReply(
  message: EmailMessageIn, fromAddress: string, toAddress: string,
  body: string, inReplyTo: string
): Promise<string | null> {
  try {
    const raw = buildReplyMime({
      fromAddress,
      toAddress,
      subject: message.headers.get('subject') || 'your website',
      inReplyTo,
      references: message.headers.get('references'),
      messageId: `${crypto.randomUUID()}@garage.co.nz`,
      body: body + '\n\n—\ngarage.co.nz\n',
    });
    await message.reply(new EmailMessage(fromAddress, toAddress, raw));
    return null;
  } catch (error) {
    // A failed reply must never undo work that already succeeded, but it must
    // leave a trace — a missing confirmation is otherwise invisible.
    console.error('Reply failed:', error);
    return String((error as Error)?.message || error).slice(0, 400);
  }
}

// ── Everything else: unchanged behaviour ────────────────────────────────────

async function storeAsInboxMail(message: EmailMessageIn, env: Env): Promise<void> {
  const from = message.from;
  const subject = message.headers.get('subject') || '(no subject)';
  // Was: split on the first blank line and keep the rest. That drops the top
  // headers and keeps everything else — every MIME boundary, every nested
  // Content-Type, and the whole quoted-printable HTML part — so the inbox
  // preview read "--0000000000000dddc7065a0171fa Content-Type: multipart".
  // PostalMime was already being used ten lines up for site mail; this path
  // just never reached for it.
  let bodyText = '';
  let attachments: { name: string; type: string; size: number; url: string }[] = [];
  try {
    const parsed = await PostalMime.parse(message.raw);
    bodyText = String(parsed.text || '').trim();

    // Whatever they attached, kept. A CV that arrives as a subject line about
    // a CV is not a message anybody can act on. Same bucket the builder uses,
    // so /images/<key> serves it back with the right content type.
    for (const file of (parsed.attachments || []).slice(0, 6)) {
      try {
        const bytes: ArrayBuffer =
          file.content instanceof ArrayBuffer
            ? file.content
            : new TextEncoder().encode(String(file.content || '')).buffer;
        if (!bytes.byteLength || bytes.byteLength > 15_000_000) continue;

        const name = String(file.filename || 'attachment').replace(/[^\w.\-]+/g, '_').slice(0, 60);
        const type = String(file.mimeType || 'application/octet-stream');
        // Single-segment key: /images/[filename] does not route nested paths.
        const key = `mail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}`;
        await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: type } });
        attachments.push({
          name: String(file.filename || name).slice(0, 80),
          type,
          size: bytes.byteLength,
          url: `https://garage.co.nz/images/${key}`,
        });
      } catch (error) {
        console.error('Could not keep an attachment:', error);
      }
    }
    if (!bodyText && parsed.html) {
      bodyText = String(parsed.html)
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch (error) {
    // A mail we cannot parse is still a mail worth keeping, so fall back to
    // the old behaviour rather than dropping it.
    console.error('Could not parse inbound mail:', error);
    const rawEmail = await new Response(message.raw).text();
    const parts = rawEmail.split('\r\n\r\n');
    if (parts.length > 1) bodyText = parts.slice(1).join('\r\n\r\n');
  }

  let fromName: string | null = null;
  let fromAddress = from;
  const nameMatch = from.match(/^(.+?)\s*<(.+?)>$/);
  if (nameMatch) {
    fromName = nameMatch[1].replace(/"/g, '').trim();
    fromAddress = nameMatch[2];
  }

  await env.DB
    .prepare(
      `INSERT INTO emails (from_address, from_name, to_address, subject, body_text, attachments, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      fromAddress, fromName, message.to, subject, bodyText.slice(0, 50000),
      attachments.length ? JSON.stringify(attachments) : null,
      new Date().toISOString()
    )
    .run();

  try {
    await fetch(`${SITE_ORIGIN}/api/booking-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fromName || fromAddress,
        email: fromAddress,
        time: 'Email received',
        meetingType: 'email',
      }),
    });
  } catch {
    // Push failures must not lose the email.
  }
}
