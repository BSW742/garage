// Looking at the pictures, instead of guessing from their filenames.
//
// Everything upstream of this inferred role and quality from markup: the word
// "logo" in a class attribute, a byte count, a width attribute modern builders
// no longer emit. Those guesses failed silently — a hamburger icon became the
// logo, a signature graphic became a gallery photo, and nobody found out until
// the owner opened their own site. One look answers all of it at once.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-5';
const MAX_IMAGES = 12;

export interface ImageVerdict {
  url: string;
  kind: 'photo' | 'logo' | 'furniture';
  /** 0 unusable, 5 would happily put it on the homepage */
  quality: number;
  orientation: 'landscape' | 'portrait' | 'square';
  subject: string;
  /** Would carry a full-bleed header with a headline over the top */
  hero: boolean;
  /** Logos only: what the mark needs behind it to be visible at all */
  needs?: 'anything' | 'dark' | 'light';
}

export interface VisionResult {
  ok: boolean;
  images: ImageVerdict[];
  logo: string | null;
  palette: string | null;
  /** Publishable photographs, best first */
  photos: string[];
  hero: string | null;
  /** 0 to 1 — could someone build this business a site from this material alone */
  confidence: number;
  /** The chosen logo will disappear unless the page behind it is dark */
  logoNeedsDark: boolean;
  note?: string;
}

const EMPTY: VisionResult = {
  ok: false,
  images: [],
  logo: null,
  palette: null,
  photos: [],
  hero: null,
  confidence: 0,
  logoNeedsDark: false,
};

const PROMPT = `You are looking at images taken off a small business website, to work out what is
actually usable when we rebuild it.

For each image, say what it is:
- photo — a real photograph: their work, their premises, their people, their products
- logo — their brand mark or wordmark
- furniture — website plumbing rather than content: icons, buttons, arrows, social badges,
  sprites, decorative patterns, placeholder blocks, screenshots of interface

quality is 0 to 5 and means "would I publish this on their homepage". A sharp, well-lit
photograph of their actual work is a 5. Dark, blurry, tiny, stretched or heavily watermarked
is a 1. Judge the picture, not how interesting the subject is. Reserve 0 for genuinely
unusable — corrupt, blank, or so degraded there is nothing to see. It is a ranking, not a
pass mark: a mediocre photo of their real work still beats an empty page.

needs applies to logos only, and it matters more than it sounds. A logo drawn in white on a
transparent background is invisible on a white page — say "dark". One drawn in dark ink on
transparency needs "light". Anything with its own background, or mid-toned enough to read
either way, is "anything".

hero means it would carry a full-bleed header with a headline over the top: wide, room to
breathe, nothing important in the middle where the words go.

palette is the dominant brand colour from the logo, as a hex. Leave it out if there is no logo.

confidence is 0 to 1: how well could someone build this business a website from this material
alone. A logo and four good photographs of their work is high. A logo and three icons is low.
Be honest — a low score gets the owner asked for better photos, which is the right outcome.`;

const REPORT_TOOL = {
  name: 'report',
  description: 'Report what you see in the images.',
  input_schema: {
    type: 'object' as const,
    properties: {
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'number', description: 'Which image, counting from 1 in the order shown' },
            kind: { type: 'string', enum: ['photo', 'logo', 'furniture'] },
            quality: { type: 'number', description: '0 unusable to 5 excellent' },
            orientation: { type: 'string', enum: ['landscape', 'portrait', 'square'] },
            subject: { type: 'string', description: 'What it shows, a few words' },
            hero: { type: 'boolean' },
            needs: {
              type: 'string',
              enum: ['anything', 'dark', 'light'],
              description: 'Logos only: what must be behind it for it to be visible',
            },
          },
          required: ['index', 'kind', 'quality', 'orientation', 'subject', 'hero'],
        },
      },
      palette: { type: 'string', description: 'Brand hex from the logo, e.g. #16a34a' },
      confidence: { type: 'number', description: '0 to 1' },
    },
    required: ['images', 'confidence'],
  },
};

/**
 * Look at a set of images and report what they actually are. Fails soft: if the
 * call errors, callers get ok:false and should keep whatever the old heuristics
 * gave them. Acquisition degrading is survivable; acquisition breaking is not.
 */
/**
 * Send the bytes rather than the link. Some sources we can reach are ones the
 * model's own fetcher cannot — a query-string image URL, or a host that treats
 * an unfamiliar caller as a bot. If we already hold the file, hand it over.
 */
async function inlineSource(url: string): Promise<any | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/png,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    const type = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!/^image\/(png|jpeg|gif|webp)$/.test(type)) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 4_500_000) return null;
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    return { type: 'base64', media_type: type, data: btoa(binary) };
  } catch {
    return null;
  }
}

export async function lookAtImages(
  apiKey: string,
  urls: string[],
  opts: { inline?: boolean } = {}
): Promise<VisionResult> {
  const candidates = [...new Set((urls || []).filter(Boolean))].slice(0, MAX_IMAGES);
  if (!apiKey || !candidates.length) return { ...EMPTY, note: 'nothing to look at' };

  try {
    const client = new Anthropic({ apiKey });
    const sources = await Promise.all(
      candidates.map(async (url) =>
        opts.inline ? (await inlineSource(url)) || { type: 'url', url } : { type: 'url', url }
      )
    );
    const content: any[] = [{ type: 'text', text: PROMPT }];
    candidates.forEach((url, i) => {
      content.push({ type: 'text', text: `Image ${i + 1}:` });
      content.push({ type: 'image', source: sources[i] });
    });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      tools: [REPORT_TOOL as any],
      tool_choice: { type: 'tool', name: 'report' },
      messages: [{ role: 'user', content }],
    });

    const call = (response.content as any[]).find((b) => b.type === 'tool_use');
    if (!call) return { ...EMPTY, note: 'no verdict returned' };

    const said = call.input || {};
    const verdicts: ImageVerdict[] = (said.images || [])
      .map((v: any) => {
        const url = candidates[Number(v.index) - 1];
        if (!url) return null;
        return {
          url,
          kind: ['photo', 'logo', 'furniture'].includes(v.kind) ? v.kind : 'furniture',
          quality: Math.max(0, Math.min(5, Number(v.quality) || 0)),
          orientation: ['landscape', 'portrait', 'square'].includes(v.orientation)
            ? v.orientation
            : 'landscape',
          subject: String(v.subject || '').slice(0, 80),
          hero: !!v.hero,
          needs: ['anything', 'dark', 'light'].includes(v.needs) ? v.needs : 'anything',
        } as ImageVerdict;
      })
      .filter(Boolean);

    // Best logo by quality, so a crisp mark beats a washed-out one.
    const logoVerdict =
      verdicts.filter((v) => v.kind === 'logo').sort((a, b) => b.quality - a.quality)[0] || null;
    const logo = logoVerdict?.url || null;

    // Rank, do not gate. A middling photo of their actual work beats an empty
    // gallery, and an empty page loses them in seconds. Drop only what is
    // genuinely unusable and let the best rise to the top.
    const photos = verdicts
      .filter((v) => v.kind === 'photo' && v.quality > 0)
      .sort((a, b) => b.quality - a.quality);

    const hero =
      photos.filter((v) => v.hero).sort((a, b) => b.quality - a.quality)[0]?.url ||
      photos[0]?.url ||
      null;

    const palette = /^#[0-9a-f]{6}$/i.test(String(said.palette || '')) ? said.palette : null;

    return {
      ok: true,
      images: verdicts,
      logo,
      palette,
      photos: photos.map((v) => v.url),
      hero,
      confidence: Math.max(0, Math.min(1, Number(said.confidence) || 0)),
      logoNeedsDark: logoVerdict?.needs === 'dark',
    };
  } catch (error) {
    console.error('Vision pass failed:', error);
    return { ...EMPTY, note: error instanceof Error ? error.message : 'vision failed' };
  }
}
