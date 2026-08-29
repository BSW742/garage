// The tools the builder agent can actually use. Each one is a pure mutation
// over the site JSON (or a lookup), so the model composes them freely instead
// of picking from a fixed menu of hardcoded intents.

import type { SiteConfig, SiteSection } from './site-render';
import { PRIZE_BY_ID, shortlistFor, toPrizes } from './prizes';

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

const SECTION_TYPES = ['services', 'define', 'about', 'gallery', 'hours', 'testimonial', 'contact', 'band', 'faq', 'pricing', 'shop', 'menu', 'conditions', 'steps', 'acc', 'area', 'credentials', 'specs', 'included', 'honest', 'alongside'];

export const TOOLS = [
  {
    name: 'edit_text',
    description:
      'Change any single piece of text on the page. Paths: name, headline, lede, eyebrow, cta, ' +
      'contact.phone, contact.email, contact.address, sec.<i>.label, sec.<i>.title, sec.<i>.text, ' +
      'sec.<i>.quote, sec.<i>.who, sec.<i>.items.<j>.0 (service name), sec.<i>.items.<j>.1 ' +
      '(service description), sec.<i>.rows.<j>.0 (day), sec.<i>.rows.<j>.1 (hours), ' +
      'sec.<i>.menu.<g>.heading (a menu course), sec.<i>.menu.<g>.items.<j>.name, ' +
      'sec.<i>.menu.<g>.items.<j>.price and sec.<i>.menu.<g>.items.<j>.text (a dish). ' +
      'On a chain page, target is how many messages it takes to unlock it. ' +
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
      'type, hard black borders, left-aligned), classic (serif, hairlines, wide letter-spacing), ' +
      'cafe (a different page altogether: full-bleed photo hero, an open-now line worked out from ' +
      'the hours, a proper menu board, warm cream and espresso — for cafes, restaurants, bakeries, ' +
      'bars and food trucks), physio (light and airy: pale paper, deep sage, a fine serif, a framed ' +
      'hero rather than a full-bleed one, conditions you treat, a numbered how-it-works, and an ACC ' +
      'block — for physios, chiros, osteos, podiatrists, massage and dental). Never switch to cafe or ' +
      'physio without asking first; both rearrange the page. trade (dark and blunt: the phone number ' +
      'in the nav, the hero, a bar pinned to the bottom of every phone screen and the footer, plus ' +
      'areas covered, recent jobs and licence numbers — for builders, sparkies, plumbers, roofers, ' +
      'painters, landscapers and diggers). Ask before switching to trade too. tribute is a memorial ' +
      'page: a name, two dates and a wall of photographs, nothing else — no nav, no sections, no ' +
      'shop, no chat. Visitors can send photos in from the page itself. montage is the same wall ' +
      'without the mourning \u2014 a title and then nothing but pictures, no dates and no portrait, ' +
      'for a trip, a season, a build, a club, a wedding. Anyone can add one. workshop is for makers '
      + 'who teach — pottery, jewellery, wood, glass, leather. sauna is for saunas, bathhouses, '
      + 'ice baths and contrast therapy. rugby, soccer and basketball are sports clubs. charity '
      + 'is for appeals and trusts asking for donations. townhall is for community halls let out '
      + 'by the hour. daycare is for early childhood centres and kindergartens. reel is video '
      + 'first — a subject and the YouTube films already made about it. beauty is for salons, ' +
      'spas, skin clinics, brow and lash studios, nail bars and massage: a full-bleed photograph, ' +
      'treatments listed with duration and price like a menu, and a booking button pinned to the ' +
      'bottom of every phone screen. yoga and pilates are the same studio page in two ' +
      'temperatures \u2014 a timetable built for a phone, passes with their prices on them, and ' +
      'teachers with faces; yoga is warm sand and a serif, pilates cool grey and a geometric sans. ' +
      'listing is one thing for ' +
      'sale privately — a house or a car: big photos, the price, a strip of the numbers a buyer ' +
      'checks, and a plain list of what is wrong with it. ' +
      'diet is a public food diary for people who want somebody watching: a scoreboard of good ' +
      'and bad days, a strip of the last thirty days with visible gaps, and a photo or clip for ' +
      'every day posted. No nav, no sections, no shop, no chat. ' +
      'tone is the background: light, warm or dark. primary_colour is a hex like #16a34a and ' +
      'recolours buttons, links and accents.',
    input_schema: {
      type: 'object',
      properties: {
        style: { type: 'string', enum: ['modern', 'brutal', 'classic', 'cafe', 'physio', 'trade', 'tribute', 'listing', 'diet', 'chain', 'bubbles', 'game', 'eggs', 'mogged', 'montage', 'beauty', 'yoga', 'pilates', 'workshop', 'sauna', 'rugby', 'soccer', 'basketball', 'charity', 'townhall', 'daycare', 'youtube', 'insta', 'videomap'] },
        tone: { type: 'string', enum: ['light', 'warm', 'dark'] },
        primary_colour: { type: 'string', description: 'Hex colour, e.g. #16a34a' },
      },
    },
  },
  {
    name: 'set_event',
    description:
      'Put a campaign page on this site at its own path — <slug>.garage.co.nz/<path>. An event is ' +
      'a thing the business will only run if enough people want it: a workshop, a class, a supper ' +
      'club, a group rate on a street. Events here are always free — there is no paid mode and ' +
      'never will be, so the bar says FREE and it is always true. If they want to charge for ' +
      'something, this is the wrong tool and you should say so rather than bending it. Nobody is ' +
      'asked to pay, only whether it should happen, and ' +
      'the page collects names and emails until it reaches the target. Use it when they want to ' +
      'test interest, fill a session, collect emails, or promote something without selling. ' +
      'path is a short slug like "spring" or "running-clinic". title is the thing itself. blurb is ' +
      'a sentence or two on what it is. detail is the practical part — when, where, how long. ' +
      'target is how many people it takes to go ahead. closes is free text like "Closes 12 ' +
      'September". cta is the button, default "Count me in". Calling it again with the same path ' +
      'edits that campaign; a new path adds another.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Short url slug, letters numbers and dashes' },
        title: { type: 'string' },
        blurb: { type: 'string' },
        detail: { type: 'string' },
        target: { type: 'number', description: 'How many people it takes to go ahead' },
        when: {
          type: 'string',
          description: 'When the thing itself happens, in their words. "Saturday 4 October, 10am"',
        },
        closes_at: {
          type: 'string',
          description: 'The last day people can join, as YYYY-MM-DD. The bar counts down to it.',
        },
        closes: { type: 'string' },
        cta: { type: 'string' },
      },
      required: ['path', 'title', 'target'],
    },
  },
  {
    name: 'set_menu',
    description:
      'Write the food and drink menu. Groups are courses — Breakfast, All day, Coffee, Sweet — ' +
      'each holding items with a name, a price and an optional one-line description. Replaces the ' +
      'whole menu. Adds a menu section to the page if there is not one already. This is what a ' +
      'cafe site is for, so it belongs on the cafe template — offer to switch if they are not on it.',
    input_schema: {
      type: 'object',
      properties: {
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string', description: 'Course name, e.g. Breakfast' },
              note: { type: 'string', description: 'Optional line under the heading, e.g. until 11am' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    price: { type: 'string', description: 'e.g. $12 or $12.50' },
                    text: { type: 'string', description: 'One short line. Ingredients, not adjectives.' },
                  },
                  required: ['name'],
                },
              },
            },
            required: ['heading', 'items'],
          },
        },
        label: { type: 'string', description: 'Small line above the heading, default "The menu"' },
        title: { type: 'string', description: 'Section heading, default "What we are serving"' },
      },
      required: ['groups'],
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
    name: 'set_waitlist',
    description:
      'Turn the short notice list on or off. A tab on the edge of every page: somebody who ' +
      'cannot get an appointment leaves their name, and when a time opens up the owner tells the ' +
      'list from one page and the first to say yes takes it. For businesses that are booked out ' +
      '— physios, hairdressers, dentists, tattooists, anyone whose receptionist already offers ' +
      'to put people on a list. Call it the short notice list, never the cancellation list: the ' +
      'first is about what the visitor can do, the second is about the business having a bad day, ' +
      'and a page should not apologise for being in demand. Nothing is discounted and nobody is ' +
      'marketed at. Do not suggest it to a business that is quiet — a list for an empty diary is ' +
      'an insult.',
    input_schema: {
      type: 'object',
      properties: {
        on: { type: 'boolean', description: 'Show the waitlist tab on the site.' },
        title: { type: 'string', description: 'The tab, short. Defaults to "Short notice".' },
        weeks_out: {
          type: 'integer',
          description:
            'How many weeks ahead they are booked. The panel works the date out from this and ' +
            'shows it — "Our next spot is Saturday 19 September" — so it never goes stale. Ask ' +
            'them; do not guess.',
        },
        blurb: {
          type: 'string',
          description:
            'Rarely needed. The default line is "People do cancel. If you can be flexible, we ' +
            'will email you when one opens up." Only override it if theirs is genuinely better, ' +
            'and keep it to one sentence.',
        },
      },
      required: ['on'],
    },
  },
  {
    name: 'set_spinner',
    description:
      'Turn the spin-to-win wheel on or off, and set what is on it. A tab sits on the edge of ' +
      'every page; a visitor opens it, gives their name, email and phone, and spins. The wheel ' +
      'has eight equal slots and is genuinely random. Every slot is a prize — there are no ' +
      'losing slots — and the first prize you pass is the top one: it gets the single gold slot, ' +
      'so it comes up one spin in eight. Say that plainly before switching it on and make sure ' +
      'they are happy to honour it at that rate. Everything after the first fills the other seven ' +
      'slots in turn. Pass between two and eight prizes, best first, in the owner\'s own words. ' +
      'Fourteen characters each at the very most — that is what fits in a wedge — so "Free ' +
      'coffee", "20% off", "7 days free", "Free brake check". Nothing is ever emailed to the ' +
      'visitor: the details go to the owner, and the form says so.',
    input_schema: {
      type: 'object',
      properties: {
        on: { type: 'boolean', description: 'Show the wheel on the site.' },
        prizes: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Two to eight short labels, top prize first, 14 characters each at most. ' +
            'e.g. ["Free coffee","20% off","7 days free"]',
        },
        title: { type: 'string', description: 'The tab and the heading, e.g. "Spin to win".' },
        blurb: { type: 'string', description: 'One line under the heading.' },
        terms: { type: 'string', description: 'Any conditions, e.g. "One spin per person, in store only."' },
      },
      required: ['on'],
    },
  },
  {
    name: 'add_clips',
    description:
      'Put YouTube videos on a reel page. Give it whatever the person pasted — full watch links, ' +
      'youtu.be links, embed links or bare ids, in any mix. Every one is checked against YouTube ' +
      'before it goes on the page, and the real title and channel are read back from YouTube ' +
      'rather than written by you. Anything private, deleted, or with embedding switched off by ' +
      'its owner is rejected and reported back so you can tell them which one and why. NEVER pass ' +
      'an id you have not been given by the person or found in a search result — a made-up id ' +
      'looks exactly like a real one and renders as a dead grey rectangle. Use replace to start ' +
      'the list again rather than adding to it. The first clip is the feature at the top of the page.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'YouTube links or ids, in the order they should appear.',
        },
        replace: { type: 'boolean', description: 'Replace the existing films rather than adding to them.' },
        title: { type: 'string', description: 'Heading for the reel, e.g. "Twelve films".' },
      },
      required: ['urls'],
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

    case 'set_event': {
      const path = String(input.path || '')
        .toLowerCase().trim().replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9-]+/g, '-').slice(0, 40);
      if (!path) return { ok: false, message: 'A campaign needs a short url' };
      // These are real routes on the site, so they cannot sit on top of the
      // pages the template already owns.
      if (['team', 'case-studies', 'cases', 'admin', 'photos', 'llms.txt'].includes(path)) {
        return { ok: false, message: `${path} is already a page on this site — pick another word` };
      }
      const title = String(input.title || '').slice(0, 90);
      if (!title) return { ok: false, message: 'A campaign needs a title' };
      const target = Math.max(1, Math.min(500, Math.round(Number(input.target)) || 10));

      const campaign = {
        path,
        title,
        blurb: String(input.blurb || '').slice(0, 300) || undefined,
        detail: String(input.detail || '').slice(0, 900) || undefined,
        target,
        when: String(input.when || '').slice(0, 80) || undefined,
        closesAt: /^\d{4}-\d{2}-\d{2}$/.test(String(input.closes_at || ''))
          ? String(input.closes_at) : undefined,
        closes: String(input.closes || '').slice(0, 60) || undefined,
        cta: String(input.cta || '').slice(0, 30) || undefined,
      };
      const list = site.campaigns || (site.campaigns = []);
      const at = list.findIndex((c) => c && c.path === path);
      if (at >= 0) list[at] = campaign;
      else list.push(campaign);
      return {
        ok: true,
        message:
          `${title} at /${path}, going ahead at ${target}. The bar shows on every page — ` +
          `"N going" and how many more it needs — and it turns when it lands.`,
        data: { url: `/${path}` },
      };
    }

    case 'set_menu': {
      const groups = (input.groups || []).slice(0, 12).map((g: any) => ({
        heading: String(g?.heading ?? '').slice(0, 80),
        note: String(g?.note ?? '').slice(0, 160),
        items: (g?.items || []).slice(0, 40).map((i: any) => ({
          name: String(i?.name ?? '').slice(0, 120),
          price: String(i?.price ?? '').slice(0, 24),
          text: String(i?.text ?? '').slice(0, 240),
        })).filter((i: any) => i.name),
      })).filter((g: any) => g.items.length);

      if (!groups.length) return { ok: false, message: 'A menu needs at least one item' };

      const existing = site.sections.find((s) => s.type === 'menu');
      if (existing) {
        existing.menu = groups;
        if (input.label) existing.label = String(input.label).slice(0, 60);
        if (input.title) existing.title = String(input.title).slice(0, 120);
      } else {
        // Straight after the hero is where a menu belongs — it is the reason
        // anyone opened the page.
        site.sections.unshift({
          type: 'menu',
          label: String(input.label || 'The menu').slice(0, 60),
          title: String(input.title || 'What we are serving').slice(0, 120),
          menu: groups,
        });
      }
      const count = groups.reduce((n: number, g: any) => n + g.items.length, 0);
      return { ok: true, message: `Menu set: ${count} items across ${groups.length} groups` };
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

    case 'set_waitlist': {
      const list: any = site.waitlist || {};
      if (input.title !== undefined) list.title = String(input.title).slice(0, 24);
      if (input.weeks_out !== undefined) {
        list.weeksOut = Math.max(1, Math.min(52, Number(input.weeks_out) || 3));
      }
      // One sentence. The panel was ninety words and read like terms and
      // conditions; a date and a line is the whole of it.
      if (input.blurb !== undefined) list.blurb = String(input.blurb).slice(0, 140);
      if (input.on && !list.weeksOut) {
        return { ok: false, message: 'How many weeks ahead are they booked? The panel shows the date.' };
      }
      list.on = !!input.on;
      site.waitlist = list;
      if (!list.on) return { ok: true, message: 'Short notice list is off.' };
      return {
        ok: true,
        message:
          `Short notice list is on, showing ${list.weeksOut} weeks out. When a time opens up, ` +
          'open the list page from your keys email, type when it is, and everyone hears at once ' +
          '— first to say yes takes it and you get told who.',
        data: { waitlist: list },
      };
    }

    case 'set_spinner': {
      const spin: any = site.spinner || {};
      if (input.prizes !== undefined) {
        const entries = (input.prizes || [])
          .map((p: any) => String(p || '').trim())
          .filter(Boolean)
          .slice(0, 8);
        // Anything not in the catalogue is taken as the owner's own wording,
        // which is the only way this works for a trade nobody has curated.
        const tooLong = entries.filter((e: string) => !PRIZE_BY_ID[e] && e.length > 14);
        if (tooLong.length) {
          return {
            ok: false,
            message:
              `Too long for a wedge (14 characters): ${tooLong.join(', ')}. Shorten them — ` +
              `"7 days free", "free wash", "$50 off".`,
          };
        }
        if (input.on && entries.length < 2) {
          return {
            ok: false,
            message: `A wheel needs at least two prizes and I have ${entries.length}. Ask what else goes on it.`,
          };
        }
        spin.prizes = entries;
        delete spin.offers;
      }
      if (input.on && (spin.prizes || []).length < 2) {
        return {
          ok: false,
          message:
            'No prizes yet. Suggestions that suit this business: ' +
            shortlistFor(site.style).map((id) => `"${PRIZE_BY_ID[id].label}"`).join(', ') +
            '. Their own words are better if they have them. 14 characters at most, best first.',
        };
      }
      if (input.title !== undefined) spin.title = String(input.title).slice(0, 40);
      if (input.blurb !== undefined) spin.blurb = String(input.blurb).slice(0, 140);
      if (input.terms !== undefined) spin.terms = String(input.terms).slice(0, 200);
      spin.on = !!input.on;
      site.spinner = spin;

      if (!spin.on) return { ok: true, message: 'Wheel is off.' };
      const on = (spin.prizes || []).map((e: string) => PRIZE_BY_ID[e]?.label || e);
      return {
        ok: true,
        message:
          `Wheel is on with ${on.length} prizes. ${on[0]} has the gold slot, one in eight. ` +
          `${on.slice(1).join(', ')} share the other seven. Every slot is a prize.`,
        data: { spinner: spin },
      };
    }

    case 'add_clips': {
      // A YouTube id is eleven characters of a known alphabet, and it turns up
      // inside half a dozen link shapes. Take them all, because people paste
      // whatever was in the address bar.
      const ids: string[] = [];
      for (const raw of (input.urls || []).slice(0, 30)) {
        const v = String(raw || '').trim();
        const hit =
          v.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
          v.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
          v.match(/\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/) ||
          (/^[A-Za-z0-9_-]{11}$/.test(v) ? [v, v] : null);
        if (hit && !ids.includes(hit[1])) ids.push(hit[1]);
      }
      if (!ids.length) {
        return { ok: false, message: 'None of those look like YouTube links. A watch link, a youtu.be link or the id itself all work.' };
      }

      // The check that matters. oembed answers for anything that can actually
      // be embedded and refuses everything else, and it hands back the title
      // and the channel — so the page credits somebody's work with their own
      // words rather than a guess.
      const good: { id: string; title: string; who: string }[] = [];
      const bad: string[] = [];
      for (const id of ids) {
        try {
          const res = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
          );
          if (!res.ok) { bad.push(id); continue; }
          const meta = (await res.json()) as any;
          good.push({
            id,
            title: String(meta?.title || '').slice(0, 200),
            who: String(meta?.author_name || '').slice(0, 120),
          });
        } catch {
          bad.push(id);
        }
      }

      if (!good.length) {
        return {
          ok: false,
          message:
            `None of those could be embedded. That usually means the owner has turned embedding ` +
            `off, or the video is private or gone. Tried: ${ids.join(', ')}`,
        };
      }

      // An insta wall also takes clips; it must not be flipped to the YouTube
      // template just because somebody added one. That is what wiped the style
      // off insta.garage.co.nz.
      if (site.style !== 'youtube' && site.style !== 'insta') site.style = 'youtube';
      let section = site.sections.find((x) => x.type === 'video');
      if (!section) {
        section = { type: 'video', label: 'The reel', title: '', clips: [] };
        site.sections.push(section);
      }
      const existing = input.replace ? [] : (section.clips || []);
      const merged = [...existing];
      for (const clip of good) {
        if (!merged.some((c) => c.id === clip.id)) merged.push(clip);
      }
      section.clips = merged.slice(0, 24);
      if (input.title) section.title = String(input.title).slice(0, 80);
      else section.title = `${section.clips.length} film${section.clips.length === 1 ? '' : 's'}`;

      const named = good.map((c) => `${c.title} — ${c.who}`).join('; ');
      return {
        ok: true,
        message:
          `Added ${good.length}: ${named}.` +
          (bad.length ? ` Could not use ${bad.length} (embedding off, private or gone): ${bad.join(', ')}.` : '') +
          ` ${section.clips.length} on the page now.`,
        data: { added: good, rejected: bad },
      };
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
