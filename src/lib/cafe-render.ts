// CAFE TEMPLATE
// A second, genuinely different skeleton for the same SiteConfig. The house
// design is built around a service business — hero, service cards, contact —
// which is right for a physio and wrong for a cafe. A cafe is judged on three
// things before anyone walks in: what the food looks like, what is on the menu,
// and whether it is open right now. So this one leads with a full-bleed photo,
// puts a real menu board at the centre, and answers "are you open?" in the
// hero rather than four screens down.
//
// Reference: Dishoom (dishoom.com) — cream paper, deep burgundy, serif display
// against a plain sans, photography carrying the page instead of graphics, and
// an editorial voice rather than a sales one.

import type { SiteConfig, SiteSection } from './site-render';

/** Extra Google Fonts axes this template needs on top of the shared ones. */
export const CAFE_FONT_QUERY = '&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700';

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

function initials(name: string): string {
  const parts = (name || '?').split(/\s+/).filter(Boolean);
  return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export const CAFE_CSS = `
.cf{--paper:#fbf6ee;--cream:#f4ebdd;--espresso:#231a13;--ink:#2b1e15;--soft:#7c6852;
--line:#e2d4bf;--accent:var(--primary);
--display:'Fraunces',Georgia,'Times New Roman',serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.cf{background:var(--paper);color:var(--ink);font-family:var(--body)}
/* The offset photo in the story block deliberately hangs outside its frame.
   Nothing should be able to turn that into a sideways scrollbar. */
html:has(body.cf),body.cf{overflow-x:clip}
.cf h1,.cf h2,.cf h3,.cf .cf-price,.cf .cf-quote p{font-family:var(--display);font-weight:600;letter-spacing:-.015em}
.cf ::selection{background:var(--accent);color:#fff}
.cf-wrap{max-width:68rem;margin:0 auto;padding:0 1.6rem}
/* The house sheet centres every h2 and pads it. This template decides that
   per section, so take both back before anything else is said. */
.cf h2{text-align:left;margin-bottom:0}
.cf-centre h2,.cf-band h2{text-align:center}
.cf-narrow{max-width:46rem;margin:0 auto;padding:0 1.6rem}

/* Small caps rule-label, used above every section */
.cf-eyebrow{font-size:.72rem;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);
font-weight:600;display:flex;align-items:center;gap:.9rem;margin-bottom:1rem}
.cf-eyebrow::after{content:'';flex:1;height:1px;background:var(--line)}
.cf-centre .cf-eyebrow{justify-content:center}
.cf-centre .cf-eyebrow::after,.cf-centre .cf-eyebrow::before{content:'';flex:0 0 2.5rem;height:1px;background:var(--line)}

/* ── Nav ─────────────────────────────────────────── */
.cf-nav{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;
justify-content:space-between;gap:1rem;padding:1.1rem 1.8rem;color:#fff;
transition:background .35s ease,color .35s ease,box-shadow .35s ease,padding .35s ease}
.cf-nav.stuck{background:var(--paper);color:var(--ink);box-shadow:0 1px 0 var(--line);padding:.75rem 1.8rem}
.cf-nav .cf-brand{display:flex;align-items:center;gap:.6rem;font-family:var(--display);
font-weight:700;font-size:1.15rem;letter-spacing:-.02em}
.cf-nav .cf-brand img{height:46px;width:auto;max-width:200px;object-fit:contain}
.cf-nav.stuck .cf-brand img{height:38px}
.cf-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;
border:1px solid currentColor;font-size:.8rem;letter-spacing:.02em}
.cf-links{display:flex;gap:1.7rem;font-size:.76rem;letter-spacing:.2em;text-transform:uppercase;font-weight:500}
.cf-links a{opacity:.85;padding:.2rem 0;border-bottom:1px solid transparent}
.cf-links a:hover{opacity:1;border-bottom-color:currentColor}
.cf-book{border:1px solid currentColor;border-radius:999px;padding:.6rem 1.2rem;
font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;font-weight:600;white-space:nowrap}
.cf-nav.stuck .cf-book{background:var(--accent);border-color:var(--accent);color:#fff}
@media(max-width:900px){.cf-links{display:none}.cf-nav{padding:1rem 1.1rem}}

/* ── Hero ────────────────────────────────────────── */
.cf-hero{position:relative;min-height:92vh;display:grid;align-items:end;color:#fff;overflow:hidden}
.cf-hero-photo{position:absolute;inset:0;background-size:cover;background-position:center;
transform:scale(1.04);animation:cf-drift 18s ease-out forwards}
@keyframes cf-drift{to{transform:scale(1)}}
.cf-hero::after{content:'';position:absolute;inset:0;
background:linear-gradient(180deg,rgba(20,13,8,.55) 0%,rgba(20,13,8,.15) 35%,rgba(20,13,8,.82) 100%)}
/* 92vh is right when a photograph is behind the words: the text sits on the
   bottom of the picture and the picture fills the screen. With no photo it is
   a screenful of empty brown with the headline pushed off the bottom of the
   phone — which is what a cafe that has not put pictures in yet actually gets.
   So a plain hero is sized by its words. */
.cf-hero.plain{background:var(--espresso);min-height:0;align-items:start}
.cf-hero.plain .cf-hero-inner{padding-top:3.2rem;padding-bottom:3.2rem}
@media(min-width:700px){
  .cf-hero.plain .cf-hero-inner{padding-top:5rem;padding-bottom:5rem}
}
.cf-hero.plain::after{background:radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.09),transparent 70%)}
.cf-hero-inner{position:relative;z-index:2;padding:0 1.4rem 4.5rem;width:100%;max-width:68rem;margin:0 auto}
@media(min-width:700px){.cf-hero-inner{padding:0 1.8rem 4.5rem}}
.cf-hero .cf-eyebrow{color:rgba(255,255,255,.82)}
.cf-hero .cf-eyebrow::after{background:rgba(255,255,255,.32)}
.cf-hero h1{font-size:clamp(2.4rem,8.4vw,6.4rem);line-height:.95;font-weight:700;max-width:14ch;text-wrap:balance}
.cf-hero-logo img{max-height:170px;width:auto}
.cf-hero .cf-lede{margin-top:1.4rem;max-width:34rem;font-size:1.08rem;line-height:1.65;color:rgba(255,255,255,.9)}
.cf-hero-acts{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:2rem}
.cf-btn{display:inline-block;background:var(--accent);color:#fff;border-radius:999px;
padding:.95rem 1.9rem;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;font-weight:600;
border:1px solid var(--accent);transition:transform .2s ease,filter .2s ease}
.cf-btn:hover{transform:translateY(-2px);filter:brightness(1.07)}
.cf-btn.ghost{background:transparent;border-color:rgba(255,255,255,.55);color:#fff}
.cf-hero-foot{position:relative;z-index:2;border-top:1px solid rgba(255,255,255,.22);margin-top:2.6rem;
padding-top:1.1rem;display:flex;flex-wrap:wrap;gap:.6rem 2rem;align-items:center;
font-size:.82rem;color:rgba(255,255,255,.85)}
/* The one thing every cafe visitor wants to know first */
.cf-open{display:inline-flex;align-items:center;gap:.55rem;font-weight:600;letter-spacing:.02em}
.cf-open i{width:8px;height:8px;border-radius:50%;background:#7dd47d;display:inline-block;
box-shadow:0 0 0 0 rgba(125,212,125,.7);animation:cf-pulse 2.4s infinite}
.cf-open.shut i{background:#d98b6a;animation:none}
@keyframes cf-pulse{70%{box-shadow:0 0 0 9px rgba(125,212,125,0)}100%{box-shadow:0 0 0 0 rgba(125,212,125,0)}}

/* ── Ribbon ──────────────────────────────────────── */
.cf-ribbon{background:var(--espresso);color:var(--cream);padding:.95rem 0;overflow:hidden;
white-space:nowrap;font-family:var(--display);font-size:1.05rem}
.cf-ribbon-track{display:inline-flex;gap:2.6rem;padding-left:2.6rem;animation:cf-slide 34s linear infinite}
.cf-ribbon span{display:inline-flex;align-items:center;gap:2.6rem}
.cf-ribbon span::after{content:'✳';color:var(--accent);font-size:.85rem}
@keyframes cf-slide{to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.cf-ribbon-track{animation:none}.cf-hero-photo{animation:none;transform:none}}

.cf-sec{padding:6rem 0}
.cf-sec.tint{background:var(--cream)}
.cf-sec h2{font-size:clamp(1.9rem,4vw,2.9rem);line-height:1.1;max-width:20ch}
.cf-centre{text-align:center}
.cf-centre h2{margin:0 auto}
.cf-sec .cf-intro{margin-top:1rem;color:var(--soft);max-width:38rem;line-height:1.75}
.cf-centre .cf-intro{margin-left:auto;margin-right:auto}

/* ── Menu board ──────────────────────────────────── */
.cf-menu-jump{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin:2.4rem 0 3.4rem}
.cf-menu-jump a{border:1px solid var(--line);border-radius:999px;padding:.5rem 1.15rem;
font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--soft)}
.cf-menu-jump a:hover{border-color:var(--accent);color:var(--accent)}
.cf-groups{display:grid;gap:3.6rem}
@media(min-width:900px){.cf-groups.two{grid-template-columns:1fr 1fr;gap:3.6rem 4.5rem}}
.cf-group h3{font-size:1.45rem;display:flex;align-items:baseline;gap:.9rem;margin-bottom:.35rem}
.cf-group h3::after{content:'';flex:1;height:1px;background:var(--line)}
.cf-group .cf-note{color:var(--soft);font-size:.87rem;font-style:italic;margin-bottom:1.4rem}
.cf-item{display:grid;grid-template-columns:1fr auto;column-gap:.7rem;padding:.95rem 0;
border-bottom:1px dotted var(--line)}
.cf-item:last-child{border-bottom:0}
.cf-item strong{font-weight:600;font-size:1.02rem}
.cf-item .cf-price{font-size:1.02rem;color:var(--accent);white-space:nowrap;font-variant-numeric:tabular-nums}
.cf-item p{grid-column:1/-1;color:var(--soft);font-size:.9rem;line-height:1.6;margin-top:.3rem;max-width:44ch}

/* ── Story ───────────────────────────────────────── */
.cf-story{display:grid;gap:3rem;align-items:center}
@media(min-width:900px){.cf-story{grid-template-columns:1.05fr 1fr;gap:4.5rem}}
.cf-story-art{position:relative;aspect-ratio:4/5;background:var(--cream) center/cover;border-radius:2px}
.cf-story-art .cf-inset{position:absolute;right:-2.2rem;bottom:-2.2rem;width:52%;aspect-ratio:1;
background:var(--paper) center/cover;border:9px solid var(--paper);border-radius:2px;
box-shadow:0 18px 40px rgba(35,26,19,.16)}
@media(max-width:899px){.cf-story-art .cf-inset{right:-.8rem;bottom:-1.4rem;width:44%}}
.cf-story p{color:var(--soft);line-height:1.85;margin-top:1.1rem;white-space:pre-line}
.cf-sign{font-family:var(--display);font-size:1.1rem;color:var(--ink);margin-top:1.6rem;display:block}

/* ── Gallery strip ───────────────────────────────── */
.cf-strip{display:flex;gap:1rem;overflow-x:auto;padding:0 1.6rem 1rem;scroll-snap-type:x mandatory;
-webkit-overflow-scrolling:touch}
.cf-strip::-webkit-scrollbar{height:6px}
.cf-strip::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
.cf-strip .cf-shot{flex:0 0 min(78vw,28rem);aspect-ratio:4/3;background:var(--cream) center/cover;
scroll-snap-align:center;border-radius:2px;filter:saturate(1.03)}

/* ── Espresso panel: hours, address, map ─────────── */
.cf-find{background:var(--espresso);color:var(--cream)}
.cf-find .cf-eyebrow{color:#e9b98f}
.cf-find .cf-eyebrow::after,.cf-find .cf-eyebrow::before{background:rgba(244,235,221,.22)}
.cf-find h2{color:var(--paper)}
.cf-find-grid{display:grid;gap:3rem}
@media(min-width:900px){.cf-find-grid{grid-template-columns:1fr 1fr;gap:4.5rem}}
.cf-rows{margin-top:1.8rem;border-top:1px solid rgba(244,235,221,.18)}
.cf-rows div{display:flex;justify-content:space-between;gap:1.5rem;padding:.85rem 0;
border-bottom:1px solid rgba(244,235,221,.14);font-size:.95rem}
.cf-rows div.today{color:#fff;font-weight:600}
.cf-rows div.today span:first-child::before{content:'→ ';color:#e9b98f}
.cf-where{margin-top:2rem;display:grid;gap:.6rem;font-size:.95rem}
.cf-where a{border-bottom:1px solid rgba(244,235,221,.3);padding-bottom:1px}
.cf-where a:hover{border-bottom-color:#e9b98f}
.cf-map{position:relative;border-radius:2px;overflow:hidden;min-height:26rem;background:#1a1310}
.cf-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0;
filter:grayscale(1) contrast(.9) invert(.92) hue-rotate(180deg)}

/* ── Quote ───────────────────────────────────────── */
.cf-quote{text-align:center}
.cf-quote p{font-size:clamp(1.5rem,3.4vw,2.35rem);line-height:1.35;max-width:24ch;margin:0 auto;
font-weight:400;font-style:italic}
.cf-quote span{display:block;margin-top:1.6rem;font-size:.76rem;letter-spacing:.24em;
text-transform:uppercase;color:var(--soft)}

/* ── Cards (services / faq fallbacks) ────────────── */
.cf-cards{display:grid;gap:1.6rem;margin-top:2.6rem}
@media(min-width:760px){.cf-cards{grid-template-columns:repeat(3,1fr)}}
.cf-card{background:var(--paper);border:1px solid var(--line);border-radius:2px;padding:1.9rem 1.6rem}
.cf-card h3{font-size:1.15rem;margin-bottom:.5rem}
.cf-card p{color:var(--soft);font-size:.93rem;line-height:1.7}
.cf-faq{margin-top:2.4rem;border-top:1px solid var(--line)}
.cf-faq details{border-bottom:1px solid var(--line)}
.cf-faq summary{cursor:pointer;padding:1.2rem 0;font-weight:600;list-style:none;
display:flex;justify-content:space-between;gap:1rem}
.cf-faq summary::-webkit-details-marker{display:none}
.cf-faq summary::after{content:'+';color:var(--accent);font-size:1.3rem;line-height:1}
.cf-faq details[open] summary::after{content:'–'}
.cf-faq p{padding-bottom:1.3rem;color:var(--soft);line-height:1.75}

/* ── Call-to-action band ─────────────────────────── */
.cf-band{background:var(--accent);color:#fff;text-align:center;padding:5rem 1.6rem}
.cf-band h2{margin:0 auto;color:#fff}
.cf-band p{margin:1rem auto 2rem;max-width:34rem;opacity:.92;line-height:1.7}
.cf-band .cf-btn{background:#fff;color:var(--accent);border-color:#fff}

/* ── Shop ────────────────────────────────────────── */
.cf-shop{display:grid;gap:1.8rem;margin-top:2.6rem}
@media(min-width:760px){.cf-shop{grid-template-columns:repeat(3,1fr)}}
.cf-goods{background:var(--paper);border:1px solid var(--line);border-radius:2px;overflow:hidden;
display:flex;flex-direction:column}
.cf-goods .cf-goods-shot{aspect-ratio:4/3;background:var(--cream) center/cover}
.cf-goods h3{font-size:1.1rem;padding:1.2rem 1.2rem .3rem}
.cf-goods p{padding:0 1.2rem;color:var(--soft);font-size:.9rem;line-height:1.65}
.cf-goods-foot{margin-top:auto;padding:1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}

/* ── Footer ──────────────────────────────────────── */
/* The house sheet makes every footer a flex row; this one is a stack. */
.cf-foot{display:block;border-top:0;background:var(--espresso);color:rgba(244,235,221,.72);
padding:4rem 1.6rem 3rem;text-align:center;font-size:.95rem}
.cf-foot .cf-mark{margin:0 auto 1.4rem;width:52px;height:52px;color:var(--cream);font-size:1rem}
.cf-foot-name{font-family:var(--display);font-size:1.5rem;color:var(--paper);display:block;margin-bottom:.6rem}
.cf-foot-links{display:flex;flex-wrap:wrap;justify-content:center;gap:1.6rem;margin:1.8rem 0;
font-size:.74rem;letter-spacing:.2em;text-transform:uppercase}
.cf-foot-links a:hover{color:var(--paper)}
.cf-fine{font-size:.78rem;opacity:.62;margin-top:1.8rem}
.cf-fine a{border-bottom:1px solid rgba(244,235,221,.3)}
`;

/* ────────────────────────────────────────────────── */

const NAV_LABELS: Record<string, string> = {
  menu: 'Menu',
  pricing: 'Menu',
  services: 'What we do',
  about: 'Our story',
  gallery: 'Gallery',
  hours: 'Hours',
  faq: 'Questions',
  contact: 'Find us',
  shop: 'Shop',
};

const ANCHORED = new Set(Object.keys(NAV_LABELS));

function navFor(site: SiteConfig, sections: SiteSection[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const section of sections) {
    const label = NAV_LABELS[section.type];
    if (!label || seen.has(label)) continue;
    if (section.type === 'contact') {
      const c = site.contact || {};
      if (!c.phone && !c.email && !c.address) continue;
    }
    seen.add(label);
    out.push(`<a href="#${section.type}">${label}</a>`);
  }
  if ((site.team || []).length) out.push('<a href="/team">Team</a>');
  return out.join('');
}

/** Menu groups, however they arrived. A cafe that described its menu as a
 *  price list still gets a menu board rather than a table of rates. */
function groupsOf(section: SiteSection): { heading: string; note: string; items: { name: string; price: string; text: string }[] }[] {
  const groups = (section.menu || [])
    .map((g) => ({
      heading: String(g.heading || ''),
      note: String(g.note || ''),
      items: (g.items || [])
        .map((i) => ({ name: String(i.name || ''), price: String(i.price || ''), text: String(i.text || '') }))
        .filter((i) => i.name),
    }))
    .filter((g) => g.items.length);
  if (groups.length) return groups;

  // rows are [name, price] — what a pricing section carries
  const rows = (section.rows || []).filter((r) => r && r[0]);
  if (rows.length) {
    return [{
      heading: section.title || 'Menu',
      note: '',
      items: rows.map((r) => ({ name: String(r[0]), price: String(r[1] || ''), text: '' })),
    }];
  }
  // items are [name, description] — what a services section carries
  const items = (section.items || []).filter((r) => r && r[0]);
  if (items.length) {
    return [{
      heading: section.title || 'Menu',
      note: '',
      items: items.map((r) => ({ name: String(r[0]), price: '', text: String(r[1] || '') })),
    }];
  }
  return [];
}

function menuSection(section: SiteSection, anchor: string): string {
  const groups = groupsOf(section);
  if (!groups.length) return '';
  const many = groups.length > 1;
  const jump = many
    ? `<div class="cf-menu-jump">${groups
        .map((g, i) => `<a href="#menu-${i}">${esc(g.heading || `Part ${i + 1}`)}</a>`)
        .join('')}</div>`
    : '';
  const board = groups
    .map((g, i) => `<div class="cf-group" id="menu-${i}">
      ${g.heading ? `<h3>${esc(g.heading)}</h3>` : ''}
      ${g.note ? `<p class="cf-note">${esc(g.note)}</p>` : ''}
      ${g.items.map((item) => `<div class="cf-item">
        <strong>${esc(item.name)}</strong>
        ${item.price ? `<span class="cf-price">${esc(item.price)}</span>` : '<span></span>'}
        ${item.text ? `<p>${esc(item.text)}</p>` : ''}
      </div>`).join('')}
    </div>`)
    .join('');

  return `<section class="cf-sec cf-centre"${anchor}><div class="cf-wrap">
    <p class="cf-eyebrow">${esc(section.label || 'The menu')}</p>
    <h2>${esc(section.title || 'What we are serving')}</h2>
    ${section.text ? `<p class="cf-intro">${esc(section.text)}</p>` : ''}
    ${jump}
    <div class="cf-groups${groups.length > 1 ? ' two' : ''}" style="text-align:left">${board}</div>
  </div></section>`;
}

function storySection(section: SiteSection, site: SiteConfig, anchor: string, pool: string[]): string {
  const own = (section.images || []).map(safeUrl).filter(Boolean) as string[];
  const shots = own.length ? own : pool;
  const main = shots[0] || '';
  const inset = shots[1] || '';
  return `<section class="cf-sec"${anchor}><div class="cf-wrap"><div class="cf-story">
    <div class="cf-story-art"${main ? ` style="background-image:url(${esc(main)})"` : ''}>
      ${inset ? `<div class="cf-inset" style="background-image:url(${esc(inset)})"></div>` : ''}
    </div>
    <div>
      <p class="cf-eyebrow">${esc(section.label || 'Our story')}</p>
      <h2>${esc(section.title || `How ${site.name || 'we'} came about`)}</h2>
      <p>${esc(section.text)}</p>
      ${site.name ? `<span class="cf-sign">— the team at ${esc(site.name)}</span>` : ''}
    </div>
  </div></div></section>`;
}

function findSection(section: SiteSection, site: SiteConfig, anchor: string, hours: SiteSection | null): string {
  const c = site.contact || {};
  const rows = (hours?.rows || []).filter((r) => r && r[0]);
  const map = c.address
    ? `<div class="cf-map"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(c.address)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map of ${esc(c.address)}"></iframe></div>`
    : '';
  const where: string[] = [];
  if (c.address) where.push(`<span>${esc(c.address)}</span>`);
  if (c.phone) where.push(`<a href="tel:${esc(String(c.phone).replace(/\s/g, ''))}">${esc(c.phone)}</a>`);
  if (c.email) where.push(`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);

  return `<section class="cf-sec cf-find"${anchor}><div class="cf-wrap"><div class="cf-find-grid">
    <div>
      <p class="cf-eyebrow">${esc(section.label || 'Find us')}</p>
      <h2>${esc(section.title || 'Come and see us')}</h2>
      ${rows.length ? `<div class="cf-rows" data-hours>${rows
        .map((r) => `<div data-day="${esc(r[0])}"><span>${esc(r[0])}</span><span>${esc(r[1] || '')}</span></div>`)
        .join('')}</div>` : ''}
      ${where.length ? `<div class="cf-where">${where.join('')}</div>` : ''}
    </div>
    ${map}
  </div></div></section>`;
}

function cafeSection(section: SiteSection, site: SiteConfig, anchor: string, ctx: { pool: string[]; hours: SiteSection | null }): string {
  switch (section.type) {
    case 'menu':
    case 'pricing':
      return menuSection(section, anchor);

    case 'about':
      return storySection(section, site, anchor, ctx.pool);

    case 'services':
      return `<section class="cf-sec tint cf-centre"${anchor}><div class="cf-wrap">
        <p class="cf-eyebrow">${esc(section.label || 'What we do')}</p>
        <h2>${esc(section.title || 'More than coffee')}</h2>
        <div class="cf-cards" style="text-align:left">${(section.items || [])
          .map((i) => `<div class="cf-card"><h3>${esc(i[0])}</h3><p>${esc(i[1])}</p></div>`)
          .join('')}</div>
      </div></section>`;

    case 'gallery': {
      const shots = (section.images || []).map(safeUrl).filter(Boolean) as string[];
      const cells = shots.length ? shots : ctx.pool;
      if (!cells.length) return '';
      return `<section class="cf-sec cf-centre"${anchor}>
        <div class="cf-wrap"><p class="cf-eyebrow">${esc(section.label || 'The room')}</p>
        <h2>${esc(section.title || 'A look around')}</h2></div>
        <div class="cf-strip" style="margin-top:2.6rem">${cells
          .map((src) => `<div class="cf-shot" style="background-image:url(${esc(src)})"></div>`)
          .join('')}</div>
      </section>`;
    }

    // Hours ride inside the find-us panel. On their own they still get one.
    case 'hours':
      return findSection(section, site, anchor, section);

    case 'contact':
      if (!site.contact?.phone && !site.contact?.email && !site.contact?.address) return '';
      return findSection(section, site, anchor, ctx.hours);

    case 'testimonial':
      return `<section class="cf-sec tint"${anchor}><div class="cf-narrow cf-quote">
        <p>&ldquo;${esc(section.quote)}&rdquo;</p><span>${esc(section.who)}</span>
      </div></section>`;

    case 'faq':
      return `<section class="cf-sec"${anchor}><div class="cf-narrow">
        <p class="cf-eyebrow">${esc(section.label || 'Questions')}</p>
        <h2>${esc(section.title || 'Things people ask')}</h2>
        <div class="cf-faq">${(section.items || [])
          .map((i) => `<details><summary>${esc(i[0])}</summary><p>${esc(i[1])}</p></details>`)
          .join('')}</div>
      </div></section>`;

    case 'shop':
      return `<section class="cf-sec cf-centre"${anchor}><div class="cf-wrap">
        <p class="cf-eyebrow">${esc(section.label || 'Take some home')}</p>
        <h2>${esc(section.title || 'From our shelves')}</h2>
        <div class="cf-shop" style="text-align:left">${(site.products || [])
          .map((product, i) => {
            const picture = safeUrl(product.image);
            return `<div class="cf-goods">
              <div class="cf-goods-shot"${picture ? ` style="background-image:url(${esc(picture)})"` : ''}></div>
              <h3>${esc(product.name || '')}</h3>
              ${product.text ? `<p>${esc(product.text)}</p>` : ''}
              <div class="cf-goods-foot">
                <span class="cf-price">${esc(product.price || '')}</span>
                <button type="button" class="buy-add cf-btn" data-i="${i}"
                  data-name="${esc(product.name || '')}" data-price="${esc(product.price || '')}">Add</button>
              </div>
            </div>`;
          })
          .join('')}</div>
      </div></section>`;

    case 'band':
      return `<section class="cf-band"${section.tint ? ` style="background:${esc(section.tint)}"` : ''}>
        <h2>${esc(section.title)}</h2><p>${esc(section.text)}</p>
        <a class="cf-btn" href="#contact">${esc(site.cta || 'Book a table')}</a>
      </section>`;

    default:
      return '';
  }
}

/** Short phrases for the scrolling ribbon, taken from what the site already says. */
function ribbonWords(site: SiteConfig): string[] {
  const words: string[] = [];
  for (const section of site.sections || []) {
    if (section.type === 'menu') {
      for (const group of section.menu || []) if (group.heading) words.push(group.heading);
    }
  }
  if (site.eyebrow) words.push(site.eyebrow);
  const seen = new Set<string>();
  const out = words
    .map((w) => w.trim())
    .filter((w) => w && w.length < 28 && !seen.has(w.toLowerCase()) && seen.add(w.toLowerCase()));
  return out.length >= 3 ? out.slice(0, 7) : [];
}

export function renderCafeBody(site: SiteConfig, slug: string): string {
  const name = site.name || slug;
  const logo = safeUrl(site.logo);
  const hero = safeUrl(site.heroImage);
  const contact = site.contact || {};
  const sections = site.sections || [];

  // Photos to fall back on when a section brought none of its own
  const pool = [
    ...(site.images || []),
    ...sections.flatMap((s) => s.images || []),
  ].map(safeUrl).filter(Boolean) as string[];

  const hours = sections.find((s) => s.type === 'hours') || null;
  // Find-us already carries the hours table. Two espresso panels one after the
  // other is the same information twice and a hole in the middle of the page.
  const absorbsHours = sections.some(
    (s) => s.type === 'contact' && (contact.phone || contact.email || contact.address)
  );
  const visible = absorbsHours ? sections.filter((s) => s.type !== 'hours') : sections;
  const hasMenu = sections.some((s) => s.type === 'menu' || s.type === 'pricing');
  const plain = (v: string) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const heroLogo = !!logo && plain(site.headline || name) === plain(name);

  const used = new Set<string>();
  const body = visible
    .map((section) => {
      const wanted = ANCHORED.has(section.type) ? section.type : '';
      const anchor = wanted && !used.has(wanted) ? ` id="${wanted}"` : '';
      if (anchor) used.add(wanted);
      return cafeSection(section, site, anchor, { pool, hours });
    })
    .join('');

  const words = ribbonWords(site);
  const ribbon = words.length
    ? `<div class="cf-ribbon"><div class="cf-ribbon-track">${[0, 1]
        .map(() => words.map((w) => `<span>${esc(w)}</span>`).join(''))
        .join('')}</div></div>`
    : '';

  const heroFoot: string[] = [];
  if (hours) heroFoot.push('<span class="cf-open" data-open hidden><i></i><b></b></span>');
  if (contact.address) heroFoot.push(`<span>${esc(contact.address)}</span>`);
  if (contact.phone) heroFoot.push(`<a href="tel:${esc(String(contact.phone).replace(/\s/g, ''))}">${esc(contact.phone)}</a>`);

  const nav = navFor(site, visible);
  const cta = site.cta || 'Book a table';

  return `
<nav class="cf-nav" id="cf-nav">
  <a class="cf-brand" href="#top">${logo
    ? `<img src="${esc(logo)}" alt="${esc(name)}" />`
    : `<span class="cf-mark">${esc(initials(name))}</span><span>${esc(name)}</span>`}</a>
  <div class="cf-links">${nav}</div>
  <a class="cf-book" href="#contact">${esc(cta)}</a>
</nav>

<header class="cf-hero${hero ? '' : ' plain'}" id="top">
  ${hero ? `<div class="cf-hero-photo" style="background-image:url(${esc(hero)})"></div>` : ''}
  <div class="cf-hero-inner">
    ${site.eyebrow ? `<p class="cf-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    ${heroLogo
      ? `<h1 class="cf-hero-logo"><img src="${esc(logo)}" alt="${esc(name)}" /></h1>`
      : `<h1>${esc(site.headline || name)}</h1>`}
    ${site.lede ? `<p class="cf-lede">${esc(site.lede)}</p>` : ''}
    <div class="cf-hero-acts">
      ${hasMenu ? '<a class="cf-btn" href="#menu">See the menu</a>' : ''}
      <a class="cf-btn${hasMenu ? ' ghost' : ''}" href="#contact">${esc(cta)}</a>
    </div>
    ${heroFoot.length ? `<div class="cf-hero-foot">${heroFoot.join('')}</div>` : ''}
  </div>
</header>
${ribbon}
${body}
<footer class="cf-foot">
  ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" style="height:64px;width:auto;margin:0 auto 1.2rem;display:block" />`
    : `<span class="cf-mark">${esc(initials(name))}</span>`}
  <span class="cf-foot-name">${esc(name)}</span>
  ${contact.address ? `<span>${esc(contact.address)}</span>` : ''}
  ${nav ? `<div class="cf-foot-links">${nav}</div>` : ''}
  <p class="cf-fine">&copy; ${new Date().getFullYear()} ${esc(name)} &middot; Built with <a href="https://garage.co.nz/ai">garage.co.nz</a></p>
</footer>
<script>(function(){
var nav=document.getElementById('cf-nav');
if(nav){var onScroll=function(){nav.classList.toggle('stuck',window.scrollY>window.innerHeight*0.72);};
window.addEventListener('scroll',onScroll,{passive:true});onScroll();}

// "Open now" is the first thing anyone wants from a cafe, so it is worked out
// in the visitor's own timezone from the hours already on the page rather than
// baked into a cached response.
var DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
var SHORT=['sun','mon','tue','wed','thu','fri','sat'];
function dayIndex(word){
  word=word.toLowerCase().replace(/[^a-z]/g,'');
  for(var i=0;i<7;i++){if(word===DAYS[i]||word===SHORT[i]||word===SHORT[i]+'s')return i;}
  if(word.length>=3){for(var j=0;j<7;j++){if(DAYS[j].indexOf(word)===0)return j;}}
  return -1;
}
function daysCovered(label){
  var out={},parts=String(label).toLowerCase().split(/,|&|\\band\\b/);
  parts.forEach(function(part){
    var range=part.split(/[-–—]|\\bto\\b/);
    if(range.length===2){
      var a=dayIndex(range[0]),b=dayIndex(range[1]);
      if(a>=0&&b>=0){for(var k=0;k<7;k++){var d=(a+k)%7;out[d]=1;if(d===b)break;}return;}
    }
    var one=dayIndex(part);
    if(one>=0)out[one]=1;
    if(/every ?day|daily|7 days|all week/.test(part)){for(var m=0;m<7;m++)out[m]=1;}
  });
  return out;
}
function minutes(text){
  var m=String(text).match(/(\\d{1,2})(?:[:.](\\d{2}))?\\s*(am|pm)?/i);
  if(!m)return null;
  var h=parseInt(m[1],10),min=m[2]?parseInt(m[2],10):0,ap=(m[3]||'').toLowerCase();
  if(ap==='pm'&&h<12)h+=12;
  if(ap==='am'&&h===12)h=0;
  return h*60+min;
}
var now=new Date(),today=now.getDay(),mins=now.getHours()*60+now.getMinutes();
var todayRow=null;
document.querySelectorAll('[data-hours] [data-day]').forEach(function(row){
  var covered=daysCovered(row.getAttribute('data-day'));
  if(covered[today]){row.classList.add('today');if(!todayRow)todayRow=row;}
});
var badge=document.querySelector('[data-open]');
if(badge&&todayRow){
  var value=todayRow.children[1]?todayRow.children[1].textContent.trim():'';
  var shut=/closed/i.test(value);
  var span=value.split(/[-–—]|\\bto\\b/);
  var open=null,close=null;
  if(!shut&&span.length===2){open=minutes(span[0]);close=minutes(span[1]);}
  var label;
  if(shut){label='Closed today';}
  else if(open!==null&&close!==null){
    // A close time earlier than the open time means it runs past midnight
    if(close<=open)close+=24*60;
    label=(mins>=open&&mins<close)?'Open now until '+span[1].trim():'Closed now · today '+value;
    badge.classList.toggle('shut',!(mins>=open&&mins<close));
  } else {label='Today '+value;}
  if(shut)badge.classList.add('shut');
  badge.querySelector('b').textContent=label;
  badge.hidden=false;
}
})();</script>`;
}
