// Turning an email sent to <slug>@garage.co.nz into a change on that site.
//
// The whole feature rests on knowing the sender really is the owner, so the
// authentication here is the important part rather than the parsing.

// Mirrors RESERVED_HOSTS in sites-worker: these belong to the main app, and
// mail to them must keep behaving exactly as it did before.
export const RESERVED_MAILBOXES = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'email', 'smtp', 'mx', 'ftp', 'ns', 'ns1', 'ns2',
  'cdn', 'static', 'assets', 'dev', 'staging', 'preview', 'test', 'local',
  'ben', 'hello', 'hi', 'info', 'support', 'contact', 'sales', 'noreply', 'no-reply',
  'postmaster', 'abuse', 'security', 'billing', 'accounts',
]);

// Formats a browser will actually render. iPhones can still send HEIC, which
// only Safari shows, so it is better to say so than to publish a broken tile.
export const WEB_SAFE_IMAGES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const MAX_IMAGES_PER_EMAIL = 6;

// Signature logos, social badges and tracking pixels are all images, all
// web-safe, and none of them belong on anybody's website. Real photos off a
// phone are hundreds of kilobytes; this junk is one or two.
export const MIN_PHOTO_BYTES = 30_000;

/**
 * The attachments that are actually photographs someone meant to send.
 *
 * `related` marks an image the HTML body refers to by cid — which is exactly
 * what an email signature is. Size catches the rest. Disposition is
 * deliberately not used: Apple Mail sends genuine photos inline.
 */
export function usablePhotos(attachments: any[]): any[] {
  return (attachments || []).filter((a) => {
    if (!WEB_SAFE_IMAGES.has(String(a?.mimeType || '').toLowerCase())) return false;
    if (a?.related) return false;
    const bytes = a?.content?.byteLength ?? 0;
    return bytes >= MIN_PHOTO_BYTES;
  });
}

/** "Dave <dave@x.co.nz>" -> "dave@x.co.nz" */
export function bareAddress(value: unknown): string {
  const raw = String(value ?? '').trim();
  const angled = raw.match(/<([^>]+)>/);
  return (angled ? angled[1] : raw).trim().toLowerCase();
}

/** The mailbox name of a garage.co.nz address, if that is what this is. */
export function mailboxSlug(to: unknown): string | null {
  const address = bareAddress(to);
  const match = address.match(/^([a-z0-9-]{1,63})@garage\.co\.nz$/);
  if (!match) return null;
  const slug = match[1];
  return RESERVED_MAILBOXES.has(slug) ? null : slug;
}

/**
 * What Cloudflare's SPF/DKIM/DMARC checks concluded. A From address on its own
 * proves nothing — anyone can type anything there — so this is what actually
 * decides whether we trust the message.
 */
export function authVerdict(header: string | null | undefined, from: string): {
  ok: boolean;
  detail: string;
} {
  const line = String(header ?? '').toLowerCase();
  if (!line) return { ok: false, detail: 'no authentication-results header' };

  const domain = bareAddress(from).split('@')[1] || '';
  const dmarc = line.match(/dmarc=(\w+)/)?.[1];
  const dkim = line.match(/dkim=(\w+)/)?.[1];
  const spf = line.match(/spf=(\w+)/)?.[1];
  const dkimDomain = line.match(/header\.d=([a-z0-9.-]+)/)?.[1];

  const detail = `dmarc=${dmarc ?? '-'} dkim=${dkim ?? '-'} spf=${spf ?? '-'}`;

  if (dmarc === 'pass') return { ok: true, detail };

  // DMARC missing is common on small business domains. A DKIM signature from
  // the sending domain itself is still real evidence.
  const aligned = !!dkimDomain && !!domain &&
    (dkimDomain === domain || domain.endsWith('.' + dkimDomain) || dkimDomain.endsWith('.' + domain));
  if (dkim === 'pass' && aligned) return { ok: true, detail };

  return { ok: false, detail };
}

/**
 * Out-of-office autoresponders must never be replied to, or two robots will
 * mail each other until someone notices.
 */
export function isAutomated(headers: { get(name: string): string | null }): boolean {
  const auto = (headers.get('auto-submitted') || '').toLowerCase();
  const precedence = (headers.get('precedence') || '').toLowerCase();
  const listId = headers.get('list-id');
  if (auto && auto !== 'no') return true;
  if (['bulk', 'list', 'junk'].includes(precedence)) return true;
  if (listId) return true;
  if (headers.get('x-autoreply') || headers.get('x-autorespond')) return true;
  return false;
}

/** Headers cannot contain newlines, and a subject is attacker-controlled. */
export function headerSafe(value: unknown, max = 180): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

export interface ReplyParts {
  fromAddress: string;
  toAddress: string;
  subject: string;
  inReplyTo?: string | null;
  body: string;
  messageId: string;
}

/** A plain-text reply. Plain text renders everywhere and cannot break. */
export function buildReplyMime(parts: ReplyParts): string {
  const subject = headerSafe(parts.subject);
  const lines = [
    `From: garage.co.nz <${parts.fromAddress}>`,
    `To: <${parts.toAddress}>`,
    `Subject: ${subject.toLowerCase().startsWith('re:') ? subject : 'Re: ' + subject}`,
    `Message-ID: <${parts.messageId}>`,
  ];
  if (parts.inReplyTo) {
    const ref = headerSafe(parts.inReplyTo, 400);
    lines.push(`In-Reply-To: ${ref}`, `References: ${ref}`);
  }
  lines.push('MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', '', parts.body);
  return lines.join('\r\n');
}

/**
 * Photos belong in the gallery. Newest first, since the point is showing recent
 * work. If the site has no gallery yet, it gets one — placed before the contact
 * section so the page still ends on a call to action.
 */
export function addToGallery(config: any, urls: string[], caption: string): void {
  config.sections = Array.isArray(config.sections) ? config.sections : [];
  let gallery = config.sections.find((s: any) => s && s.type === 'gallery');
  if (!gallery) {
    gallery = { type: 'gallery', images: [] };
    const contactAt = config.sections.findIndex((s: any) => s && s.type === 'contact');
    if (contactAt >= 0) config.sections.splice(contactAt, 0, gallery);
    else config.sections.push(gallery);
  }
  gallery.images = [...urls, ...(Array.isArray(gallery.images) ? gallery.images : [])].slice(0, 24);
  if (caption) gallery.title = caption;
}

/**
 * A YouTube id out of whatever shape of link someone pasted. Covers the normal
 * watch URL, the share shortlink, Shorts, and an embed URL, with or without the
 * tracking junk that gets added when you share from the app.
 */
export function youtubeId(text: unknown): string | null {
  const body = String(text ?? '');
  const patterns = [
    /youtube\.com\/watch\?(?:[^\s"'<>]*&)?v=([A-Za-z0-9_-]{11})/i,
    /youtu\.be\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/i,
  ];
  for (const pattern of patterns) {
    const found = body.match(pattern);
    if (found) return found[1];
  }
  return null;
}

/**
 * Put the video at the top of the page's own section, replacing whatever was
 * there before — a business has one film they are proud of at a time, and a
 * growing pile of half-finished clips is not what anyone wants.
 */
export function setVideo(config: any, videoId: string, title: string): void {
  config.sections = Array.isArray(config.sections) ? config.sections : [];
  let video = config.sections.find((s: any) => s && s.type === 'video');
  if (!video) {
    video = { type: 'video' };
    const galleryAt = config.sections.findIndex((s: any) => s && s.type === 'gallery');
    if (galleryAt >= 0) config.sections.splice(galleryAt, 0, video);
    else {
      const contactAt = config.sections.findIndex((s: any) => s && s.type === 'contact');
      if (contactAt >= 0) config.sections.splice(contactAt, 0, video);
      else config.sections.push(video);
    }
  }
  video.videoId = videoId;
  if (title) video.title = title;
}
