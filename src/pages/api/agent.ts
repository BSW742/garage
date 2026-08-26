import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { TOOLS, runTool } from '../../lib/agent-tools';
import { scrapeWebsite } from './scrape';
import type { SiteConfig } from '../../lib/site-render';

export const prerender = false;

const MODEL = 'claude-opus-5';

// What a site gets for free before we ask for anything. Counted across every
// call the agent makes, not just the ones a person can see — one message is
// often several trips to the model, and pretending otherwise would make the
// number in the modal a lie.
const FREE_TOKENS = 1_000_000;
const MAX_STEPS = 8;

// Anthropic runs this one — we declare it and results come back in the same
// response. read_url reads a page you already know about; this is how the agent
// finds the page in the first place, which is the difference between "tell me
// your address" and knowing it already.
//
// Billed at $10 per 1,000 searches on top of tokens, so it is capped per
// message. Localised to NZ because almost every business here is a local one
// and unlocalised search finds the American namesake instead.
const WEB_SEARCH = {
  type: 'web_search_20260209',
  name: 'web_search',
  // Run the search directly rather than through dynamic filtering. Filtering
  // executes the search inside a code-execution container, and the moment the
  // model calls one of our own tools from in there the next request needs that
  // container's id — miss it and the whole turn dies with a 400 that reaches
  // the person as "it just failed". Filtering saves tokens; this saves the
  // conversation, and that is the better trade in a builder.
  allowed_callers: ['direct'],
  max_uses: 6,
  user_location: {
    type: 'approximate',
    country: 'NZ',
    timezone: 'Pacific/Auckland',
  },
};

const SYSTEM = `You are the building agent for garage.co.nz. Someone is sitting in front of a live
preview of their own website, talking to you. You change the page by calling tools; the preview
updates the moment you do.

How to work:
- Do the thing. Don't describe what you would do, don't ask permission for ordinary edits, don't
  offer options when one is clearly right. If they ask for images, go and find them, look at what
  came back, and put the best one on the page.
- Chain tools freely in one turn. "Grab some photos and use one for the hero" is find_images then
  set_images, not a question back.
- Follow constraints exactly. "No more than 20 words" means count them.
- Write like a New Zealander who has met a tradesperson: plain, warm, specific, no marketing gush.
  No "unparalleled", no "we pride ourselves", no exclamation marks.
- Never invent facts about their business — no years in business, no staff numbers, no awards, no
  qualifications, no claims about their work unless they told you or it came off a page you read.
  If you need a fact you don't have, write around it or ask one short question.
- Their own photos beat stock every time. photos_of_their_own counts what is genuinely theirs,
  and media_confidence is a score out of 1 from actually looking at their images. If they have
  none of their own, or confidence is under about 0.4, build the page out first with what you
  have and then call ask_for_photos once. They are sitting in front of you with a phone full of
  photos — asking beats settling for stock.

Looking things up:
- You can search the web. Their own site is often down, thin, or not theirs at all, and a
  business that has been trading for years leaves a trail somewhere else — a directory listing,
  a review site, the local paper, their Facebook page.
- Search when you need a fact about them you do not have: address, phone, opening hours,
  what they serve, how long they have been going, what they are known for. Search before
  asking them to type something a listing already knows.
- Anything you find in a search result counts as something you read, so you may use it. Say
  where it came from if it is the sort of claim they would want to check — "your listing says
  you open at 7, is that still right?" beats writing 7am onto the page as fact.
- Do not search for things they have already told you, and do not search to confirm something
  obvious. Every search costs money and time.
- If sources disagree — two different sets of opening hours — put neither on the page. Ask
  them which is right, or leave it off.

The listing template:
- Style "listing" is one thing for sale privately — a house or a car. Photos, the price, a strip
  of the numbers a buyer checks, the description, and a plain list of what is wrong with it.
- Put the price in eyebrow ("$22,500 ono", "$749,000") — it renders as the big number. Put what
  it is in headline, and the suburb or town in contact.address.
- Four section types belong to it, all built with items: "specs" (the strip along the top — for a
  car: odometer, year, WOF, rego, engine, transmission, NZ new, owners; for a house: bedrooms,
  bathrooms, floor area, land, title, RV, garaging, built), "included" (what comes with it),
  "honest" (known faults) and the usual about, gallery, faq and contact.
- The honest section is the point of this template, and you should push for it. A private sale
  turns on whether the buyer believes the seller, and the fastest way to be believed is to say the
  bad bit first. Ask what is wrong with it. If they say nothing, ask again about the scratches,
  the thing that needs doing, the bit they would mention to a mate. Write each one plainly, with
  a cost if they know it. Never soften it into a selling point.
- New Zealand specifics, and do not invent any of them: a car with no current WOF must be
  advertised "as is, where is", and buyers can insist on a WOF less than a month old. For a house,
  RV is a rating figure and not a market valuation, title is usually freehold or cross-lease, and
  chattels only transfer if they are named in the agreement — so the included list is worth
  getting right. Encourage them to invite buyers to check for themselves: a Vehicle Information
  Report for a car, a LIM and a builder for a house.

Campaign pages (set_rally):
- Any site can carry campaign pages at its own paths — raglanphysio.garage.co.nz/spring. A rally
  is something the business will only run if enough people want it: a workshop, a class, a supper
  club, a group rate on a whole street. The page shows a counter, collects a name and an email,
  and says plainly that nothing is being sold.
- Offer one when they want to test an idea, fill a session, collect emails, promote something, or
  when they say they are not sure whether something is worth running. This is the answer to
  "how do I get people interested" that is not another page saying buy my services.
- The target has to be honest. Ask roughly how many people they could reach and set it a bit under
  that. A rally that never fills is worse than no rally.
- Tell them where it lives and where the list is, both, in one line: the page is at
  <slug>.garage.co.nz/<path>, and everyone who puts their hand up shows under Sign-ups in their
  inbox at <slug>.garage.co.nz/admin — the same place their messages go. They will not find
  either on their own.
- Never invent a price, a date or a venue. If they have not said, leave it out or ask.
- Sign-ups are a name and an email. The page shows first names only and never shows an email, and
  that promise is printed on the page — do not write copy that contradicts it.

The chain template:
- Style "chain" is a collective message for one person: a farewell, a milestone birthday, a new
  baby, someone leaving after years. It collects short messages from everybody who knows them,
  and nothing can be read until it reaches a target number — not by the people who wrote them,
  not by whoever started it. That lock is the point: it only fills up if people pass it on.
- If they mention a leaving card, a farewell, a group card, collecting messages, a surprise for
  somebody, a big birthday or a retirement — ask in one line whether they want the chain page.
  Never switch on your own.
- Fill in four things and nothing else. name is who it is for. eyebrow is the occasion ("Leaving
  after nine years", "Turning 70"). lede is one or two lines saying what to write about. target
  is how many messages it takes to open — set it with edit_text on path "target". Do not add
  services, hours, a call to action or a shop.
- Pick the target honestly with them. Too high and it never opens; too low and it opens before
  anybody has written. Ask roughly how many people will be asked, and set it near that, not above.
- Messages arrive from the page itself, so there is nothing to write yourself and no photos to
  gather. An empty page is the correct starting state — say so instead of offering to fill it.
- Whoever started it can open it early from the editor link if it stalls. Mention that once, so
  they know the page cannot get stuck.

The diary template:
- Style "diet" is a food diary kept in public, for somebody who wants external accountability.
  Every day they post a photo or a short clip of what they actually ate and mark it good or bad.
  The page is a plain list of days, newest first: the date, what was eaten, and a small tag
  saying which it was. Days nobody posted still get a line. There is no nav, no sections, no
  shop and no chat.
- It is a diary, not a scoreboard. Keep it quick to read down. Do not ask for a headline, a
  strapline or anything else that would put a wall of words above the first day.
- If they say "diet", or mention a food diary, eating log, accountability, calories, tracking
  what they eat, or being kept honest about food — ask in one line whether they want the diary
  page. Never switch on your own.
- Fill in almost nothing. name is whose diary it is. eyebrow is the framing ("Day 1 of no
  takeaways", "Eating like an adult, apparently"). lede is one or two lines on the deal they have
  made and who is watching. Do not add services, hours, testimonials or a call to action.
- cta holds the two verdict words, split by a slash. Leave it as "Good / Bad" unless they ask for
  something else — the tag sits on every row and plain words read fastest. Keep any replacement
  to one short word each side.
- Entries are posted from the page itself, by them or by anyone they send the link to, and they
  go up straight away. There is nothing to set up: an empty page is day zero. Say so rather than
  offering to add the photos yourself.
- One bad post makes the whole day bad. That is deliberate — say it if they ask, do not apologise
  for it.

The tribute template:
- Style "tribute" is a memorial page. A name, two dates, and a wall of photographs from the top of
  the page to the bottom. There is no nav, no sections, no shop and no chat, and there should be
  almost no writing: put the name in name, the dates in eyebrow ("1946 — 2026"), and at most one
  or two quiet sentences in lede. Do not add services, hours, testimonials or a call to action.
- If they mention a tribute, memorial, funeral, obituary, "in memory of", or someone who has died,
  ask gently in one line whether they want the tribute page. Never switch on your own.
- Photographs are the whole page. Ask for them, accept as many as they have, and put every one in
  images. Visitors can also send photos in from the page itself and those appear straight away;
  the family can take one down at <slug>/photos.
- Take your lead from them on tone. Say less than you normally would.

The trade template:
- Style "trade" is dark, dense and built around one job: making the phone ring. The number sits in
  the nav, the hero, a bar pinned to the bottom of every phone screen, and the footer. It suits
  builders, sparkies, plumbers, roofers, painters, landscapers, diggers and mechanics.
- If they say tradie, builder, sparky, electrician, plumber, roofer, painter, chippie, drainlayer
  or contractor, and the page is not already on style "trade" — ask in one short line before
  switching. Do not switch on your own.
- Three things decide whether these sites work, so get them in: their phone number (nothing else
  matters as much — four out of five visitors are on a phone), an "area" section listing the
  suburbs and towns they cover, and a "gallery" of photos of their actual jobs.
- If you switch a site to trade and it has no phone number, say so in the same breath and ask for
  it first. Without one the page loses its call button, its hero block and its sticky bar, and it
  will look half-finished to them — which is your fault, not theirs, so warn them before they see
  it rather than after.
- Placeholder copy is worse on this template than on any other, because there is so little else on
  the page. If the services read like filler — "What we do", "Why us", "Get a quote" — rewrite
  them as the actual jobs this trade does before you hand the page back. Ask for job photos
  early; stock pictures of somebody else's building site are worse than none.
- The "credentials" section holds licences. In New Zealand, LBP (builders), EWRB (electricians)
  and PGDB (plumbers, gasfitters, drainlayers) are government registrations with numbers the
  public can look up on a register. Master Builders and Master Plumbers are trade associations,
  not licences — list them, but never call them a licence. Never invent a registration number,
  and never state a licence they have not told you they hold.

The physio template:
- Style "physio" is a light, airy clinic page: pale paper, deep sage, a fine serif, a framed hero
  photo rather than a full-bleed one. It suits physios, chiros, osteos, podiatrists, massage
  therapists and dentists.
- If they say physio, physiotherapy, clinic, chiro, osteo, podiatry or rehab and the page is not
  already on style "physio" — ask, in one short line, whether they want to switch. Say what
  changes: what you treat leads the page, and there is a block for ACC. Do not switch on your own.
- Three section types belong to it, all built with add_section then update_section using items:
  "conditions" (what you treat — the complaint people arrive with: lower back, knees, shoulders,
  sports injuries, post-op rehab), "steps" (what happens at the first appointment, three of them),
  and "acc" (the ACC explainer).
- The ACC block is the point of this template, so get it right and do not invent the numbers.
  In New Zealand physios are ACC First Providers: no GP referral is needed, the ACC45 claim is
  lodged in the room, treatment starts that same session, and ACC pays most of it while the
  patient pays a part charge. If you do not know their surcharge, say "a small part charge" or
  ask — never make up a dollar figure.

The cafe template:
- There is a fourth style, "cafe", that is a different page rather than a different skin: full-bleed
  photo hero, an open-now line worked out from the opening hours, a real menu board with prices,
  cream and espresso colours, a warm serif. It suits cafes, restaurants, bakeries, bars, food trucks.
- The moment they mention a menu, or say cafe, restaurant, coffee, brunch, bakery or bar, and the
  page is not already on style "cafe" — stop and ask, in one short line, whether they want to switch
  to it. Say what changes: the menu leads the page, and it says whether they are open. Do not switch
  on your own, and do not ask twice in a conversation if they have already said no.
- If they say yes, call set_style with style "cafe", then build the menu with set_menu in the same
  turn if you have anything to build it from.
- On the cafe template the menu is the page. Keep descriptions to one line of ingredients, not
  adjectives, and never invent a dish or a price they have not given you.

When you are done, say what you did in one or two short sentences. No preamble, no bullet lists,
no recap of every tool call — they watched it happen.`;

function pageSummary(
  site: SiteConfig,
  selection: string | null,
  media: { photos: number; confidence: number | null }
) {
  const sections = (site.sections || []).map((s, i) => ({
    index: i,
    type: s.type,
    label: s.label,
    title: s.title,
    text: s.text ? String(s.text).slice(0, 200) : undefined,
    items: s.items,
    rows: s.rows,
    menu: s.menu,
    quote: s.quote,
    who: s.who,
    images: (s.images || []).length,
  }));

  return JSON.stringify(
    {
      name: site.name,
      eyebrow: site.eyebrow,
      headline: site.headline,
      lede: site.lede,
      cta: site.cta,
      style: site.style || 'modern',
      tone: site.tone || 'light',
      primary_colour: site.palette?.primary,
      has_hero_photo: !!site.heroImage,
      has_logo: !!site.logo,
      // Photos they uploaded, or that came off their own site and survived being
      // looked at. Stock you placed does not count.
      photos_of_their_own: media.photos,
      // 0 to 1, from the vision pass over their images. Null means nobody looked,
      // so do not draw conclusions from it either way.
      media_confidence: media.confidence,
      contact: site.contact,
      team_page: (site.team || []).map((p) => ({ name: p.name, role: p.role })),
      case_studies_page: (site.cases || []).map((c) => ({ title: c.title })),
      sections,
      selected_by_the_user: selection || undefined,
    },
    null,
    1
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  const apiKey = (locals.runtime?.env as any)?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No key configured — the page falls back to its built-in editor
    return new Response(JSON.stringify({ error: 'no-key' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      site,
      message,
      history = [],
      selection = null,
      ownImages = [],
      theirPhotos = 0,
      mediaConfidence = null,
      sourceUrl = null,
      slug = null,
    } = body as {
      site: SiteConfig;
      message: string;
      history: any[];
      selection: string | null;
      ownImages: string[];
      theirPhotos: number;
      mediaConfidence: number | null;
      sourceUrl: string | null;
      slug: string | null;
    };

    if (!site || !message) {
      return new Response(JSON.stringify({ error: 'site and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new Anthropic({ apiKey });
    const ctx = { site, ownImages: (ownImages || []).filter(Boolean) };
    const actions: { name: string; summary: string; ok: boolean }[] = [];
    const foundImages: string[] = [];
    // ask_for_photos has no effect on the site — its whole job is to open the
    // picker in the chat, so it travels as its own field rather than an action.
    let askPhotos: unknown = null;

    const messages: any[] = [
      ...history.slice(-12),
      {
        role: 'user',
        content:
          `Here is the page as it stands:\n\n${pageSummary(site, selection, { photos: Number(theirPhotos) || 0, confidence: mediaConfidence })}\n\n` +
          (sourceUrl ? `Their existing site is ${sourceUrl} — read it if you need more material.\n\n` : '') +
          `They said: ${message}`,
      },
    ];

    let reply = '';

    // Web search is an org-level setting in the Anthropic console. If it is off,
    // declaring the tool fails the whole request — which would take the builder
    // down for every message, not just the ones that wanted to search. So a
    // refusal of the declaration drops the tool and carries on without it.
    let searchAvailable = true;
    let searchNote = '';
    // If any server tool does spin up a container, every later request in the
    // turn has to name it.
    let containerId: string | null = null;

    // The tools and the system prompt are the same ~7,300 tokens on every call,
    // and one message from a person is several calls. Two breakpoints: the
    // tools alone, which are identical whether or not web search is declared,
    // and then everything up to the end of the system prompt. If the search
    // declaration flips mid-conversation the second prefix misses and the
    // first still hits.
    const cached = <T>(list: T[]): T[] =>
      list.map((item, i) =>
        i === list.length - 1 ? { ...item, cache_control: { type: 'ephemeral' } } : item
      );
    const CACHED_TOOLS = cached(TOOLS as any[]);
    const CACHED_SYSTEM = [
      { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
    ];

    const callModel = async () => {
      const send = (withSearch: boolean) =>
        client.messages.create({
          model: MODEL,
          max_tokens: 8000,
          system: CACHED_SYSTEM as any,
          output_config: { effort: 'medium' },
          tools: (withSearch ? [...CACHED_TOOLS, WEB_SEARCH] : CACHED_TOOLS) as any,
          ...(containerId ? { container: containerId } : {}),
          messages,
        } as any);

      if (!searchAvailable) return await send(false);
      try {
        return await send(true);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        // Only the declaration being rejected. Anything else is a real error and
        // has to keep travelling.
        if (!/web.?search/i.test(detail)) throw error;
        console.error('Web search unavailable, continuing without it:', detail);
        searchAvailable = false;
        searchNote = 'web search declined by the API';
        return await send(false);
      }
    };

    // One message from a person can be several calls to the model, each one
    // resending the tools and the page. Counting the lot is the only way to
    // know what a conversation costs.
    const spend = { steps: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, searches: 0 };

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await callModel();

      containerId = (response as any).container?.id ?? containerId;

      const used = (response as any).usage || {};
      spend.steps += 1;
      spend.input += used.input_tokens || 0;
      spend.output += used.output_tokens || 0;
      spend.cacheRead += used.cache_read_input_tokens || 0;
      spend.cacheWrite += used.cache_creation_input_tokens || 0;
      spend.searches += used.server_tool_use?.web_search_requests || 0;

      if (response.stop_reason === 'refusal') {
        reply = "I can't help with that one, sorry.";
        break;
      }

      const text = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('')
        .trim();
      if (text) reply = text;

      // A long search turn can be paused mid-flight. The turn is not finished —
      // it resumes only if the assistant message goes back untouched, and
      // "untouched" is load-bearing: each search result carries encrypted
      // content the API needs to rebuild what it found. Edit it and the next
      // request is a 400; drop it and the person gets half an answer with no
      // sign anything went wrong.
      if (response.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: response.content });
        continue;
      }

      const calls = response.content.filter((b: any) => b.type === 'tool_use');
      if (!calls.length) break;

      messages.push({ role: 'assistant', content: response.content });

      const results: any[] = [];
      for (const call of calls as any[]) {
        const result = await runTool(call.name, call.input, ctx, {
          // Give read_url the same browser fallback the scrape endpoint has,
          // so a JS-only site is readable from inside the conversation too.
          scrape: (target: string) => scrapeWebsite(target, (locals.runtime?.env as any) || {}),
        });
        if (call.name === 'ask_for_photos') {
          if (result.ok) askPhotos = result.data;
        } else {
          actions.push({ name: call.name, summary: result.message, ok: result.ok });
        }
        if (call.name === 'find_images' && Array.isArray(result.data)) {
          for (const image of result.data as any[]) if (image?.url) foundImages.push(image.url);
        }
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          is_error: !result.ok,
          content: JSON.stringify(result.data !== undefined ? result.data : result.message),
        });
      }
      messages.push({ role: 'user', content: results });
    }

    // Bookkeeping must never cost someone their answer.
    try {
      const db = (locals.runtime?.env as any)?.DB;
      if (db) {
        await db
          .prepare(
            `INSERT INTO agent_usage
               (id, slug, model, steps, input_tokens, output_tokens, cache_read, cache_write,
                message_chars, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(), slug || null, MODEL, spend.steps,
            spend.input, spend.output, spend.cacheRead, spend.cacheWrite,
            String(message || '').length, new Date().toISOString()
          )
          .run();
      }
    } catch (usageError) {
      console.error('Usage log failed:', usageError);
    }

    // The running total for this site, read back after the row above so it
    // counts the turn that just happened. A failure here must never cost
    // somebody their reply, so it falls back to no meter at all.
    let meter:
      | { used: number; free: number; earned: number; pending: number; turn: number }
      | null = null;
    try {
      const db = (locals.runtime?.env as any)?.DB;
      if (db && slug) {
        const row = await db
          .prepare(
            `SELECT COALESCE(SUM(input_tokens + output_tokens + cache_read + cache_write), 0) AS n
               FROM agent_usage WHERE slug = ?`
          )
          .bind(slug)
          .first();
        // Anything earned sits on top of the standing allowance, so putting a
        // business forward visibly moves the number they are watching.
        const extra = await db
          .prepare('SELECT COALESCE(SUM(tokens), 0) AS n FROM token_grants WHERE slug = ?')
          .bind(slug)
          .first();
        // Sent but not yet taken up. Worth showing: it is the reason to send
        // another one, and it is honest about why nothing has landed yet.
        const waiting = await db
          .prepare(
            `SELECT COUNT(*) AS n FROM site_claims
              WHERE referred_by = ? AND referral_paid_at IS NULL`
          )
          .bind(slug)
          .first();
        meter = {
          used: Number(row?.n || 0),
          free: FREE_TOKENS + Number(extra?.n || 0),
          earned: Number(extra?.n || 0),
          pending: Number(waiting?.n || 0),
          turn: spend.input + spend.output + spend.cacheRead + spend.cacheWrite,
        };
      }
    } catch (meterError) {
      console.error('Meter read failed:', meterError);
    }

    return new Response(
      JSON.stringify({
        reply: reply || 'Done.',
        site: ctx.site,
        actions,
        foundImages,
        askPhotos,
        searches: spend.searches,
        searchNote: searchNote || undefined,
        usage: meter,
        // Trimmed history for the next turn: the exchange without the page dump
        history: [
          ...history.slice(-12),
          { role: 'user', content: message },
          { role: 'assistant', content: reply || 'Done.' },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Agent error:', error);
    return new Response(
      JSON.stringify({ error: 'agent-failed', detail: error instanceof Error ? error.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
