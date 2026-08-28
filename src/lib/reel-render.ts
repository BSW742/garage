// REEL TEMPLATE (style: "reel")
//
// Video first. A subject, and the films people have already made about it.
//
// Two things shape this template and both come from the same fact: the films
// are not ours.
//
// The credit is part of the design, not a footnote. Every clip carries the
// title and the channel exactly as YouTube publishes them, read back from the
// oEmbed endpoint rather than written by a model. A page that credits somebody's
// work with an invented title is worse than one with no titles at all, and a
// model will invent an eleven-character video id as readily as a real one — an
// invented one renders as a dead grey rectangle and nobody notices for a week.
//
// And nothing loads until it is asked for. Twelve embedded iframes is several
// megabytes and twelve sets of cookies before anybody has pressed anything, so
// each slot is a thumbnail and a play button, and the iframe is built on click.
// The embeds are youtube-nocookie.com, which is the same player without the
// tracking on arrival.
//
// The look is a dark room and a lit screen. Everything else on the page gets
// out of the way of the picture.

import type { SiteConfig, SiteSection, Clip } from './site-render';

export const REEL_FONT_QUERY = '&family=Space+Grotesk:wght@400;500;700';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

const pick = (site: SiteConfig, type: string): SiteSection | undefined =>
  (site.sections || []).find((s) => s?.type === type);

// A YouTube id is exactly eleven characters of a known alphabet. Anything else
// never reaches the page — this is the last gate before render, after the
// oEmbed check that happens when the page is built.
const ID = /^[A-Za-z0-9_-]{11}$/;

function clipsOf(site: SiteConfig): Clip[] {
  const out: Clip[] = [];
  for (const section of site.sections || []) {
    for (const clip of section?.clips || []) {
      const id = String(clip?.id || '');
      if (ID.test(id) && !out.some((c) => c.id === id)) {
        out.push({ id, title: clip?.title || '', who: clip?.who || '', note: clip?.note || '' });
      }
    }
    // Older pages carry a plain list of ids and no titles. Still renderable.
    for (const id of section?.videos || []) {
      const v = String(id || '');
      if (ID.test(v) && !out.some((c) => c.id === v)) out.push({ id: v });
    }
  }
  return out;
}

export const REEL_CSS = `
.rl{--room:#0b0b0d;--panel:#141418;--ink:#f4f4f5;--dim:#8f8f99;--line:#26262d;
--accent:var(--primary);
--display:'Space Grotesque','Space Grotesk',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.rl{background:var(--room);color:var(--ink);font-family:var(--body);line-height:1.6}
html:has(body.rl),body.rl{overflow-x:clip;background:var(--room)}
.rl h1,.rl h2,.rl h3{font-family:var(--display);font-weight:700;line-height:1.04;
letter-spacing:-.028em;text-align:left;margin-bottom:0}
.rl ::selection{background:var(--accent);color:#000}
.rl-wrap{max-width:76rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.rl-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--room) 86%,transparent);
backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.rl-nav-in{display:flex;align-items:center;gap:1.1rem;padding:.9rem 0}
.rl-mark{font-family:var(--display);font-weight:700;font-size:1.12rem;letter-spacing:-.03em}
.rl-count{margin-left:auto;font-size:.82rem;color:var(--dim);letter-spacing:.06em}

/* -- The feature. One film, given the top of the page. -- */
.rl-hero{padding:2.6rem 0 0}
.rl-eyebrow{font-size:.72rem;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);
margin-bottom:1rem}
.rl-hero h1{font-size:clamp(2.3rem,7vw,4.6rem);max-width:18ch}
.rl-lede{margin-top:1.1rem;max-width:38rem;font-size:1.06rem;color:var(--dim)}

.rl-stage{margin-top:2.2rem;position:relative;border-radius:14px;overflow:hidden;
background:var(--panel);border:1px solid var(--line)}
.rl-stage .rl-frame{aspect-ratio:16/9;width:100%;display:block;position:relative}
.rl-frame img{width:100%;height:100%;object-fit:cover;display:block}
.rl-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.rl-play{position:absolute;inset:0;display:grid;place-items:center;border:0;cursor:pointer;
background:linear-gradient(transparent 40%,rgba(0,0,0,.55));width:100%;height:100%;padding:0}
.rl-play:hover .rl-disc{transform:scale(1.08);background:var(--accent)}
.rl-disc{width:4.2rem;height:4.2rem;border-radius:50%;background:rgba(0,0,0,.6);
border:1px solid rgba(255,255,255,.5);display:grid;place-items:center;transition:.18s}
.rl-disc:after{content:'';border-style:solid;border-width:.62rem 0 .62rem 1.05rem;
border-color:transparent transparent transparent #fff;margin-left:.22rem}
.rl-play:hover .rl-disc:after{border-left-color:#000}
.rl-cap{padding:1rem 1.2rem;border-top:1px solid var(--line);display:flex;gap:1rem;
align-items:baseline;flex-wrap:wrap}
.rl-cap b{font-family:var(--display);font-weight:500;font-size:1.02rem}
.rl-cap span{color:var(--dim);font-size:.88rem}
.rl-cap a{color:var(--dim);border-bottom:1px solid var(--line)}
.rl-cap a:hover{color:var(--ink);border-bottom-color:var(--ink)}

/* -- Sections -- */
.rl-sec{padding:4.2rem 0}
.rl-label{font-size:.72rem;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);
margin-bottom:.8rem}
.rl-sec h2{font-size:clamp(1.8rem,4.4vw,2.7rem)}
.rl-sub{margin-top:.9rem;color:var(--dim);max-width:38rem}

/* -- The wall. Everything else, in order. -- */
.rl-grid{margin-top:2.2rem;display:grid;gap:1.4rem;grid-template-columns:1fr}
@media(min-width:640px){.rl-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1040px){.rl-grid{grid-template-columns:repeat(3,1fr);gap:1.6rem}}
.rl-card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;
display:flex;flex-direction:column}
.rl-card .rl-frame{aspect-ratio:16/9}
.rl-card .rl-disc{width:3rem;height:3rem}
.rl-card .rl-disc:after{border-width:.44rem 0 .44rem .75rem;margin-left:.16rem}
.rl-meta{padding:.95rem 1rem 1.05rem;display:flex;flex-direction:column;gap:.3rem;flex:1}
.rl-meta b{font-family:var(--display);font-weight:500;font-size:.98rem;line-height:1.3}
.rl-meta span{color:var(--dim);font-size:.84rem}
.rl-meta a{color:var(--dim);border-bottom:1px solid transparent}
.rl-meta a:hover{color:var(--ink);border-bottom-color:var(--line)}
.rl-meta p{color:var(--dim);font-size:.87rem;margin-top:.25rem}

/* -- Written bits. Deliberately quiet next to the films. -- */
.rl-prose{max-width:42rem;color:var(--dim)}
.rl-prose p+p{margin-top:.9rem}
.rl-list{margin-top:1.8rem;display:grid;gap:0;max-width:46rem}
.rl-row{display:grid;grid-template-columns:1fr auto;gap:.3rem 1rem;padding:.95rem 0;
border-bottom:1px solid var(--line);align-items:baseline}
.rl-row:last-child{border-bottom:0}
.rl-row b{font-weight:600;font-size:.99rem}
.rl-row .rl-tag{font-family:var(--display);font-size:.86rem;color:var(--accent);white-space:nowrap}
.rl-row p{grid-column:1/-1;color:var(--dim);font-size:.89rem;margin-top:.15rem}
.rl-qs{margin-top:1.8rem;max-width:46rem}
.rl-q{border-top:1px solid var(--line);padding:1.1rem 0}
.rl-q:last-child{border-bottom:1px solid var(--line)}
.rl-q b{display:block;font-weight:600;margin-bottom:.3rem}
.rl-q span{color:var(--dim);font-size:.93rem}

/* -- The credit. Not small print: it is whose work this is. -- */
.rl-end{padding:3.4rem 0 4.4rem;border-top:1px solid var(--line);margin-top:2rem}
.rl-credit{color:var(--dim);font-size:.9rem;max-width:44rem}
.rl-credit b{color:var(--ink);font-weight:600}
.rl-makers{margin-top:1.1rem;display:flex;flex-wrap:wrap;gap:.45rem}
.rl-makers a{font-size:.85rem;border:1px solid var(--line);border-radius:999px;
padding:.32rem .8rem;color:var(--dim)}
.rl-makers a:hover{border-color:var(--accent);color:var(--ink)}
`;

// One slot: a thumbnail, a play button, and nothing else until it is pressed.
function frame(clip: Clip, big: boolean): string {
  const id = esc(clip.id);
  const size = big ? 'maxresdefault' : 'hqdefault';
  const label = clip.title ? `Play: ${clip.title}` : 'Play video';
  return `<div class="rl-frame" data-yt="${id}">
    <img src="https://i.ytimg.com/vi/${id}/${size}.jpg" alt="" loading="lazy"
         onerror="this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" />
    <button type="button" class="rl-play" aria-label="${esc(label)}"><span class="rl-disc"></span></button>
  </div>`;
}

function credit(clip: Clip): string {
  const title = clip.title ? esc(clip.title) : 'Untitled';
  const who = clip.who
    ? `<span>${esc(clip.who)}</span>`
    : '';
  return `<b>${title}</b>${who}`;
}

export function renderReelBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const clips = clipsOf(site);
  const [feature, ...rest] = clips;

  const wall = pick(site, 'video') || pick(site, 'reel');
  const about = pick(site, 'about');
  const list = pick(site, 'services') || pick(site, 'pricing');
  const faq = pick(site, 'faq');

  const makers = [...new Set(clips.map((c) => c.who).filter(Boolean) as string[])];

  const featureHtml = feature
    ? `<div class="rl-stage">
      ${frame(feature, true)}
      <div class="rl-cap">
        ${credit(feature)}
        <a href="https://www.youtube.com/watch?v=${esc(feature.id)}" target="_blank"
           rel="noopener nofollow" style="margin-left:auto">Watch on YouTube</a>
      </div>
    </div>`
    : '';

  const wallHtml = rest.length
    ? `<section class="rl-sec" id="reel"><div class="rl-wrap">
    <p class="rl-label">${esc(wall?.label || 'The reel')}</p>
    <h2>${esc(wall?.title || 'Everything else')}</h2>
    ${wall?.text ? `<p class="rl-sub">${esc(wall.text)}</p>` : ''}
    <div class="rl-grid">${rest
      .slice(0, 24)
      .map(
        (c) => `<article class="rl-card">
        ${frame(c, false)}
        <div class="rl-meta">
          ${credit(c)}
          ${c.note ? `<p>${esc(c.note)}</p>` : ''}
          <a href="https://www.youtube.com/watch?v=${esc(c.id)}" target="_blank"
             rel="noopener nofollow" style="margin-top:.35rem">Watch on YouTube</a>
        </div>
      </article>`
      )
      .join('')}</div>
  </div></section>`
    : '';

  const aboutHtml = about?.text
    ? `<section class="rl-sec"><div class="rl-wrap">
    <p class="rl-label">${esc(about?.label || 'The place')}</p>
    <h2>${esc(about?.title || 'What you are looking at')}</h2>
    <div class="rl-prose" style="margin-top:1.2rem">${String(about.text)
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p)}</p>`)
      .join('')}</div>
  </div></section>`
    : '';

  const listHtml = (list?.items || []).length
    ? `<section class="rl-sec"><div class="rl-wrap">
    <p class="rl-label">${esc(list?.label || 'On the ground')}</p>
    <h2>${esc(list?.title || 'Worth knowing')}</h2>
    <div class="rl-list">${(list?.items || [])
      .slice(0, 14)
      .map((i) => {
        const [head, tag] = String(i[1] || '').split(/\s*\|\s*/);
        return `<div class="rl-row">
          <b>${esc(i[0])}</b>
          ${tag ? `<span class="rl-tag">${esc(tag)}</span>` : '<span></span>'}
          ${head ? `<p>${esc(head)}</p>` : ''}
        </div>`;
      })
      .join('')}</div>
  </div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="rl-sec"><div class="rl-wrap">
    <p class="rl-label">${esc(faq?.label || 'Questions')}</p>
    <h2>${esc(faq?.title || 'Asked a lot')}</h2>
    <div class="rl-qs">${(faq?.items || [])
      .slice(0, 8)
      .map((q) => `<div class="rl-q"><b>${esc(q[0])}</b><span>${esc(q[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="rl-nav"><div class="rl-wrap"><div class="rl-nav-in">
  <a class="rl-mark" href="#top">${esc(who)}</a>
  ${clips.length ? `<span class="rl-count">${clips.length} film${clips.length === 1 ? '' : 's'}</span>` : ''}
</div></div></nav>

<header class="rl-hero" id="top"><div class="rl-wrap">
  ${site.eyebrow ? `<p class="rl-eyebrow">${esc(site.eyebrow)}</p>` : ''}
  <h1>${esc(site.headline || who)}</h1>
  ${site.lede ? `<p class="rl-lede">${esc(site.lede)}</p>` : ''}
  ${featureHtml}
</div></header>

${wallHtml}
${aboutHtml}
${listHtml}
${faqHtml}

<section class="rl-end"><div class="rl-wrap">
  <p class="rl-credit">
    <b>These films are not ours.</b> Every one belongs to the person who made it,
    and the titles and channel names here are exactly as published on YouTube.
    Nothing is hosted on this page &mdash; each one plays from YouTube, and only
    once you press it.
  </p>
  ${makers.length
    ? `<div class="rl-makers">${makers
        .slice(0, 24)
        .map((m) => `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(m)}"
             target="_blank" rel="noopener nofollow">${esc(m)}</a>`)
        .join('')}</div>`
    : ''}
</div></section>

<script>
(function () {
  // Nothing is embedded until somebody asks for it. Twelve iframes on load is
  // several megabytes and a set of cookies each, for films most visitors will
  // never press. nocookie is the same player without the tracking on arrival.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.rl-play') : null;
    if (!btn) return;
    var frame = btn.closest('.rl-frame');
    var id = frame && frame.dataset.yt;
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    f.title = btn.getAttribute('aria-label') || 'Video';
    frame.innerHTML = '';
    frame.appendChild(f);
  });
})();
</script>`;
}
