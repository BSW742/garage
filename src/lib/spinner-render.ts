// SPIN TO WIN — a lead-capture widget for any published site.
//
// A tab peels off the right-hand edge of the page. Click it and a panel comes
// out with a wheel, the prizes on it, and three fields. Fill them in, the wheel
// spins, confetti, and whatever it landed on.
//
// Three decisions worth writing down, because all three could reasonably have
// gone the other way.
//
// The wheel is honest. Eight equal segments and a uniform random landing — the
// odds are exactly what the visitor can see. It would have been trivial to make
// it always stop on a prize, and plenty of these do, but a wheel that only
// pretends to be random is a lie told with an animation. If the top prize is on
// one slot of eight then it comes up one spin in eight, and the owner should
// pick a prize they are happy to give away at that rate.
//
// The losing slots say "Not this time" rather than pretending to be a prize.
// Somebody who does not win should know they did not win.
//
// And nothing is emailed to the visitor. They gave an address to spin a wheel,
// not to be added to a list — so the address goes to the owner, who can decide
// whether there is a reason to use it. The form says exactly that, above the
// button, in a sentence nobody has to go looking for.

import type { SiteConfig, Spinner } from './site-render';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

export const SLOTS = 8;

/**
 * Lay the offers out around the wheel.
 *
 * The top prize sits at the top, where a visitor looking at a still wheel will
 * read it first. The rest are scattered — but scattered the same way on every
 * load, seeded off the slug, because a wheel whose labels move between page
 * views looks broken rather than random.
 */
export function layout(offers: string[], slug: string): string[] {
  const clean = offers.map((o) => String(o || '').trim()).filter(Boolean).slice(0, SLOTS);
  const slots: (string | null)[] = new Array(SLOTS).fill(null);
  if (!clean.length) return [];

  slots[0] = clean[0];

  // A tiny deterministic shuffle. crypto is overkill for arranging a wheel and
  // Math.random would move the labels on every render.
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) >>> 0;
  const next = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);

  const free = [1, 2, 3, 4, 5, 6, 7];
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }
  clean.slice(1).forEach((offer, i) => {
    if (free[i] !== undefined) slots[free[i]] = offer;
  });

  return slots.map((s) => s || 'Not this time');
}


// The panel is two steps, and that order is the whole point.
//
// The first version put the wheel and a three-field form on one card, which was
// taller than a laptop screen — so the offers and the button were never on
// screen together and you had to scroll past the prizes to reach the thing that
// spins them. It also asked for an email before it had given anybody a reason
// to care.
//
// Now: look at the wheel, read what is on it, want one. Then press spin, and
// only then does a sheet slide up asking who you are. The card is sized so both
// steps fit a phone and a laptop without scrolling — the wheel takes whichever
// is smaller of the width and the height it is given.
//
// Yellow, red and black, which is what a wheel like this is supposed to look
// like.

const INK = '#0d0d0f';
const RED = '#d81f2a';
const YELLOW = '#f7c521';

export const SPINNER_CSS = `
.gsp-tab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9990;
display:flex;align-items:center;gap:.5rem;border:0;cursor:pointer;
background:${YELLOW};color:${INK};font:800 .82rem/1 var(--font-sans,system-ui,sans-serif);
padding:.95rem .7rem;border-radius:12px 0 0 12px;writing-mode:vertical-rl;letter-spacing:.02em;
box-shadow:-4px 0 22px -6px rgba(0,0,0,.5);transition:padding .2s,background .2s}
.gsp-tab:hover{padding-right:1.05rem;background:#ffd633}
.gsp-tab i{font-style:normal;writing-mode:horizontal-tb;font-size:1.05rem;line-height:1}
@media(max-width:520px){.gsp-tab{top:auto;bottom:92px;transform:none}}

.gsp-veil{position:fixed;inset:0;z-index:9991;background:rgba(6,6,8,.75);
backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:.8rem}
.gsp-veil.on{display:flex}

/* Never taller than the screen, so there is nothing to scroll. */
.gsp-card{position:relative;display:flex;flex-direction:column;
width:min(25rem,100%);max-height:min(96vh,42rem);overflow:hidden;
background:${INK};color:#fff;border:1px solid #26262c;border-radius:20px;
padding:1.3rem 1.25rem 1.15rem;text-align:center;
font-family:var(--font-sans,system-ui,sans-serif);
box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}
.gsp-x{position:absolute;right:.7rem;top:.7rem;width:2rem;height:2rem;border-radius:50%;
border:1px solid #2e2e36;background:transparent;color:#9a9aa6;font-size:1.1rem;cursor:pointer;
line-height:1;z-index:3}
.gsp-x:hover{color:#fff;border-color:#55555f}
.gsp-card h2{font-size:1.3rem;font-weight:800;letter-spacing:-.02em;margin:0 0 .3rem;color:#fff}
.gsp-blurb{color:#9a9aa6;font-size:.86rem;margin:0 0 .8rem;line-height:1.45}

/* The wheel takes whichever it has less of, width or height. */
.gsp-wheel-wrap{position:relative;flex:0 1 auto;min-height:0;
width:min(70vw,38vh,16.5rem);aspect-ratio:1;margin:.1rem auto .9rem}
.gsp-wheel-wrap:before{content:'';position:absolute;left:50%;top:-7px;transform:translateX(-50%);
border-style:solid;border-width:0 .65rem 1.05rem .65rem;
border-color:transparent transparent ${YELLOW} transparent;z-index:3;
filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
.gsp-wheel{position:absolute;inset:0;border-radius:50%;border:5px solid ${YELLOW};
box-shadow:0 0 0 3px ${INK},0 14px 34px -12px rgba(0,0,0,.8);
transition:transform 5s cubic-bezier(.15,.9,.16,1)}
.gsp-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
width:20%;height:20%;border-radius:50%;background:${YELLOW};z-index:2;
box-shadow:0 2px 10px rgba(0,0,0,.6)}
.gsp-hub:after{content:'';position:absolute;inset:22%;border-radius:50%;background:${INK}}

/* Labels read outward along the radius, and flip on the left half so nothing
   is upside down. Truncation is by character count rather than ellipsis in CSS
   because a rotated overflowing box clips into its neighbour. */
.gsp-lab{position:absolute;left:50%;top:50%;transform-origin:0 0;
font:800 .58rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.01em;
white-space:nowrap;pointer-events:none;color:#fff}
.gsp-lab.dark{color:${INK}}

.gsp-go{flex:none;width:100%;border:0;border-radius:999px;cursor:pointer;
background:${YELLOW};color:${INK};font:800 1.02rem/1 var(--font-sans,system-ui,sans-serif);
padding:.95rem 1rem;transition:background .15s,transform .1s}
.gsp-go:hover{background:#ffd633}
.gsp-go:active{transform:translateY(1px)}
.gsp-go:disabled{opacity:.55;cursor:default}
.gsp-small{margin:.6rem 0 0;font-size:.7rem;color:#77777f;line-height:1.5;flex:none}

/* Step two slides over the wheel rather than pushing it down the page. */
.gsp-sheet{position:absolute;inset:auto 0 0 0;z-index:4;transform:translateY(101%);
background:${INK};border-top:1px solid #26262c;border-radius:20px;
padding:1.2rem 1.25rem 1.15rem;transition:transform .28s cubic-bezier(.2,.8,.2,1)}
.gsp-sheet.on{transform:translateY(0)}
.gsp-sheet h3{margin:0 0 .2rem;font-size:1.05rem;color:#fff}
.gsp-form{display:grid;gap:.5rem;text-align:left;margin-top:.7rem}
.gsp-form input{width:100%;font:inherit;font-size:.95rem;padding:.72rem .85rem;
border-radius:10px;border:1px solid #2e2e36;background:#17171c;color:#fff}
.gsp-form input::placeholder{color:#6a6a74}
.gsp-form input:focus{outline:2px solid ${YELLOW};outline-offset:1px;border-color:transparent}
.gsp-err{margin:.15rem 0 0;font-size:.8rem;color:#ff9a9a;min-height:1.05em}
.gsp-back{margin:.55rem auto 0;display:block;background:none;border:0;cursor:pointer;
color:#77777f;font:600 .78rem/1 var(--font-sans,system-ui,sans-serif)}
.gsp-back:hover{color:#fff}

.gsp-won{display:none}
.gsp-won.on{display:block}
.gsp-won h3{font-size:1.5rem;margin:.3rem 0 .2rem;color:${YELLOW}}
.gsp-prize{font-size:1.1rem;font-weight:800;color:#fff;background:#17171c;
border:1px solid #2e2e36;border-radius:12px;padding:.9rem 1rem;margin:.85rem 0}

.gsp-conf{position:fixed;inset:0;pointer-events:none;z-index:9992;overflow:hidden}
.gsp-bit{position:absolute;width:.5rem;height:.85rem;opacity:0;animation:gspFall linear forwards}
@keyframes gspFall{
  0%{opacity:1;transform:translate3d(0,-10vh,0) rotate(0)}
  100%{opacity:0;transform:translate3d(var(--dx,0),105vh,0) rotate(var(--rot,540deg))}}
@media(prefers-reduced-motion:reduce){
  .gsp-wheel{transition-duration:.6s}
  .gsp-sheet{transition-duration:0s}
  .gsp-bit{display:none}}
`;

/** The tab, the panel and the wheel. Returns '' when the widget is off. */
export function renderSpinner(site: SiteConfig, slug: string): string {
  const spin = site.spinner as Spinner | undefined;
  if (!spin?.on) return '';
  const slots = layout(spin.offers || [], slug);
  if (slots.length !== SLOTS) return '';

  const seg = 360 / SLOTS;
  const top = slots[0];

  // Red and black around the wheel, and the top prize in yellow so the eye
  // lands on the thing worth wanting.
  const colour = (i: number) => (i === 0 ? YELLOW : i % 2 ? RED : '#1b1b21');
  const wedges = slots
    .map((_, i) => `${colour(i)} ${i * seg}deg ${(i + 1) * seg}deg`)
    .join(',');

  const labels = slots
    .map((text, i) => {
      const mid = i * seg + seg / 2;
      const short = text.length > 17 ? text.slice(0, 16) + '…' : text;
      // Past halfway the label would be upside down, so it is turned round and
      // hung off the far edge reading back towards the centre.
      // translateX is a percentage of the label's own width, not the wheel's.
      // The label is 30% of the wheel, so 47% of it puts the text's inner edge
      // at 14% of the wheel — just clear of the hub, which has a 10% radius.
      // At 16% it started underneath the hub.
      //
      // Flipped labels are rotated the other way, so +x points back towards the
      // centre: -147% hangs the band off the 44% mark and it reads inward to
      // the same 14%. Both halves therefore occupy the same ring.
      const flipped = mid > 180;
      const t = flipped
        ? `rotate(${mid + 90}deg) translateX(-147%)`
        : `rotate(${mid - 90}deg) translateX(47%)`;
      return `<span class="gsp-lab${i === 0 ? ' dark' : ''}"
        style="transform:${t};width:30%;text-align:${flipped ? 'right' : 'left'}">${esc(short)}</span>`;
    })
    .join('');

  const who = esc(site.name || slug);

  return `
<button class="gsp-tab" id="gsp-tab" type="button" aria-haspopup="dialog">
  <i>&#127920;</i>${esc(spin.title || 'Spin to win')}
</button>

<div class="gsp-veil" id="gsp-veil" role="dialog" aria-modal="true" aria-label="${esc(spin.title || 'Spin to win')}">
  <div class="gsp-card">
    <button class="gsp-x" id="gsp-x" type="button" aria-label="Close">&times;</button>

    <div id="gsp-play" style="display:contents">
      <h2 id="gsp-title">${esc(spin.title || 'Spin to win')}</h2>
      <p class="gsp-blurb">${esc(spin.blurb || `Have a look at what is on the wheel.`)}</p>

      <div class="gsp-wheel-wrap">
        <div class="gsp-wheel" id="gsp-wheel" style="background:conic-gradient(${wedges})">${labels}</div>
        <span class="gsp-hub"></span>
      </div>

      <button class="gsp-go" id="gsp-open" type="button">Spin the wheel</button>
      <p class="gsp-small">Top prize: ${esc(top)}. Eight slots, one spin, genuinely random.</p>
    </div>

    <div class="gsp-won" id="gsp-won">
      <h3 id="gsp-head">Congratulations</h3>
      <p class="gsp-blurb" id="gsp-sub">Here is what you landed on.</p>
      <div class="gsp-prize" id="gsp-prize"></div>
      <p class="gsp-small">${who} has your details and will be in touch.
        ${spin.terms ? esc(spin.terms) : ''}</p>
    </div>

    <!-- Step two. Over the wheel, not below it. -->
    <div class="gsp-sheet" id="gsp-sheet">
      <h3>Who are we spinning for?</h3>
      <p class="gsp-blurb">So ${who} knows who won.</p>
      <form class="gsp-form" id="gsp-form" novalidate>
        <input id="gsp-name" placeholder="Your name" autocomplete="name" />
        <input id="gsp-email" type="email" placeholder="Email" autocomplete="email" />
        <input id="gsp-phone" type="tel" placeholder="Phone (optional)" autocomplete="tel" />
        <p class="gsp-err" id="gsp-err" role="alert"></p>
        <button class="gsp-go" id="gsp-go" type="submit">Spin it</button>
      </form>
      <button class="gsp-back" id="gsp-back" type="button">Back to the wheel</button>
      <p class="gsp-small">Your details go to ${who} and nowhere else. We will not email you.</p>
    </div>
  </div>
</div>
<div class="gsp-conf" id="gsp-conf" aria-hidden="true"></div>

<script>
(function () {
  var SLOTS = ${SLOTS};
  var slots = ${JSON.stringify(slots)};
  var slug = ${JSON.stringify(slug)};
  var $ = function (id) { return document.getElementById(id); };
  var veil = $('gsp-veil'), wheel = $('gsp-wheel'), sheet = $('gsp-sheet'), form = $('gsp-form');
  if (!veil || !wheel || !form) return;

  var KEY = 'garage-spun:' + slug;
  function open() { veil.classList.add('on'); }
  function close() { veil.classList.remove('on'); }
  $('gsp-tab').addEventListener('click', open);
  $('gsp-x').addEventListener('click', close);
  veil.addEventListener('click', function (e) { if (e.target === veil) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // Look first, then asked. The sheet is the only thing that wants an email
  // and it does not appear until somebody has decided they want a go.
  $('gsp-open').addEventListener('click', function () {
    sheet.classList.add('on');
    setTimeout(function () { $('gsp-name').focus(); }, 300);
  });
  $('gsp-back').addEventListener('click', function () { sheet.classList.remove('on'); });

  function finish(prize, won, already) {
    $('gsp-play').style.display = 'none';
    sheet.classList.remove('on');
    $('gsp-prize').textContent = prize;
    $('gsp-head').textContent = won ? 'Congratulations' : 'Not this time';
    $('gsp-sub').textContent = already
      ? 'You have already had your spin.'
      : won ? 'Here is what you landed on.' : 'The wheel was not kind. Thanks for playing.';
    $('gsp-won').classList.add('on');
  }

  try {
    var prev = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (prev && prev.prize) finish(prev.prize, prev.won, true);
  } catch (e) {}

  function confetti() {
    var box = $('gsp-conf');
    if (!box) return;
    var colours = ['${YELLOW}', '${RED}', '#ffffff', '#ffd633'];
    for (var i = 0; i < 70; i++) {
      var bit = document.createElement('span');
      bit.className = 'gsp-bit';
      bit.style.left = Math.random() * 100 + 'vw';
      bit.style.background = colours[i % colours.length];
      bit.style.setProperty('--dx', (Math.random() * 30 - 15) + 'vw');
      bit.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      bit.style.animationDuration = (2.4 + Math.random() * 1.8) + 's';
      bit.style.animationDelay = (Math.random() * 0.5) + 's';
      box.appendChild(bit);
      setTimeout(function (el) { return function () { el.remove(); }; }(bit), 5000);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('gsp-err'); err.textContent = '';
    var name = $('gsp-name').value.trim();
    var email = $('gsp-email').value.trim();
    var phone = $('gsp-phone').value.trim();
    if (!name) { err.textContent = 'We need a name.'; return; }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { err.textContent = 'That email does not look right.'; return; }

    // The slot is chosen here, uniformly, before anything moves. The animation
    // is told where to stop; it does not decide.
    var idx = Math.floor(Math.random() * SLOTS);
    var prize = slots[idx];
    var won = prize !== 'Not this time';

    var go = $('gsp-go');
    go.disabled = true; go.textContent = 'Spinning…';
    sheet.classList.remove('on');

    var seg = 360 / SLOTS;
    wheel.style.transform = 'rotate(' + (360 * 6 - (idx * seg + seg / 2)) + 'deg)';

    fetch('https://garage.co.nz/api/spin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone, prize: prize, won: won }),
    }).catch(function () {});

    try { localStorage.setItem(KEY, JSON.stringify({ prize: prize, won: won })); } catch (e) {}

    setTimeout(function () { finish(prize, won, false); if (won) confetti(); }, 5200);
  });
})();
</script>`;
}
