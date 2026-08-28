// STUDIO TEMPLATE (styles: "yoga" and "pilates")
//
// Two style codes, one renderer. The research was unambiguous: a yoga studio's
// site and a pilates studio's site need exactly the same things — a timetable
// that works on a phone, prices you can find without asking, teachers with real
// photographs, and one obvious offer for a first-timer. What differs is the
// temperature, not the structure.
//
// So rather than two near-identical files, this is one file with two
// personalities: yoga is warm sand and a serif, pilates is cool grey and a
// geometric sans. Everything underneath is shared, which means a fix to the
// timetable is a fix to both.
//
// Three findings drove the layout, all from studios that convert:
//
//   Most bookings happen on a phone, minutes before class. So the timetable is
//   built for a narrow screen first and simply gets more room on a wide one.
//
//   Hidden pricing is the single biggest drop-off. Passes are on the page with
//   their prices, not behind an enquiry form.
//
//   People book with people, not logos. Teachers get faces and names.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const YOGA_FONT_QUERY = '&family=Lora:ital,wght@0,400;0,500;0,600;1,400';
export const PILATES_FONT_QUERY = '&family=Outfit:wght@300;400;600;800';

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

export const STUDIO_CSS = `
.st{--paper:#faf7f2;--ink:#26221d;--dim:#7d7469;--line:#e9e0d5;--card:#fff;
--accent:var(--primary);
--soft:color-mix(in srgb,var(--primary) 10%,#faf7f2);
--display:'Lora',Georgia,serif;
--body:'Inter',system-ui,-apple-system,sans-serif;
--round:16px;--caps:.02em}
/* Pilates: cooler, flatter, more gym than temple. */
.st.pil{--paper:#f5f6f7;--ink:#15181c;--dim:#6c757e;--line:#e2e6ea;
--soft:color-mix(in srgb,var(--primary) 8%,#f5f6f7);
--display:'Outfit',system-ui,sans-serif;--round:10px;--caps:.14em}
.st{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.7}
html:has(body.st),body.st{overflow-x:clip}
.st h1,.st h2,.st h3{font-family:var(--display);font-weight:600;line-height:1.12;
text-align:left;margin-bottom:0}
.st.pil h1,.st.pil h2{font-weight:800;letter-spacing:-.02em}
.st ::selection{background:var(--ink);color:var(--paper)}
.st-wrap{max-width:70rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.st-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--paper) 92%,transparent);
backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.st-nav-in{display:flex;align-items:center;gap:1rem;padding:.9rem 0}
.st-mark{font-family:var(--display);font-size:1.15rem;letter-spacing:var(--caps)}
.st.pil .st-mark{text-transform:uppercase;font-weight:800;font-size:1rem}
.st-nav-end{margin-left:auto;display:flex;align-items:center;gap:.9rem}
.st-cta{background:var(--ink);color:var(--paper);border-radius:999px;padding:.55rem 1.2rem;
font-size:.87rem;white-space:nowrap}
.st-cta:hover{background:var(--accent);color:#fff}

/* -- Hero -- */
.st-hero{position:relative;min-height:clamp(22rem,58vh,34rem);display:grid;align-items:end;
background:var(--soft) center/cover no-repeat;overflow:hidden}
.st-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(transparent 34%,rgba(20,17,14,.66))}
.st-hero-in{position:relative;z-index:1;padding:2.4rem 0 2.8rem;color:#fff;width:100%}
.st-eyebrow{font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;opacity:.86;
margin-bottom:1rem}
.st-hero h1{font-size:clamp(2.2rem,6.4vw,4rem);color:#fff}
.st-lede{margin-top:1rem;max-width:32rem;color:rgba(255,255,255,.9)}
.st-doing{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:1.7rem}
.st-btn{background:#fff;color:var(--ink);border-radius:999px;padding:.8rem 1.7rem;font-size:.9rem}
.st-btn:hover{background:var(--accent);color:#fff}
.st-btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
.st-btn.ghost:hover{background:rgba(255,255,255,.14);color:#fff}

/* -- The first-timer offer. One thing, said once. -- */
.st-offer{background:var(--ink);color:var(--paper);padding:1.4rem 0}
.st-offer-in{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem 1.4rem}
.st-offer b{font-family:var(--display);font-size:1.15rem}
.st-offer span{color:rgba(255,255,255,.72);font-size:.95rem}
.st-offer a{margin-left:auto;background:var(--paper);color:var(--ink);border-radius:999px;
padding:.6rem 1.3rem;font-size:.87rem;white-space:nowrap}

.st-sec{padding:4rem 0}
.st-sec.tint{background:var(--soft)}
.st-label{font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);
margin-bottom:.8rem}
.st-sec h2{font-size:clamp(1.7rem,4.2vw,2.5rem)}
.st-sub{margin-top:.8rem;color:var(--dim);max-width:34rem}

/* -- Timetable. Narrow screen first: one day after another, big enough to
      read at arm's length on the way out the door. -- */
.st-week{margin-top:2.2rem;display:grid;gap:1.6rem;grid-template-columns:1fr}
@media(min-width:700px){.st-week{grid-template-columns:repeat(2,1fr);gap:1.8rem 2.5rem}}
@media(min-width:1040px){.st-week{grid-template-columns:repeat(3,1fr)}}
.st-day h3{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);
font-family:var(--body);font-weight:700;padding-bottom:.6rem;border-bottom:1px solid var(--line);
margin-bottom:.7rem}
.st-class{display:grid;grid-template-columns:auto 1fr;gap:.1rem .9rem;padding:.55rem 0;
border-bottom:1px solid color-mix(in srgb,var(--line) 55%,transparent)}
.st-class:last-child{border-bottom:0}
.st-time{font-family:var(--display);font-size:1rem;font-weight:600;white-space:nowrap;
color:var(--accent)}
.st-class b{font-weight:600;font-size:.98rem}
.st-class span{grid-column:2;color:var(--dim);font-size:.86rem}

/* -- Passes. Findable, with the number on them. -- */
.st-passes{margin-top:2.2rem;display:grid;gap:1rem;grid-template-columns:1fr}
@media(min-width:640px){.st-passes{grid-template-columns:repeat(3,1fr)}}
.st-pass{background:var(--card);border:1px solid var(--line);border-radius:var(--round);
padding:1.5rem 1.3rem}
.st-pass b{display:block;font-size:.96rem;font-weight:600}
.st-pass i{display:block;font-style:normal;font-family:var(--display);
font-size:clamp(1.6rem,4vw,2.1rem);margin-top:.5rem;color:var(--accent)}
.st-pass span{display:block;margin-top:.4rem;color:var(--dim);font-size:.87rem}

/* -- Teachers. Faces, because people book with people. -- */
.st-people{margin-top:2.2rem;display:grid;gap:1.6rem;grid-template-columns:repeat(2,1fr)}
@media(min-width:760px){.st-people{grid-template-columns:repeat(4,1fr)}}
.st-person img,.st-person .st-blank{width:100%;aspect-ratio:1;border-radius:var(--round);
object-fit:cover;display:block;background:var(--soft)}
.st.pil .st-person img,.st.pil .st-person .st-blank{border-radius:50%}
.st-person b{display:block;margin-top:.8rem;font-size:1rem;font-weight:600}
.st-person em{display:block;font-style:normal;color:var(--accent);font-size:.82rem;
letter-spacing:.06em}
.st-person p{margin-top:.35rem;color:var(--dim);font-size:.87rem}

.st-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:2rem}
@media(min-width:760px){.st-shots{grid-template-columns:repeat(4,1fr);gap:.9rem}}
.st-shot{aspect-ratio:1;border-radius:var(--round);background:var(--soft) center/cover no-repeat}

.st-end{text-align:center}
.st-end h2{text-align:center}
.st-end .st-doing{justify-content:center}
.st-end .st-btn{background:var(--ink);color:var(--paper)}
.st-end .st-btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}
.st-addr{margin-top:1rem;color:var(--dim)}

.st-foot{border-top:1px solid var(--line);padding:2rem 0 3rem;text-align:center;
color:var(--dim);font-size:.82rem;display:block}
.st-foot a{color:var(--dim);border-bottom:1px solid var(--line)}
`;

const pick = (site: SiteConfig, type: string): SiteSection | undefined =>
  (site.sections || []).find((s) => s && s.type === type);

export function renderStudioBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const book = esc(site.cta || 'Book a class');

  // A day per group, a class per item: time in the price field, teacher in the
  // note. The cafe menu shape turns out to be a timetable if you tilt it.
  const week = (pick(site, 'menu')?.menu || []) as MenuGroup[];
  const passes = pick(site, 'pricing');
  const offer = pick(site, 'band');
  const about = pick(site, 'about');
  const team = (site.team || []).filter((p) => p && p.name).slice(0, 8);

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 4);

  const offerHtml = offer?.title
    ? `<section class="st-offer"><div class="st-wrap"><div class="st-offer-in">
    <b>${esc(offer.title)}</b>
    ${offer.text ? `<span>${esc(offer.text)}</span>` : ''}
    <a href="#book">${book}</a>
  </div></div></section>`
    : '';

  const weekHtml = week.length
    ? `<section class="st-sec" id="timetable"><div class="st-wrap">
    <p class="st-label">${esc(pick(site, 'menu')?.label || 'Timetable')}</p>
    <h2>${esc(pick(site, 'menu')?.title || 'The week')}</h2>
    <div class="st-week">${week
      .slice(0, 7)
      .map(
        (day) => `<div class="st-day">
        ${day.heading ? `<h3>${esc(day.heading)}</h3>` : ''}
        ${(day.items || [])
          .slice(0, 10)
          .map(
            (c) => `<div class="st-class">
            <span class="st-time">${esc(c?.price || '')}</span>
            <b>${esc(c?.name || '')}</b>
            ${c?.text ? `<span>${esc(c.text)}</span>` : ''}
          </div>`
          )
          .join('')}
      </div>`
      )
      .join('')}</div>
  </div></section>`
    : '';

  const passHtml = (passes?.items || []).length
    ? `<section class="st-sec tint" id="prices"><div class="st-wrap">
    <p class="st-label">${esc(passes?.label || 'Passes')}</p>
    <h2>${esc(passes?.title || 'What it costs')}</h2>
    ${passes?.text ? `<p class="st-sub">${esc(passes.text)}</p>` : ''}
    <div class="st-passes">${(passes?.items || [])
      .slice(0, 6)
      .map((p) => {
        // "Ten trip pass|$200|Never expires" — price after the first pipe so a
        // plain two-column list still works.
        const [price, note] = String(p[1] || '').split('|');
        return `<div class="st-pass"><b>${esc(p[0])}</b>
        ${price ? `<i>${esc(price.trim())}</i>` : ''}
        ${note ? `<span>${esc(note.trim())}</span>` : ''}
      </div>`;
      })
      .join('')}</div>
  </div></section>`
    : '';

  const teamHtml = team.length
    ? `<section class="st-sec"><div class="st-wrap">
    <p class="st-label">Teachers</p>
    <h2>Who you will be with</h2>
    <div class="st-people">${team
      .map((p) => {
        const face = safeUrl(p.image);
        return `<div class="st-person">
        ${face
          ? `<img src="${esc(face)}" alt="${esc(p.name || '')}" loading="lazy" />`
          : '<div class="st-blank"></div>'}
        <b>${esc(p.name || '')}</b>
        ${p.role ? `<em>${esc(p.role)}</em>` : ''}
        ${p.text ? `<p>${esc(p.text)}</p>` : ''}
      </div>`;
      })
      .join('')}</div>
  </div></section>`
    : '';

  const roomHtml = shots.length
    ? `<section class="st-sec tint"><div class="st-wrap">
    <p class="st-label">The studio</p>
    <h2>${esc(about?.title || 'Where you will be')}</h2>
    ${about?.text ? `<p class="st-sub">${esc(about.text)}</p>` : ''}
    <div class="st-shots">${shots
      .map((u) => `<div class="st-shot" style="background-image:url(${esc(u)})"></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="st-nav"><div class="st-wrap"><div class="st-nav-in">
  <a class="st-mark" href="#top">${esc(who)}</a>
  <div class="st-nav-end">
    ${weekHtml ? '<a href="#timetable">Timetable</a>' : ''}
    ${passHtml ? '<a href="#prices">Prices</a>' : ''}
    <a class="st-cta" href="#book">${book}</a>
  </div>
</div></div></nav>

<header class="st-hero" id="top"${hero ? ` style="background-image:url(${esc(hero)})"` : ''}>
  <div class="st-hero-in"><div class="st-wrap">
    ${site.eyebrow ? `<p class="st-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || who)}</h1>
    ${site.lede ? `<p class="st-lede">${esc(site.lede)}</p>` : ''}
    <div class="st-doing">
      <a class="st-btn" href="#book">${book}</a>
      ${weekHtml ? '<a class="st-btn ghost" href="#timetable">See the timetable</a>' : ''}
    </div>
  </div></div>
</header>

${offerHtml}
${weekHtml}
${passHtml}
${teamHtml}
${roomHtml}

<section class="st-sec st-end" id="book"><div class="st-wrap">
  <p class="st-label">Booking</p>
  <h2>${esc(offer?.title ? 'Come in' : 'Come and try a class')}</h2>
  ${contact.address ? `<p class="st-addr">${esc(contact.address)}</p>` : ''}
  <div class="st-doing">
    ${tel ? `<a class="st-btn" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    ${contact.email ? `<a class="st-btn ghost" href="mailto:${esc(contact.email)}">Email us</a>` : ''}
  </div>
</div></section>

<footer class="st-foot"><div class="st-wrap">
  <span>${esc(who)}</span> &middot;
  <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
</div></footer>`;
}
