// TOWNHALL TEMPLATE (style: "townhall")
//
// For community halls, memorial halls, church halls, community houses and
// anywhere else with a room, a kitchen and a bond. Read the Kāpiti Coast
// District Council schedule, Youthtown, Green Bay Community House, Bayview,
// Kumeu and All Saints Hamilton, and three things came up every single time.
//
// The rate has two columns. Community and not-for-profit pay one price, and
// everybody else pays another — $30 an hour against $40, or $10 against $25.
// That is not a discount, it is the whole social contract of a hall, and a
// template that prints one number per room gets it wrong for half the people
// reading. So the rate card is built with two rates side by side from the
// start, and falls back gracefully to one when a venue only has one.
//
// Capacity depends on the layout. The same room is 60 for a sit-down dinner and
// 100 standing. Halls say this because somebody planning a 21st and somebody
// planning a funeral lunch need different answers out of the same room.
//
// And the boring things are the booked things. What is in the kitchen — zip,
// pie warmer, dishwasher, stove — how many chairs and trestles, whether there
// is a PA. The bond, which is frequently two numbers as well: $150 if you are
// out by six, $400 if you go later. Nobody hires a hall on the strength of a
// photograph; they hire it because the answer to "is there a dishwasher" is on
// the page.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const HALL_FONT_QUERY = '&family=Newsreader:opsz,wght@6..72,400;6..72,600';

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

// "$30 / $40" or "$30 community | $40 other" — two rates where a hall has two.
function rates(price: unknown): { community: string; other: string | null } {
  const raw = String(price ?? '').trim();
  const split = raw.split(/\s*[|\/]\s*/).filter(Boolean);
  if (split.length >= 2) return { community: split[0], other: split.slice(1).join(' / ') };
  return { community: raw, other: null };
}

export const HALL_CSS = `
.hl{--paper:#f7f5f0;--ink:#1f1d18;--dim:#6e685d;--line:#e0dbd0;--card:#fff;
--accent:var(--primary);
--tint:color-mix(in srgb,var(--primary) 9%,#f7f5f0);
--display:'Newsreader',Georgia,serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.hl{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.68}
html:has(body.hl),body.hl{overflow-x:clip}
.hl h1,.hl h2,.hl h3{font-family:var(--display);font-weight:600;line-height:1.1;
letter-spacing:-.008em;text-align:left;margin-bottom:0}
.hl ::selection{background:var(--ink);color:var(--paper)}
.hl-wrap{max-width:70rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.hl-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--paper) 93%,transparent);
backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.hl-nav-in{display:flex;align-items:center;gap:1.1rem;padding:.9rem 0}
.hl-mark{font-family:var(--display);font-size:1.2rem}
.hl-nav-end{margin-left:auto;display:flex;align-items:center;gap:1rem}
.hl-tel{display:none;font-size:.92rem;color:var(--dim)}
@media(min-width:620px){.hl-tel{display:inline}}
.hl-book{background:var(--ink);color:var(--paper);border-radius:3px;padding:.56rem 1.2rem;
font-size:.87rem;font-weight:500;white-space:nowrap}
.hl-book:hover{background:var(--accent);color:#fff}

/* -- Hero -- */
.hl-hero{position:relative;min-height:clamp(20rem,54vh,30rem);display:grid;align-items:end;
background:var(--tint) center/cover no-repeat;overflow:hidden}
.hl-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(transparent 32%,rgba(24,21,16,.66))}
.hl-hero-in{position:relative;z-index:1;padding:2.3rem 0 2.7rem;color:#fff}
.hl-hero .hl-wrap{width:100%}
.hl-eyebrow{font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;margin-bottom:.9rem;
opacity:.86}
.hl-hero h1{font-size:clamp(2.2rem,6vw,3.7rem);color:#fff}
.hl-lede{margin-top:1rem;max-width:34rem;font-size:1.04rem;color:rgba(255,255,255,.9)}
.hl-doing{margin-top:1.7rem;display:flex;flex-wrap:wrap;gap:.7rem}
.hl-btn{background:#fff;color:var(--ink);border-radius:3px;padding:.8rem 1.7rem;
font-size:.9rem;font-weight:600}
.hl-btn:hover{background:var(--accent);color:#fff}
.hl-btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
.hl-btn.ghost:hover{background:rgba(255,255,255,.14)}

/* -- Sections -- */
.hl-sec{padding:4.3rem 0}
.hl-sec.tint{background:var(--tint)}
.hl-label{font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);
margin-bottom:.8rem}
.hl-sec h2{font-size:clamp(1.75rem,4.2vw,2.6rem)}
.hl-sub{margin-top:.9rem;color:var(--dim);max-width:36rem}

/* -- The rate card. Two columns, because a hall has two prices. -- */
.hl-rooms{margin-top:2.2rem;display:grid;gap:1.1rem;grid-template-columns:1fr}
@media(min-width:760px){.hl-rooms{grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))}}
.hl-room{border:1px solid var(--line);border-radius:8px;background:var(--card);
padding:1.5rem 1.45rem;display:flex;flex-direction:column}
.hl-room h3{font-size:1.25rem}
.hl-room .hl-holds{margin-top:.5rem;color:var(--dim);font-size:.9rem}
.hl-two-rate{margin-top:1.15rem;display:grid;grid-template-columns:1fr 1fr;gap:1px;
background:var(--line);border:1px solid var(--line);border-radius:6px;overflow:hidden}
.hl-two-rate.one{grid-template-columns:1fr}
.hl-r{background:var(--paper);padding:.85rem .9rem;text-align:center}
.hl-r b{display:block;font-family:var(--display);font-weight:600;font-size:1.3rem;
color:var(--accent);line-height:1}
.hl-r span{display:block;margin-top:.35rem;font-size:.68rem;letter-spacing:.1em;
text-transform:uppercase;color:var(--dim)}
.hl-room p{margin-top:1rem;color:var(--dim);font-size:.92rem}
.hl-gh{font-family:var(--display);font-size:1.2rem;margin:2.4rem 0 .3rem}
.hl-gn{color:var(--dim);font-size:.9rem}

/* -- Capacity by layout: the same room, three answers. -- */
.hl-layouts{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2rem;
background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden}
@media(min-width:760px){.hl-layouts{grid-template-columns:repeat(4,1fr)}}
.hl-layout{background:var(--card);padding:1.6rem 1rem;text-align:center}
.hl-layout b{display:block;font-family:var(--display);font-weight:600;
font-size:clamp(1.7rem,4.4vw,2.4rem);line-height:1;color:var(--accent)}
.hl-layout b.long{font-size:1.02rem;line-height:1.3;font-family:var(--body);font-weight:600}
.hl-layout span{display:block;margin-top:.5rem;font-size:.73rem;letter-spacing:.13em;
text-transform:uppercase;color:var(--dim)}

/* -- What comes with it. The boring list that decides the booking. -- */
.hl-kit{margin-top:2rem;display:grid;gap:.75rem;grid-template-columns:1fr}
@media(min-width:700px){.hl-kit{grid-template-columns:repeat(2,1fr);gap:.75rem 2.4rem}}
.hl-kit-row{display:flex;gap:.7rem;align-items:baseline;padding:.6rem 0;
border-bottom:1px solid var(--line)}
.hl-kit-row i{font-style:normal;color:var(--accent);flex:none}
.hl-kit-row b{font-weight:600;font-size:.97rem}
.hl-kit-row span{color:var(--dim);font-size:.9rem}

/* -- Bond and conditions. Plain, and never in a colour that reads as an
      offer — this is the part people are cross about later. -- */
.hl-terms{margin-top:2rem;border:1px solid var(--line);border-radius:8px;background:var(--card);
padding:1.6rem 1.6rem 1.4rem;max-width:46rem}
.hl-terms b{display:block;font-family:var(--display);font-size:1.08rem;margin-bottom:.8rem}
.hl-terms ul{list-style:none;display:grid;gap:.6rem}
.hl-terms li{display:flex;gap:.7rem;align-items:baseline;font-size:.95rem;color:var(--ink)}
.hl-terms li i{font-style:normal;color:var(--accent);flex:none}
.hl-terms li span{color:var(--dim)}

/* -- Photos, hours, quote, faq -- */
.hl-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:2rem}
@media(min-width:760px){.hl-shots{grid-template-columns:repeat(3,1fr);gap:.9rem}}
.hl-pic{aspect-ratio:4/3;border-radius:8px;background:var(--tint) center/cover no-repeat}
.hl-pic:first-child{grid-column:span 2;aspect-ratio:16/10}
.hl-two{display:grid;gap:2.3rem;grid-template-columns:1fr;margin-top:2rem}
@media(min-width:820px){.hl-two{grid-template-columns:1.1fr .9fr;gap:3.2rem}}
.hl-hours{background:var(--card);border:1px solid var(--line);border-radius:8px;
padding:1.35rem 1.45rem;align-self:start}
.hl-hours div{display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;
border-bottom:1px solid var(--line);font-size:.93rem}
.hl-hours div:last-child{border-bottom:0}
.hl-hours span:last-child{color:var(--dim);white-space:nowrap}
.hl-quote{max-width:44rem}
.hl-quote p{font-family:var(--display);font-size:clamp(1.25rem,3vw,1.85rem);line-height:1.35}
.hl-quote cite{display:block;margin-top:1rem;font-style:normal;font-family:var(--body);
font-size:.84rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.hl-qs{margin-top:1.9rem;max-width:46rem}
.hl-q{border-top:1px solid var(--line);padding:1.1rem 0}
.hl-q:last-child{border-bottom:1px solid var(--line)}
.hl-q b{display:block;font-weight:600;margin-bottom:.3rem}
.hl-q span{color:var(--dim);font-size:.94rem}

/* -- End -- */
.hl-end{padding:4.3rem 0;background:var(--ink);color:var(--paper)}
.hl-end h2{color:var(--paper)}
.hl-end .hl-label{color:color-mix(in srgb,var(--primary) 68%,#fff)}
.hl-end .hl-sub{color:rgba(255,255,255,.72)}
.hl-lines{margin-top:1.9rem;display:grid;gap:.85rem}
.hl-line{display:flex;gap:.8rem;align-items:baseline;font-size:1.02rem}
.hl-line i{font-style:normal;opacity:.5;flex:none;width:1.1rem}
.hl-line a{color:var(--paper);border-bottom:1px solid rgba(255,255,255,.32)}
`;

export function renderHallBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const book = esc(site.cta || 'Check a date');

  const spaces = pick(site, 'menu');
  const spaceGroups = (spaces?.menu || []) as MenuGroup[];
  const layouts = pick(site, 'specs');
  const kit = pick(site, 'credentials');
  const terms = pick(site, 'conditions');
  const hours = pick(site, 'hours');
  const about = pick(site, 'about');
  const quote = pick(site, 'testimonial');
  const faq = pick(site, 'faq');

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 5);

  const spacesHtml = spaceGroups.length
    ? `<section class="hl-sec" id="rooms"><div class="hl-wrap">
    <p class="hl-label">${esc(spaces?.label || 'The rooms')}</p>
    <h2>${esc(spaces?.title || 'What you can hire')}</h2>
    ${spaces?.text ? `<p class="hl-sub">${esc(spaces.text)}</p>` : ''}
    ${spaceGroups.slice(0, 3).map((g) => `<div>
      ${spaceGroups.length > 1 && g.heading ? `<h3 class="hl-gh">${esc(g.heading)}</h3>` : ''}
      ${g.note ? `<p class="hl-gn">${esc(g.note)}</p>` : ''}
      <div class="hl-rooms">${(g.items || []).slice(0, 8).map((r) => {
        const { community, other } = rates(r?.price);
        return `<div class="hl-room">
          <h3>${esc(r?.name || '')}</h3>
          ${community ? `<div class="hl-two-rate${other ? '' : ' one'}">
            <div class="hl-r"><b>${esc(community)}</b><span>${other ? 'Community' : 'Per hour'}</span></div>
            ${other ? `<div class="hl-r"><b>${esc(other)}</b><span>Everyone else</span></div>` : ''}
          </div>` : ''}
          ${r?.text ? `<p>${esc(r.text)}</p>` : ''}
        </div>`;
      }).join('')}</div>
    </div>`).join('')}
  </div></section>`
    : '';

  const layoutsHtml = (layouts?.items || []).length
    ? `<section class="hl-sec tint"><div class="hl-wrap">
    <p class="hl-label">${esc(layouts?.label || 'Capacity')}</p>
    <h2>${esc(layouts?.title || 'How many it holds')}</h2>
    ${layouts?.text ? `<p class="hl-sub">${esc(layouts.text)}</p>` : ''}
    <div class="hl-layouts">${(layouts?.items || []).slice(0, 4).map((i) => {
      const value = String(i[1] || i[0] || '');
      return `<div class="hl-layout"><b${value.length > 14 ? ' class="long"' : ''}>${esc(value)}</b>
        <span>${esc(i[1] ? i[0] : '')}</span></div>`;
    }).join('')}</div>
  </div></section>`
    : '';

  const kitHtml = (kit?.items || []).length
    ? `<section class="hl-sec"><div class="hl-wrap">
    <p class="hl-label">${esc(kit?.label || 'Included')}</p>
    <h2>${esc(kit?.title || 'What comes with it')}</h2>
    <div class="hl-kit">${(kit?.items || []).slice(0, 12)
      .map((k) => `<div class="hl-kit-row"><i>&#10003;</i><div>
        <b>${esc(k[0])}</b>${k[1] ? ` <span>${esc(k[1])}</span>` : ''}
      </div></div>`).join('')}</div>
  </div></section>`
    : '';

  const termsHtml = (terms?.items || []).length
    ? `<section class="hl-sec tint"><div class="hl-wrap">
    <p class="hl-label">${esc(terms?.label || 'The rules')}</p>
    <h2>${esc(terms?.title || 'Bond and conditions')}</h2>
    <div class="hl-terms">
      ${terms?.text ? `<b>${esc(terms.text)}</b>` : ''}
      <ul>${(terms?.items || []).slice(0, 8)
        .map((t) => `<li><i>&#8226;</i><div><b>${esc(t[0])}</b>${t[1] ? ` <span>${esc(t[1])}</span>` : ''}</div></li>`)
        .join('')}</ul>
    </div>
  </div></section>`
    : '';

  const roomHtml = shots.length || about?.text
    ? `<section class="hl-sec"><div class="hl-wrap">
    <p class="hl-label">${esc(about?.label || 'The hall')}</p>
    <h2>${esc(about?.title || 'Have a look')}</h2>
    ${about?.text ? `<p class="hl-sub">${esc(about.text)}</p>` : ''}
    ${shots.length ? `<div class="hl-shots">${shots
      .map((u) => `<div class="hl-pic" style="background-image:url(${esc(u)})"></div>`).join('')}</div>` : ''}
  </div></section>`
    : '';

  const hoursHtml = (hours?.rows || []).length
    ? `<section class="hl-sec tint"><div class="hl-wrap"><div class="hl-two">
    <div>
      <p class="hl-label">${esc(hours?.label || 'Availability')}</p>
      <h2>${esc(hours?.title || 'When it is free')}</h2>
      <p class="hl-sub">${esc('Regular bookings hold these slots. Anything not listed is worth asking about.')}</p>
    </div>
    <div class="hl-hours">${(hours?.rows || []).slice(0, 8)
      .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}</div>
  </div></div></section>`
    : '';

  const quoteHtml = quote?.quote
    ? `<section class="hl-sec"><div class="hl-wrap"><div class="hl-quote">
    <p>&ldquo;${esc(quote.quote)}&rdquo;</p>
    ${quote.who ? `<cite>${esc(quote.who)}</cite>` : ''}
  </div></div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="hl-sec"><div class="hl-wrap">
    <p class="hl-label">${esc(faq?.label || 'Questions')}</p>
    <h2>${esc(faq?.title || 'Asked a lot')}</h2>
    <div class="hl-qs">${(faq?.items || []).slice(0, 8)
      .map((q) => `<div class="hl-q"><b>${esc(q[0])}</b><span>${esc(q[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="hl-nav"><div class="hl-wrap"><div class="hl-nav-in">
  <a class="hl-mark" href="#top">${esc(who)}</a>
  <div class="hl-nav-end">
    ${tel ? `<a class="hl-tel" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    <a class="hl-book" href="#book">${book}</a>
  </div>
</div></div></nav>

<header class="hl-hero" id="top"${hero ? ` style="background-image:url(${esc(hero)})"` : ''}>
  <div class="hl-hero-in"><div class="hl-wrap">
    ${site.eyebrow ? `<p class="hl-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || who)}</h1>
    ${site.lede ? `<p class="hl-lede">${esc(site.lede)}</p>` : ''}
    <div class="hl-doing">
      <a class="hl-btn" href="#book">${book}</a>
      ${spacesHtml ? '<a class="hl-btn ghost" href="#rooms">Rooms and rates</a>' : ''}
    </div>
  </div></div>
</header>

${spacesHtml}
${layoutsHtml}
${kitHtml}
${termsHtml}
${roomHtml}
${hoursHtml}
${quoteHtml}
${faqHtml}

<section class="hl-end" id="book"><div class="hl-wrap">
  <p class="hl-label">${esc('Book it')}</p>
  <h2>${esc(site.cta || 'Check a date')}</h2>
  <p class="hl-sub">${esc('Tell us the date, roughly how many, and what you are doing. We will come back with whether it is free and what it will cost.')}</p>
  <div class="hl-lines">
    ${contact.phone ? `<div class="hl-line"><i>&#9742;</i><a href="tel:${esc(tel)}">${esc(contact.phone)}</a></div>` : ''}
    ${contact.email ? `<div class="hl-line"><i>&#9993;</i><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
    ${contact.address ? `<div class="hl-line"><i>&#9906;</i><span>${esc(contact.address)}</span></div>` : ''}
  </div>
</div></section>`;
}
