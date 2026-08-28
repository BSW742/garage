// BEAUTY TEMPLATE (style: "beauty")
//
// For salons, spas, skin clinics, brow and lash studios, nail bars, massage.
// Built after heydayskincare.com, which does three things worth stealing:
// booking is anchored in every section rather than parked in the nav, the
// treatments are named tiers instead of an undifferentiated list, and the
// credibility comes from numbers — hours of training, years open, reviews.
//
// One thing is deliberately inverted. Heyday hides its prices behind
// "customised for you", which works for a chain with a membership funnel. A
// New Zealand salon's customer wants to know what a facial costs before they
// pick up the phone, and hiding it reads as expensive rather than exclusive.
// So the treatment list carries duration and price, plainly, like a menu.
//
// The sticky bar at the bottom is the trade template's phone number wearing
// different clothes. For a tradie the whole page exists to make the phone ring;
// here it exists to get a booking, and it should never be more than a thumb
// away.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const BEAUTY_FONT_QUERY = '&family=Marcellus';

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

export const BEAUTY_CSS = `
.bt{--bone:#faf6f2;--ink:#2b2320;--dim:#87786f;--line:#ece2da;--card:#fff;
--accent:var(--primary);
--blush:color-mix(in srgb,var(--primary) 12%,#faf6f2);
--display:'Marcellus',Georgia,serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.bt{background:var(--bone);color:var(--ink);font-family:var(--body);line-height:1.7}
html:has(body.bt),body.bt{overflow-x:clip}
.bt h1,.bt h2,.bt h3{font-family:var(--display);font-weight:400;letter-spacing:.005em;
line-height:1.12;text-align:left;margin-bottom:0}
.bt ::selection{background:var(--ink);color:var(--bone)}
.bt-wrap{max-width:68rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.bt-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bone) 92%,transparent);
backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.bt-nav-in{display:flex;align-items:center;gap:1.2rem;padding:1rem 0}
.bt-mark{font-family:var(--display);font-size:1.2rem;letter-spacing:.06em;text-transform:uppercase}
.bt-nav-end{margin-left:auto;display:flex;align-items:center;gap:1rem}
.bt-tel{display:none;font-size:.92rem;color:var(--dim)}
@media(min-width:620px){.bt-tel{display:inline}}
.bt-book{background:var(--ink);color:var(--bone);border-radius:999px;padding:.6rem 1.3rem;
font-size:.88rem;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.bt-book:hover{background:var(--accent);color:#fff}

/* -- Hero. One picture, given room. -- */
.bt-hero{position:relative;min-height:clamp(24rem,64vh,38rem);display:grid;align-items:end;
background:var(--blush) center/cover no-repeat;overflow:hidden}
.bt-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(transparent 30%,rgba(30,22,19,.62))}
.bt-hero-in{position:relative;z-index:1;padding:2.5rem 0 3rem;color:#fff}
.bt-hero .bt-wrap{width:100%}
.bt-eyebrow{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;margin-bottom:1.1rem;
opacity:.85}
.bt-hero h1{font-size:clamp(2.4rem,7vw,4.4rem);color:#fff}
.bt-lede{margin-top:1.1rem;max-width:32rem;font-size:1.04rem;color:rgba(255,255,255,.9)}
.bt-hero .bt-doing{margin-top:1.8rem;display:flex;flex-wrap:wrap;gap:.7rem}
.bt-btn{background:#fff;color:var(--ink);border-radius:999px;padding:.85rem 1.8rem;
font-size:.88rem;letter-spacing:.06em;text-transform:uppercase}
.bt-btn:hover{background:var(--accent);color:#fff}
.bt-btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
.bt-btn.ghost:hover{background:rgba(255,255,255,.14);color:#fff}

/* -- Sections -- */
.bt-sec{padding:4.5rem 0}
.bt-sec.tint{background:var(--blush)}
.bt-label{font-size:.7rem;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);
margin-bottom:.9rem}
.bt-sec h2{font-size:clamp(1.8rem,4.4vw,2.7rem)}
.bt-sub{margin-top:.9rem;color:var(--dim);max-width:34rem}

/* -- The treatment list. Duration and price, in the open. -- */
.bt-menu{margin-top:2.4rem;display:grid;gap:2.6rem;grid-template-columns:1fr}
@media(min-width:820px){.bt-menu{grid-template-columns:repeat(2,1fr);gap:2.6rem 3.5rem}}
.bt-group h3{font-family:var(--display);font-size:1.25rem;padding-bottom:.7rem;
border-bottom:1px solid var(--line);margin-bottom:1.1rem}
.bt-item{display:grid;grid-template-columns:1fr auto;gap:.3rem 1rem;padding:.75rem 0;
border-bottom:1px solid color-mix(in srgb,var(--line) 60%,transparent)}
.bt-item:last-child{border-bottom:0}
.bt-item b{font-weight:600;font-size:1rem}
.bt-item .bt-price{font-family:var(--display);font-size:1.05rem;white-space:nowrap;
color:var(--accent)}
.bt-item p{grid-column:1/-1;color:var(--dim);font-size:.9rem;margin-top:.1rem;max-width:34rem}

/* -- The numbers that do the vouching -- */
.bt-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2.4rem;
background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
@media(min-width:760px){.bt-stats{grid-template-columns:repeat(4,1fr)}}
.bt-stat{background:var(--card);padding:1.6rem 1rem;text-align:center}
.bt-stat b{display:block;font-family:var(--display);font-size:clamp(1.6rem,4vw,2.3rem);
line-height:1;color:var(--accent)}
.bt-stat span{display:block;margin-top:.5rem;font-size:.74rem;letter-spacing:.14em;
text-transform:uppercase;color:var(--dim)}

/* -- The room -- */
.bt-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:2.2rem}
@media(min-width:760px){.bt-shots{grid-template-columns:repeat(3,1fr);gap:1rem}}
.bt-shot{aspect-ratio:4/5;border-radius:12px;background:var(--blush) center/cover no-repeat}
.bt-shot:first-child{grid-column:span 2;aspect-ratio:16/11}
@media(min-width:760px){.bt-shot:first-child{grid-column:span 2;aspect-ratio:16/10}}

/* -- Credentials, hours -- */
.bt-two{display:grid;gap:2.6rem;grid-template-columns:1fr;margin-top:2.4rem}
@media(min-width:820px){.bt-two{grid-template-columns:1.1fr .9fr;gap:3.5rem}}
.bt-creds{display:grid;gap:.9rem}
.bt-cred{display:flex;gap:.8rem;align-items:flex-start}
.bt-cred i{flex:none;width:1.5rem;height:1.5rem;border-radius:50%;margin-top:.15rem;
background:var(--blush);display:grid;place-items:center;font-style:normal;font-size:.7rem;
color:var(--accent);font-weight:700}
.bt-cred b{display:block;font-weight:600;font-size:.98rem}
.bt-cred span{color:var(--dim);font-size:.9rem}
.bt-hours{border:1px solid var(--line);border-radius:14px;background:var(--card);padding:1.5rem}
.bt-hours div{display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;
border-bottom:1px solid color-mix(in srgb,var(--line) 60%,transparent);font-size:.95rem}
.bt-hours div:last-child{border-bottom:0}
.bt-hours span:last-child{color:var(--dim)}

.bt-quote{max-width:44rem;margin:0 auto;text-align:center}
.bt-quote p{font-family:var(--display);font-size:clamp(1.3rem,3.2vw,1.9rem);line-height:1.45}
.bt-quote cite{display:block;margin-top:1.2rem;font-style:normal;font-size:.8rem;
letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}

.bt-end{text-align:center}
.bt-end h2{text-align:center}
.bt-end .bt-doing{justify-content:center;margin-top:1.8rem;display:flex;flex-wrap:wrap;gap:.7rem}
.bt-end .bt-btn{background:var(--ink);color:var(--bone)}
.bt-end .bt-btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}
.bt-addr{margin-top:1.1rem;color:var(--dim)}

.bt-foot{border-top:1px solid var(--line);padding:2rem 0 6.5rem;text-align:center;
color:var(--dim);font-size:.82rem;display:block}
.bt-foot a{color:var(--dim);border-bottom:1px solid var(--line)}

/* Booking is never more than a thumb away. */
.bt-bar{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;gap:.6rem;
padding:.7rem 1rem calc(.7rem + env(safe-area-inset-bottom));
background:color-mix(in srgb,var(--ink) 96%,transparent);backdrop-filter:blur(8px)}
@media(min-width:820px){.bt-bar{display:none}}
.bt-bar a{flex:1;text-align:center;border-radius:999px;padding:.8rem;font-size:.85rem;
letter-spacing:.06em;text-transform:uppercase;background:var(--bone);color:var(--ink)}
.bt-bar a.tel{background:transparent;color:var(--bone);border:1px solid rgba(255,255,255,.35)}
`;

const pick = (site: SiteConfig, type: string): SiteSection | undefined =>
  (site.sections || []).find((s) => s && s.type === type);

export function renderBeautyBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const book = esc(site.cta || 'Book now');

  const treatments = (pick(site, 'menu')?.menu || []) as MenuGroup[];
  const stats = pick(site, 'specs');
  const creds = pick(site, 'credentials');
  const hours = pick(site, 'hours');
  const quote = pick(site, 'testimonial');
  const about = pick(site, 'about');

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 5);

  const treatmentsHtml = treatments.length
    ? `<section class="bt-sec" id="treatments"><div class="bt-wrap">
    <p class="bt-label">${esc(pick(site, 'menu')?.label || 'Treatments')}</p>
    <h2>${esc(pick(site, 'menu')?.title || 'What we do')}</h2>
    <div class="bt-menu">${treatments
      .slice(0, 8)
      .map(
        (g) => `<div class="bt-group">
        ${g.heading ? `<h3>${esc(g.heading)}</h3>` : ''}
        ${(g.items || [])
          .slice(0, 14)
          .map(
            (t) => `<div class="bt-item">
            <b>${esc(t?.name || '')}</b>
            ${t?.price ? `<span class="bt-price">${esc(t.price)}</span>` : '<span></span>'}
            ${t?.text ? `<p>${esc(t.text)}</p>` : ''}
          </div>`
          )
          .join('')}
      </div>`
      )
      .join('')}</div>
  </div></section>`
    : '';

  const statsHtml = (stats?.items || []).length
    ? `<section class="bt-sec tint"><div class="bt-wrap">
    <div class="bt-stats">${(stats?.items || [])
      .slice(0, 4)
      .map(
        (i) => `<div class="bt-stat"><b>${esc(i[1] || i[0])}</b>
        <span>${esc(i[1] ? i[0] : '')}</span></div>`
      )
      .join('')}</div>
  </div></section>`
    : '';

  const roomHtml = shots.length
    ? `<section class="bt-sec"><div class="bt-wrap">
    <p class="bt-label">The room</p>
    <h2>${esc(about?.title || 'Where you will be')}</h2>
    ${about?.text ? `<p class="bt-sub">${esc(about.text)}</p>` : ''}
    <div class="bt-shots">${shots
      .map((u) => `<div class="bt-shot" style="background-image:url(${esc(u)})"></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const twoHtml = (creds?.items || []).length || (hours?.rows || []).length
    ? `<section class="bt-sec tint"><div class="bt-wrap"><div class="bt-two">
    <div>
      ${(creds?.items || []).length
        ? `<p class="bt-label">${esc(creds?.label || 'Qualified')}</p>
           <h2>${esc(creds?.title || 'Who is looking after you')}</h2>
           <div class="bt-creds" style="margin-top:1.6rem">${(creds?.items || [])
             .slice(0, 6)
             .map(
               (c) => `<div class="bt-cred"><i>&#10003;</i><div>
               <b>${esc(c[0])}</b>${c[1] ? `<span>${esc(c[1])}</span>` : ''}
             </div></div>`
             )
             .join('')}</div>`
        : ''}
    </div>
    ${(hours?.rows || []).length
      ? `<div class="bt-hours">${(hours?.rows || [])
          .slice(0, 8)
          .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`)
          .join('')}</div>`
      : '<div></div>'}
  </div></div></section>`
    : '';

  const quoteHtml = quote?.quote
    ? `<section class="bt-sec"><div class="bt-wrap"><div class="bt-quote">
    <p>&ldquo;${esc(quote.quote)}&rdquo;</p>
    ${quote.who ? `<cite>${esc(quote.who)}</cite>` : ''}
  </div></div></section>`
    : '';

  return `
<nav class="bt-nav"><div class="bt-wrap"><div class="bt-nav-in">
  <a class="bt-mark" href="#top">${esc(who)}</a>
  <div class="bt-nav-end">
    ${tel ? `<a class="bt-tel" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    <a class="bt-book" href="#book">${book}</a>
  </div>
</div></div></nav>

<header class="bt-hero" id="top"${hero ? ` style="background-image:url(${esc(hero)})"` : ''}>
  <div class="bt-hero-in"><div class="bt-wrap">
    ${site.eyebrow ? `<p class="bt-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || who)}</h1>
    ${site.lede ? `<p class="bt-lede">${esc(site.lede)}</p>` : ''}
    <div class="bt-doing">
      <a class="bt-btn" href="#book">${book}</a>
      ${treatmentsHtml ? '<a class="bt-btn ghost" href="#treatments">See treatments</a>' : ''}
    </div>
  </div></div>
</header>

${treatmentsHtml}
${statsHtml}
${roomHtml}
${twoHtml}
${quoteHtml}

<section class="bt-sec bt-end" id="book"><div class="bt-wrap">
  <p class="bt-label">Booking</p>
  <h2>${esc(quote?.title || 'Come and see us')}</h2>
  ${contact.address ? `<p class="bt-addr">${esc(contact.address)}</p>` : ''}
  <div class="bt-doing">
    ${tel ? `<a class="bt-btn" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    ${contact.email ? `<a class="bt-btn ghost" href="mailto:${esc(contact.email)}">Email us</a>` : ''}
  </div>
</div></section>

<footer class="bt-foot"><div class="bt-wrap">
  <span>${esc(who)}</span> &middot;
  <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
</div></footer>

${tel || contact.email
  ? `<div class="bt-bar">
      <a href="#book">${book}</a>
      ${tel ? `<a class="tel" href="tel:${esc(tel)}">Call</a>` : ''}
    </div>`
  : ''}`;
}
