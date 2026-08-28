// CLUB TEMPLATE (styles: "rugby", "soccer", "basketball")
//
// One renderer, three skins — the same arrangement as yoga and pilates, and for
// the same reason. A club is a club. Rolleston RFC, the one I read closest,
// puts the same things on its page as every football and basketball club does:
// who can play and at what age, who pays for the ground, when training is, and
// where the clubrooms are. Three renderers would have been three chances to get
// it inconsistently right.
//
// Two things about real club sites are worth building around.
//
// The sponsors go near the top, not in the footer. Rolleston runs twenty-odd
// local businesses in a band directly under the hero, above the welcome, above
// the history, above everything. That looks like a mistake until you think
// about who the page is for: the club exists because Ray White and the Rolly
// Inn pay for the jerseys, and the people reading are the ones who drink there.
// A sponsor wall buried at the bottom is a club that will struggle to renew.
//
// And the grades are age bands, not team names. Rippa 5–7, Junior Tackle 7–12,
// Intermediate 13–18, Senior Men, Women & Girls. A parent arrives at this page
// asking exactly one question — where does my seven year old go — and the page
// answers it or it has failed.
//
// The draw is deliberately optional. Nearly every real club has handed fixtures
// to a portal — Rugby Xplorer, Comet, PlayHQ — so a template that demands a
// fixture list would either sit empty or invite somebody to invent one. When a
// draw is given it renders; when it is not, the page does not pretend.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const CLUB_FONT_QUERY = '&family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600';

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

// A sponsor list comes back as ["Midland Tyres", ...] about as often as it does
// as [{name: "Midland Tyres"}]. Both are the obvious way to write it, so both
// are read rather than one being declared wrong — the alternative is a wall of
// empty chips, which is what the first live club page rendered.
function sponsorName(entry: unknown): { name: string; link: string | null } {
  if (typeof entry === 'string') return { name: entry, link: null };
  const o = (entry || {}) as any;
  return { name: String(o.name || ''), link: safeUrl(o.contact) };
}

// Same story for a priced list: some come back as menu groups, some as flat
// pairs in items. Subs are short enough that a flat list is a fair guess.
function priced(section: SiteSection | undefined): MenuGroup[] {
  if (!section) return [];
  if ((section.menu || []).length) return section.menu as MenuGroup[];
  if ((section.items || []).length) {
    return [{ items: (section.items || []).map(([name, price]) => ({ name, price })) }];
  }
  return [];
}

export const CLUB_CSS = `
.cb{--pitch:#0f1512;--deep:#161d19;--ink:#f2f4f2;--dim:#9aa5a0;--line:#28322d;
--accent:var(--primary);
--display:'Barlow Condensed',system-ui,sans-serif;
--body:'Barlow',system-ui,-apple-system,sans-serif}
/* Football clubs read colder, basketball reads like a court at night. */
.cb.soc{--pitch:#0c1220;--deep:#131b2c;--line:#243149}
.cb.bkb{--pitch:#17120e;--deep:#211a14;--line:#372c22}
.cb{background:var(--pitch);color:var(--ink);font-family:var(--body);line-height:1.6}
html:has(body.cb),body.cb{overflow-x:clip;background:var(--pitch)}
.cb h1,.cb h2,.cb h3{font-family:var(--display);font-weight:700;line-height:.98;
letter-spacing:.005em;text-transform:uppercase;text-align:left;margin-bottom:0}
.cb ::selection{background:var(--accent);color:#fff}
.cb-wrap{max-width:72rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.cb-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--pitch) 92%,transparent);
backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.cb-nav-in{display:flex;align-items:center;gap:1.1rem;padding:.85rem 0}
.cb-mark{font-family:var(--display);font-weight:700;font-size:1.35rem;text-transform:uppercase;
letter-spacing:.01em}
.cb-nav-end{margin-left:auto;display:flex;align-items:center;gap:1rem}
.cb-tel{display:none;font-size:.9rem;color:var(--dim)}
@media(min-width:620px){.cb-tel{display:inline}}
.cb-join{background:var(--accent);color:#fff;border-radius:3px;padding:.55rem 1.2rem;
font-family:var(--display);font-weight:700;font-size:.95rem;text-transform:uppercase;
letter-spacing:.03em;white-space:nowrap}

/* -- Hero -- */
.cb-hero{position:relative;min-height:clamp(24rem,66vh,38rem);display:grid;align-items:end;
background:var(--deep) center/cover no-repeat;overflow:hidden}
.cb-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(transparent 25%,color-mix(in srgb,var(--pitch) 88%,transparent) 72%,var(--pitch))}
.cb-hero-in{position:relative;z-index:1;padding:2.4rem 0 3rem}
.cb-hero .cb-wrap{width:100%}
.cb-eyebrow{font-family:var(--display);font-size:.9rem;letter-spacing:.2em;text-transform:uppercase;
color:var(--accent);margin-bottom:.8rem}
.cb-hero h1{font-size:clamp(2.8rem,10vw,6rem)}
.cb-lede{margin-top:1rem;max-width:34rem;font-size:1.04rem;color:rgba(242,244,242,.78)}
.cb-doing{margin-top:1.7rem;display:flex;flex-wrap:wrap;gap:.7rem}
.cb-btn{background:var(--accent);color:#fff;border-radius:3px;padding:.8rem 1.7rem;
font-family:var(--display);font-weight:700;font-size:1rem;text-transform:uppercase;letter-spacing:.03em}
.cb-btn.ghost{background:transparent;color:var(--ink);border:1px solid rgba(242,244,242,.35)}
.cb-btn.ghost:hover{background:rgba(242,244,242,.1)}

/* -- The sponsor band, directly under the hero where a club needs it. -- */
.cb-backers{background:var(--deep);border-block:1px solid var(--line);padding:1.5rem 0}
.cb-backers p{font-family:var(--display);font-size:.82rem;letter-spacing:.22em;
text-transform:uppercase;color:var(--dim);margin-bottom:1rem}
.cb-logos{display:flex;flex-wrap:wrap;gap:.5rem}
.cb-logo{border:1px solid var(--line);border-radius:3px;padding:.5rem .95rem;font-size:.9rem;
font-weight:600;color:rgba(242,244,242,.82);background:color-mix(in srgb,var(--ink) 4%,transparent)}
.cb-logo a{color:inherit}
.cb-logo:hover{border-color:var(--accent);color:var(--ink)}

/* -- Sections -- */
.cb-sec{padding:4.2rem 0}
.cb-sec.tint{background:var(--deep)}
.cb-label{font-family:var(--display);font-size:.85rem;letter-spacing:.22em;text-transform:uppercase;
color:var(--accent);margin-bottom:.7rem}
.cb-sec h2{font-size:clamp(2rem,5.4vw,3.2rem)}
.cb-sub{margin-top:.9rem;color:var(--dim);max-width:38rem}

/* -- Grades. The question is "where does my seven year old go", so the age
      band is the loudest thing in the card. -- */
.cb-grades{margin-top:2.2rem;display:grid;gap:1rem;grid-template-columns:1fr}
@media(min-width:700px){.cb-grades{grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}}
.cb-grade{border:1px solid var(--line);border-radius:6px;background:var(--deep);
padding:1.4rem 1.35rem;display:flex;flex-direction:column}
.cb-grade .cb-age{font-family:var(--display);font-weight:700;font-size:1.9rem;color:var(--accent);
line-height:1;letter-spacing:.01em}
.cb-grade b{font-family:var(--display);font-weight:700;font-size:1.18rem;text-transform:uppercase;
margin-top:.55rem;display:block}
.cb-grade p{margin-top:.6rem;color:var(--dim);font-size:.93rem}

/* -- The draw, when they have one. -- */
.cb-draw{margin-top:2rem;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.cb-fix{display:grid;grid-template-columns:1fr auto;gap:.2rem 1rem;padding:.95rem 1.2rem;
border-bottom:1px solid var(--line);align-items:baseline}
.cb-fix:last-child{border-bottom:0}
.cb-fix b{font-family:var(--display);font-weight:700;font-size:1.1rem;text-transform:uppercase}
.cb-fix .cb-when{font-family:var(--display);font-weight:600;color:var(--accent);white-space:nowrap;
font-size:1rem}
.cb-fix span.cb-where{grid-column:1/-1;color:var(--dim);font-size:.88rem}

/* -- Subs and training, side by side. -- */
.cb-cols{display:grid;gap:2.2rem;grid-template-columns:1fr;margin-top:2.2rem}
@media(min-width:820px){.cb-cols{grid-template-columns:1fr 1fr;gap:3rem}}
.cb-rate{display:grid;grid-template-columns:1fr auto;gap:.2rem 1rem;padding:.7rem 0;
border-bottom:1px solid var(--line);align-items:baseline}
.cb-rate:last-child{border-bottom:0}
.cb-rate b{font-weight:600;font-size:.98rem}
.cb-rate .cb-cost{font-family:var(--display);font-weight:700;font-size:1.15rem;color:var(--accent);
white-space:nowrap}
.cb-rate p{grid-column:1/-1;color:var(--dim);font-size:.87rem;margin-top:.1rem}
.cb-gh{font-family:var(--display);font-size:1.15rem;text-transform:uppercase;
padding-bottom:.55rem;border-bottom:1px solid var(--line);margin-bottom:.9rem}
.cb-gn{color:var(--dim);font-size:.88rem;margin:-.5rem 0 .9rem}

/* -- Numbers -- */
.cb-nums{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2rem;
background:var(--line);border:1px solid var(--line);border-radius:6px;overflow:hidden}
@media(min-width:760px){.cb-nums{grid-template-columns:repeat(4,1fr)}}
.cb-num{background:var(--pitch);padding:1.6rem 1rem;text-align:center}
.cb-num b{display:block;font-family:var(--display);font-weight:700;
font-size:clamp(1.9rem,5vw,2.8rem);line-height:1;color:var(--accent)}
.cb-num b.long{font-size:1.05rem;line-height:1.3;font-family:var(--body);font-weight:600}
.cb-num span{display:block;margin-top:.5rem;font-size:.74rem;letter-spacing:.14em;
text-transform:uppercase;color:var(--dim)}

/* -- Photos -- */
.cb-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-top:2rem}
@media(min-width:760px){.cb-shots{grid-template-columns:repeat(4,1fr);gap:.8rem}}
.cb-pic{aspect-ratio:4/3;background:var(--deep) center/cover no-repeat;border-radius:4px}
.cb-pic:first-child{grid-column:span 2;aspect-ratio:16/10}

/* -- Committee -- */
.cb-people{display:grid;gap:.8rem;margin-top:1.6rem}
.cb-person{display:flex;gap:.7rem;align-items:baseline;padding:.7rem 0;
border-bottom:1px solid var(--line)}
.cb-person:last-child{border-bottom:0}
.cb-person b{font-family:var(--display);font-weight:700;text-transform:uppercase;
font-size:1.02rem;flex:none;min-width:9rem}
.cb-person span{color:var(--dim);font-size:.93rem}

/* -- Clubrooms / hours / quote / faq -- */
.cb-hours{background:var(--deep);border:1px solid var(--line);border-radius:6px;
padding:1.3rem 1.4rem;align-self:start}
.cb-hours div{display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;
border-bottom:1px solid var(--line);font-size:.93rem}
.cb-hours div:last-child{border-bottom:0}
.cb-hours span:last-child{color:var(--dim);white-space:nowrap}
.cb-quote{max-width:44rem}
.cb-quote p{font-family:var(--display);font-weight:700;text-transform:uppercase;
font-size:clamp(1.5rem,4vw,2.4rem);line-height:1.06}
.cb-quote cite{display:block;margin-top:1rem;font-style:normal;font-family:var(--body);
font-size:.84rem;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.cb-qs{margin-top:1.8rem;max-width:46rem}
.cb-q{border-top:1px solid var(--line);padding:1.1rem 0}
.cb-q:last-child{border-bottom:1px solid var(--line)}
.cb-q b{display:block;font-weight:600;margin-bottom:.3rem}
.cb-q span{color:var(--dim);font-size:.94rem}

/* -- End -- */
.cb-end{padding:4.2rem 0;background:var(--deep);border-top:1px solid var(--line)}
.cb-lines{margin-top:1.8rem;display:grid;gap:.85rem}
.cb-line{display:flex;gap:.8rem;align-items:baseline;font-size:1.02rem}
.cb-line i{font-style:normal;opacity:.5;flex:none;width:1.1rem}
.cb-line a{color:var(--ink);border-bottom:1px solid rgba(242,244,242,.3)}
.cb-line a:hover{border-bottom-color:var(--ink)}
`;

// What each code calls things. Only the words change; the page does not.
const WORDS: Record<string, { grades: string; game: string; season: string; join: string }> = {
  rugby:      { grades: 'Grades',  game: 'Draw',      season: 'Season',   join: 'Register' },
  soccer:     { grades: 'Grades',  game: 'Fixtures',  season: 'Season',   join: 'Register' },
  basketball: { grades: 'Grades',  game: 'Schedule',  season: 'Season',   join: 'Register' },
};

export function renderClubBody(site: SiteConfig, slug: string): string {
  const words = WORDS[site.style || 'rugby'] || WORDS.rugby;
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const join = esc(site.cta || words.join);

  const grades = pick(site, 'menu');
  const gradeGroups = (grades?.menu || []) as MenuGroup[];
  const draw = pick(site, 'steps');
  const subs = pick(site, 'rates') || pick(site, 'pricing');
  const subGroups = priced(subs);
  const nums = pick(site, 'specs');
  const backers = (site.sections || []).find((s) => (s?.partners || []).length);
  const people = pick(site, 'team') || pick(site, 'credentials');
  const about = pick(site, 'about');
  const hours = pick(site, 'hours');
  const quote = pick(site, 'testimonial');
  const faq = pick(site, 'faq');

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 5);

  // "Rippa Rugby" with "5–7 years" in price: the age leads the card.
  const gradesHtml = gradeGroups.length
    ? `<section class="cb-sec" id="grades"><div class="cb-wrap">
    <p class="cb-label">${esc(grades?.label || words.grades)}</p>
    <h2>${esc(grades?.title || 'Who can play')}</h2>
    ${grades?.text ? `<p class="cb-sub">${esc(grades.text)}</p>` : ''}
    ${gradeGroups.slice(0, 4).map((g) => `<div>
      ${gradeGroups.length > 1 && g.heading ? `<h3 class="cb-gh" style="margin-top:2rem">${esc(g.heading)}</h3>` : ''}
      <div class="cb-grades">${(g.items || []).slice(0, 10).map((t) => `<div class="cb-grade">
        ${t?.price ? `<span class="cb-age">${esc(t.price)}</span>` : ''}
        <b>${esc(t?.name || '')}</b>
        ${t?.text ? `<p>${esc(t.text)}</p>` : ''}
      </div>`).join('')}</div>
    </div>`).join('')}
  </div></section>`
    : '';

  const drawHtml = (draw?.items || []).length
    ? `<section class="cb-sec tint" id="draw"><div class="cb-wrap">
    <p class="cb-label">${esc(draw?.label || words.game)}</p>
    <h2>${esc(draw?.title || 'Coming up')}</h2>
    ${draw?.text ? `<p class="cb-sub">${esc(draw.text)}</p>` : ''}
    <div class="cb-draw">${(draw?.items || []).slice(0, 8).map((f) => {
      // "Saturday 2pm | Rolleston Park" — the time leads, the ground follows.
      const [when, where] = String(f[1] || '').split(/\s*\|\s*/);
      return `<div class="cb-fix">
        <b>${esc(f[0])}</b>
        ${when ? `<span class="cb-when">${esc(when)}</span>` : '<span></span>'}
        ${where ? `<span class="cb-where">${esc(where)}</span>` : ''}
      </div>`;
    }).join('')}</div>
  </div></section>`
    : '';

  const subsHtml = subGroups.length || (hours?.rows || []).length
    ? `<section class="cb-sec"><div class="cb-wrap"><div class="cb-cols">
    <div>
      ${subGroups.length
        ? `<p class="cb-label">${esc(subs?.label || 'Subs')}</p>
           <h2>${esc(subs?.title || 'What it costs')}</h2>
           ${subGroups.slice(0, 3).map((g) => `<div style="margin-top:1.6rem">
             ${g.heading ? `<h3 class="cb-gh">${esc(g.heading)}</h3>` : ''}
             ${g.note ? `<p class="cb-gn">${esc(g.note)}</p>` : ''}
             ${(g.items || []).slice(0, 10).map((r) => `<div class="cb-rate">
               <b>${esc(r?.name || '')}</b>
               ${r?.price ? `<span class="cb-cost">${esc(r.price)}</span>` : '<span></span>'}
               ${r?.text ? `<p>${esc(r.text)}</p>` : ''}
             </div>`).join('')}
           </div>`).join('')}`
        : ''}
    </div>
    ${(hours?.rows || []).length
      ? `<div><p class="cb-label">${esc(hours?.label || 'Training')}</p>
         <h2>${esc(hours?.title || 'When we are on')}</h2>
         <div class="cb-hours" style="margin-top:1.6rem">${(hours?.rows || []).slice(0, 8)
           .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}</div>
         </div>`
      : '<div></div>'}
  </div></div></section>`
    : '';

  const numsHtml = (nums?.items || []).length
    ? `<section class="cb-sec tint"><div class="cb-wrap">
    <div class="cb-nums">${(nums?.items || []).slice(0, 4).map((i) => {
      const value = String(i[1] || i[0] || '');
      return `<div class="cb-num"><b${value.length > 14 ? ' class="long"' : ''}>${esc(value)}</b>
        <span>${esc(i[1] ? i[0] : '')}</span></div>`;
    }).join('')}</div>
  </div></section>`
    : '';

  const clubHtml = shots.length || about?.text
    ? `<section class="cb-sec"><div class="cb-wrap">
    <p class="cb-label">${esc(about?.label || 'The club')}</p>
    <h2>${esc(about?.title || 'Where we are')}</h2>
    ${about?.text ? `<p class="cb-sub">${esc(about.text)}</p>` : ''}
    ${shots.length ? `<div class="cb-shots">${shots
      .map((u) => `<div class="cb-pic" style="background-image:url(${esc(u)})"></div>`).join('')}</div>` : ''}
  </div></section>`
    : '';

  const peopleHtml = (people?.items || []).length
    ? `<section class="cb-sec tint"><div class="cb-wrap">
    <p class="cb-label">${esc(people?.label || 'Committee')}</p>
    <h2>${esc(people?.title || 'Who to ask')}</h2>
    <div class="cb-people">${(people?.items || []).slice(0, 8)
      .map((p) => `<div class="cb-person"><b>${esc(p[0])}</b><span>${esc(p[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const quoteHtml = quote?.quote
    ? `<section class="cb-sec"><div class="cb-wrap"><div class="cb-quote">
    <p>&ldquo;${esc(quote.quote)}&rdquo;</p>
    ${quote.who ? `<cite>${esc(quote.who)}</cite>` : ''}
  </div></div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="cb-sec"><div class="cb-wrap">
    <p class="cb-label">${esc(faq?.label || 'Questions')}</p>
    <h2>${esc(faq?.title || 'Asked a lot')}</h2>
    <div class="cb-qs">${(faq?.items || []).slice(0, 8)
      .map((q) => `<div class="cb-q"><b>${esc(q[0])}</b><span>${esc(q[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  // Directly under the hero. A club that hides its sponsors is a club that
  // will have a hard conversation in March.
  const backersHtml = (backers?.partners || []).length
    ? `<section class="cb-backers"><div class="cb-wrap">
    <p>${esc(backers?.label || backers?.title || 'Our sponsors')}</p>
    <div class="cb-logos">${(backers?.partners || []).slice(0, 24).map((b) => {
      const { name, link } = sponsorName(b);
      if (!name) return '';
      return `<span class="cb-logo">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener nofollow">${esc(name)}</a>` : esc(name)}</span>`;
    }).join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="cb-nav"><div class="cb-wrap"><div class="cb-nav-in">
  <a class="cb-mark" href="#top">${esc(who)}</a>
  <div class="cb-nav-end">
    ${tel ? `<a class="cb-tel" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    <a class="cb-join" href="#join">${join}</a>
  </div>
</div></div></nav>

<header class="cb-hero" id="top"${hero ? ` style="background-image:url(${esc(hero)})"` : ''}>
  <div class="cb-hero-in"><div class="cb-wrap">
    ${site.eyebrow ? `<p class="cb-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || who)}</h1>
    ${site.lede ? `<p class="cb-lede">${esc(site.lede)}</p>` : ''}
    <div class="cb-doing">
      <a class="cb-btn" href="#join">${join}</a>
      ${gradesHtml ? `<a class="cb-btn ghost" href="#grades">${esc(words.grades)}</a>` : ''}
      ${drawHtml ? `<a class="cb-btn ghost" href="#draw">${esc(words.game)}</a>` : ''}
    </div>
  </div></div>
</header>

${backersHtml}
${gradesHtml}
${drawHtml}
${subsHtml}
${numsHtml}
${clubHtml}
${peopleHtml}
${quoteHtml}
${faqHtml}

<section class="cb-end" id="join"><div class="cb-wrap">
  <p class="cb-label">${esc('Get involved')}</p>
  <h2>${esc(site.cta || 'Come down')}</h2>
  <p class="cb-sub">${esc('New players, old players, parents who can run a sausage sizzle — all of it helps.')}</p>
  <div class="cb-lines">
    ${contact.phone ? `<div class="cb-line"><i>&#9742;</i><a href="tel:${esc(tel)}">${esc(contact.phone)}</a></div>` : ''}
    ${contact.email ? `<div class="cb-line"><i>&#9993;</i><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
    ${contact.address ? `<div class="cb-line"><i>&#9906;</i><span>${esc(contact.address)}</span></div>` : ''}
  </div>
</div></section>`;
}
