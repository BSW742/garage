// AGENCY TEMPLATE (style: "mogged")
//
// Built after getmogged.co.nz. A confident, sales-led page for people who sell
// expertise rather than a product: agencies, consultants, accountants, brokers,
// anyone whose pitch is "we will make you look better than the others".
//
// Four things carry it, and they are all borrowed deliberately:
//
// A very heavy grotesk headline with one word set in italic. The italic does
// all the work — it is the only piece of emphasis on the page and it lands
// because nothing else is competing.
//
// Tick points immediately under the buttons. Three short proofs, not a
// paragraph, sitting where somebody's eye already is after reading the CTA.
//
// A logo wall in greyscale. Colour logos fight each other and look like a
// sponsor board; grey ones read as a list of clients.
//
// And the definition block — the word, the part of speech, the meaning, then
// somebody using it in a sentence. It is the most memorable thing on the
// original site and costs nothing to reproduce, because every business has a
// word they wish people used about them.

import type { SiteConfig, SiteSection } from './site-render';

export const MOGGED_FONT_QUERY =
  '&family=Plus+Jakarta+Sans:ital,wght@0,500;0,700;0,800;1,800';

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

export const MOGGED_CSS = `
.mg{--ink:#0d1836;--dim:#5b6580;--line:#e7eaf3;--paper:#fff;--wash:#f6f8fd;
--accent:var(--primary);
--display:'Plus Jakarta Sans',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.mg{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.65}
html:has(body.mg),body.mg{overflow-x:clip}
.mg h1,.mg h2,.mg h3{font-family:var(--display);font-weight:800;letter-spacing:-.035em;
line-height:1.02;text-align:left;margin-bottom:0}
.mg ::selection{background:var(--accent);color:#fff}
.mg-wrap{max-width:74rem;margin:0 auto;padding:0 1.4rem}

/* -- Nav -- */
.mg-nav{border-bottom:1px solid var(--line);position:sticky;top:0;z-index:30;
background:rgba(255,255,255,.92);backdrop-filter:blur(8px)}
.mg-nav-in{display:flex;align-items:center;gap:1.4rem;padding:.9rem 0}
.mg-mark{font-family:var(--display);font-weight:800;font-size:1.15rem;letter-spacing:-.04em;
color:var(--accent);text-transform:uppercase}
.mg-mark span{color:var(--ink)}
.mg-nav-links{display:none;gap:1.4rem;margin-left:auto;font-size:.92rem;font-weight:500}
@media(min-width:900px){.mg-nav-links{display:flex}}
.mg-nav-links a{color:var(--ink)}
.mg-nav-links a:hover{color:var(--accent)}
.mg-nav-end{display:flex;align-items:center;gap:.9rem;margin-left:auto}
@media(min-width:900px){.mg-nav-end{margin-left:0}}
.mg-tel{display:none;font-weight:700;font-size:.95rem;color:var(--ink);white-space:nowrap}
@media(min-width:620px){.mg-tel{display:inline}}
.mg-pill{background:var(--accent);color:#fff;border-radius:999px;padding:.6rem 1.15rem;
font-weight:600;font-size:.9rem;white-space:nowrap}
.mg-pill:hover{filter:brightness(1.08)}

/* -- Hero -- */
.mg-hero{padding:4rem 0 3.5rem}
.mg-hero-in{display:grid;gap:2.8rem;align-items:center;grid-template-columns:1fr}
@media(min-width:980px){.mg-hero-in{grid-template-columns:1.06fr .94fr;gap:3.5rem}}
.mg-hero h1{font-size:clamp(2.5rem,6.6vw,4.6rem)}
.mg-hero h1 em{font-style:italic;font-weight:800}
.mg-lede{margin-top:1.6rem;font-size:1.09rem;color:var(--dim);max-width:33rem}
.mg-doing{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:2rem}
.mg-btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--accent);color:#fff;
border-radius:999px;padding:.9rem 1.7rem;font-weight:600;font-size:.98rem}
.mg-btn:hover{filter:brightness(1.08)}
.mg-btn.ghost{background:transparent;color:var(--ink);border:1.5px solid var(--line)}
.mg-btn.ghost:hover{border-color:var(--ink);filter:none}

/* Three short proofs, right where the eye already is. */
.mg-ticks{display:flex;flex-wrap:wrap;gap:.5rem 1.6rem;margin-top:1.5rem}
.mg-tick{display:flex;align-items:flex-start;gap:.45rem;font-size:.9rem;color:var(--dim)}
.mg-tick svg{flex:none;margin-top:.28rem}

.mg-stack{position:relative;padding:1rem 0}
.mg-shot{border-radius:14px;overflow:hidden;background:var(--wash);
box-shadow:0 34px 70px -34px rgba(13,24,54,.45);border:1px solid var(--line)}
.mg-shot img{width:100%;display:block;aspect-ratio:4/3;object-fit:cover}
.mg-shot.tilt{transform:rotate(-3deg)}
.mg-shot.behind{position:absolute;inset:0 -1.6rem auto auto;width:88%;transform:rotate(2.5deg);
z-index:-1;opacity:.55}
.mg-chip{display:inline-block;margin-top:1rem;background:var(--ink);color:#fff;
border-radius:999px;padding:.45rem 1rem;font-size:.83rem;font-weight:600}

/* -- The logo wall. Grey, or it turns into a sponsor board. -- */
.mg-trust{border-top:1px solid var(--line);border-bottom:1px solid var(--line);
padding:2rem 0;background:var(--paper)}
.mg-trust p{font-size:.88rem;color:var(--dim);margin-bottom:1.4rem}
.mg-logos{display:flex;flex-wrap:wrap;align-items:center;gap:1.2rem 2.4rem;
justify-content:space-between}
.mg-logos img{height:2rem;width:auto;filter:grayscale(1);opacity:.55}
.mg-logos span{font-family:var(--display);font-weight:700;font-size:1rem;color:var(--dim);
opacity:.75;letter-spacing:-.02em}
.mg-logos a{color:inherit}
.mg-logos a:hover span{color:var(--accent);opacity:1}

/* -- The definition. The bit everybody remembers. -- */
.mg-define{padding:4rem 0;border-bottom:1px solid var(--line)}
.mg-define-in{display:grid;gap:1.2rem;grid-template-columns:1fr;align-items:start}
@media(min-width:760px){.mg-define-in{grid-template-columns:14rem 1fr;gap:2.5rem}}
.mg-word{font-family:var(--display);font-weight:800;font-style:italic;
font-size:clamp(2rem,5vw,2.9rem);color:var(--accent);letter-spacing:-.04em;line-height:1}
.mg-meaning b{font-weight:700}
.mg-meaning p{font-size:1.05rem}
.mg-usage{margin-top:.7rem;font-style:italic;color:var(--dim);font-size:1.02rem}

/* -- What they do -- */
.mg-sec{padding:4rem 0}
.mg-sec h2{font-size:clamp(1.8rem,4.4vw,2.8rem);margin-bottom:.7rem}
.mg-sub{color:var(--dim);max-width:34rem;margin-bottom:2.2rem}
.mg-grid{display:grid;gap:1.1rem;grid-template-columns:1fr}
@media(min-width:640px){.mg-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1000px){.mg-grid{grid-template-columns:repeat(3,1fr)}}
.mg-card{border:1px solid var(--line);border-radius:16px;padding:1.5rem 1.4rem;
background:var(--paper);transition:border-color .2s ease,transform .2s ease}
.mg-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.mg-card h3{font-size:1.12rem;margin-bottom:.45rem}
.mg-card p{color:var(--dim);font-size:.93rem}

.mg-band{background:var(--ink);color:#fff;border-radius:22px;padding:3rem 2rem;text-align:center;
margin:1rem 0 0}
.mg-band h2{text-align:center;font-size:clamp(1.7rem,4.2vw,2.6rem)}
.mg-band p{color:rgba(255,255,255,.72);margin-top:.9rem;max-width:32rem;
margin-left:auto;margin-right:auto}
.mg-band .mg-doing{justify-content:center}
.mg-band .mg-btn.ghost{color:#fff;border-color:rgba(255,255,255,.3)}
.mg-band .mg-btn.ghost:hover{border-color:#fff}

.mg-foot{border-top:1px solid var(--line);margin-top:3rem;padding:2.2rem 0 3rem;
color:var(--dim);font-size:.85rem;display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;
justify-content:space-between}
.mg-foot a{color:var(--dim);border-bottom:1px solid var(--line)}
@media(prefers-reduced-motion:reduce){.mg-card:hover{transform:none}}
`;

const TICK =
  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg>';

const pick = (site: SiteConfig, type: string): SiteSection | undefined =>
  (site.sections || []).find((s) => s && s.type === type);

/**
 * One word in the headline set in italic. The last word by default, or
 * whatever they wrapped in *asterisks* — a convention people already know from
 * every chat app they use.
 */
function emphasised(headline: string): string {
  const raw = String(headline || '').trim();
  if (!raw) return '';
  if (/\*[^*]+\*/.test(raw)) {
    return esc(raw).replace(/\*([^*]+)\*/, (_m, inner) => `<em>${inner}</em>`);
  }
  const words = raw.split(/\s+/);
  if (words.length < 3) return esc(raw);
  const last = words.pop() as string;
  return `${esc(words.join(' '))} <em>${esc(last)}</em>`;
}

export function renderMoggedBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const contact = site.contact || {};
  const services = pick(site, 'services');
  const define = pick(site, 'define');
  const trust = pick(site, 'alongside');
  const band = pick(site, 'band');

  const shots = [safeUrl(site.heroImage), ...(site.images || []).map(safeUrl)].filter(
    (u): u is string => !!u
  );

  // Three at most. Four ticks is a list, and a list is not a proof.
  const proofs = (pick(site, 'included')?.items || []).slice(0, 3);

  const mark = who.split(/\s+/);
  const wordmark =
    mark.length > 1
      ? `${esc(mark[0])}<span>${esc(mark.slice(1).join(' '))}.</span>`
      : `${esc(who)}<span>.</span>`;

  const call = contact.phone
    ? `<a class="mg-tel" href="tel:${esc(String(contact.phone).replace(/[^\d+]/g, ''))}">${esc(
        contact.phone
      )}</a>`
    : '';

  const trustHtml = (trust?.partners || []).length
    ? `<section class="mg-trust"><div class="mg-wrap">
    <p>${esc(trust?.text || trust?.title || 'Trusted by')}</p>
    <div class="mg-logos">${(trust?.partners || [])
      // The model writes this list as bare strings as often as objects, and a
      // filter on p.name silently dropped every one of the string ones — the
      // section rendered empty rather than wrong, which is harder to notice.
      .map((p: any) => (typeof p === 'string' ? { name: p } : p))
      .filter((p: any) => p && p.name)
      .slice(0, 8)
      .map((p) =>
        p.slug
          ? `<a href="https://${esc(p.slug)}.garage.co.nz"><span>${esc(p.name)}</span></a>`
          : `<span>${esc(p.name)}</span>`
      )
      .join('')}</div>
  </div></section>`
    : '';

  const defineHtml = define?.text
    ? `<section class="mg-define"><div class="mg-wrap"><div class="mg-define-in">
    <div class="mg-word">${esc(define.label || who.split(/\s+/)[0].toLowerCase())}</div>
    <div class="mg-meaning">
      <p><b>${esc(define.title || 'verb.')}</b> ${esc(define.text)}</p>
      ${define.quote ? `<p class="mg-usage">&ldquo;${esc(define.quote)}&rdquo;</p>` : ''}
    </div>
  </div></div></section>`
    : '';

  const servicesHtml = (services?.items || []).length
    ? `<section class="mg-sec" id="what"><div class="mg-wrap">
    <h2>${esc(services?.title || 'What we do')}</h2>
    <p class="mg-sub">${esc(services?.text || '')}</p>
    <div class="mg-grid">${(services?.items || [])
      .map(
        (item) => `<div class="mg-card"><h3>${esc(item[0])}</h3>
        ${item[1] ? `<p>${esc(item[1])}</p>` : ''}</div>`
      )
      .join('')}</div>
  </div></section>`
    : '';

  return `
<nav class="mg-nav"><div class="mg-wrap"><div class="mg-nav-in">
  <a class="mg-mark" href="#top">${wordmark}</a>
  <div class="mg-nav-links">
    ${servicesHtml ? '<a href="#what">What we do</a>' : ''}
    ${defineHtml ? '<a href="#top">About</a>' : ''}
    <a href="#contact">Contact</a>
  </div>
  <div class="mg-nav-end">
    ${call}
    <a class="mg-pill" href="#contact">${esc(site.cta || 'Get in touch')}</a>
  </div>
</div></div></nav>

<section class="mg-hero" id="top"><div class="mg-wrap"><div class="mg-hero-in">
  <div>
    <h1>${emphasised(site.headline || who)}</h1>
    ${site.lede ? `<p class="mg-lede">${esc(site.lede)}</p>` : ''}
    <div class="mg-doing">
      <a class="mg-btn" href="#contact">${esc(site.cta || 'Get in touch')}</a>
      ${servicesHtml ? '<a class="mg-btn ghost" href="#what">See what we do</a>' : ''}
    </div>
    ${proofs.length
      ? `<div class="mg-ticks">${proofs
          .map((p) => `<span class="mg-tick">${TICK}${esc(p[0])}</span>`)
          .join('')}</div>`
      : ''}
  </div>
  ${shots.length
    ? `<div class="mg-stack">
      ${shots[1] ? `<div class="mg-shot behind"><img src="${esc(shots[1])}" alt="" /></div>` : ''}
      <div class="mg-shot tilt"><img src="${esc(shots[0])}" alt="${esc(who)}" /></div>
      ${contact.address ? `<span class="mg-chip">${esc(contact.address)}</span>` : ''}
    </div>`
    : ''}
</div></div></section>

${trustHtml}
${defineHtml}
${servicesHtml}

<section class="mg-sec" id="contact"><div class="mg-wrap"><div class="mg-band">
  <h2>${esc(band?.title || 'Ready when you are')}</h2>
  <p>${esc(band?.text || `Tell us what you are trying to do and we will tell you straight whether we can help.`)}</p>
  <div class="mg-doing">
    ${contact.phone
      ? `<a class="mg-btn" href="tel:${esc(String(contact.phone).replace(/[^\d+]/g, ''))}">${esc(contact.phone)}</a>`
      : ''}
    ${contact.email
      ? `<a class="mg-btn ghost" href="mailto:${esc(contact.email)}">Email us</a>`
      : ''}
  </div>
</div></div></section>

<footer class="mg-foot"><div class="mg-wrap" style="display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;justify-content:space-between;width:100%">
  <span>&copy; ${new Date().getFullYear()} ${esc(who)}</span>
  <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
</div></footer>`;
}
