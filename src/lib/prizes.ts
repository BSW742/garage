// The prize catalogue.
//
// Free text on a wheel was the mistake. "20% off your next bag of beans" is
// twenty-nine characters that have to be shrunk, rotated and truncated into a
// forty-five degree wedge, and the design ends up bending around the worst case
// rather than looking like anything. Every label here is short enough to sit in
// a wedge at a readable size, so the wheel can be drawn once and drawn properly.
//
// The icons are line drawings rather than emoji. Emoji are somebody else's
// artwork in somebody else's colours, and eight of them around a wheel is a
// sticker album — one stroke weight in one colour reads as a designed object.

export interface Prize {
  id: string;
  icon: string;    // a 24x24 path set, stroked in currentColor
  label: string;   // 14 characters at the very most
  note: string;    // the longer version, for the win screen and the owner's email
}

const I = {
  gift: '<path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>',
  tag: '<path d="M20.6 13.4L12 22l-9-9V4h9zM7.5 7.5h.01"/>',
  percent: '<path d="M19 5L5 19M6.5 6.5h.01M17.5 17.5h.01"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  ticket: '<path d="M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3a3 3 0 000 6v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a3 3 0 000-6zM13 5v2M13 11v2M13 17v2"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/>',
  cup: '<path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 9h1.5a2.5 2.5 0 010 5H17M3 22h15"/>',
  glass: '<path d="M5 4h14l-1.5 6.5A4 4 0 0113.6 14h-3.2a4 4 0 01-3.9-3.5zM12 14v6M8.5 20h7"/>',
  cake: '<path d="M6 10h12l-1 10H7zM8.5 10L9 4M15.5 10L15 4M12 10V4M4 20h16"/>',
  note: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  van: '<path d="M2 7h11v10H2zM13 10h4.5l3.5 3.5V17h-8z"/><circle cx="6.5" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  figure: '<circle cx="12" cy="5" r="2.4"/><path d="M12 8v6M8 21l4-7 4 7M6 11l6-2 6 2"/>',
  shirt: '<path d="M8 3l4 2 4-2 5 3-2.5 4L17 9v12H7V9l-1.5 1L3 6z"/>',
  spark: '<path d="M12 2.5l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9zM18.5 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  up: '<path d="M12 20V5M6 11l6-6 6 6M6 21h12"/>',
};

export const PRIZES: Prize[] = [
  { id: 'gift',     icon: I.gift,     label: 'Free gift',     note: 'A free gift' },
  { id: 'off10',    icon: I.percent,  label: '10% off',       note: '10% off your next visit' },
  { id: 'off20',    icon: I.percent,  label: '20% off',       note: '20% off your next visit' },
  { id: 'half',     icon: I.scissors, label: 'Half price',    note: 'Half price on your next one' },
  { id: 'bogof',    icon: I.ticket,   label: '2 for 1',       note: 'Two for one' },
  { id: 'vip',      icon: I.star,     label: 'VIP upgrade',   note: 'A VIP upgrade' },
  { id: 'coffee',   icon: I.cup,      label: 'Free coffee',   note: 'A free coffee' },
  { id: 'drink',    icon: I.glass,    label: 'Free drink',    note: 'A free drink' },
  { id: 'dessert',  icon: I.cake,     label: 'Free dessert',  note: 'A free dessert' },
  { id: 'ten',      icon: I.note,     label: '$10 off',       note: '$10 off' },
  { id: 'twenty',   icon: I.note,     label: '$20 off',       note: '$20 off' },
  { id: 'fifty',    icon: I.note,     label: '$50 off',       note: '$50 off' },
  { id: 'delivery', icon: I.van,      label: 'Free delivery', note: 'Free delivery' },
  { id: 'session',  icon: I.target,   label: 'Free session',  note: 'A free session' },
  { id: 'class',    icon: I.figure,   label: 'Free class',    note: 'A free class' },
  { id: 'merch',    icon: I.shirt,    label: 'Free merch',    note: 'A free bit of merch' },
  { id: 'sticker',  icon: I.spark,    label: 'Free sticker',  note: 'A free sticker' },
  { id: 'upgrade',  icon: I.up,       label: 'Free upgrade',  note: 'A free upgrade' },
];

export const PRIZE_BY_ID: Record<string, Prize> = Object.fromEntries(
  PRIZES.map((p) => [p.id, p])
);

/** A 24x24 line icon, at whatever size the caller asks for. */
export function icon(prize: Prize, size = '1.35rem'): string {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${prize.icon}</svg>`;
}

// Six squares in the picker, never more — a grid you can take in at a glance
// beats a catalogue you have to read. These six work for almost any small
// business; the shortlist changes with the trade where it can.
export const DEFAULT_SHORTLIST = ['gift', 'off10', 'off20', 'half', 'bogof', 'vip'];

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
