// DAYCARE TEMPLATE (style: "daycare")
//
// For early childhood centres, kindergartens, preschools and home-based care.
// This is the most heavily regulated thing garage renders, and the template is
// shaped by that rather than fighting it.
//
// A New Zealand parent lands here with three questions and they are always the
// same three. What does it cost. Do you take my child's age. How many adults
// are in the room. Everything else on the page is decoration next to those.
//
// Fees are banded by age because the funding is. Under two is the expensive
// band — $320 to $380 a week is the national middle — because 20 Hours ECE does
// not apply until three. Two to three is $180 to $300. From three it drops to
// nearly nothing at a participating centre because the government is paying for
// twenty hours a week. A fee table that ignores those bands is telling a parent
// the wrong number by a factor of five, so the bands are the structure of the
// pricing block and not an afterthought.
//
// 20 Hours ECE gets its own explanation rather than a line in a table. The rule
// has edges that centres get in trouble for blurring: three, four and five year
// olds, up to twenty hours a week, no more than six hours in a day, and a
// centre may not charge a fee for those hours. Optional charges are a real and
// separate thing and must be described as optional. The writing guidance is
// explicit about all of it.
//
// Ratios are law, not marketing: one adult to five children under two, one to
// ten over two. They render as plain numbers.
//
// The licence is the other checkable fact. Every centre is licensed by the
// Ministry of Education and has ERO reports. Both are named, never invented —
// a fabricated licence number or ERO rating on a childcare page is the worst
// thing this codebase could produce.
//
// The look is daylight: soft, warm, unfussy. Not primary colours and cartoon
// crayons — real centres photograph beautifully and the parents looking are
// adults.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const DAYCARE_FONT_QUERY = '&family=Nunito:wght@400;600;700';

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

export const DAYCARE_CSS = `
.dc{--day:#fdfbf7;--ink:#26221d;--dim:#726a5f;--line:#eae3d8;--card:#fff;
--accent:var(--primary);
--soft:color-mix(in srgb,var(--primary) 11%,#fdfbf7);
--display:'Nunito',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.dc{background:var(--day);color:var(--ink);font-family:var(--body);line-height:1.68}
html:has(body.dc),body.dc{overflow-x:clip}
.dc h1,.dc h2,.dc h3{font-family:var(--display);font-weight:700;line-height:1.12;
letter-spacing:-.016em;text-align:left;margin-bottom:0}
.dc ::selection{background:var(--accent);color:#fff}
.dc-wrap{max-width:70rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.dc-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--day) 93%,transparent);
backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.dc-nav-in{display:flex;align-items:center;gap:1.1rem;padding:.9rem 0}
.dc-mark{font-family:var(--display);font-weight:700;font-size:1.16rem}
.dc-nav-end{margin-left:auto;display:flex;align-items:center;gap:1rem}
.dc-tel{display:none;font-size:.92rem;color:var(--dim)}
@media(min-width:620px){.dc-tel{display:inline}}
.dc-visit{background:var(--accent);color:#fff;border-radius:999px;padding:.58rem 1.3rem;
font-size:.88rem;font-weight:700;white-space:nowrap}
.dc-visit:hover{filter:brightness(1.08)}

/* -- Hero. Daylight, not primary colours. -- */
.dc-hero{position:relative;min-height:clamp(22rem,58vh,33rem);display:grid;align-items:end;
background:var(--soft) center/cover no-repeat;overflow:hidden}
.dc-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(transparent 30%,rgba(28,24,19,.66))}
.dc-hero-in{position:relative;z-index:1;padding:2.3rem 0 2.8rem;color:#fff}
.dc-hero .dc-wrap{width:100%}
.dc-eyebrow{font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;margin-bottom:.9rem;
opacity:.88}
.dc-hero h1{font-size:clamp(2.1rem,5.8vw,3.6rem);color:#fff;max-width:20ch}
.dc-lede{margin-top:1rem;max-width:34rem;font-size:1.04rem;color:rgba(255,255,255,.9)}
.dc-doing{margin-top:1.7rem;display:flex;flex-wrap:wrap;gap:.7rem}
.dc-btn{background:#fff;color:var(--ink);border-radius:999px;padding:.82rem 1.8rem;
font-size:.9rem;font-weight:700}
.dc-btn:hover{background:var(--accent);color:#fff}
.dc-btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
.dc-btn.ghost:hover{background:rgba(255,255,255,.14)}

/* -- Sections -- */
.dc-sec{padding:4.3rem 0}
.dc-sec.tint{background:var(--soft)}
.dc-label{font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);
margin-bottom:.8rem}
.dc-sec h2{font-size:clamp(1.75rem,4.2vw,2.6rem)}
.dc-sub{margin-top:.9rem;color:var(--dim);max-width:36rem}

/* -- Fees, banded by age, because the funding is. -- */
.dc-bands{margin-top:2.2rem;display:grid;gap:1.1rem;grid-template-columns:1fr}
@media(min-width:760px){.dc-bands{grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}}
.dc-band{border:1px solid var(--line);border-radius:16px;background:var(--card);
padding:1.6rem 1.45rem;display:flex;flex-direction:column}
.dc-band .dc-age{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);
font-weight:700}
.dc-band b{font-family:var(--display);font-weight:700;font-size:1.15rem;margin-top:.5rem;display:block}
.dc-band .dc-fee{font-family:var(--display);font-weight:700;font-size:2rem;line-height:1;
margin-top:.85rem;color:var(--ink)}
.dc-band p{margin-top:.8rem;color:var(--dim);font-size:.92rem}
.dc-gh{font-family:var(--display);font-weight:700;font-size:1.2rem;margin:2.4rem 0 .3rem}
.dc-gn{color:var(--dim);font-size:.9rem}

/* -- 20 Hours ECE. Its own block, because the rule has edges. -- */
.dc-ece{margin-top:2.2rem;border:1px solid color-mix(in srgb,var(--primary) 30%,var(--line));
border-radius:16px;background:var(--soft);padding:1.7rem 1.7rem 1.5rem;max-width:48rem}
.dc-ece b{display:block;font-family:var(--display);font-weight:700;font-size:1.15rem;
margin-bottom:.75rem}
.dc-ece ul{list-style:none;display:grid;gap:.6rem}
.dc-ece li{display:flex;gap:.7rem;align-items:baseline;font-size:.96rem}
.dc-ece li i{font-style:normal;color:var(--accent);flex:none}
.dc-ece li span{color:var(--dim)}

/* -- Ratios and the other numbers that are law. -- */
.dc-nums{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2rem;
background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden}
@media(min-width:760px){.dc-nums{grid-template-columns:repeat(4,1fr)}}
.dc-num{background:var(--card);padding:1.7rem 1rem;text-align:center}
.dc-num b{display:block;font-family:var(--display);font-weight:700;
font-size:clamp(1.6rem,4.4vw,2.4rem);line-height:1;color:var(--accent)}
.dc-num b.long{font-size:1.02rem;line-height:1.3;font-family:var(--body);font-weight:600}
.dc-num span{display:block;margin-top:.5rem;font-size:.73rem;letter-spacing:.13em;
text-transform:uppercase;color:var(--dim)}

/* -- The day. A parent wants to picture it. -- */
.dc-day{margin-top:2rem;display:grid;gap:0;max-width:44rem}
.dc-when{display:grid;grid-template-columns:5.5rem 1fr;gap:1rem;padding:1rem 0;
border-bottom:1px solid var(--line);align-items:baseline}
.dc-when:last-child{border-bottom:0}
.dc-when.noclock{grid-template-columns:1fr}
.dc-when time{font-family:var(--display);font-weight:700;color:var(--accent);font-size:.98rem}
.dc-when b{display:block;font-weight:600;font-size:1rem}
.dc-when span{color:var(--dim);font-size:.92rem}

/* -- Teachers, photos, quote, faq -- */
.dc-people{display:grid;gap:.85rem;margin-top:1.7rem;max-width:44rem}
.dc-person{display:flex;gap:.7rem;align-items:baseline}
.dc-person i{font-style:normal;color:var(--accent);flex:none}
.dc-person b{display:block;font-weight:600;font-size:.98rem}
.dc-person span{color:var(--dim);font-size:.91rem}
.dc-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:2rem}
@media(min-width:760px){.dc-shots{grid-template-columns:repeat(3,1fr);gap:.9rem}}
.dc-pic{aspect-ratio:4/3;border-radius:14px;background:var(--soft) center/cover no-repeat}
.dc-pic:first-child{grid-column:span 2;aspect-ratio:16/10}
.dc-two{display:grid;gap:2.3rem;grid-template-columns:1fr;margin-top:2rem}
@media(min-width:820px){.dc-two{grid-template-columns:1.1fr .9fr;gap:3.2rem}}
.dc-hours{background:var(--card);border:1px solid var(--line);border-radius:16px;
padding:1.35rem 1.45rem;align-self:start}
.dc-hours div{display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;
border-bottom:1px solid var(--line);font-size:.93rem}
.dc-hours div:last-child{border-bottom:0}
.dc-hours span:last-child{color:var(--dim);white-space:nowrap}
.dc-quote{max-width:44rem}
.dc-quote p{font-family:var(--display);font-weight:600;font-size:clamp(1.25rem,3vw,1.85rem);
line-height:1.35}
.dc-quote cite{display:block;margin-top:1rem;font-style:normal;font-family:var(--body);
font-size:.84rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.dc-qs{margin-top:1.9rem;max-width:46rem}
.dc-q{border-top:1px solid var(--line);padding:1.1rem 0}
.dc-q:last-child{border-bottom:1px solid var(--line)}
.dc-q b{display:block;font-weight:600;margin-bottom:.3rem}
.dc-q span{color:var(--dim);font-size:.94rem}

/* -- End, and the licence. Checkable, like the charity number. -- */
.dc-end{padding:4.3rem 0;background:var(--ink);color:var(--day)}
.dc-end h2{color:var(--day)}
.dc-end .dc-label{color:color-mix(in srgb,var(--primary) 68%,#fff)}
.dc-end .dc-sub{color:rgba(255,255,255,.72)}
.dc-lines{margin-top:1.9rem;display:grid;gap:.85rem}
.dc-line{display:flex;gap:.8rem;align-items:baseline;font-size:1.02rem}
.dc-line i{font-style:normal;opacity:.5;flex:none;width:1.1rem}
.dc-line a{color:var(--day);border-bottom:1px solid rgba(255,255,255,.32)}
.dc-lic{margin-top:2.2rem;padding-top:1.4rem;border-top:1px solid rgba(255,255,255,.16);
font-size:.88rem;color:rgba(255,255,255,.62)}
.dc-lic b{font-family:var(--display);font-weight:600;color:rgba(255,255,255,.86)}
`;

export function renderDaycareBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const visit = esc(site.cta || 'Book a visit');

  const fees = pick(site, 'menu');
  const feeGroups = (fees?.menu || []) as MenuGroup[];
  const ece = pick(site, 'conditions');
  const nums = pick(site, 'specs');
  const day = pick(site, 'steps');
  const teachers = pick(site, 'team') || pick(site, 'credentials');
  const about = pick(site, 'about');
  const hours = pick(site, 'hours');
  const quote = pick(site, 'testimonial');
  const faq = pick(site, 'faq');

  // The licence and any ERO report, pulled out to sit beside the legal name.
  const licence = (teachers?.items || [])
    .concat((pick(site, 'credentials')?.items || []))
    .find((i) => /licen[cs]|ministry of education|ERO/i.test(`${i[0]} ${i[1]}`));

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 5);

  // "Under 2 | Pēpi room" in name, the weekly fee in price.
  const feesHtml = feeGroups.length
    ? `<section class="dc-sec" id="fees"><div class="dc-wrap">
    <p class="dc-label">${esc(fees?.label || 'Fees')}</p>
    <h2>${esc(fees?.title || 'What it costs')}</h2>
    ${fees?.text ? `<p class="dc-sub">${esc(fees.text)}</p>` : ''}
    ${feeGroups.slice(0, 3).map((g) => `<div>
      ${feeGroups.length > 1 && g.heading ? `<h3 class="dc-gh">${esc(g.heading)}</h3>` : ''}
      ${g.note ? `<p class="dc-gn">${esc(g.note)}</p>` : ''}
      <div class="dc-bands">${(g.items || []).slice(0, 6).map((b) => {
        const [age, room] = String(b?.name || '').split(/\s*\|\s*/);
        return `<div class="dc-band">
          <span class="dc-age">${esc(age || '')}</span>
          ${room ? `<b>${esc(room)}</b>` : ''}
          ${b?.price ? `<span class="dc-fee">${esc(b.price)}</span>` : ''}
          ${b?.text ? `<p>${esc(b.text)}</p>` : ''}
        </div>`;
      }).join('')}</div>
    </div>`).join('')}
  </div></section>`
    : '';

  const eceHtml = (ece?.items || []).length
    ? `<section class="dc-sec tint"><div class="dc-wrap">
    <p class="dc-label">${esc(ece?.label || 'Funding')}</p>
    <h2>${esc(ece?.title || '20 Hours ECE')}</h2>
    <div class="dc-ece">
      ${ece?.text ? `<b>${esc(ece.text)}</b>` : ''}
      <ul>${(ece?.items || []).slice(0, 8)
        .map((e) => `<li><i>&#8226;</i><div><b>${esc(e[0])}</b>${e[1] ? ` <span>${esc(e[1])}</span>` : ''}</div></li>`)
        .join('')}</ul>
    </div>
  </div></section>`
    : '';

  const numsHtml = (nums?.items || []).length
    ? `<section class="dc-sec"><div class="dc-wrap">
    ${nums?.title ? `<p class="dc-label">${esc(nums?.label || 'The numbers')}</p><h2>${esc(nums.title)}</h2>` : ''}
    <div class="dc-nums">${(nums?.items || []).slice(0, 4).map((i) => {
      const value = String(i[1] || i[0] || '');
      return `<div class="dc-num"><b${value.length > 14 ? ' class="long"' : ''}>${esc(value)}</b>
        <span>${esc(i[1] ? i[0] : '')}</span></div>`;
    }).join('')}</div>
  </div></section>`
    : '';

  const dayHtml = (day?.items || []).length
    ? `<section class="dc-sec tint"><div class="dc-wrap">
    <p class="dc-label">${esc(day?.label || 'The day')}</p>
    <h2>${esc(day?.title || 'How a day goes')}</h2>
    ${day?.text ? `<p class="dc-sub">${esc(day.text)}</p>` : ''}
    <div class="dc-day">${(day?.items || []).slice(0, 8).map((s) => {
      // "8am | Arrival and free play" — the clock gets its own column.
      // The clock arrives two ways and both are the obvious way to write it:
      // piped into the first field, "8am | Arrival and free play", or simply as
      // the first field of the pair with the label second. Read either. When
      // there is no time at all the column closes up, because an empty one
      // reads as a broken table.
      const [head, tail] = String(s[0] || '').split(/\s*\|\s*/);
      const isClock = /^\d{1,2}([.:]\d{2})?\s*(am|pm|noon)?$/i.test(head.trim());
      const clock = tail ? head : isClock ? head : '';
      const label = tail || (isClock ? String(s[1] || '') : head);
      const note = tail || !isClock ? String(s[1] || '') : '';
      return `<div class="dc-when${clock ? '' : ' noclock'}">
        ${clock ? `<time>${esc(clock)}</time>` : ''}
        <div><b>${esc(label)}</b>${note ? `<span>${esc(note)}</span>` : ''}</div>
      </div>`;
    }).join('')}</div>
  </div></section>`
    : '';

  const teachersHtml = (teachers?.items || []).length
    ? `<section class="dc-sec"><div class="dc-wrap">
    <p class="dc-label">${esc(teachers?.label || 'The team')}</p>
    <h2>${esc(teachers?.title || 'Who is in the room')}</h2>
    <div class="dc-people">${(teachers?.items || []).slice(0, 8)
      .map((t) => `<div class="dc-person"><i>&#10003;</i><div>
        <b>${esc(t[0])}</b>${t[1] ? `<span>${esc(t[1])}</span>` : ''}
      </div></div>`).join('')}</div>
  </div></section>`
    : '';

  const placeHtml = shots.length || about?.text
    ? `<section class="dc-sec tint"><div class="dc-wrap">
    <p class="dc-label">${esc(about?.label || 'The centre')}</p>
    <h2>${esc(about?.title || 'Where they will be')}</h2>
    ${about?.text ? `<p class="dc-sub">${esc(about.text)}</p>` : ''}
    ${shots.length ? `<div class="dc-shots">${shots
      .map((u) => `<div class="dc-pic" style="background-image:url(${esc(u)})"></div>`).join('')}</div>` : ''}
  </div></section>`
    : '';

  const hoursHtml = (hours?.rows || []).length
    ? `<section class="dc-sec"><div class="dc-wrap"><div class="dc-two">
    <div>
      <p class="dc-label">${esc(hours?.label || 'Hours')}</p>
      <h2>${esc(hours?.title || 'When we are open')}</h2>
    </div>
    <div class="dc-hours">${(hours?.rows || []).slice(0, 8)
      .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}</div>
  </div></div></section>`
    : '';

  const quoteHtml = quote?.quote
    ? `<section class="dc-sec tint"><div class="dc-wrap"><div class="dc-quote">
    <p>&ldquo;${esc(quote.quote)}&rdquo;</p>
    ${quote.who ? `<cite>${esc(quote.who)}</cite>` : ''}
  </div></div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="dc-sec"><div class="dc-wrap">
    <p class="dc-label">${esc(faq?.label || 'Questions')}</p>
    <h2>${esc(faq?.title || 'What parents ask')}</h2>
    <div class="dc-qs">${(faq?.items || []).slice(0, 8)
      .map((q) => `<div class="dc-q"><b>${esc(q[0])}</b><span>${esc(q[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="dc-nav"><div class="dc-wrap"><div class="dc-nav-in">
  <a class="dc-mark" href="#top">${esc(who)}</a>
  <div class="dc-nav-end">
    ${tel ? `<a class="dc-tel" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    <a class="dc-visit" href="#visit">${visit}</a>
  </div>
</div></div></nav>

<header class="dc-hero" id="top"${hero ? ` style="background-image:url(${esc(hero)})"` : ''}>
  <div class="dc-hero-in"><div class="dc-wrap">
    ${site.eyebrow ? `<p class="dc-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || who)}</h1>
    ${site.lede ? `<p class="dc-lede">${esc(site.lede)}</p>` : ''}
    <div class="dc-doing">
      <a class="dc-btn" href="#visit">${visit}</a>
      ${feesHtml ? '<a class="dc-btn ghost" href="#fees">Fees</a>' : ''}
    </div>
  </div></div>
</header>

${feesHtml}
${eceHtml}
${numsHtml}
${dayHtml}
${teachersHtml}
${placeHtml}
${hoursHtml}
${quoteHtml}
${faqHtml}

<section class="dc-end" id="visit"><div class="dc-wrap">
  <p class="dc-label">${esc('Come and see')}</p>
  <h2>${esc(site.cta || 'Book a visit')}</h2>
  <p class="dc-sub">${esc('Come in while the children are here — a quiet centre tells you nothing. Bring your child and stay as long as you like.')}</p>
  <div class="dc-lines">
    ${contact.phone ? `<div class="dc-line"><i>&#9742;</i><a href="tel:${esc(tel)}">${esc(contact.phone)}</a></div>` : ''}
    ${contact.email ? `<div class="dc-line"><i>&#9993;</i><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
    ${contact.address ? `<div class="dc-line"><i>&#9906;</i><span>${esc(contact.address)}</span></div>` : ''}
  </div>
  ${licence
    ? `<p class="dc-lic">${esc(licence[0])} <b>${esc(licence[1] || '')}</b>. Licensed by the Ministry of Education; ERO reports are public.</p>`
    : ''}
</div></section>`;
}
