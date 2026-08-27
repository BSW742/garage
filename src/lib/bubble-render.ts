// BUBBLES TEMPLATE (style: "bubbles")
//
// For people whose work is the pitch — potters, painters, florists, jewellers,
// tattooists, photographers. Every other template here puts words first and
// pictures in support. This one floats the work in front of you and hides the
// words inside it until you go looking.
//
// Each bubble is a piece. Burst one and it tells you what it is.
//
// Two things kept it honest rather than clever:
//
// Bubbles drift inside a grid cell rather than floating free. Free-floating
// circles look wonderful on a laptop and turn into an overlapping mess on a
// phone, and a gallery you cannot read on a phone is not a gallery.
//
// The words live in the HTML from the start, hidden by CSS. A page that only
// exists once JavaScript has run is invisible to exactly the machines this
// site is trying to be found by.

import type { SiteConfig } from './site-render';

export const BUBBLE_FONT_QUERY = '&family=Syne:wght@400;600;800';

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

export const BUBBLE_CSS = `
.bb{--ink:#191720;--dim:#6f6a7d;--line:#e6e2ef;--paper:#fbfaff;
--glow:color-mix(in srgb,var(--primary) 40%,#fff);
--display:'Syne',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.bb{color:var(--ink);font-family:var(--body);line-height:1.6;
background:
  radial-gradient(60rem 40rem at 15% 0%,color-mix(in srgb,var(--primary) 12%,transparent),transparent 60%),
  radial-gradient(50rem 40rem at 90% 20%,color-mix(in srgb,var(--deep) 10%,transparent),transparent 60%),
  var(--paper)}
html:has(body.bb),body.bb{overflow-x:clip}
.bb h1,.bb h2{font-family:var(--display);font-weight:800;letter-spacing:-.02em;
line-height:1.02;text-align:center;margin-bottom:0}
.bb ::selection{background:var(--ink);color:var(--paper)}
.bb-wrap{max-width:74rem;margin:0 auto;padding:0 1.2rem}

/* -- Head -- */
.bb-head{padding:4.5rem 0 1rem;text-align:center}
.bb-eyebrow{font-family:var(--display);font-weight:600;font-size:.78rem;letter-spacing:.22em;
text-transform:uppercase;color:var(--primary);margin-bottom:1rem}
.bb-head h1{font-size:clamp(2.4rem,8vw,5rem)}
.bb-lede{margin:1.3rem auto 0;color:var(--dim);max-width:33rem;font-size:1.02rem}
.bb-hint{margin-top:1.6rem;font-size:.84rem;color:var(--dim);font-style:italic}

/* -- The field. A grid, so nothing ever piles up on a phone. -- */
.bb-field{display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem;
padding:2.5rem 0 4rem;place-items:center}
@media(min-width:560px){.bb-field{grid-template-columns:repeat(3,1fr);gap:1rem}}
@media(min-width:900px){.bb-field{grid-template-columns:repeat(4,1fr);gap:1.4rem}}

.bb-cell{width:100%;aspect-ratio:1;display:grid;place-items:center}
.bb-bub{position:relative;border:0;padding:0;background:none;cursor:pointer;
width:min(100%,11rem);aspect-ratio:1;border-radius:50%;
animation:bb-drift var(--dur,9s) ease-in-out var(--delay,0s) infinite;
transition:transform .35s cubic-bezier(.16,1,.3,1)}
.bb-bub:hover{transform:scale(1.05)}
.bb-bub:focus-visible{outline:2px solid var(--ink);outline-offset:6px}
.bb-skin{position:absolute;inset:0;border-radius:50%;overflow:hidden;
background:var(--line) center/cover;
box-shadow:0 18px 40px -22px rgba(25,23,32,.7),
  inset 0 0 0 1px rgba(255,255,255,.5),
  inset 0 10px 18px -12px rgba(255,255,255,.55)}
.bb-skin img{width:100%;height:100%;object-fit:cover;display:block}
/* The bit that makes it read as a bubble rather than a circle: one soft
   highlight, top left, like light on a curved surface. */
.bb-shine{position:absolute;top:10%;left:14%;width:26%;height:19%;border-radius:50%;
background:radial-gradient(closest-side,rgba(255,255,255,.62),rgba(255,255,255,0));
pointer-events:none;filter:blur(2px)}
.bb-ring{position:absolute;inset:0;border-radius:50%;pointer-events:none;
box-shadow:0 0 0 1px color-mix(in srgb,var(--primary) 35%,transparent)}

@keyframes bb-drift{
  0%,100%{transform:translate3d(0,0,0)}
  25%{transform:translate3d(3%,-5%,0)}
  50%{transform:translate3d(-2%,-8%,0)}
  75%{transform:translate3d(-4%,-3%,0)}
}

/* Bursting. The ring flies outward, the bubble goes. */
.bb-bub.pop{animation:none;transform:scale(.4);opacity:0;
transition:transform .32s ease-in,opacity .32s ease-in}
.bb-bub.pop .bb-ring{animation:bb-burst .45s ease-out forwards}
@keyframes bb-burst{
  0%{transform:scale(1);opacity:.9}
  100%{transform:scale(1.9);opacity:0}
}
.bb-bub.back{animation:bb-drift var(--dur,9s) ease-in-out var(--delay,0s) infinite}

/* The words live here from the start, hidden until something reads them. */
.bb-said{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);
white-space:nowrap}

/* -- What a burst bubble says -- */
.bb-card{position:fixed;inset:0;z-index:90;display:none;place-items:center;padding:1.4rem;
background:rgba(20,18,26,.55);backdrop-filter:blur(6px)}
.bb-card.on{display:grid}
.bb-card-in{background:var(--paper);border-radius:24px;overflow:hidden;
width:min(430px,100%);max-height:90vh;overflow-y:auto;
box-shadow:0 40px 90px -40px rgba(20,18,26,.7);
animation:bb-rise .4s cubic-bezier(.16,1,.3,1) both}
@keyframes bb-rise{from{transform:translateY(14px) scale(.97);opacity:0}}
.bb-card-shot{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:var(--line)}
.bb-card-say{padding:1.5rem 1.5rem 1.7rem;text-align:center}
.bb-card-say h2{font-size:1.5rem;margin-bottom:.5rem}
.bb-card-say p{color:var(--dim);font-size:.96rem;line-height:1.65}
.bb-price{display:inline-block;margin-top:.9rem;font-family:var(--display);font-weight:600;
font-size:1.05rem;color:var(--primary)}
.bb-x{display:block;width:100%;margin-top:1.3rem;background:var(--ink);color:var(--paper);
border:0;border-radius:999px;padding:.8rem;font:inherit;font-weight:600;cursor:pointer}

.bb-empty{text-align:center;color:var(--dim);padding:4rem 1.5rem 6rem}
.bb-foot{border-top:1px solid var(--line);padding:2.2rem 0 3rem;text-align:center;
color:var(--dim);font-size:.82rem;display:block}
.bb-foot a{color:var(--dim);border-bottom:1px solid var(--line)}

@media(prefers-reduced-motion:reduce){
  .bb-bub,.bb-bub.back{animation:none}
  .bb-card-in{animation:none}
}
`;

interface Bubble {
  url: string;
  name?: string;
  text?: string;
  price?: string;
}

// Enough variation that no two neighbours breathe together, without needing a
// random number that would change on every render and break caching.
const DURATIONS = [8.5, 10.5, 9.2, 11.8, 9.8, 12.4, 8.9, 10.9];
const DELAYS = [0, 1.4, 0.6, 2.1, 1.1, 0.3, 1.8, 0.9];

export function renderBubbleBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;

  // Anything with a picture. Products carry their own words; loose images and
  // gallery photos become bubbles that simply show the work.
  const used = new Set<string>();
  const bubbles: Bubble[] = [];

  for (const product of site.products || []) {
    const url = safeUrl(product?.image);
    if (!url || used.has(url)) continue;
    used.add(url);
    bubbles.push({ url, name: product.name, text: product.text, price: product.price });
  }

  const loose = [
    ...(site.images || []),
    ...(site.sections || []).filter((s) => s && s.type === 'gallery').flatMap((s) => s.images || []),
  ];
  for (const image of loose) {
    const url = safeUrl(image);
    if (!url || used.has(url)) continue;
    used.add(url);
    bubbles.push({ url });
  }

  const field = bubbles.length
    ? `<div class="bb-field">${bubbles
        .map((b, i) => {
          const label = b.name || 'A piece of work';
          const said = [b.name, b.text, b.price].filter(Boolean).map((v) => esc(v)).join(' — ');
          return `<div class="bb-cell"><button type="button" class="bb-bub"
            style="--dur:${DURATIONS[i % DURATIONS.length]}s;--delay:${DELAYS[i % DELAYS.length]}s"
            data-i="${i}"
            data-name="${esc(b.name || '')}"
            data-text="${esc(b.text || '')}"
            data-price="${esc(b.price || '')}"
            data-full="${esc(b.url)}"
            aria-label="${esc(label)}">
            <span class="bb-skin"><img src="${esc(b.url)}" alt="${esc(label)}" loading="${
              i < 8 ? 'eager' : 'lazy'
            }" /></span>
            <span class="bb-shine"></span>
            <span class="bb-ring"></span>
            <span class="bb-said">${said || esc(label)}</span>
          </button></div>`;
        })
        .join('')}</div>`
    : `<p class="bb-empty">Nothing up yet. Add some photographs and they become the page.</p>`;

  return `
<div class="bb-wrap">
  <header class="bb-head" id="top">
    ${site.eyebrow ? `<p class="bb-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(who)}</h1>
    ${site.lede ? `<p class="bb-lede">${esc(site.lede)}</p>` : ''}
    ${bubbles.length ? `<p class="bb-hint">${esc(site.cta || 'Burst one to see what it is')}</p>` : ''}
  </header>
</div>
<div class="bb-wrap">${field}</div>
<footer class="bb-foot">
  <span>${esc(who)}</span> &middot;
  <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
</footer>

<div class="bb-card" id="bb-card" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="bb-card-in">
    <img class="bb-card-shot" id="bb-card-shot" alt="" />
    <div class="bb-card-say">
      <h2 id="bb-card-name"></h2>
      <p id="bb-card-text"></p>
      <span class="bb-price" id="bb-card-price"></span>
      <button type="button" class="bb-x" id="bb-close">Back to the rest</button>
    </div>
  </div>
</div>

<script>(function(){
var card=document.getElementById('bb-card');
var shot=document.getElementById('bb-card-shot');
var name=document.getElementById('bb-card-name');
var text=document.getElementById('bb-card-text');
var price=document.getElementById('bb-card-price');
var popped=null;

function open(bub){
  popped=bub;
  shot.src=bub.getAttribute('data-full');
  shot.alt=bub.getAttribute('data-name')||'';
  name.textContent=bub.getAttribute('data-name')||'';
  name.style.display=name.textContent?'':'none';
  text.textContent=bub.getAttribute('data-text')||'';
  text.style.display=text.textContent?'':'none';
  price.textContent=bub.getAttribute('data-price')||'';
  price.style.display=price.textContent?'':'none';
  // Pop first, then the card — the burst is the transition.
  bub.classList.remove('back');
  bub.classList.add('pop');
  setTimeout(function(){
    card.classList.add('on');
    card.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  },240);
}

function shut(){
  card.classList.remove('on');
  card.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  if(popped){
    // It re-forms. A gallery you can only look at once is a cruel gallery.
    var b=popped; popped=null;
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('back');
    setTimeout(function(){b.classList.remove('back');},60);
    try{b.focus({preventScroll:true});}catch(e){}
  }
}

document.querySelectorAll('.bb-bub').forEach(function(bub){
  bub.addEventListener('click',function(){open(bub);});
});
document.getElementById('bb-close').addEventListener('click',shut);
card.addEventListener('click',function(e){if(e.target===card)shut();});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&card.classList.contains('on'))shut();
});
})();</script>`;
}
