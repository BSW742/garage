// OUTREACH
//
// Who can be emailed, and where each one has got to.
//
// This lives on its own because two things need the same answer and must never
// disagree: the CRM at /admin/coffee, which decides what to show Ben, and
// /api/record/send, which decides what actually leaves the building. A page
// that says "ready" over an endpoint that refuses is worse than either.

export type Verdict = {
  to: string;
  ok: boolean;
  kind: 'ok' | 'none' | 'invented' | 'mismatch' | 'unsubscribed';
  why: string;
};

/** co.nz, com.au and friends keep three labels; everything else keeps two. */
export function rootDomain(host: string): string {
  const parts = String(host || '').toLowerCase().replace(/^www\./, '').split('.');
  if (parts.length > 2 && ['co', 'com', 'org', 'net', 'govt', 'ac'].includes(parts[parts.length - 2])) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export function hostOf(url: unknown): string {
  return String(url || '').replace(/^https?:\/\//, '').split('/')[0].toLowerCase().replace(/^www\./, '');
}

const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const OBVIOUSLY_FAKE = /@(example\.|domain\.com|test\.|yoursite|email\.com$)/i;

/**
 * Whether this site can be emailed, and if not, why not.
 *
 * Three things go wrong and they are not the same problem:
 *
 *  - Half the estate is invented. The cron writes a plausible business and a
 *    plausible address to match, and info@somewherethatdoesnotexist.co.nz
 *    bounces — which is how a sending domain gets itself filtered before it
 *    has reached anybody real.
 *  - Some scraped addresses belong to somebody else entirely. Kokako's listed
 *    contact is their web agency; Credaro's is a stranger.
 *  - And some are not addresses at all. pad192x192@stretch.png passes a
 *    regex and is a scrape artefact.
 *
 * So an address has to trace back to the domain we actually read.
 */
export function verdictFor(row: {
  config?: string | null;
  email?: string | null;
  source_url?: string | null;
  unsubscribed_at?: string | null;
}): Verdict {
  let cfg: any = {};
  try { cfg = JSON.parse(row.config || '{}'); } catch { /* a bad config is still a real site */ }
  const to = String(cfg?.contact?.email || row.email || '').trim().toLowerCase();

  if (row.unsubscribed_at) {
    return { to, ok: false, kind: 'unsubscribed', why: 'They asked not to be emailed.' };
  }
  if (!LOOKS_LIKE_EMAIL.test(to) || OBVIOUSLY_FAKE.test(to)) {
    return { to, ok: false, kind: 'none', why: 'No usable address on this one.' };
  }
  if (!row.source_url) {
    return {
      to, ok: false, kind: 'invented',
      why: 'Invented by the cron — there is no business here, and that address is made up.',
    };
  }
  const source = hostOf(row.source_url);
  if (rootDomain(to.split('@')[1]) !== rootDomain(source)) {
    return {
      to, ok: false, kind: 'mismatch',
      why: `Does not belong to ${source} — often their web agency rather than them.`,
    };
  }
  return { to, ok: true, kind: 'ok', why: '' };
}

export type Stage = 'keen' | 'watched' | 'sent' | 'recorded' | 'ready' | 'claimed' | 'parked';

/** Where this one has got to. Ordered by heat, hottest first. */
export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: 'keen', label: 'Keen', hint: 'Thumbs up, or asked for something' },
  { id: 'watched', label: 'Watched', hint: 'Opened the film or pressed play' },
  { id: 'sent', label: 'Sent', hint: 'Emailed, nothing back yet' },
  { id: 'recorded', label: 'Recorded', hint: 'Has a take, not sent' },
  { id: 'ready', label: 'Ready', hint: 'Real address, needs a take' },
  { id: 'claimed', label: 'Claimed', hint: 'Theirs now' },
  { id: 'parked', label: 'Parked', hint: 'Invented, no address, or not theirs' },
];

export function stageOf(row: {
  claimed_at?: string | null;
  owner_sent_at?: string | null;
  liked_at?: string | null;
  wants?: number;
  opened?: number;
  plays?: number;
  hasTake?: boolean;
  verdict: Verdict;
}): Stage {
  // Claimed only counts as won if we asked them first. Thirty sites carry a
  // claimed_at because Ben claimed them himself while testing, and a board
  // showing thirty deals nobody ever emailed is worse than no board.
  if (row.claimed_at && row.owner_sent_at) return 'claimed';
  if (row.liked_at || (row.wants || 0) > 0) return 'keen';
  if ((row.opened || 0) > 0 || (row.plays || 0) > 0) return 'watched';
  if (row.owner_sent_at) return 'sent';
  // Parked comes after the signals: somebody who watched and gave a thumbs up
  // is interesting whatever the triage thinks of their address.
  if (!row.verdict.ok) return 'parked';
  if (row.hasTake) return 'recorded';
  return 'ready';
}

/**
 * Turn "=?Windows-1252?Q?Request_for_Pro_Bono?=" back into words.
 *
 * RFC 2047 encoded-words are how any subject containing a non-ASCII character
 * crosses the wire, and a client that does not decode them shows the reader a
 * wall of machine noise. That is not a cosmetic problem: a genuine enquiry
 * from a community trust arrived looking exactly like spam, and was nearly
 * deleted on that basis.
 *
 * Whitespace between two adjacent encoded-words is not part of the text and is
 * dropped, which is what the spec asks for and what makes the seam invisible.
 */
// The only part of windows-1252 that differs from latin-1: 0x80 to 0x9F, where
// latin-1 has control characters and Microsoft put the useful punctuation.
const CP1252_HIGH = [
  '\u20AC', '\u0081', '\u201A', '\u0192', '\u201E', '\u2026', '\u2020', '\u2021',
  '\u02C6', '\u2030', '\u0160', '\u2039', '\u0152', '\u008D', '\u017D', '\u008F',
  '\u0090', '\u2018', '\u2019', '\u201C', '\u201D', '\u2022', '\u2013', '\u2014',
  '\u02DC', '\u2122', '\u0161', '\u203A', '\u0153', '\u009D', '\u017E', '\u0178',
];

export function decodeSubject(raw: unknown): string {
  const text = String(raw ?? '');
  if (!text.includes('=?')) return text;

  const one = (charset: string, kind: string, data: string): string => {
    let bytes: Uint8Array;
    if (kind.toUpperCase() === 'B') {
      try {
        const bin = atob(data);
        bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      } catch { return data; }
    } else {
      // Q is quoted-printable with underscore standing in for a space.
      const out: number[] = [];
      for (let i = 0; i < data.length; i++) {
        const c = data[i];
        if (c === '_') out.push(32);
        else if (c === '=' && /^[0-9a-f]{2}$/i.test(data.slice(i + 1, i + 3))) {
          out.push(parseInt(data.slice(i + 1, i + 3), 16));
          i += 2;
        } else out.push(c.charCodeAt(0));
      }
      bytes = Uint8Array.from(out);
    }
    const cs = charset.toLowerCase();
    if (cs === 'windows-1252' || cs === 'cp1252' || cs === 'iso-8859-1' || cs === 'latin1') {
      // Done by hand. Node's TextDecoder maps 0x96 to U+0096, a control
      // character, rather than to the en dash windows-1252 actually puts
      // there — so the punctuation in a real subject line silently vanished.
      // The WHATWG spec treats iso-8859-1 as windows-1252 too, which is why
      // both land here.
      return Array.from(bytes, (b) =>
        b >= 0x80 && b <= 0x9f ? CP1252_HIGH[b - 0x80] : String.fromCharCode(b)
      ).join('');
    }
    try {
      return new TextDecoder(cs).decode(bytes);
    } catch {
      try { return new TextDecoder('utf-8').decode(bytes); } catch { return data; }
    }
  };

  return text
    .replace(/(=\?[^?]+\?[BbQq]\?[^?]*\?=)\s+(?==\?)/g, '$1')
    .replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_m, cs, kind, data) => one(cs, kind, data))
    .trim();
}

/**
 * Machine, or a person?
 *
 * The inbox is mostly bounces, delivery receipts and the platform's own
 * notifications talking to itself, and a single real enquiry from a human
 * being sits somewhere in the middle of it looking exactly the same. That is
 * how a request for a free website from a community trust gets taken for spam.
 *
 * Erring towards "person": a machine misfiled as a human costs a second of
 * reading, and a human misfiled as a machine costs the enquiry.
 */
export function isSystemMail(from: unknown, subject: unknown): boolean {
  const who = String(from || '').toLowerCase();
  const local = who.split('@')[0] || '';
  const domain = who.split('@')[1] || '';

  if (/^(bounce|mailer-daemon|postmaster|no-?reply|do-?not-?reply|notification|notifications|automated|auto|daemon|root)\b/.test(local)) return true;
  if (/bounce|mailer-daemon/.test(who)) return true;
  // Anything the platform sent that has come back to the platform.
  if (/(^|\.)(mg\.)?garage\.co\.nz$/.test(domain)) return true;
  if (/^(mailgun|sendgrid|amazonses|postmark)/.test(domain)) return true;

  const subj = String(subject || '').toLowerCase();
  if (/^(undelivered|delivery status|returned mail|out of office|automatic reply)/.test(subj)) return true;
  return false;
}
