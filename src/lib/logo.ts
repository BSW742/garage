// Turning a short conversation about a business into a prompt for an image
// model.
//
// This used to be a long list of prohibitions — no text, no colour, no depth,
// no detail — written on the assumption that image models garble lettering and
// that a logo must be a flat minimal mark. Neither held up. The model spells
// business names correctly, and the rich cartoon it produces unprompted is
// both better and fifteen times faster than what the constraints squeezed out
// of it. So the prompt now says what is wanted and gets out of the way.

export const LOGO_STYLES: Record<string, string> = {
  cartoon: 'cartoon',
  mark: 'simple flat icon',
  badge: 'vintage badge',
  letter: 'bold lettering',
  illustration: 'hand drawn illustrated',
};

export interface LogoBrief {
  name: string;
  trade?: string;
  style?: string;
  colour?: string;
  extra?: string;
}

export function logoPrompt(brief: LogoBrief): string {
  const style = LOGO_STYLES[brief.style || ''] || brief.style || '';
  return [
    'Logo for',
    brief.name,
    brief.trade || '',
    style ? style + ' style' : '',
    brief.colour ? 'using ' + brief.colour : '',
    brief.extra || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

export function cleanBrief(input: any): LogoBrief | null {
  const name = String(input?.name ?? '').trim().slice(0, 80);
  if (!name) return null;
  return {
    name,
    trade: String(input?.trade ?? '').trim().slice(0, 60) || undefined,
    style: String(input?.style ?? '').trim().slice(0, 40) || undefined,
    colour: String(input?.colour ?? '').trim().slice(0, 40) || undefined,
    extra: String(input?.extra ?? '').trim().slice(0, 200) || undefined,
  };
}

export const RATE_PER_IP_HOUR = 6;
export const RATE_PER_DAY = 120;
