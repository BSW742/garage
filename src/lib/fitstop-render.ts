// GYM TEMPLATE (style: "fitstop")
//
// A functional-fitness gym page, built after reading the Fitstop Te Rapa site.
// Deliberately not in the starter picker: it is reached by asking for it by
// name in the builder, or by the agent recognising a gym that already belongs
// to that group. Everybody else gets the nine templates on the shelf.
//
// What makes the look, in order of how much it matters:
//
// The type does nearly all of it. One enormous compressed uppercase word,
// set at a size that would be absurd anywhere else — a hundred pixels for a
// two-word suburb — with a thin monospaced line underneath it in caps and
// wide tracking. That pairing is the whole identity: a display face with no
// air in it against a mono with nothing but air. Anton and Roboto Mono are
// the closest free stand-ins for GT America Compressed Black and GT America
// Mono; the originals are licensed and cannot be served from here.
//
// Then the ground. Not white — a warm bone and a stone grey, with an olive
// that turns up on one band, so the page reads as concrete and canvas rather
// than as a clean product site. One orange does every accent: #f15922, on the
// pill buttons and nowhere near a heading.
//
// And the session cards. Four dark photo tiles, each carrying one huge word,
// which is how a gym says what happens inside without a paragraph. If a site
// has no photos they still work as flat tiles in the palette — a gym with no
// pictures yet is the normal case on the first day, not an error.
//
// The bar under the nav is theirs too: a strip of monospaced links with a
// small mark against each. It is the second navigation and it is the one
// people actually use, so it sticks.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

// Anton for the compressed display, Roboto Mono for every label and button.
export const FITSTOP_FONT_QUERY = '&family=Anton&family=Roboto+Mono:wght@400;500';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

function safeUrl(url: unknown): string | null {
  const value = String(url || '').trim();
  if (!/^https?:\/\//i.test(value)) return null;
  return value.replace(/[()"'\s]/g, encodeURIComponent);
}

const pick = (site: SiteConfig, type: string): SiteSection | undefined =>
  (site.sections || []).find((s) => s?.type === type);

export const FITSTOP_CSS = `
.fs{--ink:#212532;--accent:#f15922;--bone:#e0e0dc;--paper:#f2f2f0;
--stone:#cdccbd;--olive:#616659;--white:#fff;
--display:Anton,Impact,'Arial Narrow',sans-serif;
--mono:'Roboto Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
background:var(--white);color:var(--ink)}
.fs *{box-sizing:border-box}
.fs .fs-wrap{width:min(1240px,100% - 3rem);margin:0 auto}

/* Every heading on the page is one thing: compressed, black, uppercase, and
   far bigger than feels sensible. Tightening the line height is what stops
   two-line headings reading as two separate headings. */
.fs h1,.fs h2,.fs h3{font-family:var(--display);font-weight:400;
text-transform:uppercase;letter-spacing:.02em;line-height:.92;margin:0}
.fs h1{font-size:clamp(3.4rem,10vw,6.2rem)}
.fs h2{font-size:clamp(2.4rem,6vw,4.4rem)}
.fs h3{font-size:clamp(1.7rem,3.4vw,2.6rem)}
.fs p{margin:0;line-height:1.6}

/* The mono does the small print: labels, links, buttons, everything that is
   not a heading and not a paragraph. Wide tracking, always caps. */
.fs .fs-mono,.fs .fs-btn,.fs .fs-label,.fs .fs-nav a,.fs .fs-strip a{
font-family:var(--mono);text-transform:uppercase;letter-spacing:.08em}
.fs .fs-label{font-size:.72rem;color:var(--accent);margin:0 0 .9rem}

/* ── Top bar ───────────────────────────────────────────────────── */
.fs .fs-nav{background:var(--white);border-bottom:1px solid var(--bone);
padding:1.1rem 0}
.fs .fs-nav .fs-wrap{display:flex;align-items:center;gap:1.5rem}
.fs .fs-mark{font-family:var(--display);font-size:1.65rem;text-transform:uppercase;
letter-spacing:.02em;line-height:1;text-decoration:none;color:var(--ink)}
/* The full stop is the only place the orange touches the name. */
.fs .fs-mark i{color:var(--accent);font-style:normal}
.fs .fs-nav .fs-links{display:flex;gap:1.6rem;margin-left:auto}
.fs .fs-nav a{font-size:.72rem;color:var(--ink);text-decoration:none}
.fs .fs-nav a:hover{color:var(--accent)}
.fs .fs-pill{border:1px solid var(--ink);border-radius:30px;padding:.7rem 1.5rem;
font-size:.66rem;text-decoration:none;color:var(--ink);white-space:nowrap}
.fs .fs-pill:hover{background:var(--ink);color:var(--white)}

/* ── The strip, which is the navigation people actually use ────── */
.fs .fs-strip{position:sticky;top:0;z-index:40;background:var(--bone)}
.fs .fs-strip .fs-wrap{display:flex;gap:2.2rem;justify-content:center;
flex-wrap:wrap;padding:.95rem 0}
.fs .fs-strip a{font-size:.76rem;color:var(--ink);text-decoration:none;
display:inline-flex;align-items:center;gap:.5rem}
.fs .fs-strip a:first-child{color:var(--accent)}
.fs .fs-strip a:hover{color:var(--accent)}
.fs .fs-strip em{font-style:normal;font-size:.9em;opacity:.75}

/* ── Hero ──────────────────────────────────────────────────────── */
.fs .fs-hero{position:relative;min-height:min(78vh,680px);display:grid;
place-items:center;text-align:center;background:var(--ink);overflow:hidden}
.fs .fs-hero-img{position:absolute;inset:0;background-size:cover;
background-position:center}
/* Dark enough that white type holds on any photograph handed to it. */
.fs .fs-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(180deg,rgba(20,22,30,.45),rgba(20,22,30,.68))}
.fs .fs-hero-in{position:relative;z-index:2;padding:5rem 1.5rem;color:var(--white)}
.fs .fs-hero h1{color:var(--white)}
.fs .fs-tag{font-family:var(--mono);text-transform:uppercase;letter-spacing:.14em;
font-size:clamp(.78rem,1.5vw,1rem);margin-top:1.4rem;color:rgba(255,255,255,.92)}
.fs .fs-btn{display:inline-block;background:var(--accent);color:var(--white);
border:0;border-radius:30px;padding:1.05rem 2.8rem;font-size:.8rem;
text-decoration:none;margin-top:2.2rem;cursor:pointer}
.fs .fs-btn:hover{background:#d94d1a}
.fs .fs-btn.ghost{background:none;border:1px solid rgba(255,255,255,.8);
margin-left:.6rem}
.fs .fs-btn.ghost:hover{background:rgba(255,255,255,.14)}

/* ── Bands ─────────────────────────────────────────────────────── */
.fs .fs-sec{padding:clamp(3.5rem,7vw,6rem) 0}
.fs .fs-sec.bone{background:var(--paper)}
.fs .fs-sec.stone{background:var(--stone)}
.fs .fs-sec.dark{background:var(--ink);color:var(--white)}
.fs .fs-sec.dark h2{color:var(--white)}
.fs .fs-head{max-width:46rem;margin:0 0 2.8rem}
.fs .fs-sub{margin-top:1.1rem;font-size:1.05rem;color:#5a6070}
.fs .fs-sec.dark .fs-sub{color:rgba(255,255,255,.72)}

/* ── Session tiles ─────────────────────────────────────────────── */
.fs .fs-tiles{display:grid;gap:1rem;
grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}
.fs .fs-tile{position:relative;min-height:19rem;display:flex;
align-items:flex-end;padding:1.6rem;overflow:hidden;background:var(--olive);
color:var(--white)}
.fs .fs-tile-img{position:absolute;inset:0;background-size:cover;
background-position:center;transition:transform .5s ease}
.fs .fs-tile:hover .fs-tile-img{transform:scale(1.05)}
.fs .fs-tile:after{content:'';position:absolute;inset:0;
background:linear-gradient(180deg,rgba(20,22,30,.15),rgba(20,22,30,.75))}
.fs .fs-tile-in{position:relative;z-index:2}
.fs .fs-tile h3{color:var(--white)}
.fs .fs-tile p{margin-top:.6rem;font-size:.92rem;color:rgba(255,255,255,.85);
max-width:22rem}
/* Every second tile takes the olive so a gym with no photographs still gets
   a rhythm across the row rather than four identical blocks. */
.fs .fs-tile:nth-child(2n){background:var(--ink)}
.fs .fs-tile:nth-child(3n){background:var(--accent)}

/* ── Price cards ───────────────────────────────────────────────── */
.fs .fs-plans{display:grid;gap:1rem;
grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))}
.fs .fs-plan{background:var(--white);padding:2rem 1.8rem 2.2rem;
border:1px solid var(--bone)}
.fs .fs-plan h3{font-size:clamp(1.4rem,2.4vw,1.9rem)}
.fs .fs-plan .fs-note{font-family:var(--mono);font-size:.7rem;
text-transform:uppercase;letter-spacing:.08em;color:var(--accent);
margin-bottom:.9rem}
/* wrap, or the description's flex-basis:100% fights the name and the price for
   the one line they are all on and squeezes both into two words a piece. */
.fs .fs-row{display:flex;flex-wrap:wrap;justify-content:space-between;
gap:.2rem 1rem;padding:.85rem 0;border-bottom:1px solid var(--bone)}
.fs .fs-row:last-child{border-bottom:0}
.fs .fs-row b{font-weight:600;font-size:.98rem}
.fs .fs-row span{font-family:var(--mono);font-size:.85rem;white-space:nowrap}
.fs .fs-row p{flex-basis:100%;font-size:.86rem;color:#6b7180;margin-top:.3rem}

/* ── Timetable ─────────────────────────────────────────────────── */
.fs .fs-times{display:grid;gap:0;max-width:44rem}
.fs .fs-time{display:flex;justify-content:space-between;gap:1.5rem;
padding:1.05rem 0;border-bottom:1px solid rgba(33,37,50,.16)}
.fs .fs-time b{font-family:var(--mono);font-size:.8rem;text-transform:uppercase;
letter-spacing:.08em;font-weight:500}
.fs .fs-time span{font-size:.98rem}

/* ── Gallery ───────────────────────────────────────────────────── */
.fs .fs-shots{display:grid;gap:.6rem;
grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))}
.fs .fs-shot{aspect-ratio:1;background-size:cover;background-position:center;
background-color:var(--stone)}

/* ── Contact ───────────────────────────────────────────────────── */
.fs .fs-facts{display:grid;gap:2rem;
grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));margin-top:2.5rem}
.fs .fs-fact b{display:block;font-family:var(--mono);font-size:.7rem;
text-transform:uppercase;letter-spacing:.1em;color:var(--accent);
margin-bottom:.5rem}
.fs .fs-fact a,.fs .fs-fact span{color:inherit;font-size:1.02rem;
text-decoration:none;line-height:1.55}
.fs .fs-fact a:hover{color:var(--accent)}

.fs .fs-foot{background:var(--ink);color:rgba(255,255,255,.6);
padding:2.5rem 0;font-family:var(--mono);font-size:.7rem;
text-transform:uppercase;letter-spacing:.08em}
.fs .fs-foot .fs-wrap{display:flex;flex-wrap:wrap;gap:1rem;
justify-content:space-between}
.fs .fs-foot a{color:rgba(255,255,255,.6);text-decoration:none}
.fs .fs-foot a:hover{color:var(--white)}

@media(max-width:760px){
  .fs .fs-nav .fs-links{display:none}
  .fs .fs-strip .fs-wrap{gap:1.2rem;justify-content:flex-start;
  overflow-x:auto;flex-wrap:nowrap}
  .fs .fs-strip a{white-space:nowrap}
  .fs .fs-btn.ghost{margin-left:0;margin-top:.7rem}
}
`;

export function renderFitstopBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const cta = esc(site.cta || 'Try us free');

  const sessions = pick(site, 'services');
  const price = pick(site, 'pricing') || pick(site, 'menu');
  const hours = pick(site, 'hours');
  const about = pick(site, 'about');
  const faq = pick(site, 'faq');
  const quote = pick(site, 'testimonial');

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 8);

  // The tiles take their pictures from the gallery when the sessions have none
  // of their own, because a gym almost always has photos before it has them
  // sorted into anything.
  const tiles = (sessions?.items || []).slice(0, 4);
  const tileHtml = tiles.length
    ? `<section class="fs-sec" id="sessions"><div class="fs-wrap">
    <div class="fs-head">
      <p class="fs-label">${esc(sessions?.label || 'What we do')}</p>
      <h2>${esc(sessions?.title || 'Our session types')}</h2>
      ${sessions?.text ? `<p class="fs-sub">${esc(sessions.text)}</p>` : ''}
    </div>
    <div class="fs-tiles">${tiles
      .map((s, i) => {
        const img = shots[i];
        return `<article class="fs-tile">
        ${img ? `<div class="fs-tile-img" style="background-image:url(${esc(img)})"></div>` : ''}
        <div class="fs-tile-in">
          <h3>${esc(s[0])}</h3>
          ${s[1] ? `<p>${esc(s[1])}</p>` : ''}
        </div>
      </article>`;
      })
      .join('')}</div>
  </div></section>`
    : '';

  const groups = (price?.menu || []) as MenuGroup[];
  const rows = (price?.rows || price?.items || []) as [string, string][];
  const priceHtml = groups.length || rows.length
    ? `<section class="fs-sec bone" id="membership"><div class="fs-wrap">
    <div class="fs-head">
      <p class="fs-label">${esc(price?.label || 'Membership')}</p>
      <h2>${esc(price?.title || 'What it costs')}</h2>
      ${price?.text ? `<p class="fs-sub">${esc(price.text)}</p>` : ''}
    </div>
    <div class="fs-plans">${
      groups.length
        ? groups
            .slice(0, 4)
            .map((g) => `<div class="fs-plan">
        ${g.heading ? `<h3>${esc(g.heading)}</h3>` : ''}
        ${g.note ? `<p class="fs-note">${esc(g.note)}</p>` : ''}
        ${(g.items || [])
          .slice(0, 8)
          .map((r) => `<div class="fs-row">
            <b>${esc(r?.name || '')}</b>
            ${r?.price ? `<span>${esc(r.price)}</span>` : '<span></span>'}
            ${r?.text ? `<p>${esc(r.text)}</p>` : ''}
          </div>`)
          .join('')}
      </div>`)
            .join('')
        : `<div class="fs-plan">${rows
            .slice(0, 8)
            .map((r) => `<div class="fs-row"><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`)
            .join('')}</div>`
    }</div>
  </div></section>`
    : '';

  const timeRows = (hours?.rows || hours?.items || []) as [string, string][];
  const hoursHtml = timeRows.length
    ? `<section class="fs-sec stone" id="timetable"><div class="fs-wrap">
    <div class="fs-head">
      <p class="fs-label">${esc(hours?.label || 'Timetable')}</p>
      <h2>${esc(hours?.title || 'When we are open')}</h2>
      ${hours?.text ? `<p class="fs-sub">${esc(hours.text)}</p>` : ''}
    </div>
    <div class="fs-times">${timeRows
      .slice(0, 9)
      .map((r) => `<div class="fs-time"><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const aboutHtml = about?.text
    ? `<section class="fs-sec dark" id="about"><div class="fs-wrap">
    <div class="fs-head">
      <p class="fs-label">${esc(about.label || 'The gym')}</p>
      <h2>${esc(about.title || `Inside ${who}`)}</h2>
      <p class="fs-sub">${esc(about.text)}</p>
    </div>
    ${quote?.quote
      ? `<p class="fs-tag" style="letter-spacing:.1em;margin-top:0">&ldquo;${esc(quote.quote)}&rdquo;${
          quote.who ? ` &mdash; ${esc(quote.who)}` : ''
        }</p>`
      : ''}
  </div></section>`
    : '';

  const shotHtml = shots.length
    ? `<section class="fs-sec" id="community"><div class="fs-wrap">
    <div class="fs-head">
      <p class="fs-label">The community</p>
      <h2>Who trains here</h2>
    </div>
    <div class="fs-shots">${shots
      .map((u) => `<div class="fs-shot" style="background-image:url(${esc(u)})"></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="fs-sec bone" id="first"><div class="fs-wrap">
    <div class="fs-head">
      <p class="fs-label">${esc(faq?.label || 'First timers')}</p>
      <h2>${esc(faq?.title || 'Before you come in')}</h2>
    </div>
    <div class="fs-plans">${(faq?.items || [])
      .slice(0, 6)
      .map((q) => `<div class="fs-plan"><h3 style="font-size:1.3rem">${esc(q[0])}</h3>
        <p style="margin-top:.8rem;color:#5a6070;font-size:.95rem">${esc(q[1])}</p></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const strip = [
    ['&#9678;', who, '#top'],
    timeRows.length ? ['&#9201;', 'Timetable', '#timetable'] : null,
    groups.length || rows.length ? ['&#9776;', 'Membership', '#membership'] : null,
    (faq?.items || []).length ? ['&raquo;', 'First timers', '#first'] : null,
    ['&#9993;', 'Contact us', '#contact'],
  ].filter(Boolean) as [string, string, string][];

  return `
<nav class="fs-nav">
  <div class="fs-wrap">
    <a class="fs-mark" href="#top">${esc(who)}<i>.</i></a>
    <div class="fs-links">
      ${tiles.length ? '<a href="#sessions">Sessions</a>' : ''}
      ${timeRows.length ? '<a href="#timetable">Timetable</a>' : ''}
      ${groups.length || rows.length ? '<a href="#membership">Membership</a>' : ''}
      <a href="#contact">Contact</a>
    </div>
    <a class="fs-pill" href="#contact">${cta}</a>
  </div>
</nav>

<div class="fs-strip">
  <div class="fs-wrap">${strip
    .map(([mark, label, href]) => `<a href="${href}"><em>${mark}</em>${esc(label)}</a>`)
    .join('')}</div>
</div>

<header class="fs-hero" id="top">
  ${hero ? `<div class="fs-hero-img" style="background-image:url(${esc(hero)})"></div>` : ''}
  <div class="fs-hero-in">
    <h1>${esc(site.headline || who)}</h1>
    <p class="fs-tag">${esc(site.lede || site.eyebrow || 'Your home of functional fitness')}</p>
    <div>
      <a class="fs-btn" href="#contact">${cta}</a>
      ${timeRows.length ? '<a class="fs-btn ghost" href="#timetable">See the timetable</a>' : ''}
    </div>
  </div>
</header>

${tileHtml}
${priceHtml}
${hoursHtml}
${aboutHtml}
${shotHtml}
${faqHtml}

<section class="fs-sec" id="contact"><div class="fs-wrap">
  <div class="fs-head">
    <p class="fs-label">Come in</p>
    <h2>Find us</h2>
  </div>
  <div class="fs-facts">
    ${contact.address ? `<div class="fs-fact"><b>Address</b><span>${esc(contact.address)}</span></div>` : ''}
    ${contact.phone ? `<div class="fs-fact"><b>Phone</b><a href="tel:${esc(tel)}">${esc(contact.phone)}</a></div>` : ''}
    ${contact.email ? `<div class="fs-fact"><b>Email</b><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
  </div>
  <a class="fs-btn" href="${contact.email ? `mailto:${esc(contact.email)}` : '#top'}">${cta}</a>
</div></section>

<footer class="fs-foot"><div class="fs-wrap">
  <span>&copy; ${new Date().getFullYear()} ${esc(who)}</span>
  <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
</div></footer>
`;
}
