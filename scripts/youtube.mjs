#!/usr/bin/env node
//
//   npm run reel -- queenstown "mountain biking in Queenstown"
//   npm run reel -- taupo "trout fishing on Lake Taupo" --films 10
//   npm run reel -- rotorua "..." --replace        # rebuild an existing one
//   npm run reel -- alaska "..." --ids a1b,c2d      # a list you chose yourself
//
// Search, verify, write, publish. The verify step is the one that matters: a
// model will produce a plausible eleven-character YouTube id as readily as a
// real one, and an invented id renders as a dead grey rectangle that nobody
// notices for a week. So every id is checked against YouTube's oembed endpoint
// before it goes anywhere near the database — free, no key, no quota — and the
// title and channel that end up on the page are the ones YouTube returns, not
// the ones the model wrote down.
//
// Nothing is published until every film has passed.

import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';

const run = promisify(execFile);

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);
const positional = argv.filter((a, i) =>
  !a.startsWith('--') && !(i > 0 && argv[i - 1] === '--films'));

const slug = (positional[0] || '').toLowerCase();
const subject = positional[1] || '';
const want = Math.max(4, Math.min(20, Number(flag('films', 12)) || 12));

if (!/^[a-z0-9-]{3,40}$/.test(slug) || !subject) {
  console.error('usage: npm run reel -- <slug> "<subject>" [--films 12] [--replace]');
  process.exit(1);
}

const KEY = (readFileSync('.dev.vars', 'utf8').match(/ANTHROPIC_API_KEY\s*=\s*"?([^"\n]+)/) || [])[1];
if (!KEY) { console.error('No ANTHROPIC_API_KEY in .dev.vars'); process.exit(1); }

const say = (m) => process.stdout.write(`${m}\n`);

// ── 1. find ────────────────────────────────────────────────────────────────
// A search is the usual way in, but a subject the search drifts on is better
// curated by hand — Alaska off-grid came back four-fifths bush flying, because
// that is what is popular rather than what was asked for. --ids skips the
// search and takes a list, and everything after this point is identical: the
// same verification, the same refusal to publish anything unchecked.
const given = flag('ids', '');
let found;
if (given) {
  found = given.split(/[,\s]+/).filter(Boolean).map((id) => ({ id }));
  say(`\n  ${found.length} ids given, skipping the search`);
} else {
say(`\n  Searching for films about: ${subject}`);
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({
    model: 'claude-sonnet-5',
    // Search results are bulky and land in the same budget as the answer. At
    // 1600 this stopped mid-search and returned nothing at all.
    max_tokens: 6000,
    system:
      'You find YouTube videos. When you have finished searching, return ONLY a JSON array of up ' +
      `to ${want + 4} objects: [{"id":"the 11-char v= id","title":"","who":"channel"}]. Only ` +
      'videos that actually appeared in your search results. NEVER guess or construct an id.',
    tools: [{
      type: 'web_search_20260209', name: 'web_search', allowed_callers: ['direct'],
      max_uses: 4, user_location: { type: 'approximate', country: 'NZ' },
    }],
    messages: [{ role: 'user', content: `Find YouTube videos about: ${subject}. Prefer well-made videos from real channels, and a mix of angles.` }],
  }),
});
if (!res.ok) { console.error(`  search failed: HTTP ${res.status}`); process.exit(1); }
const data = await res.json();
const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
const match = text.match(/\[[\s\S]*\]/);
if (!match) { console.error('  the model returned no list'); process.exit(1); }
found = JSON.parse(match[0]);
say(`  ${found.length} candidates`);
}

// ── 2. verify ──────────────────────────────────────────────────────────────
// oembed is the whole trick: 200 with the real title and author for anything
// embeddable, 400 for anything invented.
say('\n  Checking each one against YouTube');
const clips = [];
for (const c of found) {
  const id = String(c?.id || '');
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) { say(`    skip  ${id} — not an id`); continue; }
  if (clips.some((x) => x.id === id)) continue;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!r.ok) { say(`    drop  ${id} — ${r.status}`); continue; }
    const o = await r.json();
    clips.push({ id, title: o.title, who: o.author_name });
    say(`    ok    ${id}  ${String(o.title).slice(0, 46)} — ${o.author_name}`);
  } catch {
    say(`    drop  ${id} — unreachable`);
  }
  if (clips.length >= want) break;
}
if (clips.length < 4) { console.error(`\n  only ${clips.length} verified — not enough for a page`); process.exit(1); }

// ── 3. write the words around them ─────────────────────────────────────────
say(`\n  Writing the page around ${clips.length} films`);
const wres = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({
    model: 'claude-sonnet-5', max_tokens: 2000,
    system:
      'You write the short written part of a page whose real content is a set of YouTube films. ' +
      'Return ONLY JSON: {"name":"","eyebrow":"","headline":"six words or so","lede":"two ' +
      'sentences","about":{"title":"","text":"two short paragraphs separated by a blank line"},' +
      '"facts":{"title":"","items":[["thing","one line|short tag"]]},"faq":{"items":[["q","a"]]}}. ' +
      'New Zealand English, no exclamation marks, no marketing gloss. Never claim the films are ' +
      'ours and never invent a fact about the subject — if you are not sure, leave it out.',
    messages: [{ role: 'user', content:
      `Subject: ${subject}\n\nThe films on the page are:\n` +
      clips.map((c) => `  - ${c.title} (${c.who})`).join('\n') }],
  }),
});
// The films are the page. The words around them are worth having but they are
// not worth losing fourteen verified clips over, and the first Raglan run did
// exactly that — the model closed a string with an extra quote, JSON.parse
// threw, and the whole run went in the bin including the search that paid for
// it. So a broken answer here degrades to a plain page rather than an exception.
function readJson(response) {
  const text = (response?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const block = (text.match(/\{[\s\S]*\}/) || [null])[0];
  if (!block) return null;
  try {
    return JSON.parse(block);
  } catch {
    return null;
  }
}

let w = readJson(await wres.json());
if (!w) {
  say('  the written part came back malformed — asking once more');
  const retry = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-5', max_tokens: 2000,
      // The first retry dropped the language rules along with everything else,
      // and came back with a Chinese character wedged into an English headline.
      // A retry is still the same job — say so.
      system:
        'Return ONLY valid JSON, nothing else. Check every string is closed before you finish. ' +
        'New Zealand English throughout, no exclamation marks, no marketing gloss, and no ' +
        'characters outside ordinary English punctuation and macronised vowels.',
      messages: [{ role: 'user', content:
        `Write this as JSON: {"name":"","eyebrow":"","headline":"six words or so","lede":"two sentences",` +
        `"about":{"title":"","text":"two short paragraphs separated by a blank line"},` +
        `"facts":{"title":"","items":[["thing","one line"]]},"faq":{"items":[["q","a"]]}}\n\n` +
        `Subject: ${subject}\n\nThe films are:\n` + clips.map((c) => `  - ${c.title} (${c.who})`).join('\n') }],
    }),
  });
  w = readJson(await retry.json());
}
if (!w) {
  say('  still malformed — publishing the films with plain wording');
  w = { name: subject, headline: subject, lede: '' };
}

const config = {
  name: w.name || subject,
  style: 'youtube',
  eyebrow: w.eyebrow || '',
  headline: w.headline || w.name || subject,
  lede: w.lede || '',
  tone: 'dark',
  // The builder reads a palette off every config it opens. Leaving it
  // out is what made the first three reels uneditable.
  palette: { primary: '#e0483d', deep: '#0b0b0d', wash: '#141418' },
  shop: false, chat: false, products: [],
  sections: [
    { type: 'video', label: 'The reel', title: `${clips.length} films`, clips },
    ...(w.about?.text ? [{ type: 'about', label: 'The subject', title: w.about.title || '', text: w.about.text }] : []),
    ...(w.facts?.items?.length ? [{ type: 'services', label: 'Worth knowing', title: w.facts.title || '', items: w.facts.items }] : []),
    ...(w.faq?.items?.length ? [{ type: 'faq', label: 'Questions', title: 'Asked a lot', items: w.faq.items }] : []),
  ],
};

// ── 4. publish ─────────────────────────────────────────────────────────────
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
const sql = has('replace')
  ? `UPDATE site_claims SET config = ${q(JSON.stringify(config))}, status = 'live',
       in_projects = 1, updated_at = datetime('now') WHERE slug = ${q(slug)};`
  : `INSERT INTO site_claims (slug, email, config, status, edit_token, in_projects, updated_at, created_at)
     VALUES (${q(slug)}, ${q(slug + '@garage.co.nz')}, ${q(JSON.stringify(config))}, 'live',
             ${q(randomBytes(16).toString('hex'))}, 1, datetime('now'), datetime('now'));`;

const file = `.reel-${slug}.sql`;
writeFileSync(file, sql);
try {
  const { stdout } = await run('npx', ['wrangler', 'd1', 'execute', 'garage-db', '--remote', `--file=${file}`],
    { maxBuffer: 1024 * 1024 * 8 });
  if (!/"success": true/.test(stdout)) throw new Error(stdout.slice(-400));
} finally {
  try { unlinkSync(file); } catch {}
}

say(`\n  ${config.name}`);
say(`  https://${slug}.garage.co.nz    ${clips.length} films, all verified\n`);
