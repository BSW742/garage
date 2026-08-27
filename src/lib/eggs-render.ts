// PRODUCER TEMPLATE (style: "eggs")
//
// Built after b-egg.farm, for the businesses nothing else here served: people
// who make a thing rather than do a job. Orchards, honey, free-range eggs,
// cheese, olive oil, craft beer, growers who sell through other people's
// shelves.
//
// A producer's page has different work to do from a plumber's. Nobody is
// ringing them for a quote. They need to answer three things fast: what is it,
// why is it better than the one next to it on the shelf, and where do I get it.
// So the page is the range, the proof, and the stockists — in that order.
//
// The proof is certifications, and they are the one thing on this template
// that is worth being pedantic about. "Organic" and "free range" are claims
// with legal weight in New Zealand, so they are rendered as what they are —
// a named certification with a body behind it — rather than as decoration.

import type { SiteConfig, SiteSection } from './site-render';

export const EGGS_FONT_QUERY = '&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800';

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

export const EGGS_CSS = `
.eg{--paper:#fbf6ec;--ink:#231f1a;--dim:#7c7266;--line:#e8ddc9;--card:#fffdf8;
--accent:var(--primary);--yolk:color-mix(in srgb,var(--primary) 55%,#ffc94d);
--display:'Bricolage Grotesque',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.eg{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.65}
html:has(body.eg),body.eg{overflow-x:clip}
.eg h1,.eg h2,.eg h3{font-family:var(--display);font-weight:800;letter-spacing:-.03em;
line-height:.98;text-align:left;margin-bottom:0}
.eg ::selection{background:var(--ink);color:var(--paper)}
.eg-wrap{max-width:70rem;margin:0 auto;padding:0 1.3rem}

/* Soft shapes behind everything, the way a food brand softens a grid. */
.eg-blob{position:absolute;border-radius:50%;filter:blur(50px);opacity:.5;pointer-events:none;
z-index:0}
.eg-blob.a{width:34rem;height:26rem;top:-8rem;right:-10rem;
background:color-mix(in srgb,var(--yolk) 60%,transparent)}
.eg-blob.b{width:26rem;height:22rem;bottom:-6rem;left:-9rem;
background:color-mix(in srgb,var(--accent) 26%,transparent)}

/* -- Hero. The headline is broken across lines on purpose: it is the one
      piece of visual rhythm a page with no illustration budget can afford. -- */
.eg-hero{position:relative;overflow:hidden;padding:4rem 0 3rem}
.eg-hero-in{position:relative;z-index:1;display:grid;gap:2.5rem;align-items:center;
grid-template-columns:1fr}
@media(min-width:900px){.eg-hero-in{grid-template-columns:1.08fr .92fr;gap:3.5rem}}
.eg-eyebrow{display:inline-block;font-family:var(--display);font-weight:700;font-size:.74rem;
letter-spacing:.16em;text-transform:uppercase;color:var(--accent);
border:1.5px solid color-mix(in srgb,var(--accent) 35%,transparent);
border-radius:999px;padding:.4rem 1rem;margin-bottom:1.5rem}
.eg-hero h1{font-size:clamp(2.6rem,7.5vw,5.2rem)}
.eg-hero h1 span{display:block}
.eg-hero h1 span:nth-child(2){padding-left:.7em}
.eg-hero h1 span:nth-child(3){padding-left:.25em;font-style:italic;color:var(--accent)}
.eg-lede{margin-top:1.6rem;font-size:1.08rem;color:var(--dim);max-width:31rem}
.eg-doing{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:2rem}
.eg-btn{display:inline-block;background:var(--ink);color:var(--paper);border-radius:999px;
padding:.85rem 1.7rem;font-weight:600;font-size:.97rem}
.eg-btn:hover{background:var(--accent);color:#fff}
.eg-btn.ghost{background:transparent;color:var(--ink);border:1.5px solid var(--line)}
.eg-btn.ghost:hover{border-color:var(--ink);background:transparent;color:var(--ink)}

.eg-shot{position:relative;border-radius:2rem;overflow:hidden;aspect-ratio:4/3;
background:var(--card) center/cover;box-shadow:0 30px 60px -35px rgba(35,31,26,.5)}
.eg-shot img{width:100%;height:100%;object-fit:cover;display:block}

/* -- The range -- */
.eg-sec{padding:4rem 0 1rem;position:relative}
.eg-sec h2{font-size:clamp(1.8rem,4.5vw,2.9rem);margin-bottom:.6rem}
.eg-sec .eg-sub{color:var(--dim);max-width:34rem;margin-bottom:2.2rem}
.eg-range{display:grid;gap:1.2rem;grid-template-columns:1fr}
@media(min-width:600px){.eg-range{grid-template-columns:repeat(2,1fr)}}
@media(min-width:980px){.eg-range{grid-template-columns:repeat(3,1fr)}}
.eg-item{background:var(--card);border:1px solid var(--line);border-radius:1.4rem;
overflow:hidden;display:flex;flex-direction:column}
.eg-item-shot{aspect-ratio:1;background:color-mix(in srgb,var(--yolk) 22%,var(--card)) center/cover}
.eg-item-shot img{width:100%;height:100%;object-fit:cover;display:block}
.eg-item-say{padding:1.2rem 1.3rem 1.4rem;flex:1;display:flex;flex-direction:column}
.eg-item h3{font-size:1.15rem;letter-spacing:-.02em}
.eg-item p{margin-top:.4rem;color:var(--dim);font-size:.92rem;flex:1}
.eg-item b{display:block;margin-top:.9rem;font-family:var(--display);font-weight:700;
font-size:1.05rem;color:var(--accent)}

/* -- Certifications. A claim with a body behind it, not a sticker. -- */
.eg-certs{display:grid;gap:1rem;grid-template-columns:repeat(2,1fr)}
@media(min-width:760px){.eg-certs{grid-template-columns:repeat(4,1fr)}}
.eg-cert{text-align:center;background:var(--card);border:1px solid var(--line);
border-radius:1.2rem;padding:1.5rem 1rem}
.eg-cert-mark{width:3rem;height:3rem;margin:0 auto .9rem;border-radius:50%;
background:color-mix(in srgb,var(--yolk) 45%,var(--card));
display:grid;place-items:center;font-family:var(--display);font-weight:800;
font-size:1.05rem;color:var(--ink)}
.eg-cert b{display:block;font-size:.96rem;font-weight:600}
.eg-cert span{display:block;margin-top:.3rem;color:var(--dim);font-size:.83rem;line-height:1.5}

/* -- The numbers -- */
.eg-facts{display:grid;gap:0;grid-template-columns:repeat(2,1fr);
border:1px solid var(--line);border-radius:1.4rem;overflow:hidden;background:var(--card)}
@media(min-width:760px){.eg-facts{grid-template-columns:repeat(4,1fr)}}
.eg-fact{padding:1.5rem 1.1rem;text-align:center;
box-shadow:0 0 0 .5px var(--line)}
.eg-fact b{display:block;font-family:var(--display);font-weight:800;
font-size:clamp(1.5rem,4vw,2.1rem);letter-spacing:-.03em}
.eg-fact span{display:block;margin-top:.35rem;font-size:.78rem;letter-spacing:.1em;
text-transform:uppercase;color:var(--dim);font-weight:600}

/* -- Where to buy -- */
.eg-where{display:flex;flex-wrap:wrap;gap:.6rem}
.eg-where a,.eg-where span{border:1px solid var(--line);background:var(--card);
border-radius:999px;padding:.55rem 1.1rem;font-size:.93rem;color:var(--ink)}
.eg-where a:hover{border-color:var(--accent);color:var(--accent)}

.eg-story{background:var(--card);border-radius:2rem;padding:2.5rem 2rem;
border:1px solid var(--line)}
.eg-story p{color:var(--dim);white-space:pre-wrap;max-width:44rem}

.eg-contact{padding:4rem 0 2rem;text-align:center}
.eg-contact h2{text-align:center;font-size:clamp(1.8rem,4.5vw,2.6rem)}
.eg-contact p{margin-top:.9rem;color:var(--dim)}
.eg-contact .eg-doing{justify-content:center}

.eg-foot{border-top:1px solid var(--line);margin-top:2rem;padding:2rem 0 3rem;
color:var(--dim);font-size:.83rem;display:block;text-align:center}
.eg-foot a{color:var(--dim);border-bottom:1px solid var(--line)}
`;

/** Three lines out of a headline, so the hero has some rhythm to it. */
function broken(headline: string): string {
  const words = String(headline).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length < 3) return `<span>${esc(words.join(' '))}</span>`;
  const size = Math.ceil(words.length / 3);
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += size) lines.push(words.slice(i, i + size).join(' '));
  return lines.slice(0, 3).map((line) => `<span>${esc(line)}</span>`).join('');
}

const pick = (site: SiteConfig, type: string): SiteSection | undefined =>
  (site.sections || []).find((s) => s && s.type === type);

export function renderEggsBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const hero = safeUrl(site.heroImage);

  const range = (site.products || []).filter((p) => p && (p.name || p.image));
  const certs = pick(site, 'credentials');
  const facts = pick(site, 'specs');
  const story = pick(site, 'about');
  const where = pick(site, 'alongside');

  const rangeHtml = range.length
    ? `<section class="eg-sec" id="range"><div class="eg-wrap">
    <h2>${esc(pick(site, 'shop')?.title || 'The range')}</h2>
    <p class="eg-sub">${esc(pick(site, 'shop')?.text || 'Everything we make, and what goes in it.')}</p>
    <div class="eg-range">${range
      .map((p) => {
        const shot = safeUrl(p.image);
        return `<article class="eg-item">
        <div class="eg-item-shot">${
          shot ? `<img src="${esc(shot)}" alt="${esc(p.name || '')}" loading="lazy" />` : ''
        }</div>
        <div class="eg-item-say">
          <h3>${esc(p.name || '')}</h3>
          ${p.text ? `<p>${esc(p.text)}</p>` : ''}
          ${p.price ? `<b>${esc(p.price)}</b>` : ''}
        </div>
      </article>`;
      })
      .join('')}</div></div></section>`
    : '';

  const certsHtml = (certs?.items || []).length
    ? `<section class="eg-sec" id="certs"><div class="eg-wrap">
    <h2>${esc(certs?.title || 'How it is made')}</h2>
    <p class="eg-sub">${esc(
      certs?.text || 'Every one of these is a certification with a body behind it, not a sticker.'
    )}</p>
    <div class="eg-certs">${(certs?.items || [])
      .slice(0, 8)
      .map(
        (item) => `<div class="eg-cert">
        <div class="eg-cert-mark">${esc(String(item[0] || '?').trim().slice(0, 2).toUpperCase())}</div>
        <b>${esc(item[0])}</b>${item[1] ? `<span>${esc(item[1])}</span>` : ''}
      </div>`
      )
      .join('')}</div></div></section>`
    : '';

  const factsHtml = (facts?.items || []).length
    ? `<section class="eg-sec"><div class="eg-wrap">
    <div class="eg-facts">${(facts?.items || [])
      .slice(0, 8)
      .map(
        (item) => `<div class="eg-fact"><b>${esc(item[1] || item[0])}</b>
        <span>${esc(item[1] ? item[0] : '')}</span></div>`
      )
      .join('')}</div></div></section>`
    : '';

  const storyHtml = story?.text
    ? `<section class="eg-sec"><div class="eg-wrap"><div class="eg-story">
    <h2>${esc(story.title || 'How we got here')}</h2>
    <p style="margin-top:1.1rem">${esc(story.text)}</p>
  </div></div></section>`
    : '';

  const whereHtml = (where?.partners || []).length
    ? `<section class="eg-sec" id="where"><div class="eg-wrap">
    <h2>${esc(where?.title || 'Where to find us')}</h2>
    <p class="eg-sub">${esc(where?.text || 'On the shelf at these places.')}</p>
    <div class="eg-where">${(where?.partners || [])
      .filter((p) => p && p.name)
      .map((p) =>
        p.slug
          ? `<a href="https://${esc(p.slug)}.garage.co.nz">${esc(p.name)}</a>`
          : `<span>${esc(p.name)}</span>`
      )
      .join('')}</div></div></section>`
    : '';

  const reach = [
    contact.phone
      ? `<a class="eg-btn" href="tel:${esc(String(contact.phone).replace(/[^\d+]/g, ''))}">${esc(
          contact.phone
        )}</a>`
      : '',
    contact.email ? `<a class="eg-btn ghost" href="mailto:${esc(contact.email)}">Email us</a>` : '',
  ]
    .filter(Boolean)
    .join('');

  return `
<section class="eg-hero">
  <div class="eg-blob a"></div>
  <div class="eg-blob b"></div>
  <div class="eg-wrap"><div class="eg-hero-in">
    <div>
      ${site.eyebrow ? `<p class="eg-eyebrow">${esc(site.eyebrow)}</p>` : ''}
      <h1>${broken(site.headline || who)}</h1>
      ${site.lede ? `<p class="eg-lede">${esc(site.lede)}</p>` : ''}
      <div class="eg-doing">
        ${range.length ? `<a class="eg-btn" href="#range">${esc(site.cta || 'See the range')}</a>` : ''}
        ${whereHtml ? '<a class="eg-btn ghost" href="#where">Where to buy</a>' : ''}
      </div>
    </div>
    <div class="eg-shot">${
      hero ? `<img src="${esc(hero)}" alt="${esc(who)}" />` : ''
    }</div>
  </div></div>
</section>

${rangeHtml}
${certsHtml}
${factsHtml}
${storyHtml}
${whereHtml}

<section class="eg-contact" id="contact"><div class="eg-wrap">
  <h2>${esc(who)}</h2>
  ${contact.address ? `<p>${esc(contact.address)}</p>` : ''}
  ${reach ? `<div class="eg-doing">${reach}</div>` : ''}
</div></section>

<footer class="eg-foot"><div class="eg-wrap">
  <span>${esc(who)}</span> &middot;
  <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
</div></footer>`;
}
