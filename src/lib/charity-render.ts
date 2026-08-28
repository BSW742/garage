// CHARITY TEMPLATE (style: "charity")
//
// For appeals, trusts and community organisations asking for money. Read the
// New Zealand ones that do it well — Kākāpō Recovery, ChildFund NZ, UNICEF
// Aotearoa, Givealittle — and they all do the same one thing.
//
// They convert dollars into objects. Not "your donation helps us continue our
// vital work", but "$30 buys batteries for a remote monitoring device" and "$50
// buys a month of supplementary food pellets for one kākāpō" and "$25 provides
// soap, a torch and hygiene items in an emergency". The amount is a price tag
// on a real thing. That block is the engine of this template and it gets the
// most room, styled as a row of choices rather than a paragraph, because the
// decision being asked for is "which one", not "whether".
//
// Second: the money has a destination. A page that asks for money and never
// says where it lands is the shape of every scam, so "where it goes" is a
// first-class section rather than a footnote.
//
// Third, and this one is regulatory rather than aesthetic. A registered New
// Zealand charity has a number from Charities Services in the form CC12345, and
// it is the single fastest way for somebody to check that a stranger asking for
// money is real. It renders in the footer of every page, beside the legal name.
// The writing guidance is emphatic that it is never to be invented — a made-up
// registration number on a donation page is not a typo, it is a fake charity.
//
// The progress bar is optional and deliberately honest: it only draws when both
// a raised figure and a target are given, and it never rounds up to look better.

import type { SiteConfig, SiteSection, MenuGroup } from './site-render';

export const CHARITY_FONT_QUERY = '&family=Sora:wght@400;600;700';

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

// "$12,400 of $30,000" -> 41%. Returns null unless both numbers are real, so a
// half-filled bar can never appear on a page that has not said what it wants.
function progress(raised: unknown, target: unknown): { pct: number; raised: string; target: string } | null {
  const num = (v: unknown) => {
    const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const r = num(raised);
  const t = num(target);
  if (r === null || t === null) return null;
  return {
    pct: Math.max(0, Math.min(100, Math.round((r / t) * 100))),
    raised: String(raised),
    target: String(target),
  };
}

export const CHARITY_CSS = `
.ch2{--page:#fbfaf8;--ink:#1c1a17;--dim:#6f6960;--line:#e8e3db;--card:#fff;
--accent:var(--primary);
--warm:color-mix(in srgb,var(--primary) 10%,#fbfaf8);
--display:'Sora',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.ch2{background:var(--page);color:var(--ink);font-family:var(--body);line-height:1.68}
html:has(body.ch2),body.ch2{overflow-x:clip}
.ch2 h1,.ch2 h2,.ch2 h3{font-family:var(--display);font-weight:700;line-height:1.08;
letter-spacing:-.022em;text-align:left;margin-bottom:0}
.ch2 ::selection{background:var(--accent);color:#fff}
.ch2-wrap{max-width:70rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav. Donate is never further than the top of the screen. -- */
.ch2-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--page) 93%,transparent);
backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.ch2-nav-in{display:flex;align-items:center;gap:1.1rem;padding:.9rem 0}
.ch2-mark{font-family:var(--display);font-weight:700;font-size:1.1rem;letter-spacing:-.02em}
.ch2-nav-end{margin-left:auto;display:flex;align-items:center;gap:1rem}
.ch2-give{background:var(--accent);color:#fff;border-radius:999px;padding:.58rem 1.3rem;
font-size:.88rem;font-weight:600;white-space:nowrap}
.ch2-give:hover{filter:brightness(1.08)}

/* -- Hero -- */
.ch2-hero{position:relative;min-height:clamp(23rem,62vh,36rem);display:grid;align-items:end;
background:var(--warm) center/cover no-repeat;overflow:hidden}
.ch2-hero:after{content:'';position:absolute;inset:0;
background:linear-gradient(transparent 28%,rgba(20,17,14,.7))}
.ch2-hero-in{position:relative;z-index:1;padding:2.4rem 0 2.8rem;color:#fff}
.ch2-hero .ch2-wrap{width:100%}
.ch2-eyebrow{font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;margin-bottom:1rem;
opacity:.88}
.ch2-hero h1{font-size:clamp(2.2rem,6.4vw,3.9rem);color:#fff;max-width:20ch}
.ch2-lede{margin-top:1.05rem;max-width:34rem;font-size:1.05rem;color:rgba(255,255,255,.9)}

/* -- The bar. Only drawn when both numbers were given. -- */
.ch2-meter{margin-top:1.9rem;max-width:32rem}
.ch2-track{height:9px;border-radius:999px;background:rgba(255,255,255,.25);overflow:hidden}
.ch2-fill{height:100%;border-radius:999px;background:var(--accent)}
.ch2-meter-say{margin-top:.7rem;display:flex;justify-content:space-between;gap:1rem;
font-size:.9rem;color:rgba(255,255,255,.88)}
.ch2-meter-say b{font-family:var(--display);font-weight:700}
.ch2-doing{margin-top:1.7rem;display:flex;flex-wrap:wrap;gap:.7rem}
.ch2-btn{background:var(--accent);color:#fff;border-radius:999px;padding:.85rem 1.9rem;
font-size:.92rem;font-weight:600}
.ch2-btn:hover{filter:brightness(1.08)}
.ch2-btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
.ch2-btn.ghost:hover{background:rgba(255,255,255,.14)}

/* -- Sections -- */
.ch2-sec{padding:4.4rem 0}
.ch2-sec.tint{background:var(--warm)}
.ch2-label{font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);
margin-bottom:.8rem}
.ch2-sec h2{font-size:clamp(1.8rem,4.4vw,2.7rem)}
.ch2-sub{margin-top:.9rem;color:var(--dim);max-width:36rem}

/* -- WHAT IT BUYS. A price tag on a real object; the reason this template
      exists. Laid out as a row of choices, because the question is which. -- */
.ch2-buys{margin-top:2.3rem;display:grid;gap:1rem;grid-template-columns:1fr}
@media(min-width:680px){.ch2-buys{grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))}}
.ch2-buy{border:1px solid var(--line);border-radius:14px;background:var(--card);
padding:1.6rem 1.4rem;display:flex;flex-direction:column;transition:border-color .15s}
.ch2-buy:hover{border-color:var(--accent)}
.ch2-buy .ch2-amt{font-family:var(--display);font-weight:700;font-size:2.1rem;line-height:1;
color:var(--accent)}
.ch2-buy b{margin-top:.85rem;font-weight:600;font-size:1.02rem;display:block;line-height:1.35}
.ch2-buy p{margin-top:.55rem;color:var(--dim);font-size:.9rem}
.ch2-buy-go{margin-top:auto;padding-top:1.1rem}
.ch2-buy-go a{display:inline-block;background:var(--warm);color:var(--ink);border-radius:999px;
padding:.5rem 1.1rem;font-size:.84rem;font-weight:600}
.ch2-buy:hover .ch2-buy-go a{background:var(--accent);color:#fff}
.ch2-gh{font-family:var(--display);font-size:1.15rem;margin:2.4rem 0 .2rem}

/* -- Where it goes -- */
.ch2-splits{margin-top:2rem;display:grid;gap:1rem;max-width:44rem}
.ch2-split b{display:flex;justify-content:space-between;gap:1rem;font-weight:600;font-size:.98rem}
.ch2-split b span:last-child{font-family:var(--display);font-weight:700;color:var(--accent)}
.ch2-split-track{margin-top:.5rem;height:7px;border-radius:999px;background:var(--line);
overflow:hidden}
.ch2-split-fill{height:100%;border-radius:999px;background:var(--accent)}
.ch2-split p{margin-top:.4rem;color:var(--dim);font-size:.88rem}

/* -- Numbers, steps, gallery, quote, faq -- */
.ch2-nums{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:2rem;
background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
@media(min-width:760px){.ch2-nums{grid-template-columns:repeat(4,1fr)}}
.ch2-num{background:var(--card);padding:1.7rem 1rem;text-align:center}
.ch2-num b{display:block;font-family:var(--display);font-weight:700;
font-size:clamp(1.6rem,4.4vw,2.4rem);line-height:1;color:var(--accent)}
.ch2-num b.long{font-size:1.02rem;line-height:1.3;font-family:var(--body);font-weight:600}
.ch2-num span{display:block;margin-top:.5rem;font-size:.73rem;letter-spacing:.14em;
text-transform:uppercase;color:var(--dim)}
.ch2-steps{margin-top:2rem;display:grid;gap:1.5rem;grid-template-columns:1fr;counter-reset:s}
@media(min-width:760px){.ch2-steps{grid-template-columns:repeat(3,1fr);gap:2rem}}
.ch2-step{counter-increment:s}
.ch2-step:before{content:counter(s);font-family:var(--display);font-weight:700;font-size:.9rem;
color:var(--accent);display:block;margin-bottom:.5rem}
.ch2-step b{display:block;font-size:1rem;margin-bottom:.3rem}
.ch2-step span{color:var(--dim);font-size:.93rem}
.ch2-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;margin-top:2rem}
@media(min-width:760px){.ch2-shots{grid-template-columns:repeat(3,1fr);gap:.9rem}}
.ch2-pic{aspect-ratio:4/3;border-radius:12px;background:var(--warm) center/cover no-repeat}
.ch2-pic:first-child{grid-column:span 2;aspect-ratio:16/10}
.ch2-quote{max-width:44rem}
.ch2-quote p{font-family:var(--display);font-weight:600;font-size:clamp(1.25rem,3vw,1.9rem);
line-height:1.32}
.ch2-quote cite{display:block;margin-top:1rem;font-style:normal;font-family:var(--body);
font-size:.84rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.ch2-qs{margin-top:1.9rem;max-width:46rem}
.ch2-q{border-top:1px solid var(--line);padding:1.15rem 0}
.ch2-q:last-child{border-bottom:1px solid var(--line)}
.ch2-q b{display:block;font-weight:600;margin-bottom:.3rem}
.ch2-q span{color:var(--dim);font-size:.94rem}

/* -- End, and the registration. A stranger asking for money should be
      checkable in one click. -- */
.ch2-end{padding:4.4rem 0;background:var(--ink);color:var(--page)}
.ch2-end h2{color:var(--page)}
.ch2-end .ch2-label{color:color-mix(in srgb,var(--primary) 65%,#fff)}
.ch2-end .ch2-sub{color:rgba(255,255,255,.72)}
.ch2-lines{margin-top:1.9rem;display:grid;gap:.85rem}
.ch2-line{display:flex;gap:.8rem;align-items:baseline;font-size:1.02rem}
.ch2-line i{font-style:normal;opacity:.5;flex:none;width:1.1rem}
.ch2-line a{color:var(--page);border-bottom:1px solid rgba(255,255,255,.32)}
.ch2-reg{margin-top:2.2rem;padding-top:1.4rem;border-top:1px solid rgba(255,255,255,.16);
font-size:.88rem;color:rgba(255,255,255,.62)}
.ch2-reg b{font-family:var(--display);font-weight:600;color:rgba(255,255,255,.86)}
`;

export function renderCharityBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);
  const tel = String(contact.phone || '').replace(/[^\d+]/g, '');
  const give = esc(site.cta || 'Donate');

  const buys = pick(site, 'menu');
  const buyGroups = (buys?.menu || []) as MenuGroup[];
  const goes = pick(site, 'rates') || pick(site, 'pricing');
  const nums = pick(site, 'specs');
  const how = pick(site, 'steps');
  const about = pick(site, 'about');
  const quote = pick(site, 'testimonial');
  const faq = pick(site, 'faq');

  // The appeal's own numbers live on the band section, if there is one.
  const appeal = pick(site, 'band') || pick(site, 'appeal');
  const bar = progress(
    (appeal?.items || []).find((i) => /raised|so far/i.test(i[0]))?.[1],
    (appeal?.items || []).find((i) => /goal|target|need/i.test(i[0]))?.[1]
  );

  const registration = (pick(site, 'credentials')?.items || [])
    .find((i) => /^cc\d|charit|registration|registered/i.test(`${i[0]} ${i[1]}`));

  const shots = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s?.type === 'gallery').flatMap((s) => s.images || []),
  ]
    .map(safeUrl)
    .filter((u): u is string => !!u && u !== hero)
    .slice(0, 5);

  const buysHtml = buyGroups.length
    ? `<section class="ch2-sec" id="give"><div class="ch2-wrap">
    <p class="ch2-label">${esc(buys?.label || 'Your donation')}</p>
    <h2>${esc(buys?.title || 'What it buys')}</h2>
    ${buys?.text ? `<p class="ch2-sub">${esc(buys.text)}</p>` : ''}
    ${buyGroups.slice(0, 3).map((g) => `<div>
      ${buyGroups.length > 1 && g.heading ? `<h3 class="ch2-gh">${esc(g.heading)}</h3>` : ''}
      <div class="ch2-buys">${(g.items || []).slice(0, 8).map((b) => `<div class="ch2-buy">
        ${b?.price ? `<span class="ch2-amt">${esc(b.price)}</span>` : ''}
        <b>${esc(b?.name || '')}</b>
        ${b?.text ? `<p>${esc(b.text)}</p>` : ''}
        <div class="ch2-buy-go"><a href="#donate">${esc(site.cta || 'Give this')}</a></div>
      </div>`).join('')}</div>
    </div>`).join('')}
  </div></section>`
    : '';

  // "Straight to the programme | 82" — the share draws its own bar.
  const goesHtml = (goes?.items || []).length
    ? `<section class="ch2-sec tint"><div class="ch2-wrap">
    <p class="ch2-label">${esc(goes?.label || 'Transparency')}</p>
    <h2>${esc(goes?.title || 'Where the money goes')}</h2>
    ${goes?.text ? `<p class="ch2-sub">${esc(goes.text)}</p>` : ''}
    <div class="ch2-splits">${(goes?.items || []).slice(0, 6).map((s) => {
      const share = Number(String(s[1] || '').replace(/[^0-9.]/g, ''));
      const pct = Number.isFinite(share) && share > 0 && share <= 100 ? share : null;
      return `<div class="ch2-split">
        <b><span>${esc(s[0])}</span><span>${esc(s[1] || '')}</span></b>
        ${pct !== null ? `<div class="ch2-split-track"><div class="ch2-split-fill" style="width:${pct}%"></div></div>` : ''}
      </div>`;
    }).join('')}</div>
  </div></section>`
    : '';

  const numsHtml = (nums?.items || []).length
    ? `<section class="ch2-sec"><div class="ch2-wrap">
    <div class="ch2-nums">${(nums?.items || []).slice(0, 4).map((i) => {
      const value = String(i[1] || i[0] || '');
      return `<div class="ch2-num"><b${value.length > 14 ? ' class="long"' : ''}>${esc(value)}</b>
        <span>${esc(i[1] ? i[0] : '')}</span></div>`;
    }).join('')}</div>
  </div></section>`
    : '';

  const howHtml = (how?.items || []).length
    ? `<section class="ch2-sec tint"><div class="ch2-wrap">
    <p class="ch2-label">${esc(how?.label || 'How it works')}</p>
    <h2>${esc(how?.title || 'What happens next')}</h2>
    <div class="ch2-steps">${(how?.items || []).slice(0, 6)
      .map((s) => `<div class="ch2-step"><b>${esc(s[0])}</b><span>${esc(s[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  const workHtml = shots.length || about?.text
    ? `<section class="ch2-sec"><div class="ch2-wrap">
    <p class="ch2-label">${esc(about?.label || 'The work')}</p>
    <h2>${esc(about?.title || 'What we do')}</h2>
    ${about?.text ? `<p class="ch2-sub">${esc(about.text)}</p>` : ''}
    ${shots.length ? `<div class="ch2-shots">${shots
      .map((u) => `<div class="ch2-pic" style="background-image:url(${esc(u)})"></div>`).join('')}</div>` : ''}
  </div></section>`
    : '';

  const quoteHtml = quote?.quote
    ? `<section class="ch2-sec tint"><div class="ch2-wrap"><div class="ch2-quote">
    <p>&ldquo;${esc(quote.quote)}&rdquo;</p>
    ${quote.who ? `<cite>${esc(quote.who)}</cite>` : ''}
  </div></div></section>`
    : '';

  const faqHtml = (faq?.items || []).length
    ? `<section class="ch2-sec"><div class="ch2-wrap">
    <p class="ch2-label">${esc(faq?.label || 'Questions')}</p>
    <h2>${esc(faq?.title || 'Before you give')}</h2>
    <div class="ch2-qs">${(faq?.items || []).slice(0, 8)
      .map((q) => `<div class="ch2-q"><b>${esc(q[0])}</b><span>${esc(q[1] || '')}</span></div>`)
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="ch2-nav"><div class="ch2-wrap"><div class="ch2-nav-in">
  <a class="ch2-mark" href="#top">${esc(who)}</a>
  <div class="ch2-nav-end">
    <a class="ch2-give" href="#donate">${give}</a>
  </div>
</div></div></nav>

<header class="ch2-hero" id="top"${hero ? ` style="background-image:url(${esc(hero)})"` : ''}>
  <div class="ch2-hero-in"><div class="ch2-wrap">
    ${site.eyebrow ? `<p class="ch2-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || who)}</h1>
    ${site.lede ? `<p class="ch2-lede">${esc(site.lede)}</p>` : ''}
    ${bar ? `<div class="ch2-meter">
      <div class="ch2-track"><div class="ch2-fill" style="width:${bar.pct}%"></div></div>
      <div class="ch2-meter-say">
        <span><b>${esc(bar.raised)}</b> raised</span>
        <span>of ${esc(bar.target)}</span>
      </div>
    </div>` : ''}
    <div class="ch2-doing">
      <a class="ch2-btn" href="#donate">${give}</a>
      ${buysHtml ? '<a class="ch2-btn ghost" href="#give">What it buys</a>' : ''}
    </div>
  </div></div>
</header>

${buysHtml}
${goesHtml}
${numsHtml}
${howHtml}
${workHtml}
${quoteHtml}
${faqHtml}

<section class="ch2-end" id="donate"><div class="ch2-wrap">
  <p class="ch2-label">${esc('Give')}</p>
  <h2>${esc(site.cta || 'Donate')}</h2>
  <p class="ch2-sub">${esc('Get in touch and we will tell you exactly where it goes.')}</p>
  <div class="ch2-lines">
    ${contact.phone ? `<div class="ch2-line"><i>&#9742;</i><a href="tel:${esc(tel)}">${esc(contact.phone)}</a></div>` : ''}
    ${contact.email ? `<div class="ch2-line"><i>&#9993;</i><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
    ${contact.address ? `<div class="ch2-line"><i>&#9906;</i><span>${esc(contact.address)}</span></div>` : ''}
  </div>
  ${registration
    ? `<p class="ch2-reg">${esc(registration[0])} <b>${esc(registration[1] || '')}</b>. You can look this up on the Charities Register.</p>`
    : ''}
</div></section>`;
}
