// CLINIC TEMPLATE (style: "physio")
// The third skeleton. The house design is a service business, the cafe leads
// with a menu; a physio is neither. Someone arrives here having just hurt
// themselves, and wants three things in this order: can you treat this, what
// will it cost me, and how soon can I come in.
//
// So this one is light and airy on purpose — pale paper, deep sage, a fine
// serif with a lot of air around it. Clinical without the hospital blue.
//
// Reference: HEVA HEALTH (hevahealth.com, Awwwards SOTD) — off-white against
// deep olive, credibility stated in the hero rather than buried, numbered
// "how it works", practitioners with their credentials on the front page.
//
// The ACC block is the New Zealand part and the reason a generic template
// cannot do this job: physios here are ACC First Providers, so no GP referral
// is needed, the claim is lodged in the room, and the patient pays a part
// charge rather than the lot.

import type { SiteConfig, SiteSection } from './site-render';

export const CLINIC_FONT_QUERY = '&family=Instrument+Serif:ital@0;1';

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

export const CLINIC_CSS = `
/* The neutrals are tinted from whatever brand colour the site already has,
   rather than baked sage — a clinic with a blue logo should not sit on a green
   page. color-mix does it in the browser, so there is nothing to compute. */
.ph{--paper:#fbfbf6;--accent:var(--primary);
--mist:color-mix(in srgb,var(--primary) 9%,#fbfbf6);
--line:color-mix(in srgb,var(--primary) 15%,#e9e9e3);
--panel:color-mix(in srgb,var(--primary) 20%,#1a1f1a);
--ink:color-mix(in srgb,var(--primary) 12%,#242a24);
--soft:color-mix(in srgb,var(--primary) 10%,#6d726b);
--display:'Instrument Serif',Georgia,serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.ph{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.7}
html:has(body.ph),body.ph{overflow-x:clip}
/* The house sheet centres and pads every h2; this one decides per section. */
.ph h2{text-align:left;margin-bottom:0}
.ph h1,.ph h2,.ph h3.ph-display{font-family:var(--display);font-weight:400;letter-spacing:-.01em;line-height:1.08}
.ph ::selection{background:var(--accent);color:#fff}
.ph-wrap{max-width:72rem;margin:0 auto;padding:0 1.6rem}
.ph-narrow{max-width:44rem;margin:0 auto;padding:0 1.6rem}
.ph-centre{text-align:center}
.ph-centre h2{text-align:center}

/* Small caps label with a dot — quieter than the cafe's rule */
.ph-eyebrow{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);
font-weight:600;margin-bottom:1.1rem;display:flex;align-items:center;gap:.55rem}
.ph-eyebrow::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;flex:none}
.ph-centre .ph-eyebrow{justify-content:center}

/* ── Nav ─────────────────────────────────────────── */
.ph-nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;
gap:1rem;padding:1rem 1.8rem;background:rgba(251,251,246,.82);backdrop-filter:blur(12px);
border-bottom:1px solid transparent;transition:border-color .3s ease}
.ph-nav.stuck{border-bottom-color:var(--line)}
.ph-brand{display:flex;align-items:center;gap:.65rem;font-weight:600;font-size:1.02rem;letter-spacing:-.01em}
.ph-brand img{height:42px;width:auto;max-width:190px;object-fit:contain}
.ph-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;
background:var(--mist);color:var(--accent);font-size:.78rem;font-weight:600;flex:none}
.ph-links{display:flex;gap:1.9rem;font-size:.92rem;color:var(--soft)}
.ph-links a:hover{color:var(--ink)}
.ph-book{background:var(--accent);color:#fff;border-radius:999px;padding:.65rem 1.35rem;
font-size:.86rem;font-weight:600;white-space:nowrap;transition:transform .2s ease,filter .2s ease}
.ph-book:hover{transform:translateY(-1px);filter:brightness(1.08)}
@media(max-width:900px){.ph-links{display:none}.ph-nav{padding:.9rem 1.1rem}}

/* ── Hero — light, never full-bleed dark ─────────── */
.ph-hero{padding:5rem 0 5.5rem;background:
radial-gradient(60rem 30rem at 78% -10%,var(--mist),transparent 70%),var(--paper)}
.ph-hero-grid{display:grid;gap:3rem;align-items:center}
@media(min-width:940px){.ph-hero-grid{grid-template-columns:1.05fr .95fr;gap:4.5rem}
.ph-hero{padding:6.5rem 0 7rem}}
.ph-hero h1{font-size:clamp(2.6rem,5.6vw,4.6rem);max-width:15ch;text-wrap:balance}
.ph-hero h1 em{font-style:italic;color:var(--accent)}
.ph-lede{margin-top:1.4rem;font-size:1.1rem;color:var(--soft);max-width:34rem;line-height:1.75}
.ph-acts{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:2.2rem}
.ph-btn{display:inline-block;background:var(--accent);color:#fff;border-radius:999px;
padding:.95rem 1.9rem;font-size:.94rem;font-weight:600;border:1px solid var(--accent);
transition:transform .2s ease,filter .2s ease}
.ph-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.ph-btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}
.ph-btn.ghost:hover{border-color:var(--accent);color:var(--accent);filter:none}
/* The trust row: the things that decide whether they pick up the phone */
.ph-trust{display:flex;flex-wrap:wrap;gap:.5rem .9rem;margin-top:2.4rem;align-items:center}
.ph-trust span{display:inline-flex;align-items:center;gap:.45rem;font-size:.85rem;color:var(--soft);
background:var(--mist);border-radius:999px;padding:.45rem 1rem}
.ph-trust span::before{content:'✓';color:var(--accent);font-weight:700;font-size:.8rem}
.ph-hero-art{position:relative;aspect-ratio:4/5;border-radius:28px;overflow:hidden;
background:var(--mist) center/cover;box-shadow:0 30px 70px -40px rgba(47,61,44,.4)}
@media(max-width:939px){.ph-hero-art{aspect-ratio:16/11;border-radius:22px}}

.ph-sec{padding:5.5rem 0}
.ph-sec.tint{background:var(--mist)}
.ph-sec h2{font-size:clamp(1.9rem,3.8vw,2.9rem);max-width:22ch}
.ph-centre h2{margin-left:auto;margin-right:auto}
.ph-intro{margin-top:1.1rem;color:var(--soft);max-width:38rem;line-height:1.8}
.ph-centre .ph-intro{margin-left:auto;margin-right:auto}

/* ── Conditions — the "I have this specific pain" door ── */
.ph-conditions{display:grid;gap:1rem;margin-top:3rem}
@media(min-width:700px){.ph-conditions{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1000px){.ph-conditions{grid-template-columns:repeat(3,1fr)}}
.ph-cond{background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:1.8rem 1.6rem;
transition:border-color .25s ease,transform .25s ease}
.ph-cond:hover{border-color:var(--accent);transform:translateY(-3px)}
.ph-sec.tint .ph-cond{background:var(--paper)}
.ph-cond h3{font-size:1.08rem;font-weight:600;margin-bottom:.5rem;letter-spacing:-.01em}
.ph-cond p{font-size:.92rem;color:var(--soft);line-height:1.7}
.ph-cond-dot{width:30px;height:30px;border-radius:10px;background:var(--mist);display:grid;
place-items:center;margin-bottom:1.1rem;color:var(--accent);font-size:.9rem}
.ph-sec.tint .ph-cond-dot{background:var(--mist)}

/* ── Steps — 01 / 02 / 03 ────────────────────────── */
.ph-steps{display:grid;gap:2.4rem;margin-top:3.2rem;counter-reset:step}
@media(min-width:820px){.ph-steps{grid-template-columns:repeat(3,1fr);gap:2.6rem}}
.ph-step{counter-increment:step;position:relative;padding-top:2.6rem}
.ph-step::before{content:'0' counter(step);position:absolute;top:0;left:0;
font-family:var(--display);font-size:1.9rem;color:var(--accent);line-height:1}
.ph-step::after{content:'';position:absolute;top:1rem;left:0;right:0;height:1px;background:var(--line);
transform:translateY(-50%);margin-left:2.6rem}
@media(max-width:819px){.ph-step::after{display:none}}
.ph-step:last-child::after{display:none}
.ph-step h3{font-size:1.12rem;font-weight:600;margin-bottom:.5rem}
.ph-step p{color:var(--soft);font-size:.94rem;line-height:1.75}

/* ── ACC — the New Zealand block ─────────────────── */
.ph-acc{background:var(--panel);color:rgba(255,255,255,.86);border-radius:32px;padding:3.4rem 2.6rem;
margin:0 1.6rem;max-width:72rem}
@media(min-width:1200px){.ph-acc{margin:0 auto}}
@media(max-width:600px){.ph-acc{border-radius:22px;padding:2.4rem 1.5rem;margin:0 1rem}}
.ph-acc .ph-eyebrow{color:color-mix(in srgb,var(--primary) 45%,#dfe7db)}
.ph-acc h2{color:#fff;max-width:18ch}
.ph-acc-grid{display:grid;gap:2.4rem;align-items:start}
@media(min-width:900px){.ph-acc-grid{grid-template-columns:1fr 1.1fr;gap:4rem}}
.ph-acc-points{display:grid;gap:1.3rem}
.ph-acc-point{display:grid;grid-template-columns:auto 1fr;gap:.9rem;align-items:start}
.ph-acc-point i{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.14);
color:color-mix(in srgb,var(--primary) 45%,#dfe7db);display:grid;place-items:center;font-style:normal;font-size:.7rem;font-weight:700;margin-top:.2rem}
.ph-acc-point strong{display:block;font-weight:600;color:#fff;font-size:.98rem}
.ph-acc-point span{color:rgba(255,255,255,.68);font-size:.92rem;line-height:1.7}
.ph-acc p.ph-intro{color:rgba(255,255,255,.72)}
.ph-acc .ph-btn{background:#fff;color:var(--panel);border-color:#fff;margin-top:1.8rem}

/* ── Team ────────────────────────────────────────── */
.ph-team{display:grid;gap:1.8rem;margin-top:3rem}
@media(min-width:760px){.ph-team{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}}
.ph-person{text-align:left}
.ph-person-shot{aspect-ratio:3/4;border-radius:20px;background:var(--mist) center/cover;margin-bottom:1.1rem}
.ph-person strong{display:block;font-weight:600;font-size:1.05rem;letter-spacing:-.01em}
.ph-person .ph-role{display:block;color:var(--accent);font-size:.84rem;margin:.2rem 0 .6rem;
letter-spacing:.04em}
.ph-person p{color:var(--soft);font-size:.92rem;line-height:1.7}

/* ── Quote ───────────────────────────────────────── */
.ph-quote{text-align:center}
.ph-quote p{font-family:var(--display);font-size:clamp(1.5rem,3.2vw,2.3rem);line-height:1.35;
max-width:24ch;margin:0 auto;font-weight:400}
.ph-quote span{display:block;margin-top:1.6rem;font-size:.8rem;letter-spacing:.18em;
text-transform:uppercase;color:var(--soft)}

/* ── Practical: hours, find us ───────────────────── */
.ph-find{display:grid;gap:3rem;margin-top:3rem}
@media(min-width:900px){.ph-find{grid-template-columns:1fr 1fr;gap:4rem}}
.ph-rows{border-top:1px solid var(--line)}
.ph-rows div{display:flex;justify-content:space-between;gap:1.5rem;padding:.95rem 0;
border-bottom:1px solid var(--line);font-size:.95rem}
.ph-rows div.today{font-weight:600;color:var(--ink)}
.ph-rows div span:last-child{color:var(--soft)}
.ph-rows div.today span:last-child{color:var(--accent)}
.ph-where{display:grid;gap:.7rem;margin-top:1.8rem;font-size:.96rem}
.ph-where a{color:var(--accent);border-bottom:1px solid transparent}
.ph-where a:hover{border-bottom-color:var(--accent)}
.ph-map{position:relative;border-radius:24px;overflow:hidden;min-height:24rem;background:var(--mist)}
.ph-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0;filter:grayscale(.55) contrast(.95)}

/* ── FAQ ─────────────────────────────────────────── */
.ph-faq{margin-top:2.6rem;border-top:1px solid var(--line)}
.ph-faq details{border-bottom:1px solid var(--line)}
.ph-faq summary{cursor:pointer;padding:1.35rem 0;font-weight:600;list-style:none;
display:flex;justify-content:space-between;gap:1rem;align-items:center}
.ph-faq summary::-webkit-details-marker{display:none}
.ph-faq summary::after{content:'';width:10px;height:10px;border-right:1.5px solid var(--accent);
border-bottom:1.5px solid var(--accent);transform:rotate(45deg);transition:transform .25s ease;flex:none}
.ph-faq details[open] summary::after{transform:rotate(225deg)}
.ph-faq p{padding-bottom:1.4rem;color:var(--soft);line-height:1.8}

/* ── Gallery ─────────────────────────────────────── */
.ph-strip{display:grid;gap:1rem;margin-top:2.8rem}
@media(min-width:700px){.ph-strip{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}}
.ph-shot{aspect-ratio:1;background:var(--mist) center/cover;border-radius:20px}

/* ── Band ────────────────────────────────────────── */
.ph-band{text-align:center;padding:5rem 1.6rem;background:var(--mist)}
.ph-band h2{margin:0 auto;color:var(--ink)}
.ph-band p{margin:1.1rem auto 2rem;max-width:34rem;color:var(--soft);line-height:1.8}

/* ── Shop ────────────────────────────────────────── */
.ph-shop{display:grid;gap:1.6rem;margin-top:2.8rem}
@media(min-width:760px){.ph-shop{grid-template-columns:repeat(3,1fr)}}
.ph-goods{border:1px solid var(--line);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;background:var(--paper)}
.ph-goods-shot{aspect-ratio:4/3;background:var(--mist) center/cover}
.ph-goods h3{font-size:1.02rem;font-weight:600;padding:1.2rem 1.2rem .3rem}
.ph-goods p{padding:0 1.2rem;color:var(--soft);font-size:.9rem;line-height:1.65}
.ph-goods-foot{margin-top:auto;padding:1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.ph-goods-foot .ph-price{font-weight:600;color:var(--accent)}

/* ── Footer ──────────────────────────────────────── */
.ph-foot{display:block;border-top:1px solid var(--line);background:var(--paper);
padding:3.5rem 1.6rem 2.6rem;text-align:center;color:var(--soft);font-size:.92rem}
.ph-foot-name{font-family:var(--display);font-size:1.5rem;color:var(--ink);display:block;margin-bottom:.5rem}
.ph-foot-links{display:flex;flex-wrap:wrap;justify-content:center;gap:1.6rem;margin:1.7rem 0;font-size:.88rem}
.ph-foot-links a:hover{color:var(--ink)}
.ph-fine{font-size:.82rem;opacity:.75;margin-top:1.6rem}
.ph-fine a{color:var(--accent)}
`;

const NAV_LABELS: Record<string, string> = {
  conditions: 'What we treat',
  services: 'Services',
  steps: 'How it works',
  acc: 'ACC',
  about: 'About',
  gallery: 'The clinic',
  pricing: 'Fees',
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
  if ((site.team || []).length) out.push('<a href="/team">Our team</a>');
  return out.join('');
}

function pairs(section: SiteSection): [string, string][] {
  return (section.items || []).filter((i) => i && i[0]) as [string, string][];
}

function conditionsSection(section: SiteSection, anchor: string): string {
  const items = pairs(section);
  if (!items.length) return '';
  return `<section class="ph-sec tint ph-centre"${anchor}><div class="ph-wrap">
    <p class="ph-eyebrow">${esc(section.label || 'What we treat')}</p>
    <h2>${esc(section.title || 'Come in with this')}</h2>
    ${section.text ? `<p class="ph-intro">${esc(section.text)}</p>` : ''}
    <div class="ph-conditions" style="text-align:left">${items
      .map((i) => `<div class="ph-cond">
        <div class="ph-cond-dot">&#9679;</div>
        <h3>${esc(i[0])}</h3>
        ${i[1] ? `<p>${esc(i[1])}</p>` : ''}
      </div>`)
      .join('')}</div>
  </div></section>`;
}

function stepsSection(section: SiteSection, anchor: string): string {
  const items = pairs(section);
  if (!items.length) return '';
  return `<section class="ph-sec"${anchor}><div class="ph-wrap">
    <p class="ph-eyebrow">${esc(section.label || 'How it works')}</p>
    <h2>${esc(section.title || 'What happens when you come in')}</h2>
    ${section.text ? `<p class="ph-intro">${esc(section.text)}</p>` : ''}
    <div class="ph-steps">${items
      .map((i) => `<div class="ph-step"><h3>${esc(i[0])}</h3>${i[1] ? `<p>${esc(i[1])}</p>` : ''}</div>`)
      .join('')}</div>
  </div></section>`;
}

function accSection(section: SiteSection, site: SiteConfig, anchor: string): string {
  const items = pairs(section);
  return `<section class="ph-sec"${anchor} style="padding-top:1rem"><div class="ph-acc">
    <div class="ph-acc-grid">
      <div>
        <p class="ph-eyebrow">${esc(section.label || 'ACC')}</p>
        <h2>${esc(section.title || 'Hurt yourself? ACC covers most of it.')}</h2>
        ${section.text ? `<p class="ph-intro">${esc(section.text)}</p>` : ''}
        <a class="ph-btn" href="#contact">${esc(site.cta || 'Book an appointment')}</a>
      </div>
      ${items.length ? `<div class="ph-acc-points">${items
        .map((i) => `<div class="ph-acc-point"><i>&#10003;</i><div>
          <strong>${esc(i[0])}</strong>${i[1] ? `<span>${esc(i[1])}</span>` : ''}
        </div></div>`)
        .join('')}</div>` : ''}
    </div>
  </div></section>`;
}

function findSection(section: SiteSection, site: SiteConfig, anchor: string, hours: SiteSection | null): string {
  const c = site.contact || {};
  const rows = (hours?.rows || []).filter((r) => r && r[0]);
  const map = c.address
    ? `<div class="ph-map"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(c.address)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map of ${esc(c.address)}"></iframe></div>`
    : '';
  const where: string[] = [];
  if (c.address) where.push(`<span>${esc(c.address)}</span>`);
  if (c.phone) where.push(`<a href="tel:${esc(String(c.phone).replace(/\s/g, ''))}">${esc(c.phone)}</a>`);
  if (c.email) where.push(`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);

  return `<section class="ph-sec"${anchor}><div class="ph-wrap">
    <p class="ph-eyebrow">${esc(section.label || 'Find us')}</p>
    <h2>${esc(section.title || 'Come and see us')}</h2>
    <div class="ph-find">
      <div>
        ${rows.length ? `<div class="ph-rows" data-hours>${rows
          .map((r) => `<div data-day="${esc(r[0])}"><span>${esc(r[0])}</span><span>${esc(r[1] || '')}</span></div>`)
          .join('')}</div>` : ''}
        ${where.length ? `<div class="ph-where">${where.join('')}</div>` : ''}
      </div>
      ${map}
    </div>
  </div></section>`;
}

function clinicSection(section: SiteSection, site: SiteConfig, anchor: string, ctx: { pool: string[]; hours: SiteSection | null }): string {
  switch (section.type) {
    case 'conditions':
      return conditionsSection(section, anchor);
    case 'steps':
      return stepsSection(section, anchor);
    case 'acc':
      return accSection(section, site, anchor);

    // A services list on a clinic reads the same way conditions do
    case 'services':
      return conditionsSection({ ...section, label: section.label || 'Services', title: section.title || 'How we can help' }, anchor);

    case 'about':
      return `<section class="ph-sec"${anchor}><div class="ph-narrow">
        <p class="ph-eyebrow">${esc(section.label || 'About')}</p>
        <h2>${esc(section.title || `About ${site.name || 'the clinic'}`)}</h2>
        <p class="ph-intro" style="white-space:pre-line;max-width:none">${esc(section.text)}</p>
      </div></section>`;

    case 'pricing':
      return `<section class="ph-sec tint"${anchor}><div class="ph-narrow">
        <p class="ph-eyebrow">${esc(section.label || 'Fees')}</p>
        <h2>${esc(section.title || 'What it costs')}</h2>
        <div class="ph-rows" style="margin-top:2.2rem">${(section.rows || [])
          .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1] || '')}</span></div>`)
          .join('')}</div>
        ${section.text ? `<p class="ph-intro" style="font-size:.9rem">${esc(section.text)}</p>` : ''}
      </div></section>`;

    case 'gallery': {
      const shots = (section.images || []).map(safeUrl).filter(Boolean) as string[];
      const cells = shots.length ? shots : ctx.pool;
      if (!cells.length) return '';
      return `<section class="ph-sec ph-centre"${anchor}><div class="ph-wrap">
        <p class="ph-eyebrow">${esc(section.label || 'The clinic')}</p>
        <h2>${esc(section.title || 'Have a look around')}</h2>
        <div class="ph-strip">${cells.slice(0, 8)
          .map((src) => `<div class="ph-shot" style="background-image:url(${esc(src)})"></div>`)
          .join('')}</div>
      </div></section>`;
    }

    case 'hours':
      return findSection(section, site, anchor, section);

    case 'contact':
      if (!site.contact?.phone && !site.contact?.email && !site.contact?.address) return '';
      return findSection(section, site, anchor, ctx.hours);

    case 'testimonial':
      return `<section class="ph-sec tint"${anchor}><div class="ph-narrow ph-quote">
        <p>&ldquo;${esc(section.quote)}&rdquo;</p><span>${esc(section.who)}</span>
      </div></section>`;

    case 'faq':
      return `<section class="ph-sec"${anchor}><div class="ph-narrow">
        <p class="ph-eyebrow">${esc(section.label || 'Questions')}</p>
        <h2>${esc(section.title || 'Things people ask')}</h2>
        <div class="ph-faq">${(section.items || [])
          .map((i) => `<details><summary>${esc(i[0])}</summary><p>${esc(i[1])}</p></details>`)
          .join('')}</div>
      </div></section>`;

    case 'shop':
      return `<section class="ph-sec ph-centre"${anchor}><div class="ph-wrap">
        <p class="ph-eyebrow">${esc(section.label || 'Shop')}</p>
        <h2>${esc(section.title || 'Things that help at home')}</h2>
        <div class="ph-shop" style="text-align:left">${(site.products || [])
          .map((product, i) => {
            const picture = safeUrl(product.image);
            return `<div class="ph-goods">
              <div class="ph-goods-shot"${picture ? ` style="background-image:url(${esc(picture)})"` : ''}></div>
              <h3>${esc(product.name || '')}</h3>
              ${product.text ? `<p>${esc(product.text)}</p>` : ''}
              <div class="ph-goods-foot">
                <span class="ph-price">${esc(product.price || '')}</span>
                <button type="button" class="buy-add ph-btn" style="padding:.6rem 1.2rem;font-size:.85rem"
                  data-i="${i}" data-name="${esc(product.name || '')}" data-price="${esc(product.price || '')}">Add</button>
              </div>
            </div>`;
          })
          .join('')}</div>
      </div></section>`;

    case 'band':
      return `<section class="ph-band"${section.tint ? ` style="background:${esc(section.tint)}"` : ''}>
        <h2>${esc(section.title)}</h2><p>${esc(section.text)}</p>
        <a class="ph-btn" href="#contact">${esc(site.cta || 'Book an appointment')}</a>
      </section>`;

    default:
      return '';
  }
}

/** The practitioners belong on the front page here — people want to know who
 *  is going to put hands on them before they ring up. */
function teamBlock(site: SiteConfig): string {
  const team = site.team || [];
  if (!team.length) return '';
  return `<section class="ph-sec ph-centre" id="team"><div class="ph-wrap">
    <p class="ph-eyebrow">Our team</p>
    <h2>Who you will see</h2>
    <div class="ph-team">${team
      .map((p) => {
        const shot = safeUrl(p.image);
        return `<div class="ph-person">
          <div class="ph-person-shot"${shot ? ` style="background-image:url(${esc(shot)})"` : ''}></div>
          <strong>${esc(p.name || '')}</strong>
          ${p.role ? `<span class="ph-role">${esc(p.role)}</span>` : ''}
          ${p.text ? `<p>${esc(p.text)}</p>` : ''}
        </div>`;
      })
      .join('')}</div>
  </div></section>`;
}

export function renderClinicBody(site: SiteConfig, slug: string): string {
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
      return clinicSection(section, site, anchor, { pool, hours });
    })
    .join('');

  // The hero photo is a framed panel, not a full-bleed background — that is
  // most of what keeps this template feeling light.
  const art = hero || pool[0] || '';
  const cta = site.cta || 'Book an appointment';
  const nav = navFor(site, visible);

  // Whatever the ACC block already claims, said again where people look first.
  // Deliberately not hardcoded: the renderer has no business asserting that a
  // clinic is ACC registered when nobody has told it so.
  const trust: string[] = [];
  const accSec = sections.find((s) => s.type === 'acc');
  for (const item of (accSec?.items || []).slice(0, 2)) {
    if (item && item[0]) trust.push(esc(item[0]));
  }
  if (hours) trust.push('<b data-open></b>');

  return `
<nav class="ph-nav" id="ph-nav">
  <a class="ph-brand" href="#top">${logo
    ? `<img src="${esc(logo)}" alt="${esc(name)}" />`
    : `<span class="ph-mark">${esc(initials(name))}</span><span>${esc(name)}</span>`}</a>
  <div class="ph-links">${nav}</div>
  <a class="ph-book" href="#contact">${esc(cta)}</a>
</nav>

<header class="ph-hero" id="top"><div class="ph-wrap"><div class="ph-hero-grid">
  <div>
    ${site.eyebrow ? `<p class="ph-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || name)}</h1>
    ${site.lede ? `<p class="ph-lede">${esc(site.lede)}</p>` : ''}
    <div class="ph-acts">
      <a class="ph-btn" href="#contact">${esc(cta)}</a>
      ${contact.phone
        ? `<a class="ph-btn ghost" href="tel:${esc(String(contact.phone).replace(/\s/g, ''))}">${esc(contact.phone)}</a>`
        : ''}
    </div>
    ${trust.length ? `<div class="ph-trust">${trust.map((t) => `<span>${t}</span>`).join('')}</div>` : ''}
  </div>
  <div class="ph-hero-art"${art ? ` style="background-image:url(${esc(art)})"` : ''}></div>
</div></div></header>
${body}
${teamBlock(site)}
<footer class="ph-foot">
  ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" style="height:52px;width:auto;margin:0 auto 1rem;display:block" />` : ''}
  <span class="ph-foot-name">${esc(name)}</span>
  ${contact.address ? `<span>${esc(contact.address)}</span>` : ''}
  ${nav ? `<div class="ph-foot-links">${nav}</div>` : ''}
  <p class="ph-fine">&copy; ${new Date().getFullYear()} ${esc(name)} &middot; Built with <a href="https://garage.co.nz/ai">garage.co.nz</a></p>
</footer>
<script>(function(){
var nav=document.getElementById('ph-nav');
if(nav){var s=function(){nav.classList.toggle('stuck',window.scrollY>12);};
window.addEventListener('scroll',s,{passive:true});s();}

// Same open-now reading as the cafe: worked out in the visitor's timezone from
// the hours already on the page, because a cached response cannot know.
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
if(/every ?day|daily|7 days|all week/.test(part)){for(var m=0;m<7;m++)out[m]=1;}});return out;}
function minutes(t){var m=String(t).match(/(\\d{1,2})(?:[:.](\\d{2}))?\\s*(am|pm)?/i);
if(!m)return null;var h=parseInt(m[1],10),mi=m[2]?parseInt(m[2],10):0,ap=(m[3]||'').toLowerCase();
if(ap==='pm'&&h<12)h+=12;if(ap==='am'&&h===12)h=0;return h*60+mi;}
var now=new Date(),today=now.getDay(),mins=now.getHours()*60+now.getMinutes(),todayRow=null;
document.querySelectorAll('[data-hours] [data-day]').forEach(function(row){
if(daysCovered(row.getAttribute('data-day'))[today]){row.classList.add('today');if(!todayRow)todayRow=row;}});
var badge=document.querySelector('[data-open]');
if(badge&&todayRow){var v=todayRow.children[1]?todayRow.children[1].textContent.trim():'';
var shut=/closed/i.test(v),span=v.split(/[-–—]|\\bto\\b/),open=null,close=null;
if(!shut&&span.length===2){open=minutes(span[0]);close=minutes(span[1]);}
var label;
if(shut){label='Closed today';}
else if(open!==null&&close!==null){if(close<=open)close+=1440;
label=(mins>=open&&mins<close)?'Open until '+span[1].trim():'Opens '+span[0].trim();}
else{label='Today '+v;}
badge.textContent=label;}
else if(badge){badge.parentNode.remove();}
})();</script>`;
}
