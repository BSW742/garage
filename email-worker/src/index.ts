import PostalMime from 'postal-mime';
// @ts-expect-error — provided by the Workers runtime, not by node types.
import { EmailMessage } from 'cloudflare:email';
import {
  mailboxSlug, bareAddress, authVerdict, isAutomated, buildReplyMime,
  MAX_IMAGES_PER_EMAIL, addToGallery, youtubeId, addVideo, usablePhotos,
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

  if (!attachments.length && !video) {
    record.intent = 'held';
    return say(
      heic
        ? `Those photos are in a format websites cannot show (HEIC). On an iPhone: Settings > Camera > Formats > Most Compatible, then send them again.`
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
  const rawEmail = await new Response(message.raw).text();

  let bodyText = '';
  const parts = rawEmail.split('\r\n\r\n');
  if (parts.length > 1) bodyText = parts.slice(1).join('\r\n\r\n');

  let fromName: string | null = null;
  let fromAddress = from;
  const nameMatch = from.match(/^(.+?)\s*<(.+?)>$/);
  if (nameMatch) {
    fromName = nameMatch[1].replace(/"/g, '').trim();
    fromAddress = nameMatch[2];
  }

  await env.DB
    .prepare(
      `INSERT INTO emails (from_address, from_name, to_address, subject, body_text, received_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(fromAddress, fromName, message.to, subject, bodyText.slice(0, 50000), new Date().toISOString())
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
