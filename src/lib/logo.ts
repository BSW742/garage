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
 * Image models will happily produce a busy full-colour scene with garbled
 * lettering unless told very plainly not to. Logos need flat shapes, one
 * colour, lots of space and absolutely no text — misspelled words are the
 * single most common way these come out unusable.
 */
export function logoPrompt(brief: LogoBrief): string {
  const style = LOGO_STYLES[brief.style || 'mark'] || LOGO_STYLES.mark;
  const bits = [
    `A professional logo for "${brief.name}"`,
    brief.trade ? `, a ${brief.trade} business in New Zealand` : '',
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
