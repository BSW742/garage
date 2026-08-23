import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { TOOLS, runTool } from '../../lib/agent-tools';
import { scrapeWebsite } from './scrape';
import type { SiteConfig } from '../../lib/site-render';

export const prerender = false;

const MODEL = 'claude-opus-5';
const MAX_STEPS = 8;

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

    // One message from a person can be several calls to the model, each one
    // resending the tools and the page. Counting the lot is the only way to
    // know what a conversation costs.
    const spend = { steps: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM,
        output_config: { effort: 'medium' },
        tools: TOOLS as any,
        messages,
      });

      const used = (response as any).usage || {};
      spend.steps += 1;
      spend.input += used.input_tokens || 0;
      spend.output += used.output_tokens || 0;
      spend.cacheRead += used.cache_read_input_tokens || 0;
      spend.cacheWrite += used.cache_creation_input_tokens || 0;

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

      const calls = response.content.filter((b: any) => b.type === 'tool_use');
      if (!calls.length) break;

      messages.push({ role: 'assistant', content: response.content });

      const results: any[] = [];
      for (const call of calls as any[]) {
        const result = await runTool(call.name, call.input, ctx, { scrape: scrapeWebsite });
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

    return new Response(
      JSON.stringify({
        reply: reply || 'Done.',
        site: ctx.site,
        actions,
        foundImages,
        askPhotos,
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
