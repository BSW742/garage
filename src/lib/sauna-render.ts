// SAUNA TEMPLATE (style: "sauna")
//
// For saunas, bathhouses, ice baths, contrast therapy and the mobile trailer
// parked at the surf club. Built after reading Cora Studio in Grey Lynn,
// O-Studio in Christchurch and Wellington, Genki Vitality, WYLD and Hana.
//
// The thing that makes these pages different from every other wellness page is
// that people genuinely do not know how to do it. Not "what is a facial" — how
// long do I sit in there, how cold is it, will I be all right. Cora answers it
// before it asks for a booking: beginners five to ten minutes in the heat,
// seasoned fifteen to twenty; two to three minutes in the ice, and start at
// thirty seconds if you are new. That advice is the centre of this template.
// It is the round, and it gets the widest block on the page.
//
// The pricing is a different animal too. A salon prices a treatment. A sauna
// prices a body: WYLD is $100 for one, $140 for two, $180 for three, because
// the room costs the same either way. Then packs and weekly memberships on top
// — Cora's ten for $290, O-Studio's five for $490, unlimited at $59 a week.
// So the price list is built to carry three different shapes at once rather
// than a flat menu of services.
//
// Safety is not fine print here. Every real one of these says get out if you
// feel dizzy, and a template for this trade that leaves it off is worse than
// one with an ugly warning box. If the page has no safety section the block
// does not render — but the writing guidance asks for one every time.
//
// The look is the only thing on the site allowed to be two-faced: hot and cold
// held together. Dark room, ember warmth, and a cold edge that shows up on the
// ice half of the round.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const SAUNA_FONT_QUERY = '&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700';

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

// Which half of the round a step belongs to, so the hot ones glow and the cold
// ones do not. Read off the words the step already uses rather than asking the
// agent to tag them — "3. Ice bath, 2 minutes" is self-describing.
function heat(label: string, body: string): 'hot' | 'cold' | 'rest' {
  const t = `${label} ${body}`.toLowerCase();
  if (/\b(ice|cold|plunge|cool|chill|snow|shower)\b/.test(t)) return 'cold';
  if (/\b(sauna|heat|hot|steam|warm|löyly|loyly|sweat)\b/.test(t)) return 'hot';
  return 'rest';
}

export const SAUNA_CSS = `
.sn{--night:#14110f;--deep:#1d1917;--ink:#f4efe9;--dim:#a2968a;--line:#2e2825;
--ember:var(--primary);
--ice:#7fb8d6;
--display:'Bricolage Grotesque',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.sn{background:var(--night);color:var(--ink);font-family:var(--body);line-height:1.68}
html:has(body.sn),body.sn{overflow-x:clip;background:var(--night)}
.sn h1,.sn h2,.sn h3{font-family:var(--display);font-weight:700;line-height:1.06;
letter-spacing:-.022em;text-align:left;margin-bottom:0}
.sn ::selection{background:var(--ember);color:#fff}
.sn-wrap{max-width:70rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.sn-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--night) 88%,transparent);
backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.sn-nav-in{display:flex;align-items:center;gap:1.2rem;padding:.95rem 0}
.sn-mark{font-family:var(--display);font-weight:700;font-size:1.14rem;letter-spacing:-.02em}
.sn-nav-end{margin-left:auto;display:flex;align-items:center;gap:1rem}
.sn-tel{display:none;font-size:.92rem;color:var(--dim)}
@media(min-width:620px){.sn-tel{display:inline}}
.sn-book{background:var(--ember);color:#fff;border-radius:999px;padding:.6rem 1.3rem;
font-size:.87rem;font-weight:600;white-space:nowrap}
.sn-book:hover{filter:brightness(1.12)}

/* -- Hero. The heat comes up off the floor of the picture. -- */
.sn-hero{position:relative;min-height:clamp(26rem,72vh,42rem);display:grid;align-items:end;
background:var(--deep) center/cover no-repeat;overflow:hidden}
.sn-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(transparent 22%,color-mix(in srgb,var(--night) 82%,transparent) 68%,var(--night)),
radial-gradient(120% 60% at 50% 118%,color-mix(in srgb,var(--ember) 40%,transparent),transparent 70%)}
.sn-hero-in{position:relative;z-index:1;padding:2.5rem 0 3.4rem}
.sn-hero .sn-wrap{width:100%}
.sn-eyebrow{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;margin-bottom:1.1rem;
color:var(--ember)}
.sn-hero h1{font-size:clamp(2.5rem,8vw,5rem);max-width:16ch}
.sn-lede{margin-top:1.15rem;max-width:34rem;font-size:1.06rem;color:rgba(244,239,233,.76)}
.sn-doing{margin-top:1.9rem;display:flex;flex-wrap:wrap;gap:.7rem}
.sn-btn{background:var(--ember);color:#fff;border-radius:999px;padding:.85rem 1.9rem;
font-size:.9rem;font-weight:600}
.sn-btn:hover{filter:brightness(1.12)}
.sn-btn.ghost{background:transparent;color:var(--ink);border:1px solid rgba(244,239,233,.35)}
.sn-btn.ghost:hover{background:rgba(244,239,233,.1)}

/* -- Sections -- */
.sn-sec{padding:4.6rem 0}
.sn-sec.tint{background:var(--deep)}
.sn-label{font-size:.7rem;letter-spacing:.26em;text-transform:uppercase;color:var(--ember);
margin-bottom:.85rem}
.sn-sec h2{font-size:clamp(1.85rem,4.6vw,2.9rem)}
.sn-sub{margin-top:.95rem;color:var(--dim);max-width:36rem}

/* -- THE ROUND. The reason this template exists: hot, cold, rest, repeat,
      with the timings a first-timer is actually asking for. -- */
.sn-round{margin-top:2.6rem;display:grid;gap:1rem;grid-template-columns:1fr}
@media(min-width:720px){.sn-round{grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))}}
.sn-leg{position:relative;border:1px solid var(--line);border-radius:12px;padding:1.5rem 1.4rem;
background:var(--deep);overflow:hidden}
.sn-leg:before{content:'';position:absolute;inset:auto 0 0 0;height:2px;background:var(--line)}
.sn-leg.hot:before{background:linear-gradient(90deg,transparent,var(--ember))}
.sn-leg.hot{background:linear-gradient(180deg,var(--deep),color-mix(in srgb,var(--ember) 9%,var(--deep)))}
.sn-leg.cold:before{background:linear-gradient(90deg,transparent,var(--ice))}
.sn-leg.cold{background:linear-gradient(180deg,var(--deep),color-mix(in srgb,var(--ice) 9%,var(--deep)))}
.sn-leg i{font-style:normal;font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;
color:var(--dim);display:block;margin-bottom:.8rem}
.sn-leg.hot i{color:var(--ember)}
.sn-leg.cold i{color:var(--ice)}
.sn-leg b{font-family:var(--display);font-size:1.22rem;display:block;line-height:1.15}
.sn-leg p{margin-top:.6rem;color:var(--dim);font-size:.94rem}

/* -- Sessions. Priced by the body and by the pass, not by the service. -- */
.sn-rates{margin-top:2.4rem;display:grid;gap:1.6rem;grid-template-columns:1fr}
@media(min-width:800px){.sn-rates{grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1.6rem}}
.sn-rate{border:1px solid var(--line);border-radius:14px;background:var(--deep);
padding:1.6rem 1.5rem;display:flex;flex-direction:column}
.sn-rate h3{font-size:1.1rem;letter-spacing:.02em}
.sn-rate .sn-note{margin-top:.5rem;color:var(--dim);font-size:.88rem}
.sn-list{margin-top:1.3rem;display:grid;gap:.1rem}
.sn-row{display:grid;grid-template-columns:1fr auto;gap:.25rem .9rem;padding:.7rem 0;
border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);align-items:baseline}
.sn-row:last-child{border-bottom:0}
.sn-row b{font-weight:600;font-size:.98rem}
.sn-row .sn-cost{font-family:var(--display);font-weight:700;font-size:1.06rem;color:var(--ember);
white-space:nowrap}
.sn-row p{grid-column:1/-1;color:var(--dim);font-size:.87rem;margin-top:.1rem}

/* -- Numbers: how hot, how cold, how long, how many. -- */
.sn-nums{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2.2rem;
background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
@media(min-width:760px){.sn-nums{grid-template-columns:repeat(4,1fr)}}
.sn-num{background:var(--night);padding:1.7rem 1rem;text-align:center}
.sn-num b{display:block;font-family:var(--display);font-size:clamp(1.6rem,4.4vw,2.4rem);
line-height:1;color:var(--ember)}
.sn-num span{display:block;margin-top:.55rem;font-size:.72rem;letter-spacing:.14em;
text-transform:uppercase;color:var(--dim)}
/* A spec value is meant to be a number. The model sometimes answers with a
   sentence — "about a week, depending on kiln loads" — and that at display
   size is a mess, so a long one steps down to something readable. */
.sn-num b.long{font-size:1.02rem;line-height:1.3;font-family:var(--body);font-weight:600}

/* -- Bring / room -- */
.sn-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:2.2rem}
@media(min-width:760px){.sn-shots{grid-template-columns:repeat(3,1fr);gap:1rem}}
.sn-pic{aspect-ratio:4/5;border-radius:12px;background:var(--deep) center/cover no-repeat}
.sn-pic:first-child{grid-column:span 2;aspect-ratio:16/11}
@media(min-width:760px){.sn-pic:first-child{aspect-ratio:16/10}}

.sn-two{display:grid;gap:2.4rem;grid-template-columns:1fr;margin-top:2.2rem}
@media(min-width:820px){.sn-two{grid-template-columns:1.1fr .9fr;gap:3.4rem}}
.sn-bring{display:grid;gap:.8rem;margin-top:1.5rem}
.sn-brings{display:flex;gap:.7rem;align-items:baseline}
.sn-brings i{font-style:normal;color:var(--ember);flex:none}
.sn-brings b{display:block;font-family:var(--body);font-weight:600;font-size:.96rem}
.sn-brings span{color:var(--dim);font-size:.9rem}
.sn-hours{background:var(--deep);border:1px solid var(--line);border-radius:14px;
padding:1.4rem 1.5rem;align-self:start}
.sn-hours div{display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;
border-bottom:1px solid color-mix(in srgb,var(--line) 65%,transparent);font-size:.93rem}
.sn-hours div:last-child{border-bottom:0}
.sn-hours span:last-child{color:var(--dim);white-space:nowrap}

/* -- Safety. Deliberately plain and impossible to mistake for marketing. -- */
.sn-safe{margin-top:2.2rem;border:1px solid color-mix(in srgb,var(--ember) 35%,var(--line));
border-radius:14px;background:color-mix(in srgb,var(--ember) 7%,var(--deep));
padding:1.6rem 1.6rem 1.4rem;max-width:46rem}
.sn-safe b{display:block;font-family:var(--display);font-size:1.05rem;margin-bottom:.75rem}
.sn-safe ul{list-style:none;display:grid;gap:.6rem}
.sn-safe li{display:flex;gap:.7rem;align-items:baseline;font-size:.95rem;color:rgba(244,239,233,.84)}
.sn-safe li i{font-style:normal;color:var(--ember);flex:none}

/* -- Quote + questions -- */
.sn-quote{max-width:44rem}
.sn-quote p{font-family:var(--display);font-weight:500;font-size:clamp(1.3rem,3.2vw,2rem);
line-height:1.3}
.sn-quote cite{display:block;margin-top:1.1rem;font-style:normal;font-size:.84rem;
letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.sn-qs{margin-top:2rem;max-width:46rem}
.sn-q{border-top:1px solid var(--line);padding:1.15rem 0}
.sn-q:last-child{border-bottom:1px solid var(--line)}
.sn-q b{display:block;font-weight:600;margin-bottom:.35rem}
.sn-q span{color:var(--dim);font-size:.95rem}

/* -- End -- */
.sn-end{padding:4.6rem 0;background:
radial-gradient(120% 70% at 50% 0%,color-mix(in srgb,var(--ember) 20%,transparent),transparent 68%),var(--deep)}
.sn-lines{margin-top:2rem;display:grid;gap:.9rem}
.sn-line{display:flex;gap:.8rem;align-items:baseline;font-size:1.02rem}
.sn-line i{font-style:normal;opacity:.5;flex:none;width:1.1rem}
.sn-line a{color:var(--ink);border-bottom:1px solid rgba(244,239,233,.3)}
.sn-line a:hover{border-bottom-color:var(--ink)}
`;

export function renderSaunaBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const book = esc(site.cta || 'Book a session');

  const rates = pick(site, 'menu');
  const groups = (rates?.menu || []) as MenuGroup[];
  const round = pick(site, 'steps');
  const nums = pick(site, 'specs');
  const bring = pick(site, 'credentials');
  const safe = pick(site, 'conditions');
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

  const roundHtml = (round?.items || []).length
    ? `<section class="sn-sec" id="round"><div class="sn-wrap">
    <p class="sn-label">${esc(round?.label || 'The round')}</p>
    <h2>${esc(round?.title || 'If you have never done it')}</h2>
    ${round?.text ? `<p class="sn-sub">${esc(round.text)}</p>` : ''}
    <div class="sn-round">${(round?.items || [])
      .slice(0, 5)
      .map((s, i) => {
        const kind = heat(String(s[0] || ''), String(s[1] || ''));
        return `<div class="sn-leg ${kind}">
          <i>${kind === 'hot' ? 'Heat' : kind === 'cold' ? 'Cold' : 'Rest'} &middot; ${i + 1}</i>
          <b>${esc(s[0])}</b>
          ${s[1] ? `<p>${esc(s[1])}</p>` : ''}
        </div>`;
      })
      .join('')}</div>
  </div></section>`
    : '';

  const ratesHtml = groups.length
    ? `<section class="sn-sec tint" id="rates"><div class="sn-wrap">
    <p class="sn-label">${esc(rates?.label || 'Sessions')}</p>
    <h2>${esc(rates?.title || 'What it costs')}</h2>
    ${rates?.text ? `<p class="sn-sub">${esc(rates.text)}</p>` : ''}
    <div class="sn-rates">${groups
      .slice(0, 4)
      .map((g) => `<div class="sn-rate">
        ${g.heading ? `<h3>${esc(g.heading)}</h3>` : ''}
        ${g.note ? `<p class="sn-note">${esc(g.note)}</p>` : ''}
        <div class="sn-list">${(g.items || [])
          .slice(0, 10)
          .map((r) => `<div class="sn-row">
            <b>${esc(r?.name || '')}</b>
            ${r?.price ? `<span class="sn-cost">${esc(r.price)}</span>` : '<span></span>'}
            ${r?.text ? `<p>${esc(r.text)}</p>` : ''}
          </div>`)
          .join('')}</div>
      </div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const numsHtml = (nums?.items || []).length
    ? `<section class="sn-sec"><div class="sn-wrap">
    <div class="sn-nums">${(nums?.items || [])
      .slice(0, 4)
      .map((i) => {
        const value = String(i[1] || i[0] || '');
        return `<div class="sn-num"><b${value.length > 14 ? ' class="long"' : ''}>${esc(value)}</b>
        <span>${esc(i[1] ? i[0] : '')}</span></div>`;
      })
      .join('')}</div>
  </div></section>`
    : '';

  const roomHtml = shots.length
    ? `<section class="sn-sec tint"><div class="sn-wrap">
    <p class="sn-label">${esc('The room')}</p>
    <h2>${esc(about?.title || 'Where you will be')}</h2>
    ${about?.text ? `<p class="sn-sub">${esc(about.text)}</p>` : ''}
    <div class="sn-shots">${shots
      .map((u) => `<div class="sn-pic" style="background-image:url(${esc(u)})"></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const twoHtml = (bring?.items || []).length || (hours?.rows || []).length
    ? `<section class="sn-sec"><div class="sn-wrap"><div class="sn-two">
    <div>
      ${(bring?.items || []).length
        ? `<p class="sn-label">${esc(bring?.label || 'Bring')}</p>
           <h2>${esc(bring?.title || 'What to bring')}</h2>
           <div class="sn-bring">${(bring?.items || [])
             .slice(0, 6)
             .map((b) => `<div class="sn-brings"><i>&#10003;</i><div>
               <b>${esc(b[0])}</b>${b[1] ? `<span>${esc(b[1])}</span>` : ''}
             </div></div>`)
             .join('')}</div>`
        : ''}
    </div>
    ${(hours?.rows || []).length
      ? `<div class="sn-hours">${(hours?.rows || [])
          .slice(0, 8)
          .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`)
          .join('')}</div>`
      : '<div></div>'}
  </div></div></section>`
    : '';

  // Never dressed up, never coloured like a promotion.
  const safeHtml = (safe?.items || []).length
    ? `<section class="sn-sec tint"><div class="sn-wrap">
    <p class="sn-label">${esc(safe?.label || 'Before you get in')}</p>
    <h2>${esc(safe?.title || 'Looking after yourself')}</h2>
    <div class="sn-safe">
      <b>${esc(safe?.text || 'Heat and cold are strong. Take them at your own pace.')}</b>
      <ul>${(safe?.items || [])
        .slice(0, 8)
        .map((s) => `<li><i>&#8226;</i><span>${esc(s[0])}${s[1] ? ` &mdash; ${esc(s[1])}` : ''}</span></li>`)
        .join('')}</ul>
    </div>
  </div></section>`
    : '';

  const quoteHtml = quote?.quote
    ? `<section class="sn-sec"><div class="sn-wrap"><div class="sn-quote">
    <p>&ldquo;${esc(quote.quote)}&rdquo;</p>
    ${quote.who ? `<cite>${esc(quote.who)}</cite>` : ''}
  </div></div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="sn-sec"><div class="sn-wrap">
    <p class="sn-label">${esc(faq?.label || 'Questions')}</p>
    <h2>${esc(faq?.title || 'Asked a lot')}</h2>
    <div class="sn-qs">${(faq?.items || [])
      .slice(0, 8)
      .map((q) => `<div class="sn-q"><b>${esc(q[0])}</b><span>${esc(q[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="sn-nav"><div class="sn-wrap"><div class="sn-nav-in">
  <a class="sn-mark" href="#top">${esc(who)}</a>
  <div class="sn-nav-end">
    ${tel ? `<a class="sn-tel" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    <a class="sn-book" href="#book">${book}</a>
  </div>
</div></div></nav>

<header class="sn-hero" id="top"${hero ? ` style="background-image:url(${esc(hero)})"` : ''}>
  <div class="sn-hero-in"><div class="sn-wrap">
    ${site.eyebrow ? `<p class="sn-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || who)}</h1>
    ${site.lede ? `<p class="sn-lede">${esc(site.lede)}</p>` : ''}
    <div class="sn-doing">
      <a class="sn-btn" href="#book">${book}</a>
      ${roundHtml ? '<a class="sn-btn ghost" href="#round">Never done it?</a>' : ratesHtml ? '<a class="sn-btn ghost" href="#rates">See prices</a>' : ''}
    </div>
  </div></div>
</header>

${roundHtml}
${ratesHtml}
${numsHtml}
${roomHtml}
${twoHtml}
${safeHtml}
${quoteHtml}
${faqHtml}

<section class="sn-end" id="book"><div class="sn-wrap">
  <p class="sn-label">${esc('Get in')}</p>
  <h2>${esc(site.cta || 'Book a session')}</h2>
  <p class="sn-sub">${esc('Rooms are small and they fill up. A message ahead is the surest way in.')}</p>
  <div class="sn-lines">
    ${contact.phone ? `<div class="sn-line"><i>&#9742;</i><a href="tel:${esc(tel)}">${esc(contact.phone)}</a></div>` : ''}
    ${contact.email ? `<div class="sn-line"><i>&#9993;</i><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
    ${contact.address ? `<div class="sn-line"><i>&#9906;</i><span>${esc(contact.address)}</span></div>` : ''}
  </div>
</div></section>`;
}
