// WORKSHOP TEMPLATE (style: "workshop")
//
// For makers who teach: pottery, jewellery, woodwork, glass, leather, weaving.
// Built after reading a dozen real ones — The Clay Centre and Ayni in Auckland,
// Ruffshuffler in Christchurch, Workspace Studios, Whanganui Potters, and the
// jewellery benches at Workshop 6 and Jewellers Collective.
//
// They all sell the same thing and it is not a class. It is an object. You go
// home with a ring you made, or four glazed pieces you throw yourself. Every
// good one of these sites says so plainly, and every bad one buries it under
// "an introduction to the fundamentals of the medium". So the card here gives
// the payoff its own line at the bottom, set apart — what you leave with.
//
// Three more things worth stealing from the real ones:
//
// Seats are scarce and saying so is not a trick. Driving Creek caps at six,
// Cora at six, most benches at eight. A number that small is the product —
// it is why the class costs what it costs — so it sits in the strip with the
// price rather than in the small print.
//
// The names are the fun. "Wheel & Wine" on Friday nights, "Coffee & Clay" on
// Saturday mornings, "Saturday Spin". Nobody books "Beginner Wheel Throwing
// Level 1". The card leads with the name and lets the level be a footnote.
//
// And the wait is real. Clay goes away for three or four weeks to be fired,
// which surprises people who expected to carry a mug home that evening. It
// belongs on the page, not in an email afterwards, so `specs` carries it.
//
// The look is the bench: paper, unglazed clay, a warm grey that photographs
// like a workshop floor. Nothing glossy. The maker's hands are the hero.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const WORKSHOP_FONT_QUERY = '&family=Fraunces:opsz,wght@9..144,400;9..144,600';

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

// A workshop's detail line is written as one string by the agent, and the
// pieces are conventional: "3 hours · $140 · max 6 · you take home a silver
// ring". Splitting on the middle dot lets the card lay them out properly
// without inventing new schema for it. If it does not split, the whole line
// just prints as the description — which is what the older templates did.
function parts(text: string): { strip: string[]; home: string | null; blurb: string | null } {
  const bits = String(text || '').split(/\s*[·|]\s*/).map((s) => s.trim()).filter(Boolean);
  if (bits.length < 2) return { strip: [], home: null, blurb: text || null };

  const homeAt = bits.findIndex((b) =>
    /^(you )?(take|go|leave|walk|head)\s+(home|away)|^you (make|leave)|^take home/i.test(b)
  );
  const home = homeAt >= 0 ? bits.splice(homeAt, 1)[0] : null;

  // Anything with a number in it is a fact for the strip; prose is a blurb.
  const strip = bits.filter((b) => /\d/.test(b) && b.length <= 28);
  const rest = bits.filter((b) => !strip.includes(b));
  return { strip, home, blurb: rest.length ? rest.join(' · ') : null };
}

export const WORKSHOP_CSS = `
.wk{--paper:#f6f2ea;--ink:#241f1a;--dim:#7d7266;--line:#e2d9cb;--card:#fffdf9;
--accent:var(--primary);
--clay:color-mix(in srgb,var(--primary) 14%,#f6f2ea);
--display:'Fraunces',Georgia,serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.wk{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.68}
html:has(body.wk),body.wk{overflow-x:clip}
.wk h1,.wk h2,.wk h3{font-family:var(--display);font-weight:600;line-height:1.1;
letter-spacing:-.012em;text-align:left;margin-bottom:0}
.wk ::selection{background:var(--ink);color:var(--paper)}
.wk-wrap{max-width:70rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.wk-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--paper) 93%,transparent);
backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.wk-nav-in{display:flex;align-items:center;gap:1.2rem;padding:.95rem 0}
.wk-mark{font-family:var(--display);font-size:1.18rem;letter-spacing:-.01em}
.wk-nav-end{margin-left:auto;display:flex;align-items:center;gap:1rem}
.wk-tel{display:none;font-size:.92rem;color:var(--dim)}
@media(min-width:620px){.wk-tel{display:inline}}
.wk-book{background:var(--ink);color:var(--paper);border-radius:2px;padding:.58rem 1.2rem;
font-size:.86rem;font-weight:500;white-space:nowrap}
.wk-book:hover{background:var(--accent);color:#fff}

/* -- Hero. Hands and material, with the type sitting on the paper beneath
      rather than over the top of the picture. A workshop photo is busy and
      white text on it is unreadable. -- */
.wk-hero{padding:3.2rem 0 0}
.wk-eyebrow{font-size:.7rem;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);
margin-bottom:1rem}
.wk-hero h1{font-size:clamp(2.3rem,6.4vw,4.1rem);max-width:19ch}
.wk-lede{margin-top:1.15rem;max-width:36rem;font-size:1.06rem;color:var(--dim)}
.wk-doing{margin-top:1.8rem;display:flex;flex-wrap:wrap;gap:.7rem}
.wk-btn{background:var(--ink);color:var(--paper);border-radius:2px;padding:.8rem 1.7rem;
font-size:.9rem;font-weight:500}
.wk-btn:hover{background:var(--accent);color:#fff}
.wk-btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--ink)}
.wk-btn.ghost:hover{background:var(--ink);color:var(--paper)}
.wk-shot{margin-top:2.8rem;height:clamp(15rem,44vh,26rem);background:var(--clay) center/cover no-repeat;
border-radius:3px}

/* -- Sections -- */
.wk-sec{padding:4.4rem 0}
.wk-sec.tint{background:var(--clay)}
.wk-label{font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);
margin-bottom:.85rem}
.wk-sec h2{font-size:clamp(1.75rem,4.2vw,2.6rem)}
.wk-sub{margin-top:.9rem;color:var(--dim);max-width:36rem}

/* -- The bench: what you can come and make. The name is the headline because
      nobody books a level, and the payoff sits on its own rule at the foot. -- */
.wk-set{margin-top:2.4rem;display:grid;gap:1.1rem;grid-template-columns:1fr}
@media(min-width:780px){.wk-set{grid-template-columns:repeat(2,1fr);gap:1.2rem}}
.wk-grouped+.wk-grouped{margin-top:2.8rem}
.wk-gh{font-family:var(--display);font-size:1.2rem;padding-bottom:.65rem;
border-bottom:1px solid var(--line)}
.wk-gn{margin-top:.6rem;color:var(--dim);font-size:.9rem}
.wk-card{background:var(--card);border:1px solid var(--line);border-radius:4px;
padding:1.5rem 1.5rem 1.3rem;display:flex;flex-direction:column}
.wk-card b{font-family:var(--display);font-weight:600;font-size:1.2rem;line-height:1.2;
display:block}
.wk-strip{margin-top:.85rem;display:flex;flex-wrap:wrap;gap:.4rem}
.wk-strip span{font-size:.76rem;letter-spacing:.05em;background:var(--clay);color:var(--ink);
border-radius:2px;padding:.26rem .6rem;white-space:nowrap}
.wk-card p{margin-top:.85rem;color:var(--dim);font-size:.93rem}
.wk-cost{font-family:var(--display);font-size:1.5rem;color:var(--accent);
margin-top:.15rem;display:block;line-height:1}
.wk-top{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
.wk-home{margin-top:auto;padding-top:1.05rem;border-top:1px dashed var(--line);
display:flex;gap:.55rem;align-items:baseline;font-size:.9rem}
.wk-home i{font-style:normal;color:var(--accent);flex:none}
.wk-home b{font-family:var(--body);font-weight:600;font-size:.9rem;display:inline}

/* -- The numbers a maker's studio actually needs: seats at the bench, weeks
      to fire, years at it. -- */
.wk-nums{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2.2rem;
background:var(--line);border:1px solid var(--line);border-radius:4px;overflow:hidden}
@media(min-width:760px){.wk-nums{grid-template-columns:repeat(4,1fr)}}
.wk-num{background:var(--card);padding:1.5rem 1rem;text-align:center}
.wk-num b{display:block;font-family:var(--display);font-size:clamp(1.5rem,4vw,2.2rem);
line-height:1;color:var(--accent)}
.wk-num span{display:block;margin-top:.5rem;font-size:.73rem;letter-spacing:.13em;
text-transform:uppercase;color:var(--dim)}
/* A spec value is meant to be a number. The model sometimes answers with a
   sentence — "about a week, depending on kiln loads" — and that at display
   size is a mess, so a long one steps down to something readable. */
.wk-num b.long{font-size:1.02rem;line-height:1.3;font-family:var(--body);font-weight:600}

/* -- On the day -- */
.wk-steps{margin-top:2.2rem;display:grid;gap:1.6rem;grid-template-columns:1fr;counter-reset:s}
@media(min-width:760px){.wk-steps{grid-template-columns:repeat(3,1fr);gap:2rem}}
.wk-step{counter-increment:s}
.wk-step:before{content:counter(s,decimal-leading-zero);font-family:var(--display);
font-size:.95rem;color:var(--accent);display:block;margin-bottom:.6rem;letter-spacing:.08em}
.wk-step b{display:block;font-size:1rem;margin-bottom:.35rem}
.wk-step span{color:var(--dim);font-size:.93rem}

/* -- The work. Deliberately uneven — a shelf of pots is not a grid. -- */
.wk-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:2.2rem}
@media(min-width:760px){.wk-shots{grid-template-columns:repeat(6,1fr);gap:.9rem}}
.wk-pic{aspect-ratio:1;background:var(--clay) center/cover no-repeat;border-radius:3px}
@media(min-width:760px){
  .wk-pic{grid-column:span 2}
  .wk-pic:nth-child(1){grid-column:span 4;aspect-ratio:16/11}
  .wk-pic:nth-child(2){grid-column:span 2;aspect-ratio:4/5}
  .wk-pic:nth-child(5){grid-column:span 4;aspect-ratio:16/9}
}

/* -- Maker + hours -- */
.wk-two{display:grid;gap:2.4rem;grid-template-columns:1fr;margin-top:2.2rem}
@media(min-width:820px){.wk-two{grid-template-columns:1.15fr .85fr;gap:3.4rem}}
.wk-hours{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:1.4rem 1.5rem;
align-self:start}
.wk-hours div{display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;
border-bottom:1px solid color-mix(in srgb,var(--line) 55%,transparent);font-size:.93rem}
.wk-hours div:last-child{border-bottom:0}
.wk-hours span:last-child{color:var(--dim);white-space:nowrap}
.wk-creds{display:grid;gap:.85rem;margin-top:1.5rem}
.wk-cred{display:flex;gap:.7rem;align-items:baseline}
.wk-cred i{font-style:normal;color:var(--accent);flex:none}
.wk-cred b{display:block;font-family:var(--body);font-weight:600;font-size:.96rem}
.wk-cred span{color:var(--dim);font-size:.9rem}

/* -- Quote -- */
.wk-quote{max-width:44rem}
.wk-quote p{font-family:var(--display);font-size:clamp(1.25rem,3vw,1.85rem);line-height:1.35}
.wk-quote cite{display:block;margin-top:1.1rem;font-style:normal;font-size:.86rem;
letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}

/* -- Questions -- */
.wk-qs{margin-top:2rem;max-width:46rem}
.wk-q{border-top:1px solid var(--line);padding:1.15rem 0}
.wk-q:last-child{border-bottom:1px solid var(--line)}
.wk-q b{display:block;font-family:var(--body);font-weight:600;margin-bottom:.35rem}
.wk-q span{color:var(--dim);font-size:.95rem}

/* -- Getting hold of them -- */
.wk-end{background:var(--ink);color:var(--paper);padding:4.4rem 0}
.wk-end h2{color:var(--paper)}
.wk-end .wk-label{color:color-mix(in srgb,var(--primary) 70%,#fff)}
.wk-end .wk-sub{color:rgba(255,255,255,.7)}
.wk-lines{margin-top:2rem;display:grid;gap:.9rem}
.wk-line{display:flex;gap:.8rem;align-items:baseline;font-size:1.02rem}
.wk-line i{font-style:normal;opacity:.55;flex:none;width:1.1rem}
.wk-line a{color:var(--paper);border-bottom:1px solid rgba(255,255,255,.35)}
.wk-line a:hover{border-bottom-color:var(--paper)}
`;

export function renderWorkshopBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const book = esc(site.cta || 'Book a bench');

  const classes = pick(site, 'menu');
  const groups = (classes?.menu || []) as MenuGroup[];
  const nums = pick(site, 'specs');
  const day = pick(site, 'steps');
  const maker = pick(site, 'about');
  const creds = pick(site, 'credentials');
  const hours = pick(site, 'hours');
  const quote = pick(site, 'testimonial');
  const faq = pick(site, 'faq');

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 6);

  const card = (item: { name?: string; price?: string; text?: string }) => {
    const { strip, home, blurb } = parts(String(item?.text || ''));
    return `<article class="wk-card">
      <div class="wk-top">
        <b>${esc(item?.name || '')}</b>
        ${item?.price ? `<span class="wk-cost">${esc(item.price)}</span>` : ''}
      </div>
      ${strip.length ? `<div class="wk-strip">${strip.map((s) => `<span>${esc(s)}</span>`).join('')}</div>` : ''}
      ${blurb ? `<p>${esc(blurb)}</p>` : ''}
      ${home ? `<div class="wk-home"><i>&#8594;</i><b>${esc(home)}</b></div>` : ''}
    </article>`;
  };

  // One group renders as a plain set of cards; several get their headings,
  // because "Pottery" and "Jewellery" under one roof is a common enough
  // arrangement to be worth laying out properly.
  const classesHtml = groups.length
    ? `<section class="wk-sec" id="classes"><div class="wk-wrap">
    <p class="wk-label">${esc(classes?.label || 'At the bench')}</p>
    <h2>${esc(classes?.title || 'Come and make something')}</h2>
    ${classes?.text ? `<p class="wk-sub">${esc(classes.text)}</p>` : ''}
    ${groups.length === 1
      ? `<div class="wk-set">${(groups[0].items || []).slice(0, 12).map(card).join('')}</div>`
      : groups.slice(0, 5).map((g) => `<div class="wk-grouped">
          ${g.heading ? `<h3 class="wk-gh">${esc(g.heading)}</h3>` : ''}
          ${g.note ? `<p class="wk-gn">${esc(g.note)}</p>` : ''}
          <div class="wk-set">${(g.items || []).slice(0, 10).map(card).join('')}</div>
        </div>`).join('')}
  </div></section>`
    : '';

  const numsHtml = (nums?.items || []).length
    ? `<section class="wk-sec tint"><div class="wk-wrap">
    <div class="wk-nums">${(nums?.items || [])
      .slice(0, 4)
      .map((i) => {
        const value = String(i[1] || i[0] || '');
        return `<div class="wk-num"><b${value.length > 14 ? ' class="long"' : ''}>${esc(value)}</b>
        <span>${esc(i[1] ? i[0] : '')}</span></div>`;
      })
      .join('')}</div>
  </div></section>`
    : '';

  const dayHtml = (day?.items || []).length
    ? `<section class="wk-sec"><div class="wk-wrap">
    <p class="wk-label">${esc(day?.label || 'On the day')}</p>
    <h2>${esc(day?.title || 'How it goes')}</h2>
    ${day?.text ? `<p class="wk-sub">${esc(day.text)}</p>` : ''}
    <div class="wk-steps">${(day?.items || [])
      .slice(0, 6)
      .map((s) => `<div class="wk-step"><b>${esc(s[0])}</b><span>${esc(s[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const workHtml = shots.length
    ? `<section class="wk-sec tint"><div class="wk-wrap">
    <p class="wk-label">${esc('The work')}</p>
    <h2>${esc('What comes off the bench')}</h2>
    <div class="wk-shots">${shots
      .map((u) => `<div class="wk-pic" style="background-image:url(${esc(u)})"></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const twoHtml = maker?.text || (creds?.items || []).length || (hours?.rows || []).length
    ? `<section class="wk-sec"><div class="wk-wrap"><div class="wk-two">
    <div>
      <p class="wk-label">${esc(maker?.label || creds?.label || 'The maker')}</p>
      <h2>${esc(maker?.title || creds?.title || `Who you will be learning from`)}</h2>
      ${maker?.text ? `<p class="wk-sub">${esc(maker.text)}</p>` : ''}
      ${(creds?.items || []).length
        ? `<div class="wk-creds">${(creds?.items || [])
            .slice(0, 6)
            .map((c) => `<div class="wk-cred"><i>&#10003;</i><div>
              <b>${esc(c[0])}</b>${c[1] ? `<span>${esc(c[1])}</span>` : ''}
            </div></div>`)
            .join('')}</div>`
        : ''}
    </div>
    ${(hours?.rows || []).length
      ? `<div class="wk-hours">${(hours?.rows || [])
          .slice(0, 8)
          .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`)
          .join('')}</div>`
      : '<div></div>'}
  </div></div></section>`
    : '';

  const quoteHtml = quote?.quote
    ? `<section class="wk-sec tint"><div class="wk-wrap"><div class="wk-quote">
    <p>&ldquo;${esc(quote.quote)}&rdquo;</p>
    ${quote.who ? `<cite>${esc(quote.who)}</cite>` : ''}
  </div></div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="wk-sec"><div class="wk-wrap">
    <p class="wk-label">${esc(faq?.label || 'Before you come')}</p>
    <h2>${esc(faq?.title || 'Worth knowing')}</h2>
    <div class="wk-qs">${(faq?.items || [])
      .slice(0, 8)
      .map((q) => `<div class="wk-q"><b>${esc(q[0])}</b><span>${esc(q[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="wk-nav"><div class="wk-wrap"><div class="wk-nav-in">
  <a class="wk-mark" href="#top">${esc(who)}</a>
  <div class="wk-nav-end">
    ${tel ? `<a class="wk-tel" href="tel:${esc(tel)}">${esc(contact.phone)}</a>` : ''}
    <a class="wk-book" href="#book">${book}</a>
  </div>
</div></div></nav>

<header class="wk-hero" id="top"><div class="wk-wrap">
  ${site.eyebrow ? `<p class="wk-eyebrow">${esc(site.eyebrow)}</p>` : ''}
  <h1>${esc(site.headline || who)}</h1>
  ${site.lede ? `<p class="wk-lede">${esc(site.lede)}</p>` : ''}
  <div class="wk-doing">
    <a class="wk-btn" href="#book">${book}</a>
    ${classesHtml ? '<a class="wk-btn ghost" href="#classes">See what is on</a>' : ''}
  </div>
  ${hero ? `<div class="wk-shot" style="background-image:url(${esc(hero)})"></div>` : ''}
</div></header>

${classesHtml}
${numsHtml}
${dayHtml}
${workHtml}
${twoHtml}
${quoteHtml}
${faqHtml}

<section class="wk-end" id="book"><div class="wk-wrap">
  <p class="wk-label">${esc('Get in touch')}</p>
  <h2>${esc(site.cta || 'Come and make something')}</h2>
  <p class="wk-sub">${esc(
    contact.phone || contact.email
      ? 'Benches are small, so a message ahead is the surest way in.'
      : 'Send a message and we will find you a bench.'
  )}</p>
  <div class="wk-lines">
    ${contact.phone ? `<div class="wk-line"><i>&#9742;</i><a href="tel:${esc(tel)}">${esc(contact.phone)}</a></div>` : ''}
    ${contact.email ? `<div class="wk-line"><i>&#9993;</i><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
    ${contact.address ? `<div class="wk-line"><i>&#9906;</i><span>${esc(contact.address)}</span></div>` : ''}
  </div>
</div></section>`;
}
