// The prize catalogue.
//
// Free text on a wheel was the mistake. "20% off your next bag of beans" is
// twenty-nine characters that have to be shrunk, rotated and truncated into a
// forty-five degree wedge, and the design ends up bending around the worst case
// rather than looking like anything. Every label here is short enough to sit in
// a wedge at a readable size, so the wheel can be drawn once and drawn properly.
//
// Each prize is an icon and a label, and the pair is fixed. That is the whole
// trick: the owner chooses which prizes, never how they are written.

export interface Prize {
  id: string;
  icon: string;    // one emoji, drawn above the label
  label: string;   // 14 characters at the very most
  note: string;    // the longer version, for the win screen and the owner's email
}

export const PRIZES: Prize[] = [
  { id: 'gift',     icon: '🎁', label: 'Free gift',    note: 'A free gift' },
  { id: 'off10',    icon: '🏷️', label: '10% off',      note: '10% off your next visit' },
  { id: 'off20',    icon: '💰', label: '20% off',      note: '20% off your next visit' },
  { id: 'half',     icon: '✂️', label: 'Half price',   note: 'Half price on your next one' },
  { id: 'bogof',    icon: '🎟️', label: '2 for 1',      note: 'Two for one' },
  { id: 'vip',      icon: '⭐', label: 'VIP upgrade',  note: 'A VIP upgrade' },
  { id: 'coffee',   icon: '☕', label: 'Free coffee',  note: 'A free coffee' },
  { id: 'drink',    icon: '🥤', label: 'Free drink',   note: 'A free drink' },
  { id: 'dessert',  icon: '🍰', label: 'Free dessert', note: 'A free dessert' },
  { id: 'ten',      icon: '💵', label: '$10 off',      note: '$10 off' },
  { id: 'twenty',   icon: '💸', label: '$20 off',      note: '$20 off' },
  { id: 'fifty',    icon: '🤑', label: '$50 off',      note: '$50 off' },
  { id: 'delivery', icon: '🚚', label: 'Free delivery',note: 'Free delivery' },
  { id: 'session',  icon: '🎯', label: 'Free session', note: 'A free session' },
  { id: 'class',    icon: '🧘', label: 'Free class',   note: 'A free class' },
  { id: 'merch',    icon: '👕', label: 'Free merch',   note: 'A free bit of merch' },
  { id: 'sticker',  icon: '💫', label: 'Free sticker', note: 'A free sticker' },
  { id: 'upgrade',  icon: '🚀', label: 'Free upgrade', note: 'A free upgrade' },
];

export const PRIZE_BY_ID: Record<string, Prize> = Object.fromEntries(
  PRIZES.map((p) => [p.id, p])
);

// Six squares in the picker, never more — a grid you can take in at a glance
// beats a catalogue you have to read. These six work for almost any small
// business; the agent can swap the shortlist for something that suits the trade.
export const DEFAULT_SHORTLIST = ['gift', 'off10', 'off20', 'half', 'bogof', 'vip'];

/** The six offered to a given trade, falling back to something universal. */
export function shortlistFor(style?: string): string[] {
  const byTrade: Record<string, string[]> = {
    cafe:       ['coffee', 'dessert', 'off10', 'bogof', 'drink', 'gift'],
    eggs:       ['gift', 'off10', 'delivery', 'half', 'twenty', 'merch'],
    beauty:     ['off20', 'upgrade', 'gift', 'half', 'ten', 'vip'],
    yoga:       ['class', 'off20', 'gift', 'merch', 'vip', 'bogof'],
    pilates:    ['class', 'off20', 'gift', 'merch', 'vip', 'bogof'],
    sauna:      ['session', 'off20', 'bogof', 'gift', 'vip', 'merch'],
    physio:     ['session', 'off20', 'gift', 'ten', 'vip', 'half'],
    workshop:   ['class', 'off20', 'gift', 'merch', 'half', 'vip'],
    trade:      ['off10', 'fifty', 'twenty', 'gift', 'upgrade', 'vip'],
    daycare:    ['gift', 'off10', 'merch', 'session', 'vip', 'twenty'],
    townhall:   ['off20', 'half', 'gift', 'ten', 'bogof', 'vip'],
    charity:    ['gift', 'merch', 'sticker', 'vip', 'upgrade', 'bogof'],
    rugby:      ['merch', 'sticker', 'gift', 'off20', 'bogof', 'vip'],
    soccer:     ['merch', 'sticker', 'gift', 'off20', 'bogof', 'vip'],
    basketball: ['merch', 'sticker', 'gift', 'off20', 'bogof', 'vip'],
  };
  return byTrade[String(style || '')] || DEFAULT_SHORTLIST;
}

/** Ids to prizes, dropping anything that is not in the catalogue. */
export function toPrizes(ids: unknown): Prize[] {
  if (!Array.isArray(ids)) return [];
  const out: Prize[] = [];
  for (const id of ids) {
    const prize = PRIZE_BY_ID[String(id || '')];
    if (prize && !out.some((p) => p.id === prize.id)) out.push(prize);
  }
  return out;
}
