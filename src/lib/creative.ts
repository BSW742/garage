// The ads and the page they land on, defined together on purpose.
//
// An ad that promises one thing and hands over to a page promising another is
// where a funnel leaks. Keeping both halves in one record means the landing copy
// cannot drift from the ad that earned the click.

export interface Ad {
  id: string;
  kind: 'square' | 'wide' | 'story';
  kicker: string;
  head: string;
  sub: string;
  /** Why this one exists and where to run it */
  note: string;
  /** What the landing page says to someone who arrived on this ad */
  landing: { head: string; hot?: string; sub: string };
}

export const ADS: Ad[] = [
  {
    id: 'question',
    kind: 'square',
    kicker: 'The question',
    head: 'Would ChatGPT recommend your business?',
    sub: 'Find out in thirty seconds. Free.',
    note: 'The broad one. Curiosity, no threat — widest top of funnel.',
    landing: {
      head: 'Would AI recommend',
      hot: 'your business?',
      sub: 'Customers are asking ChatGPT who to ring. Let’s see what it says about you — takes about thirty seconds.',
    },
  },
  {
    id: 'local',
    kind: 'square',
    kicker: 'The specific one',
    head: 'We asked AI for the best plumbers in Hamilton.',
    sub: 'Three came up. Was one of them you?',
    note: 'Swap trade and town per audience. Local and concrete beats clever.',
    landing: {
      head: 'Let’s ask AI about',
      hot: 'your trade, your town.',
      sub: 'The same question a customer near you would type. We’ll show you exactly who comes up, and whether you do.',
    },
  },
  {
    id: 'rival',
    kind: 'wide',
    kicker: 'The rival',
    head: 'Your competitor is on the list.',
    sub: 'You’re not. Find out why — takes thirty seconds.',
    note: 'Sharpest hook we have. Loss, not gain. Use where frequency is low.',
    landing: {
      head: 'Let’s see who is',
      hot: 'on the list.',
      sub: 'We’ll ask AI who it recommends near you, name every business it gives back, and show you where you sit against them.',
    },
  },
  {
    id: 'shift',
    kind: 'wide',
    kicker: 'The shift',
    head: 'Nobody’s googling “plumber near me” any more.',
    sub: 'They’re asking AI. See what it says about you.',
    note: 'For owners who already sense Google traffic slipping.',
    landing: {
      head: 'They stopped googling.',
      hot: 'Now they ask AI.',
      sub: 'So the only question that matters is what AI says when someone asks for a business like yours. Let’s find out.',
    },
  },
  {
    id: 'quiet',
    kind: 'story',
    kicker: 'The quiet one',
    head: 'When AI is asked about your business, what does it say?',
    sub: 'Often: nothing at all.',
    note: 'Softer. Good for retargeting people who bounced.',
    landing: {
      head: 'What does AI say',
      hot: 'about you?',
      sub: 'Sometimes the answer is nothing at all — and that’s worth knowing. Thirty seconds, no account, no catch.',
    },
  },
  {
    id: 'dare',
    kind: 'story',
    kicker: 'The dare',
    head: 'Go on. Check.',
    sub: 'See whether AI would send a customer your way.',
    note: 'Short-form video end card. Needs the brand already warm.',
    landing: {
      head: 'Right then.',
      hot: 'Let’s check.',
      sub: 'Two things, and we’ll ask AI whether it would send a customer your way.',
    },
  },
];

export function adById(id: string | null | undefined): Ad | null {
  if (!id) return null;
  return ADS.find((ad) => ad.id === id) || null;
}
