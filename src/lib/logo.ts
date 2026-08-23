// Turning a short conversation about a business into a prompt an image model
// can do something useful with.

export const LOGO_STYLES: Record<string, string> = {
  mark: 'a simple flat vector emblem, bold geometric shapes, no text or lettering',
  badge: 'a circular badge emblem with a clean outline, flat vector, no text or lettering',
  letter: 'a single bold letterform monogram, flat vector, geometric, no other text',
  illustration: 'a simple flat illustrative mark with soft rounded shapes, no text or lettering',
};

export interface LogoBrief {
  name: string;
  trade?: string;
  style?: string;
  colour?: string;
  extra?: string;
}

/**
 * Image models draw what they are told to draw. Given "a Local & independent
 * business" they invent something abstract and forgettable; given "a lawn
 * mowing business" they produce a mower. The subject is the whole game, which
 * is why the art direction is written by a model that has read the site rather
 * than assembled from whatever marketing copy happened to be lying around.
 */
export const ART_DIRECTOR = `You art-direct logos for small New Zealand businesses.

Given what a business is called and what it does, describe the single object or
symbol its logo should show. Reply with one sentence, no preamble.

Rules:
- Name one concrete, drawable thing. A tool of the trade, an animal, a plant, a
  landform, a simple object. Never an abstract concept like "flow" or "trust".
- If the trade is unclear, choose something suggested by the name itself.
- It must survive being shrunk to 16 pixels, so: one object, bold silhouette,
  no scenes, no small detail, no multiple elements arranged together.
- Never mention text, letters, words or typography.

Example in: Raglan Roast, a coffee roastery
Example out: A single coffee bean with a simple mountain range behind it.

Example in: Flowline, a plumbing business
Example out: A curved length of pipe forming a smooth continuous loop.`;

export function logoPrompt(brief: LogoBrief, direction?: string): string {
  const style = LOGO_STYLES[brief.style || 'mark'] || LOGO_STYLES.mark;
  const subject = (direction || '').trim().replace(/[.\s]+$/, '');
  const bits = [
    subject
      ? `A logo showing: ${subject}`
      : `A professional logo for "${brief.name}"${brief.trade ? `, a ${brief.trade} business` : ''}`,
    `. Design: ${style}.`,
    brief.colour ? ` Use ${brief.colour} as the only colour.` : ' Use a single colour.',
    brief.extra ? ` ${brief.extra}.` : '',
    ' Centred on a plain white background with generous margins.',
    ' Flat, clean, high contrast, no gradients, no shadows, no 3D, no photographic detail.',
    ' Absolutely no text, no words, no letters, no numbers anywhere in the image.',
    ' It must read clearly when shrunk to the size of a favicon.',
  ];
  return bits.join('').replace(/\s+/g, ' ').trim();
}

export function cleanBrief(input: any): LogoBrief | null {
  const name = String(input?.name ?? '').trim().slice(0, 80);
  if (!name) return null;
  return {
    name,
    trade: String(input?.trade ?? '').trim().slice(0, 60) || undefined,
    style: LOGO_STYLES[input?.style] ? input.style : 'mark',
    colour: String(input?.colour ?? '').trim().slice(0, 40) || undefined,
    extra: String(input?.extra ?? '').trim().slice(0, 200) || undefined,
  };
}

export const RATE_PER_IP_HOUR = 6;
export const RATE_PER_DAY = 120;
