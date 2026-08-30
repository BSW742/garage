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
