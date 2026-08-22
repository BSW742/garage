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
- Their own photos beat stock every time.

When you are done, say what you did in one or two short sentences. No preamble, no bullet lists,
no recap of every tool call — they watched it happen.`;

function pageSummary(site: SiteConfig, selection: string | null) {
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
      contact: site.contact,
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
    } = body as {
      site: SiteConfig;
      message: string;
      history: any[];
      selection: string | null;
      ownImages: string[];
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

    const messages: any[] = [
      ...history.slice(-12),
      {
        role: 'user',
        content:
          `Here is the page as it stands:\n\n${pageSummary(site, selection)}\n\n` +
          `They said: ${message}`,
      },
    ];

    let reply = '';

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM,
        output_config: { effort: 'medium' },
        tools: TOOLS as any,
        messages,
      });

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
        actions.push({ name: call.name, summary: result.message, ok: result.ok });
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          is_error: !result.ok,
          content: JSON.stringify(result.data !== undefined ? result.data : result.message),
        });
      }
      messages.push({ role: 'user', content: results });
    }

    return new Response(
      JSON.stringify({
        reply: reply || 'Done.',
        site: ctx.site,
        actions,
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
