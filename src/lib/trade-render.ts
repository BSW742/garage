// TRADE TEMPLATE (style: "trade")
// The fourth skeleton, and the bluntest. A cafe page is browsed and a clinic
// page is read; this one is used, once, at speed, by someone standing in a
// flooded laundry holding a phone. Four out of five arrive on mobile.
//
// So the whole template is built around one job: make the phone ring. The
// number is in the nav, in the hero, in a bar pinned to the bottom of every
// phone screen, and in the footer. Everything else answers the only three
// questions that get asked — do you do this, are you any good, do you come
// out my way — and it answers them above the fold.
//
// Dark, dense and grounded, which is the opposite of the clinic template on
// purpose. Barlow Condensed reads like signwriting on the side of a van.
//
// The New Zealand part is the licence block. LBP, EWRB and PGDB are government
// registrations with numbers the public can check. Master Builders and Master
// Plumbers are trade associations, not licences — worth keeping straight,
// because claiming a licence you do not hold is a different thing entirely.

import type { SiteConfig, SiteSection } from './site-render';

export const TRADE_FONT_QUERY = '&family=Barlow+Condensed:wght@500;600;700';

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

const tel = (phone: string) => String(phone).replace(/[^0-9+]/g, '');

export const TRADE_CSS = `
.td{--ink:#12141600;--night:#141719;--steel:#1e2225;--paper:#f4f5f3;--line:#2b3034;
--soft:#a2aaad;--accent:var(--primary);
--display:'Barlow Condensed',Oswald,Impact,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.td{background:var(--night);color:#eef1f2;font-family:var(--body);line-height:1.6}
html:has(body.td),body.td{overflow-x:clip}
.td h1,.td h2,.td h3.td-display,.td .td-num{font-family:var(--display);font-weight:700;
text-transform:uppercase;letter-spacing:-.005em;line-height:.98;text-align:left;margin-bottom:0}
.td ::selection{background:var(--accent);color:#fff}
.td-wrap{max-width:74rem;margin:0 auto;padding:0 1.5rem}
.td-narrow{max-width:46rem;margin:0 auto;padding:0 1.5rem}
.td-centre{text-align:center}
.td-centre h2{text-align:center}

.td-eyebrow{font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);
font-weight:700;margin-bottom:.9rem}

/* ── Nav — the number is furniture, not a link ───── */
.td-nav{position:sticky;top:0;z-index:70;display:flex;align-items:center;justify-content:space-between;
gap:1rem;padding:.85rem 1.5rem;background:rgba(20,23,25,.92);backdrop-filter:blur(10px);
border-bottom:1px solid var(--line)}
.td-brand{display:flex;align-items:center;gap:.6rem;font-family:var(--display);font-weight:700;
font-size:1.3rem;text-transform:uppercase;letter-spacing:.01em}
.td-brand img{height:44px;width:auto;max-width:200px;object-fit:contain}
.td-mark{display:grid;place-items:center;width:38px;height:38px;background:var(--accent);
color:#fff;font-family:var(--body);font-weight:700;font-size:.8rem;flex:none}
.td-links{display:flex;gap:1.6rem;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;
font-weight:600;color:var(--soft)}
.td-links a:hover{color:#fff}
.td-call{display:inline-flex;align-items:center;gap:.5rem;background:var(--accent);color:#fff;
padding:.7rem 1.3rem;font-family:var(--display);font-size:1.25rem;font-weight:700;
letter-spacing:.01em;white-space:nowrap;transition:filter .2s ease}
.td-call:hover{filter:brightness(1.1)}
.td-call::before{content:'✆';font-size:1rem}
/* No phone number yet: the quote button takes its place rather than the
   whole call-to-action disappearing and leaving a hole where the point of
   the template used to be. */
.td-call.noph{font-family:var(--body);font-size:.92rem;font-weight:600}
.td-call.noph::before{content:none}
@media(max-width:980px){.td-links{display:none}}
@media(max-width:600px){.td-nav .td-call{display:none}.td-nav{padding:.75rem 1.1rem}}

/* ── Hero ────────────────────────────────────────── */
.td-hero{position:relative;padding:5rem 0 4.5rem;overflow:hidden;background:var(--steel)}
.td-hero-photo{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.78}
.td-hero::after{content:'';position:absolute;inset:0;
background:linear-gradient(100deg,rgba(20,23,25,.94) 8%,rgba(20,23,25,.62) 52%,rgba(20,23,25,.35) 100%)}
.td-hero-inner{position:relative;z-index:2}
@media(min-width:900px){.td-hero{padding:7rem 0 6rem}}
.td-hero h1{font-size:clamp(2.8rem,7.5vw,6rem);max-width:16ch}
.td-hero h1 em{font-style:normal;color:var(--accent)}
.td-lede{margin-top:1.3rem;font-size:1.08rem;color:#cfd6d8;max-width:36rem;line-height:1.7}
.td-acts{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:2.2rem;align-items:stretch}
/* The big one. On a phone this is what the whole page is for. */
.td-bigcall{display:inline-flex;flex-direction:column;background:var(--accent);color:#fff;
padding:.9rem 2rem;min-width:16rem;transition:filter .2s ease}
.td-bigcall:hover{filter:brightness(1.1)}
.td-bigcall small{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;opacity:.85;font-weight:600}
.td-bigcall b{font-family:var(--display);font-size:2rem;font-weight:700;line-height:1.05;letter-spacing:.01em}
.td-btn{display:inline-flex;align-items:center;justify-content:center;border:2px solid #4a5257;
color:#fff;padding:1rem 1.8rem;font-weight:600;font-size:.95rem;transition:border-color .2s ease}
.td-btn:hover{border-color:var(--accent)}
.td-badges{display:flex;flex-wrap:wrap;gap:.5rem .7rem;margin-top:2.3rem}
.td-badges span{font-size:.76rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;
color:#cfd6d8;border:1px solid var(--line);padding:.45rem .9rem}
.td-badges span b{color:var(--accent);font-weight:700}

.td-sec{padding:5rem 0}
.td-sec.pale{background:var(--paper);color:#171a1c}
.td-sec.pale .td-eyebrow{color:color-mix(in srgb,var(--accent) 82%,#000)}
.td-sec h2{font-size:clamp(2rem,4.6vw,3.2rem);max-width:20ch}
.td-intro{margin-top:1rem;color:var(--soft);max-width:38rem;line-height:1.75}
.td-sec.pale .td-intro{color:#4d565a}
.td-centre .td-intro{margin-left:auto;margin-right:auto}

/* ── Services ────────────────────────────────────── */
.td-grid{display:grid;gap:1px;margin-top:2.8rem;background:var(--line);border:1px solid var(--line)}
@media(min-width:720px){.td-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1020px){.td-grid{grid-template-columns:repeat(3,1fr)}}
.td-card{background:var(--night);padding:2rem 1.7rem;transition:background .2s ease}
.td-card:hover{background:var(--steel)}
.td-sec.pale .td-grid{background:#d8dcd8;border-color:#d8dcd8}
.td-sec.pale .td-card{background:var(--paper)}
.td-sec.pale .td-card:hover{background:#eaece8}
.td-card h3{font-family:var(--display);font-size:1.35rem;font-weight:600;text-transform:uppercase;
margin-bottom:.5rem;letter-spacing:.01em}
.td-card p{font-size:.93rem;color:var(--soft);line-height:1.7}
.td-sec.pale .td-card p{color:#4d565a}
.td-card-n{font-family:var(--display);font-size:.9rem;color:var(--accent);font-weight:700;
display:block;margin-bottom:.8rem;letter-spacing:.12em}

/* ── Area — "do you come out my way" ─────────────── */
.td-area{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:2.4rem}
.td-area span{border:1px solid var(--line);padding:.6rem 1.15rem;font-size:.92rem;font-weight:500}
.td-sec.pale .td-area span{border-color:#d0d5d0}
.td-area span b{color:var(--accent);font-weight:600}

/* ── Recent jobs — the trust engine ──────────────── */
/* Equal tiles that reflow, rather than a feature tile that strands the last
   photo whenever the count does not divide neatly. A tradie has however many
   job photos they have. */
.td-jobs{display:grid;gap:2px;margin-top:2.8rem;
grid-template-columns:repeat(auto-fill,minmax(min(100%,15rem),1fr))}
.td-job{aspect-ratio:4/3;background:var(--steel) center/cover;position:relative;overflow:hidden}
.td-job::after{content:'';position:absolute;inset:0;background:var(--accent);opacity:0;transition:opacity .25s ease}
.td-job:hover::after{opacity:.14}

/* ── Licences — numbers people can actually check ── */
.td-lic{display:grid;gap:1px;margin-top:2.8rem;background:var(--line);border:1px solid var(--line)}
@media(min-width:760px){.td-lic{grid-template-columns:repeat(2,1fr)}}
.td-lic-item{background:var(--night);padding:1.6rem 1.5rem;display:grid;
grid-template-columns:auto 1fr;gap:1rem;align-items:start}
.td-lic-item i{width:34px;height:34px;background:var(--accent);color:#fff;display:grid;
place-items:center;font-style:normal;font-weight:700;font-size:.85rem;flex:none}
.td-lic-item strong{display:block;font-family:var(--display);font-size:1.2rem;font-weight:600;
text-transform:uppercase;letter-spacing:.01em}
.td-lic-item span{display:block;color:var(--soft);font-size:.9rem;line-height:1.65;margin-top:.2rem}

/* ── Quote band ──────────────────────────────────── */
.td-band{background:var(--accent);color:#fff;padding:4.5rem 1.5rem;text-align:center}
.td-band h2{margin:0 auto;color:#fff;text-align:center}
.td-band p{margin:1rem auto 2rem;max-width:34rem;opacity:.94;line-height:1.7}
.td-band .td-bigcall{background:#fff;color:var(--accent)}
.td-band .td-btn{border-color:rgba(255,255,255,.6)}
.td-band .td-acts{justify-content:center}

/* ── Quote / testimonial ─────────────────────────── */
.td-quote{text-align:center}
.td-quote p{font-family:var(--display);font-size:clamp(1.7rem,4vw,2.8rem);line-height:1.15;
text-transform:uppercase;max-width:20ch;margin:0 auto;font-weight:600}
.td-quote span{display:block;margin-top:1.5rem;font-size:.78rem;letter-spacing:.2em;
text-transform:uppercase;color:var(--soft)}

/* ── Find us ─────────────────────────────────────── */
.td-find{display:grid;gap:2.6rem;margin-top:2.8rem}
@media(min-width:900px){.td-find{grid-template-columns:1fr 1fr;gap:3.5rem}}
.td-rows{border-top:1px solid var(--line)}
.td-rows div{display:flex;justify-content:space-between;gap:1.5rem;padding:.9rem 0;
border-bottom:1px solid var(--line);font-size:.95rem}
.td-rows div.today{color:#fff;font-weight:600}
.td-rows div.today span:last-child{color:var(--accent)}
.td-where{display:grid;gap:.6rem;margin-top:1.7rem;font-size:.96rem}
.td-where a{color:var(--accent)}
.td-map{position:relative;min-height:23rem;background:var(--steel)}
.td-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0;
filter:grayscale(1) invert(.9) hue-rotate(180deg) contrast(.85)}

/* ── FAQ ─────────────────────────────────────────── */
.td-faq{margin-top:2.4rem;border-top:1px solid var(--line)}
.td-faq details{border-bottom:1px solid var(--line)}
.td-faq summary{cursor:pointer;padding:1.25rem 0;font-weight:600;list-style:none;
display:flex;justify-content:space-between;gap:1rem}
.td-faq summary::-webkit-details-marker{display:none}
.td-faq summary::after{content:'+';color:var(--accent);font-size:1.4rem;line-height:1;font-weight:400}
.td-faq details[open] summary::after{content:'–'}
.td-faq p{padding-bottom:1.3rem;color:var(--soft);line-height:1.75}

/* ── Shop ────────────────────────────────────────── */
.td-shop{display:grid;gap:1.5rem;margin-top:2.6rem}
@media(min-width:760px){.td-shop{grid-template-columns:repeat(3,1fr)}}
.td-goods{border:1px solid var(--line);display:flex;flex-direction:column}
.td-goods-shot{aspect-ratio:4/3;background:var(--steel) center/cover}
.td-goods h3{font-family:var(--display);font-size:1.15rem;text-transform:uppercase;padding:1.1rem 1.1rem .3rem}
.td-goods p{padding:0 1.1rem;color:var(--soft);font-size:.9rem;line-height:1.6}
.td-goods-foot{margin-top:auto;padding:1.1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.td-goods-foot .td-price{font-family:var(--display);font-size:1.3rem;color:var(--accent);font-weight:700}

/* ── Footer + the bar that matters most ──────────── */
.td-foot{display:block;border-top:1px solid var(--line);background:var(--night);
padding:3.5rem 1.5rem 2.5rem;text-align:center;color:var(--soft);font-size:.92rem}
.td-foot-name{font-family:var(--display);font-size:1.9rem;text-transform:uppercase;color:#fff;
display:block;margin-bottom:.5rem;font-weight:700}
.td-foot-links{display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin:1.6rem 0;
font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600}
.td-fine{font-size:.8rem;opacity:.7;margin-top:1.5rem}
.td-fine a{color:var(--accent)}

/* Pinned to the bottom of every phone screen. Four out of five visitors are
   on one, and this is the entire point of the site. */
.td-bar{position:fixed;left:0;right:0;bottom:0;z-index:80;display:none;
grid-template-columns:1fr auto;background:var(--accent);color:#fff;
box-shadow:0 -8px 24px rgba(0,0,0,.35)}
.td-bar a{display:flex;align-items:center;justify-content:center;gap:.5rem;padding:1rem .8rem;
font-family:var(--display);font-size:1.4rem;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
.td-bar a.quote{background:rgba(0,0,0,.22);font-size:1rem;padding-left:1.4rem;padding-right:1.4rem}
@media(max-width:760px){.td-bar{display:grid}.td-foot{padding-bottom:6rem}}
`;

const NAV_LABELS: Record<string, string> = {
  services: 'What we do',
  area: 'Areas',
  gallery: 'Recent jobs',
  credentials: 'Licences',
  about: 'About',
  pricing: 'Pricing',
  hours: 'Hours',
  faq: 'FAQ',
  contact: 'Contact',
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
  return out.join('');
}

function pairs(section: SiteSection): [string, string][] {
  return (section.items || []).filter((i) => i && i[0]) as [string, string][];
}

function tradeSection(section: SiteSection, site: SiteConfig, anchor: string, ctx: { pool: string[]; hours: SiteSection | null }): string {
  switch (section.type) {
    case 'services': {
      const items = pairs(section);
      if (!items.length) return '';
      return `<section class="td-sec"${anchor}><div class="td-wrap">
        <p class="td-eyebrow">${esc(section.label || 'What we do')}</p>
        <h2>${esc(section.title || 'The work')}</h2>
        ${section.text ? `<p class="td-intro">${esc(section.text)}</p>` : ''}
        <div class="td-grid">${items
          .map((i, n) => `<div class="td-card">
            <span class="td-card-n">${String(n + 1).padStart(2, '0')}</span>
            <h3>${esc(i[0])}</h3>${i[1] ? `<p>${esc(i[1])}</p>` : ''}
          </div>`)
          .join('')}</div>
      </div></section>`;
    }

    // "Do you come out my way" — asked on every job, answered by nobody
    case 'area': {
      const items = pairs(section);
      return `<section class="td-sec pale"${anchor}><div class="td-wrap">
        <p class="td-eyebrow">${esc(section.label || 'Where we work')}</p>
        <h2>${esc(section.title || 'Areas we cover')}</h2>
        ${section.text ? `<p class="td-intro">${esc(section.text)}</p>` : ''}
        ${items.length ? `<div class="td-area">${items
          .map((i) => `<span>${esc(i[0])}${i[1] ? ` <b>${esc(i[1])}</b>` : ''}</span>`)
          .join('')}</div>` : ''}
      </div></section>`;
    }

    // Numbers the public can check, which is the whole value of stating them
    case 'credentials': {
      const items = pairs(section);
      if (!items.length) return '';
      return `<section class="td-sec"${anchor}><div class="td-wrap">
        <p class="td-eyebrow">${esc(section.label || 'Licences')}</p>
        <h2>${esc(section.title || 'Licensed and accountable')}</h2>
        ${section.text ? `<p class="td-intro">${esc(section.text)}</p>` : ''}
        <div class="td-lic">${items
          .map((i) => `<div class="td-lic-item"><i>&#10003;</i><div>
            <strong>${esc(i[0])}</strong>${i[1] ? `<span>${esc(i[1])}</span>` : ''}
          </div></div>`)
          .join('')}</div>
      </div></section>`;
    }

    case 'gallery': {
      const shots = (section.images || []).map(safeUrl).filter(Boolean) as string[];
      const cells = shots.length ? shots : ctx.pool;
      if (!cells.length) return '';
      return `<section class="td-sec"${anchor}><div class="td-wrap">
        <p class="td-eyebrow">${esc(section.label || 'Recent jobs')}</p>
        <h2>${esc(section.title || 'Work we have done')}</h2>
        <div class="td-jobs">${cells.slice(0, 12)
          .map((src) => `<div class="td-job" style="background-image:url(${esc(src)})"></div>`)
          .join('')}</div>
      </div></section>`;
    }

    case 'about':
      return `<section class="td-sec pale"${anchor}><div class="td-narrow">
        <p class="td-eyebrow">${esc(section.label || 'About')}</p>
        <h2>${esc(section.title || `About ${site.name || 'us'}`)}</h2>
        <p class="td-intro" style="white-space:pre-line;max-width:none">${esc(section.text)}</p>
      </div></section>`;

    case 'pricing':
      return `<section class="td-sec"${anchor}><div class="td-narrow">
        <p class="td-eyebrow">${esc(section.label || 'Pricing')}</p>
        <h2>${esc(section.title || 'What it costs')}</h2>
        <div class="td-rows" style="margin-top:2.2rem">${(section.rows || [])
          .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1] || '')}</span></div>`)
          .join('')}</div>
        ${section.text ? `<p class="td-intro" style="font-size:.9rem">${esc(section.text)}</p>` : ''}
      </div></section>`;

    case 'hours':
      return findSection(section, site, anchor, section);

    case 'contact':
      if (!site.contact?.phone && !site.contact?.email && !site.contact?.address) return '';
      return findSection(section, site, anchor, ctx.hours);

    case 'testimonial':
      return `<section class="td-sec pale"${anchor}><div class="td-narrow td-quote">
        <p>&ldquo;${esc(section.quote)}&rdquo;</p><span>${esc(section.who)}</span>
      </div></section>`;

    case 'faq':
      return `<section class="td-sec"${anchor}><div class="td-narrow">
        <p class="td-eyebrow">${esc(section.label || 'FAQ')}</p>
        <h2>${esc(section.title || 'Common questions')}</h2>
        <div class="td-faq">${(section.items || [])
          .map((i) => `<details><summary>${esc(i[0])}</summary><p>${esc(i[1])}</p></details>`)
          .join('')}</div>
      </div></section>`;

    case 'shop':
      return `<section class="td-sec"${anchor}><div class="td-wrap">
        <p class="td-eyebrow">${esc(section.label || 'Shop')}</p>
        <h2>${esc(section.title || 'Gear')}</h2>
        <div class="td-shop">${(site.products || [])
          .map((product, i) => {
            const picture = safeUrl(product.image);
            return `<div class="td-goods">
              <div class="td-goods-shot"${picture ? ` style="background-image:url(${esc(picture)})"` : ''}></div>
              <h3>${esc(product.name || '')}</h3>
              ${product.text ? `<p>${esc(product.text)}</p>` : ''}
              <div class="td-goods-foot">
                <span class="td-price">${esc(product.price || '')}</span>
                <button type="button" class="buy-add td-btn" style="padding:.6rem 1.2rem;font-size:.85rem"
                  data-i="${i}" data-name="${esc(product.name || '')}" data-price="${esc(product.price || '')}">Add</button>
              </div>
            </div>`;
          })
          .join('')}</div>
      </div></section>`;

    case 'band': {
      const phone = site.contact?.phone;
      return `<section class="td-band"${section.tint ? ` style="background:${esc(section.tint)}"` : ''}>
        <h2>${esc(section.title)}</h2><p>${esc(section.text)}</p>
        <div class="td-acts">${phone
          ? `<a class="td-bigcall" href="tel:${esc(tel(phone))}"><small>Call us now</small><b>${esc(phone)}</b></a>`
          : ''}<a class="td-btn" href="#contact">${esc(site.cta || 'Get a quote')}</a></div>
      </section>`;
    }

    default:
      return '';
  }
}

function findSection(section: SiteSection, site: SiteConfig, anchor: string, hours: SiteSection | null): string {
  const c = site.contact || {};
  const rows = (hours?.rows || []).filter((r) => r && r[0]);
  const map = c.address
    ? `<div class="td-map"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(c.address)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map of ${esc(c.address)}"></iframe></div>`
    : '';
  const where: string[] = [];
  if (c.phone) where.push(`<a href="tel:${esc(tel(c.phone))}">${esc(c.phone)}</a>`);
  if (c.email) where.push(`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
  if (c.address) where.push(`<span>${esc(c.address)}</span>`);

  return `<section class="td-sec"${anchor}><div class="td-wrap">
    <p class="td-eyebrow">${esc(section.label || 'Contact')}</p>
    <h2>${esc(section.title || 'Give us a call')}</h2>
    <div class="td-find">
      <div>
        ${rows.length ? `<div class="td-rows" data-hours>${rows
          .map((r) => `<div data-day="${esc(r[0])}"><span>${esc(r[0])}</span><span>${esc(r[1] || '')}</span></div>`)
          .join('')}</div>` : ''}
        ${where.length ? `<div class="td-where">${where.join('')}</div>` : ''}
      </div>
      ${map}
    </div>
  </div></section>`;
}

export function renderTradeBody(site: SiteConfig, slug: string): string {
  const name = site.name || slug;
  const logo = safeUrl(site.logo);
  const hero = safeUrl(site.heroImage);
  const contact = site.contact || {};
  const sections = site.sections || [];

  const pool = [...(site.images || []), ...sections.flatMap((s) => s.images || [])]
    .map(safeUrl).filter(Boolean) as string[];

  const hours = sections.find((s) => s.type === 'hours') || null;
  const absorbsHours = sections.some(
    (s) => s.type === 'contact' && (contact.phone || contact.email || contact.address)
  );
  const visible = absorbsHours ? sections.filter((s) => s.type !== 'hours') : sections;

  const used = new Set<string>();
  const body = visible
    .map((section) => {
      const wanted = ANCHORED.has(section.type) ? section.type : '';
      const anchor = wanted && !used.has(wanted) ? ` id="${wanted}"` : '';
      if (anchor) used.add(wanted);
      return tradeSection(section, site, anchor, { pool, hours });
    })
    .join('');

  // Licence names from the credentials block, said again in the hero. Not
  // hardcoded: the renderer has no idea what anyone is licensed to do.
  const creds = sections.find((s) => s.type === 'credentials');
  const badges = (creds?.items || []).slice(0, 3)
    .map((i) => {
      if (!i || !i[0]) return '';
      // A registration number earns its place next to the name; a sentence
      // does not — the full detail is in the licence section further down.
      const code = String(i[1] || '').match(/#?\b[A-Z]{2,4}[ -]?\d{4,}\b/)?.[0];
      const short = code || (String(i[1] || '').length <= 18 ? i[1] : '');
      return `<span>${esc(i[0])}${short ? ` <b>${esc(short)}</b>` : ''}</span>`;
    })
    .filter(Boolean)
    .join('');

  const nav = navFor(site, visible);
  const cta = site.cta || 'Get a quote';

  return `
<nav class="td-nav" id="td-nav">
  <a class="td-brand" href="#top">${logo
    ? `<img src="${esc(logo)}" alt="${esc(name)}" />`
    : `<span class="td-mark">${esc(initials(name))}</span><span>${esc(name)}</span>`}</a>
  <div class="td-links">${nav}</div>
  ${contact.phone
    ? `<a class="td-call" href="tel:${esc(tel(contact.phone))}">${esc(contact.phone)}</a>`
    : `<a class="td-call noph" href="#contact">${esc(cta)}</a>`}
</nav>

<header class="td-hero" id="top">
  ${hero ? `<div class="td-hero-photo" style="background-image:url(${esc(hero)})"></div>` : ''}
  <div class="td-wrap td-hero-inner">
    ${site.eyebrow ? `<p class="td-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || name)}</h1>
    ${site.lede ? `<p class="td-lede">${esc(site.lede)}</p>` : ''}
    <div class="td-acts">
      ${contact.phone
        ? `<a class="td-bigcall" href="tel:${esc(tel(contact.phone))}"><small>Call us now</small><b>${esc(contact.phone)}</b></a>
           <a class="td-btn" href="#contact">${esc(cta)}</a>`
        : `<a class="td-bigcall" href="#contact"><small>No job too small</small><b>${esc(cta)}</b></a>`}
    </div>
    ${badges ? `<div class="td-badges">${badges}</div>` : ''}
  </div>
</header>
${body}
<footer class="td-foot">
  ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" style="height:56px;width:auto;margin:0 auto 1rem;display:block" />` : ''}
  <span class="td-foot-name">${esc(name)}</span>
  ${contact.phone ? `<a href="tel:${esc(tel(contact.phone))}" style="color:var(--accent);font-family:var(--display);font-size:1.6rem;font-weight:700">${esc(contact.phone)}</a>` : ''}
  ${contact.address ? `<div style="margin-top:.6rem">${esc(contact.address)}</div>` : ''}
  ${nav ? `<div class="td-foot-links">${nav}</div>` : ''}
  <p class="td-fine">&copy; ${new Date().getFullYear()} ${esc(name)} &middot; Built with <a href="https://garage.co.nz/ai">garage.co.nz</a></p>
</footer>
<div class="td-bar"${contact.phone ? '' : ' style="grid-template-columns:1fr"'}>
  ${contact.phone
    ? `<a href="tel:${esc(tel(contact.phone))}">&#9990; ${esc(contact.phone)}</a>
       <a class="quote" href="#contact">${esc(cta)}</a>`
    : `<a href="#contact">${esc(cta)}</a>`}
</div>
<script>(function(){
var DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
var SHORT=['sun','mon','tue','wed','thu','fri','sat'];
function dayIndex(w){w=w.toLowerCase().replace(/[^a-z]/g,'');
for(var i=0;i<7;i++){if(w===DAYS[i]||w===SHORT[i]||w===SHORT[i]+'s')return i;}
if(w.length>=3){for(var j=0;j<7;j++){if(DAYS[j].indexOf(w)===0)return j;}}return -1;}
function daysCovered(label){var out={},parts=String(label).toLowerCase().split(/,|&|\\band\\b/);
parts.forEach(function(part){var range=part.split(/[-–—]|\\bto\\b/);
if(range.length===2){var a=dayIndex(range[0]),b=dayIndex(range[1]);
if(a>=0&&b>=0){for(var k=0;k<7;k++){var d=(a+k)%7;out[d]=1;if(d===b)break;}return;}}
var one=dayIndex(part);if(one>=0)out[one]=1;
if(/every ?day|daily|7 days|all week|24\\/7/.test(part)){for(var m=0;m<7;m++)out[m]=1;}});return out;}
var today=new Date().getDay();
document.querySelectorAll('[data-hours] [data-day]').forEach(function(row){
if(daysCovered(row.getAttribute('data-day'))[today])row.classList.add('today');});
})();</script>`;
}
