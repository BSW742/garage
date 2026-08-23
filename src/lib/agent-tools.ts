// The tools the builder agent can actually use. Each one is a pure mutation
// over the site JSON (or a lookup), so the model composes them freely instead
// of picking from a fixed menu of hardcoded intents.

import type { SiteConfig, SiteSection } from './site-render';

export interface ToolResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

export interface ToolContext {
  site: SiteConfig;
  // Images already pulled off their own site, preferred over stock
  ownImages: string[];
}

const SECTION_TYPES = ['services', 'about', 'gallery', 'hours', 'testimonial', 'contact', 'band', 'faq', 'pricing', 'shop'];

export const TOOLS = [
  {
    name: 'edit_text',
    description:
      'Change any single piece of text on the page. Paths: name, headline, lede, eyebrow, cta, ' +
      'contact.phone, contact.email, contact.address, sec.<i>.label, sec.<i>.title, sec.<i>.text, ' +
      'sec.<i>.quote, sec.<i>.who, sec.<i>.items.<j>.0 (service name), sec.<i>.items.<j>.1 ' +
      '(service description), sec.<i>.rows.<j>.0 (day), sec.<i>.rows.<j>.1 (hours). ' +
      'Section indexes are the positions in the sections array you were given.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path of the text to change' },
        text: { type: 'string', description: 'The new text' },
      },
      required: ['path', 'text'],
    },
  },
  {
    name: 'set_style',
    description:
      'Change the look of the whole site. style: modern (rounded, soft shadows), brutal (heavy ' +
      'type, hard black borders, left-aligned), classic (serif, hairlines, wide letter-spacing). ' +
      'tone is the background: light, warm or dark. primary_colour is a hex like #16a34a and ' +
      'recolours buttons, links and accents.',
    input_schema: {
      type: 'object',
      properties: {
        style: { type: 'string', enum: ['modern', 'brutal', 'classic'] },
        tone: { type: 'string', enum: ['light', 'warm', 'dark'] },
        primary_colour: { type: 'string', description: 'Hex colour, e.g. #16a34a' },
      },
    },
  },
  {
    name: 'set_products',
    description:
      'Put things in the shop. The site already carries a cart; this fills it. Nobody is asked for ' +
      'card details — a cart is sent through as an enquiry and the owner arranges payment. ' +
      'Replaces whatever is listed. Add a shop section to show them on the page.',
    input_schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'string', description: 'Written as it should appear, eg $42' },
              text: { type: 'string', description: 'A line about it' },
              image: { type: 'string', description: 'Photo URL' },
            },
            required: ['name'],
          },
        },
      },
      required: ['products'],
    },
  },
  {
    name: 'set_cart',
    description: 'Turn the shopping cart on or off for this site. It is on by default.',
    input_schema: {
      type: 'object',
      properties: { on: { type: 'boolean' } },
      required: ['on'],
    },
  },
  {
    name: 'set_team',
    description:
      'Put people on the Team page, which becomes its own page at /team once anyone is on it. ' +
      'Replaces whoever is listed. Each person takes a name, a role, a short description and ' +
      'optionally a photo URL from the media library.',
    input_schema: {
      type: 'object',
      properties: {
        people: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string', description: 'Job title or qualification' },
              text: { type: 'string', description: 'A short paragraph about them' },
              image: { type: 'string', description: 'Photo URL' },
            },
            required: ['name'],
          },
        },
      },
      required: ['people'],
    },
  },
  {
    name: 'set_case_studies',
    description:
      'Put case studies on their own page at /case-studies. Same shape as the team page but each ' +
      'one shows a YouTube video instead of a photo. Replaces whatever is listed.',
    input_schema: {
      type: 'object',
      properties: {
        studies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The job or client' },
              role: { type: 'string', description: 'What the work was' },
              text: { type: 'string', description: 'A short paragraph about it' },
              videoId: { type: 'string', description: 'YouTube video id or full link' },
            },
            required: ['title'],
          },
        },
      },
      required: ['studies'],
    },
  },
  {
    name: 'add_section',
    description:
      'Add a section to the page. services takes items (name + description pairs). about and band ' +
      'take text. hours takes rows (day + hours pairs). testimonial takes quote and who. gallery ' +
      'takes images. faq takes items (question + answer pairs). pricing is a rate card and takes ' +
      'rows (item + price pairs), plus optional text for a note such as GST or travel. shop shows ' +
      'whatever set_products has put in the shop. contact renders the ' +
      'phone/email/address already on the site.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: SECTION_TYPES },
        position: { type: 'integer', description: 'Where to insert it; omit to append' },
        label: { type: 'string', description: 'Small uppercase line above the heading' },
        title: { type: 'string', description: 'Section heading' },
        text: { type: 'string', description: 'Body text, for about and band sections' },
        items: {
          type: 'array',
          description: 'For services: [{name, description}]. For faq: [{name: question, description: answer}]',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, description: { type: 'string' } },
            required: ['name', 'description'],
          },
        },
        rows: {
          type: 'array',
          description: 'For hours: [{day, hours}]. For pricing: [{day: item, hours: price}]',
          items: {
            type: 'object',
            properties: { day: { type: 'string' }, hours: { type: 'string' } },
            required: ['day', 'hours'],
          },
        },
        quote: { type: 'string' },
        who: { type: 'string' },
        images: { type: 'array', items: { type: 'string' }, description: 'Image URLs for a gallery' },
      },
      required: ['type'],
    },
  },
  {
    name: 'update_section',
    description:
      'Rewrite part of an existing section. Only the fields you pass are changed. Use this to ' +
      'replace all the services at once, or to rewrite a section heading and body together.',
    input_schema: {
      type: 'object',
      properties: {
        index: { type: 'integer', description: 'Position of the section in the sections array' },
        label: { type: 'string' },
        title: { type: 'string' },
        text: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, description: { type: 'string' } },
            required: ['name', 'description'],
          },
        },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { day: { type: 'string' }, hours: { type: 'string' } },
            required: ['day', 'hours'],
          },
        },
        quote: { type: 'string' },
        who: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
        tint: { type: 'string', description: 'Hex colour, band sections only' },
      },
      required: ['index'],
    },
  },
  {
    name: 'remove_section',
    description: 'Delete a section from the page.',
    input_schema: {
      type: 'object',
      properties: { index: { type: 'integer' } },
      required: ['index'],
    },
  },
  {
    name: 'move_section',
    description: 'Move a section to a different position on the page.',
    input_schema: {
      type: 'object',
      properties: { from: { type: 'integer' }, to: { type: 'integer' } },
      required: ['from', 'to'],
    },
  },
  {
    name: 'find_images',
    description:
      "Search for photos to use on the page. Returns image URLs with descriptions. Their own " +
      "photos, if we have any, come back first — prefer those over stock. Look at what comes back " +
      'before choosing; the descriptions tell you what each one shows.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What the photo should show, e.g. "plumber fixing a pipe"' },
        count: { type: 'integer', description: 'How many to return, up to 10' },
      },
      required: ['query'],
    },
  },
  {
    name: 'set_images',
    description:
      'Put images on the page. hero is the big background photo behind the headline. gallery ' +
      'replaces the photos in the gallery section (adding one if there is not one already). ' +
      'logo sets the mark in the header. Pass null to remove.',
    input_schema: {
      type: 'object',
      properties: {
        hero: { type: ['string', 'null'] },
        logo: { type: ['string', 'null'] },
        gallery: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'ask_for_photos',
    description:
      'Ask them for photos of their own and open the photo picker in the chat, so they can drop ' +
      'some in there and then. Use this when the page is running on stock images or has almost ' +
      'nothing of theirs. They are sitting in front of the preview with a phone full of photos — ' +
      'asking now beats emailing later. Build the page out first with whatever you have, then ask ' +
      'once. Never ask twice in a conversation, and never ask if they have already given you photos.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'What you are short of, in a few words — e.g. "photos of your work"',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'read_url',
    description:
      'Fetch a web page and read what is on it — their old site, a Facebook page, a supplier page. ' +
      'Returns the words, contact details, services and image URLs found there.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Full URL including https://' } },
      required: ['url'],
    },
  },
];

// ── Path access (mirrors the builder's own addressing) ──────────────

function resolvePath(site: SiteConfig, path: string): { obj: any; key: string } | null {
  const parts = String(path).split('.');
  let obj: any;
  let keys: string[];
  if (parts[0] === 'sec') {
    obj = (site.sections || [])[Number(parts[1])];
    keys = parts.slice(2);
  } else {
    obj = site;
    keys = parts;
  }
  if (!obj || !keys.length) return null;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
    if (!obj) return null;
  }
  return { obj, key: keys[keys.length - 1] };
}

function safeImage(url: unknown): string | null {
  const value = String(url || '').trim();
  return /^https?:\/\//i.test(value) ? value : null;
}

function pairsToItems(items: any[]): [string, string][] {
  return (items || [])
    .map((i) => [String(i.name || '').slice(0, 60), String(i.description || '').slice(0, 240)] as [string, string])
    .filter((i) => i[0]);
}

function pairsToRows(rows: any[]): [string, string][] {
  return (rows || [])
    .map((r) => [String(r.day || '').slice(0, 40), String(r.hours || '').slice(0, 40)] as [string, string])
    .filter((r) => r[0]);
}

function applySectionFields(section: SiteSection, input: any) {
  if (input.label !== undefined) section.label = String(input.label).slice(0, 60);
  if (input.title !== undefined) section.title = String(input.title).slice(0, 120);
  if (input.text !== undefined) section.text = String(input.text).slice(0, 1200);
  if (input.quote !== undefined) section.quote = String(input.quote).slice(0, 400);
  if (input.who !== undefined) section.who = String(input.who).slice(0, 80);
  if (input.tint !== undefined) section.tint = String(input.tint).slice(0, 32);
  if (input.items !== undefined) section.items = pairsToItems(input.items).slice(0, 8);
  if (input.rows !== undefined) section.rows = pairsToRows(input.rows).slice(0, 8);
  if (input.images !== undefined) {
    section.images = (input.images || []).map(safeImage).filter(Boolean).slice(0, 8) as string[];
  }
}

// ── Image search (Openverse: openly-licensed, no API key) ───────────

async function searchOpenverse(query: string, count: number) {
  const url =
    'https://api.openverse.org/v1/images/?' +
    new URLSearchParams({
      q: query,
      page_size: String(Math.min(Math.max(count, 1), 10)),
      license_type: 'commercial',
      mature: 'false',
    });

  const res = await fetch(url, { headers: { 'User-Agent': 'garage.co.nz site builder' } });
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  const data: any = await res.json();

  return (data.results || [])
    .map((r: any) => ({
      url: r.url as string,
      description: [r.title, r.creator && `by ${r.creator}`].filter(Boolean).join(' '),
      source: 'openverse',
    }))
    .filter((r: any) => safeImage(r.url));
}

// ── Dispatch ────────────────────────────────────────────────────────

export async function runTool(
  name: string,
  input: any,
  ctx: ToolContext,
  deps: { scrape: (url: string) => Promise<any> }
): Promise<ToolResult> {
  const site = ctx.site;
  site.sections = site.sections || [];

  switch (name) {
    case 'edit_text': {
      const target = resolvePath(site, input.path);
      if (!target) return { ok: false, message: `No such place on the page: ${input.path}` };
      target.obj[target.key] = String(input.text).slice(0, 1200);
      return { ok: true, message: `Updated ${input.path}` };
    }

    case 'set_style': {
      const changed: string[] = [];
      if (input.style) { site.style = input.style; changed.push(`${input.style} style`); }
      if (input.tone) { site.tone = input.tone; changed.push(`${input.tone} background`); }
      if (input.primary_colour && /^#[0-9a-f]{6}$/i.test(input.primary_colour)) {
        site.palette = { ...(site.palette || {}), primary: input.primary_colour };
        changed.push(`colour ${input.primary_colour}`);
      }
      if (!changed.length) return { ok: false, message: 'Nothing to change' };
      return { ok: true, message: changed.join(', ') };
    }

    case 'set_products': {
      const products = (input.products || []).slice(0, 24).map((p: any) => ({
        name: String(p?.name ?? '').slice(0, 120),
        price: String(p?.price ?? '').slice(0, 40),
        text: String(p?.text ?? '').slice(0, 400),
        image: safeImage(p?.image) || undefined,
      })).filter((p: any) => p.name);
      site.products = products;
      return { ok: true, message: products.length ? `Shop now has ${products.length}` : 'Shop cleared' };
    }

    case 'set_cart': {
      site.shop = input.on !== false;
      return { ok: true, message: site.shop ? 'Cart is on' : 'Cart removed' };
    }

    case 'set_team': {
      const people = (input.people || []).slice(0, 12).map((p: any) => ({
        name: String(p?.name ?? '').slice(0, 80),
        role: String(p?.role ?? '').slice(0, 80),
        text: String(p?.text ?? '').slice(0, 800),
        image: safeImage(p?.image) || undefined,
      })).filter((p: any) => p.name);
      site.team = people;
      return {
        ok: true,
        message: people.length
          ? `Team page now has ${people.length} ${people.length === 1 ? 'person' : 'people'}`
          : 'Team page cleared',
      };
    }

    case 'set_case_studies': {
      const studies = (input.studies || []).slice(0, 12).map((c: any) => {
        const raw = String(c?.videoId ?? '');
        const id = raw.match(/[A-Za-z0-9_-]{11}/)?.[0] || '';
        return {
          title: String(c?.title ?? '').slice(0, 120),
          role: String(c?.role ?? '').slice(0, 80),
          text: String(c?.text ?? '').slice(0, 800),
          videoId: id,
        };
      }).filter((c: any) => c.title);
      site.cases = studies;
      return {
        ok: true,
        message: studies.length ? `Case studies page now has ${studies.length}` : 'Case studies cleared',
      };
    }

    case 'add_section': {
      if (!SECTION_TYPES.includes(input.type)) return { ok: false, message: `Unknown section: ${input.type}` };
      if (site.sections.length >= 12) return { ok: false, message: 'The page already has plenty of sections' };
      const section: SiteSection = { type: input.type };
      applySectionFields(section, input);
      const at = Number.isInteger(input.position)
        ? Math.max(0, Math.min(input.position, site.sections.length))
        : site.sections.length;
      site.sections.splice(at, 0, section);
      return { ok: true, message: `Added a ${input.type} section at position ${at}` };
    }

    case 'update_section': {
      const section = site.sections[input.index];
      if (!section) return { ok: false, message: `There is no section ${input.index}` };
      applySectionFields(section, input);
      return { ok: true, message: `Updated the ${section.type} section` };
    }

    case 'remove_section': {
      const section = site.sections[input.index];
      if (!section) return { ok: false, message: `There is no section ${input.index}` };
      site.sections.splice(input.index, 1);
      return { ok: true, message: `Removed the ${section.type} section` };
    }

    case 'move_section': {
      const { from, to } = input;
      if (!site.sections[from]) return { ok: false, message: `There is no section ${from}` };
      const [section] = site.sections.splice(from, 1);
      site.sections.splice(Math.max(0, Math.min(to, site.sections.length)), 0, section);
      return { ok: true, message: `Moved the ${section.type} section` };
    }

    case 'find_images': {
      const count = Math.min(Math.max(Number(input.count) || 6, 1), 10);
      const theirs = ctx.ownImages.slice(0, 4).map((url) => ({
        url,
        description: 'From their own site',
        source: 'their site',
      }));
      let stock: any[] = [];
      try {
        stock = await searchOpenverse(String(input.query), count);
      } catch (error) {
        if (!theirs.length) return { ok: false, message: 'Image search is not answering just now' };
      }
      const results = [...theirs, ...stock].slice(0, count + theirs.length);
      return {
        ok: true,
        message: `Found ${results.length} images`,
        data: results,
      };
    }

    case 'set_images': {
      const changed: string[] = [];
      if (input.hero !== undefined) {
        site.heroImage = input.hero === null ? null : safeImage(input.hero);
        changed.push(site.heroImage ? 'hero photo' : 'removed the hero photo');
      }
      if (input.logo !== undefined) {
        site.logo = input.logo === null ? null : safeImage(input.logo);
        changed.push(site.logo ? 'logo' : 'removed the logo');
      }
      if (input.gallery !== undefined) {
        const images = (input.gallery || []).map(safeImage).filter(Boolean).slice(0, 8) as string[];
        const existing = site.sections.find((s) => s.type === 'gallery');
        if (existing) existing.images = images;
        else site.sections.push({ type: 'gallery', images });
        site.images = images;
        changed.push(`${images.length} gallery photos`);
      }
      if (!changed.length) return { ok: false, message: 'Nothing to set' };
      return { ok: true, message: changed.join(', ') };
    }

    case 'ask_for_photos': {
      const reason = String(input.reason || 'photos of your work').slice(0, 80);
      return { ok: true, message: `Asked for ${reason}`, data: { reason } };
    }

    case 'read_url': {
      const url = String(input.url || '');
      if (!/^https?:\/\//i.test(url)) return { ok: false, message: 'Give me a full URL starting with https://' };
      try {
        const d = await deps.scrape(url);
        return {
          ok: true,
          message: `Read ${url}`,
          data: {
            title: d.title,
            description: d.description,
            about: (d.aboutText || '').slice(0, 800),
            services: d.services,
            phone: d.phone,
            email: d.email,
            address: d.address,
            hours: d.hours,
            socials: d.socials,
            brandColour: d.brandColour,
            images: [d.heroImage, ...(d.galleryImages || [])].filter(Boolean).slice(0, 8),
          },
        };
      } catch (error) {
        return { ok: false, message: `Could not read ${url} — it may be blocking us` };
      }
    }

    default:
      return { ok: false, message: `Unknown tool: ${name}` };
  }
}
