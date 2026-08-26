// LISTING TEMPLATE (style: "listing")
// One thing for sale, sold privately. A house or a car — the shape is the same:
// photographs, a price, the numbers a buyer checks first, and an honest account
// of what is wrong with it.
//
// That last part is the spine of this template. A private sale lives or dies on
// whether the buyer believes you, and the fastest way to be believed is to say
// the bad bit yourself before they find it. So there is a section for known
// faults sitting between the description and the contact details, in the same
// type as everything else — not buried, not apologised for.
//
// New Zealand specifics the generic templates cannot carry:
//   Cars   — WOF and rego expiry are the first things a buyer looks at, and a
//            car with no current WOF must be advertised "as is, where is".
//            Buyers can insist on a WOF less than a month old.
//   Houses — RV is a rating figure and not a market valuation, title can be
//            freehold or cross-lease (which restricts what you can do), and
//            chattels only transfer if they are named in the agreement.
//
// Photos are the product, so they get the room.

import type { SiteConfig, SiteSection } from './site-render';

export const LISTING_FONT_QUERY = '&family=Space+Grotesk:wght@400;500;700';

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

const tel = (phone: string) => String(phone).replace(/[^0-9+]/g, '');

export const LISTING_CSS = `
.ls{--paper:#ffffff;--wash:#f4f5f7;--ink:#14161a;--soft:#697184;--line:#e4e7ec;
--accent:var(--primary);
--display:'Space Grotesk',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.ls{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.65}
html:has(body.ls),body.ls{overflow-x:clip}
.ls h1,.ls h2,.ls .ls-price,.ls .ls-spec b{font-family:var(--display);font-weight:700;
letter-spacing:-.02em;text-align:left;margin-bottom:0;font-variant-numeric:tabular-nums}
.ls ::selection{background:var(--accent);color:#fff}
.ls-wrap{max-width:70rem;margin:0 auto;padding:0 1.4rem}
.ls-narrow{max-width:46rem;margin:0 auto;padding:0 1.4rem}
.ls-eyebrow{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--soft);
font-weight:600;margin-bottom:.8rem}

/* ── Nav ─────────────────────────────────────────── */
.ls-nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;
gap:1rem;padding:.8rem 1.4rem;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);
border-bottom:1px solid transparent;transition:border-color .25s ease}
.ls-nav.stuck{border-bottom-color:var(--line)}
.ls-nav .ls-who{font-family:var(--display);font-weight:700;font-size:1rem;letter-spacing:-.01em}
.ls-nav .ls-mini{display:none;font-size:.85rem;color:var(--soft)}
.ls-nav.stuck .ls-mini{display:block}
.ls-cta{background:var(--accent);color:#fff;border-radius:8px;padding:.6rem 1.15rem;
font-size:.88rem;font-weight:600;white-space:nowrap}
.ls-cta:hover{filter:brightness(1.08)}

/* ── Hero photo ──────────────────────────────────── */
.ls-hero{aspect-ratio:16/9;background:var(--wash) center/cover;position:relative}
@media(max-width:700px){.ls-hero{aspect-ratio:4/3}}
.ls-hero-count{position:absolute;right:1rem;bottom:1rem;background:rgba(15,18,22,.72);
color:#fff;font-size:.8rem;padding:.4rem .8rem;border-radius:999px;backdrop-filter:blur(4px)}

/* ── The headline block: price first ─────────────── */
.ls-top{padding:2.6rem 0 2rem;display:grid;gap:1.6rem}
@media(min-width:860px){.ls-top{grid-template-columns:1fr auto;align-items:end;gap:3rem}}
.ls-price{font-size:clamp(2.4rem,6vw,3.6rem);line-height:1;color:var(--accent)}
.ls-title{font-family:var(--display);font-weight:500;font-size:clamp(1.2rem,2.6vw,1.6rem);
letter-spacing:-.01em;margin-top:.7rem}
.ls-where{color:var(--soft);margin-top:.35rem;font-size:.98rem}
.ls-buy{display:flex;flex-wrap:wrap;gap:.6rem}
.ls-btn{display:inline-flex;align-items:center;justify-content:center;background:var(--accent);
color:#fff;border-radius:10px;padding:.95rem 1.7rem;font-weight:600;font-size:.98rem;
border:1px solid var(--accent);white-space:nowrap}
.ls-btn:hover{filter:brightness(1.08)}
.ls-btn.ghost{background:#fff;color:var(--ink);border-color:var(--line)}
.ls-btn.ghost:hover{border-color:var(--accent);color:var(--accent);filter:none}

/* ── Spec strip: what a buyer checks first ───────── */
/* The rules are drawn per cell rather than by a coloured background showing
   through the gaps — otherwise a last row that does not fill leaves a grey
   block where the missing cells would be. */
.ls-specs{display:grid;gap:1px;background:var(--paper);border-top:1px solid var(--line);
border-bottom:1px solid var(--line);
grid-template-columns:repeat(auto-fit,minmax(min(50%,11rem),1fr))}
.ls-spec{background:var(--paper);padding:1.3rem 1.2rem;box-shadow:0 0 0 1px var(--line)}
.ls-spec span{display:block;font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;
color:var(--soft);font-weight:600;margin-bottom:.35rem}
.ls-spec b{display:block;font-size:1.28rem;line-height:1.2;font-weight:700}
/* Something out of date is worth seeing, not hiding */
.ls-spec.flag b{color:#b4443a}

.ls-sec{padding:3.4rem 0}
.ls-sec.tint{background:var(--wash)}
.ls-sec h2{font-size:clamp(1.4rem,3vw,1.9rem)}
.ls-body{margin-top:1.1rem;color:#39404d;line-height:1.85;white-space:pre-line}

/* ── Gallery ─────────────────────────────────────── */
.ls-grid{display:grid;gap:.5rem;margin-top:1.6rem;
grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))}
.ls-shot{aspect-ratio:4/3;background:var(--wash) center/cover;border-radius:8px;cursor:zoom-in;
border:0;padding:0;display:block;width:100%}
.ls-shot:hover{filter:brightness(1.04)}

/* ── Lists: included, and the honest bit ─────────── */
.ls-list{margin-top:1.4rem;border-top:1px solid var(--line)}
.ls-list div{display:grid;grid-template-columns:auto 1fr;gap:.85rem;align-items:start;
padding:.9rem 0;border-bottom:1px solid var(--line)}
.ls-list i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;
font-style:normal;font-size:.68rem;font-weight:700;margin-top:.25rem;flex:none;
background:color-mix(in srgb,var(--accent) 14%,#fff);color:var(--accent)}
.ls-list strong{font-weight:600}
.ls-list p{color:var(--soft);font-size:.93rem;margin-top:.1rem}
.ls-honest .ls-list i{background:#fdeeec;color:#b4443a}
.ls-honest{border-left:3px solid #e7c3bd;padding-left:1.4rem}
@media(max-width:600px){.ls-honest{padding-left:1rem}}

/* ── Seller ──────────────────────────────────────── */
.ls-seller{display:grid;gap:2.2rem;margin-top:1.6rem}
@media(min-width:880px){.ls-seller{grid-template-columns:1fr 1fr;gap:3rem}}
.ls-lines{display:grid;gap:.55rem;font-size:1rem;margin-top:1.2rem}
.ls-lines a{color:var(--accent);font-weight:500}
.ls-map{position:relative;min-height:20rem;border-radius:12px;overflow:hidden;background:var(--wash)}
.ls-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.ls-fine{margin-top:1.6rem;font-size:.86rem;color:var(--soft);line-height:1.7}

.ls-foot{display:block;border-top:1px solid var(--line);padding:2.4rem 1.4rem 6rem;
text-align:center;color:var(--soft);font-size:.85rem}
.ls-foot a{color:var(--accent)}
@media(min-width:761px){.ls-foot{padding-bottom:2.4rem}}

/* ── Contact bar, phone only ─────────────────────── */
.ls-bar{position:fixed;left:0;right:0;bottom:0;z-index:70;display:none;
grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border-top:1px solid var(--line)}
.ls-bar a{display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.95rem;
background:#fff;font-weight:600;font-size:.95rem}
.ls-bar a.main{background:var(--accent);color:#fff}
@media(max-width:760px){.ls-bar{display:grid}}

/* ── Lightbox ────────────────────────────────────── */
.ls-box{position:fixed;inset:0;z-index:90;display:none;place-items:center;padding:3vw;
background:rgba(12,14,18,.93);cursor:zoom-out}
.ls-box.on{display:grid}
.ls-box img{max-width:94vw;max-height:88vh;object-fit:contain;border-radius:6px}
.ls-box button{position:absolute;background:none;border:0;color:#fff;cursor:pointer;opacity:.6}
.ls-box button:hover{opacity:1}
.ls-box .x{top:1rem;right:1.2rem;font-size:2rem;line-height:1}
.ls-box .prev,.ls-box .next{top:50%;transform:translateY(-50%);font-size:2.6rem;padding:1rem}
.ls-box .prev{left:.3rem}.ls-box .next{right:.3rem}
`;

const NAV_LABELS: Record<string, string> = {
  specs: 'Details',
  gallery: 'Photos',
  about: 'About it',
  included: "What's included",
  honest: 'Known faults',
  faq: 'Questions',
  contact: 'Contact',
};

const ANCHORED = new Set(Object.keys(NAV_LABELS));

function pairs(section: SiteSection): [string, string][] {
  return (section.items || []).filter((i) => i && i[0]) as [string, string][];
}

/** Something a buyer would want flagged rather than glossed: an expired WOF or
 *  rego reads as a warning, not a neutral fact. */
function isFlag(label: string, value: string): boolean {
  const v = `${label} ${value}`.toLowerCase();
  return /expired|overdue|none|no wof|as is|not current|due/.test(v);
}

function listSection(section: SiteSection, anchor: string, kind: 'included' | 'honest'): string {
  const items = pairs(section);
  if (!items.length) return '';
  const heads = kind === 'included'
    ? ["What's included", 'Comes with it']
    : ['Known faults', 'What is wrong with it'];
  return `<section class="ls-sec${kind === 'included' ? ' tint' : ''}"${anchor}><div class="ls-narrow">
    <p class="ls-eyebrow">${esc(section.label || heads[0])}</p>
    <h2>${esc(section.title || heads[1])}</h2>
    ${section.text ? `<p class="ls-body">${esc(section.text)}</p>` : ''}
    <div class="${kind === 'honest' ? 'ls-honest' : ''}"><div class="ls-list">${items
      .map((i) => `<div><i>${kind === 'honest' ? '!' : '&#10003;'}</i><div>
        <strong>${esc(i[0])}</strong>${i[1] ? `<p>${esc(i[1])}</p>` : ''}
      </div></div>`)
      .join('')}</div></div>
  </div></section>`;
}

function listingSection(section: SiteSection, site: SiteConfig, anchor: string, pool: string[]): string {
  switch (section.type) {
    case 'included':
      return listSection(section, anchor, 'included');
    case 'honest':
      return listSection(section, anchor, 'honest');

    case 'about':
      return `<section class="ls-sec"${anchor}><div class="ls-narrow">
        <p class="ls-eyebrow">${esc(section.label || 'About it')}</p>
        <h2>${esc(section.title || 'The story')}</h2>
        <p class="ls-body">${esc(section.text)}</p>
      </div></section>`;

    case 'gallery': {
      const shots = ((section.images || []).map(safeUrl).filter(Boolean) as string[]);
      const cells = shots.length ? shots : pool;
      if (!cells.length) return '';
      return `<section class="ls-sec"${anchor}><div class="ls-wrap">
        <p class="ls-eyebrow">${esc(section.label || 'Photos')}</p>
        <h2>${esc(section.title || 'Have a proper look')}</h2>
        <div class="ls-grid">${cells
          .map((src) => `<button type="button" class="ls-shot" data-full="${esc(src)}"
            style="background-image:url(${esc(src)})" aria-label="Open photo"></button>`)
          .join('')}</div>
      </div></section>`;
    }

    case 'faq':
      return `<section class="ls-sec tint"${anchor}><div class="ls-narrow">
        <p class="ls-eyebrow">${esc(section.label || 'Questions')}</p>
        <h2>${esc(section.title || 'Asked and answered')}</h2>
        <div class="ls-list">${(section.items || [])
          .map((i) => `<div><i>?</i><div><strong>${esc(i[0])}</strong><p>${esc(i[1])}</p></div></div>`)
          .join('')}</div>
      </div></section>`;

    case 'contact': {
      const c = site.contact || {};
      if (!c.phone && !c.email && !c.address) return '';
      const map = c.address
        ? `<div class="ls-map"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(c.address)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe></div>`
        : '';
      const lines: string[] = [];
      if (c.phone) lines.push(`<a href="tel:${esc(tel(c.phone))}">${esc(c.phone)}</a>`);
      if (c.email) lines.push(`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
      if (c.address) lines.push(`<span>${esc(c.address)}</span>`);
      return `<section class="ls-sec"${anchor}><div class="ls-wrap">
        <p class="ls-eyebrow">${esc(section.label || 'Contact')}</p>
        <h2>${esc(section.title || 'Come and see it')}</h2>
        <div class="ls-seller">
          <div>
            <div class="ls-lines">${lines.join('')}</div>
            ${section.text ? `<p class="ls-fine">${esc(section.text)}</p>` : ''}
          </div>
          ${map}
        </div>
      </div></section>`;
    }

    default:
      return '';
  }
}

export function renderListingBody(site: SiteConfig, slug: string): string {
  const title = site.headline || site.name || slug;
  const price = site.eyebrow || '';
  const contact = site.contact || {};
  const sections = site.sections || [];

  const pool = [...(site.images || []), ...sections.flatMap((s) => s.images || [])]
    .map(safeUrl).filter(Boolean) as string[];
  const hero = safeUrl(site.heroImage) || pool[0] || '';
  const shotCount = pool.length + (safeUrl(site.heroImage) ? 1 : 0);

  const specSec = sections.find((s) => s.type === 'specs');
  const specStrip = specSec && pairs(specSec).length
    ? `<div class="ls-specs" id="specs">${pairs(specSec)
        .slice(0, 8)
        .map((i) => `<div class="ls-spec${isFlag(i[0], i[1]) ? ' flag' : ''}">
          <span>${esc(i[0])}</span><b>${esc(i[1])}</b>
        </div>`)
        .join('')}</div>`
    : '';

  const used = new Set<string>();
  const body = sections
    .filter((s) => s.type !== 'specs')
    .map((section) => {
      const wanted = ANCHORED.has(section.type) ? section.type : '';
      const anchor = wanted && !used.has(wanted) ? ` id="${wanted}"` : '';
      if (anchor) used.add(wanted);
      return listingSection(section, site, anchor, pool);
    })
    .join('');

  const cta = site.cta || 'Enquire';

  return `
<nav class="ls-nav" id="ls-nav">
  <div>
    <div class="ls-who">${esc(site.name || title)}</div>
    <div class="ls-mini">${esc(price)}</div>
  </div>
  <a class="ls-cta" href="#contact">${esc(cta)}</a>
</nav>

<header class="ls-hero"${hero ? ` style="background-image:url(${esc(hero)})"` : ''} id="top">
  ${shotCount > 1 ? `<span class="ls-hero-count">${shotCount} photos</span>` : ''}
</header>

<div class="ls-wrap"><div class="ls-top">
  <div>
    ${price ? `<div class="ls-price">${esc(price)}</div>` : ''}
    <h1 class="ls-title">${esc(title)}</h1>
    ${contact.address ? `<p class="ls-where">${esc(contact.address)}</p>` : ''}
    ${site.lede ? `<p class="ls-where">${esc(site.lede)}</p>` : ''}
  </div>
  <div class="ls-buy">
    ${contact.phone
      ? `<a class="ls-btn" href="tel:${esc(tel(contact.phone))}">${esc(contact.phone)}</a>`
      : `<a class="ls-btn" href="#contact">${esc(cta)}</a>`}
    <a class="ls-btn ghost" href="#contact">${esc(cta)}</a>
  </div>
</div></div>
${specStrip}
${body}
<footer class="ls-foot">
  <span>${esc(title)}</span> &middot; <a href="https://garage.co.nz/ai">Listed with garage.co.nz</a>
</footer>
${contact.phone ? `<div class="ls-bar">
  <a class="main" href="tel:${esc(tel(contact.phone))}">Call ${esc(contact.phone)}</a>
  <a href="#contact">${esc(cta)}</a>
</div>` : ''}

<div class="ls-box" id="ls-box" aria-hidden="true">
  <button class="x" type="button" aria-label="Close">&times;</button>
  <button class="prev" type="button" aria-label="Previous">&#8249;</button>
  <img alt="" />
  <button class="next" type="button" aria-label="Next">&#8250;</button>
</div>

<script>(function(){
var nav=document.getElementById('ls-nav');
if(nav){var s=function(){nav.classList.toggle('stuck',window.scrollY>window.innerHeight*0.5);};
window.addEventListener('scroll',s,{passive:true});s();}

var shots=[].slice.call(document.querySelectorAll('.ls-shot'));
var box=document.getElementById('ls-box'),img=box.querySelector('img'),at=0;
function show(i){if(!shots.length)return;at=(i+shots.length)%shots.length;
img.src=shots[at].getAttribute('data-full');box.classList.add('on');
box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function hide(){box.classList.remove('on');box.setAttribute('aria-hidden','true');
document.body.style.overflow='';img.src='';}
shots.forEach(function(el,i){el.addEventListener('click',function(){show(i);});});
box.addEventListener('click',function(e){if(e.target===box||e.target===img)hide();});
box.querySelector('.x').addEventListener('click',hide);
box.querySelector('.prev').addEventListener('click',function(e){e.stopPropagation();show(at-1);});
box.querySelector('.next').addEventListener('click',function(e){e.stopPropagation();show(at+1);});
document.addEventListener('keydown',function(e){
if(!box.classList.contains('on'))return;
if(e.key==='Escape')hide();if(e.key==='ArrowLeft')show(at-1);if(e.key==='ArrowRight')show(at+1);});
})();</script>`;
}
