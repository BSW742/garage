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

export const SPINNER_CSS = `
.gsp-tab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9990;
display:flex;align-items:center;gap:.5rem;border:0;cursor:pointer;
background:var(--gsp-a,#7c3aed);color:#fff;font:600 .82rem/1 var(--font-sans,system-ui,sans-serif);
padding:.9rem .7rem;border-radius:10px 0 0 10px;writing-mode:vertical-rl;
box-shadow:0 8px 26px -8px rgba(0,0,0,.45);transition:padding .2s,filter .2s}
.gsp-tab:hover{padding-right:1rem;filter:brightness(1.08)}
.gsp-tab i{font-style:normal;writing-mode:horizontal-tb;font-size:1rem;line-height:1}
@media(max-width:520px){.gsp-tab{top:auto;bottom:88px;transform:none}}

.gsp-veil{position:fixed;inset:0;z-index:9991;background:rgba(8,6,16,.62);
backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;padding:1rem}
.gsp-veil.on{display:flex}

.gsp-card{position:relative;width:min(30rem,100%);max-height:94vh;overflow:auto;
background:#15121f;color:#f5f3ff;border:1px solid #2c2540;border-radius:20px;
padding:1.6rem 1.5rem 1.4rem;text-align:center;
font-family:var(--font-sans,system-ui,sans-serif)}
.gsp-x{position:absolute;right:.8rem;top:.8rem;width:2rem;height:2rem;border-radius:50%;
border:1px solid #2c2540;background:transparent;color:#b7aed0;font-size:1.1rem;cursor:pointer;line-height:1}
.gsp-x:hover{color:#fff;border-color:#4a4066}
.gsp-card h2{font-size:1.45rem;font-weight:800;letter-spacing:-.02em;margin:0 0 .4rem;color:#fff}
.gsp-card p.gsp-blurb{color:#b7aed0;font-size:.92rem;margin:0 0 1.1rem}

.gsp-wheel-wrap{position:relative;width:min(17rem,72vw);margin:0 auto 1.2rem}
.gsp-wheel-wrap:before{content:'';position:absolute;left:50%;top:-6px;transform:translateX(-50%);
border-style:solid;border-width:0 .7rem 1.1rem .7rem;
border-color:transparent transparent #fff transparent;z-index:2;
filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
.gsp-wheel{width:100%;aspect-ratio:1;border-radius:50%;border:6px solid #fff;
box-shadow:0 0 0 4px #2c2540,0 18px 40px -14px rgba(0,0,0,.7);
transition:transform 5.2s cubic-bezier(.14,.9,.16,1)}
.gsp-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
width:2.4rem;height:2.4rem;border-radius:50%;background:#fff;z-index:2;
box-shadow:0 2px 8px rgba(0,0,0,.4)}

.gsp-form{display:grid;gap:.55rem;text-align:left}
.gsp-form input{width:100%;font:inherit;font-size:.95rem;padding:.7rem .85rem;
border-radius:10px;border:1px solid #2c2540;background:#0f0c17;color:#f5f3ff}
.gsp-form input::placeholder{color:#6f6790}
.gsp-form input:focus{outline:2px solid var(--gsp-a,#7c3aed);outline-offset:1px}
.gsp-go{margin-top:.35rem;width:100%;border:0;border-radius:999px;cursor:pointer;
background:var(--gsp-a,#7c3aed);color:#fff;font:800 1rem/1 var(--font-sans,system-ui,sans-serif);
padding:.95rem 1rem;transition:filter .15s}
.gsp-go:hover{filter:brightness(1.1)}
.gsp-go:disabled{opacity:.6;cursor:default}
.gsp-small{margin:.7rem 0 0;font-size:.74rem;color:#8b83a8;line-height:1.5}
.gsp-err{margin:.5rem 0 0;font-size:.84rem;color:#fca5a5;min-height:1.1em}

.gsp-won{display:none}
.gsp-won.on{display:block}
.gsp-won h3{font-size:1.6rem;margin:.2rem 0 .3rem;color:#fff}
.gsp-prize{font-size:1.15rem;font-weight:700;color:var(--gsp-a,#7c3aed);
background:#0f0c17;border:1px solid #2c2540;border-radius:12px;padding:.9rem 1rem;margin:.9rem 0}
.gsp-conf{position:fixed;inset:0;pointer-events:none;z-index:9992;overflow:hidden}
.gsp-bit{position:absolute;width:.55rem;height:.9rem;opacity:0;animation:gspFall linear forwards}
@keyframes gspFall{
  0%{opacity:1;transform:translate3d(0,-10vh,0) rotate(0)}
  100%{opacity:0;transform:translate3d(var(--dx,0),105vh,0) rotate(var(--rot,540deg))}}
@media(prefers-reduced-motion:reduce){
  .gsp-wheel{transition-duration:.6s}
  .gsp-bit{display:none}}
`;

/** The tab, the panel and the wheel. Returns '' when the widget is off. */
export function renderSpinner(site: SiteConfig, slug: string): string {
  const spin = site.spinner as Spinner | undefined;
  if (!spin?.on) return '';
  const slots = layout(spin.offers || [], slug);
  if (slots.length !== SLOTS) return '';

  const accent = site.palette?.primary || '#7c3aed';
  const seg = 360 / SLOTS;

  // The face is drawn as a conic gradient with the labels laid over it, so
  // there is no image to load and it scales to any size.
  const wedges = slots
    .map((_, i) => {
      const a = i % 2 ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.02)';
      return `${a} ${i * seg}deg ${(i + 1) * seg}deg`;
    })
    .join(',');

  const labels = slots
    .map((text, i) => {
      const mid = i * seg + seg / 2;
      return `<span class="gsp-lab" style="transform:rotate(${mid}deg) translateY(-6.1rem) rotate(90deg)">${esc(
        text.length > 22 ? text.slice(0, 21) + '…' : text
      )}</span>`;
    })
    .join('');

  return `
<button class="gsp-tab" id="gsp-tab" type="button" aria-haspopup="dialog">
  <i>&#127920;</i>${esc(spin.title || 'Spin to win')}
</button>

<div class="gsp-veil" id="gsp-veil" role="dialog" aria-modal="true" aria-label="${esc(spin.title || 'Spin to win')}">
  <div class="gsp-card">
    <button class="gsp-x" id="gsp-x" type="button" aria-label="Close">&times;</button>

    <div id="gsp-play">
      <h2>${esc(spin.title || 'Spin to win')}</h2>
      <p class="gsp-blurb">${esc(spin.blurb || 'One spin, one chance. Fill this in and give it a go.')}</p>

      <div class="gsp-wheel-wrap">
        <div class="gsp-wheel" id="gsp-wheel"
             style="background:conic-gradient(${wedges}),radial-gradient(circle at 50% 50%, ${esc(accent)}, #2a1a4d)">
          ${labels}
        </div>
        <span class="gsp-hub"></span>
      </div>

      <form class="gsp-form" id="gsp-form" novalidate>
        <input id="gsp-name" name="name" placeholder="Your name" autocomplete="name" required />
        <input id="gsp-email" name="email" type="email" placeholder="Email" autocomplete="email" required />
        <input id="gsp-phone" name="phone" type="tel" placeholder="Phone" autocomplete="tel" />
        <p class="gsp-err" id="gsp-err" role="alert"></p>
        <button class="gsp-go" id="gsp-go" type="submit">Spin the wheel</button>
      </form>
      <p class="gsp-small">
        Your details go to ${esc(site.name || slug)} so they can sort your prize &mdash; nothing else,
        and you will not be added to any list by us.
        ${spin.terms ? esc(spin.terms) : ''}
      </p>
    </div>

    <div class="gsp-won" id="gsp-won">
      <h3 id="gsp-head">Congratulations</h3>
      <p class="gsp-blurb" id="gsp-sub">Here is what you landed on.</p>
      <div class="gsp-prize" id="gsp-prize"></div>
      <p class="gsp-small">${esc(site.name || slug)} has your details and will be in touch.
        Show them this screen or mention it when you get in touch.</p>
    </div>
  </div>
</div>
<div class="gsp-conf" id="gsp-conf" aria-hidden="true"></div>

<style>
.gsp-wheel{position:relative}
.gsp-lab{position:absolute;left:50%;top:50%;transform-origin:0 0;
font:700 .62rem/1.15 var(--font-sans,system-ui,sans-serif);color:#fff;
width:5.6rem;margin-left:-2.8rem;text-align:center;pointer-events:none;
text-shadow:0 1px 3px rgba(0,0,0,.6)}
</style>

<script>
(function () {
  var SLOTS = ${SLOTS};
  var slots = ${JSON.stringify(slots)};
  var slug = ${JSON.stringify(slug)};
  var tab = document.getElementById('gsp-tab');
  var veil = document.getElementById('gsp-veil');
  var wheel = document.getElementById('gsp-wheel');
  var form = document.getElementById('gsp-form');
  var go = document.getElementById('gsp-go');
  var err = document.getElementById('gsp-err');
  if (!tab || !veil || !wheel || !form) return;

  // One spin per browser. Not a security control — somebody who wants another
  // go can have one — but it stops the same person filling the owner's inbox
  // by clicking the tab five times.
  var KEY = 'garage-spun:' + slug;
  var spun = false;
  try { spun = !!localStorage.getItem(KEY); } catch (e) {}

  function open() { veil.classList.add('on'); }
  function close() { veil.classList.remove('on'); }
  tab.addEventListener('click', open);
  document.getElementById('gsp-x').addEventListener('click', close);
  veil.addEventListener('click', function (e) { if (e.target === veil) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  if (spun) {
    var prev = null;
    try { prev = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (prev && prev.prize) {
      document.getElementById('gsp-play').style.display = 'none';
      document.getElementById('gsp-prize').textContent = prev.prize;
      document.getElementById('gsp-head').textContent = prev.won ? 'You won' : 'Not this time';
      document.getElementById('gsp-sub').textContent = prev.won
        ? 'You have already had your spin.'
        : 'You have already had your spin.';
      document.getElementById('gsp-won').classList.add('on');
    }
  }

  function confetti(accent) {
    var box = document.getElementById('gsp-conf');
    if (!box) return;
    var colours = [accent, '#fbbf24', '#34d399', '#f472b6', '#60a5fa'];
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
    err.textContent = '';
    var name = document.getElementById('gsp-name').value.trim();
    var email = document.getElementById('gsp-email').value.trim();
    var phone = document.getElementById('gsp-phone').value.trim();
    if (!name) { err.textContent = 'We need a name.'; return; }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { err.textContent = 'That email does not look right.'; return; }

    // The landing slot is picked here, uniformly, before anything is animated.
    // The animation is told where to stop; it does not decide.
    var idx = Math.floor(Math.random() * SLOTS);
    var prize = slots[idx];
    var won = prize !== 'Not this time';

    go.disabled = true;
    go.textContent = 'Spinning…';

    var seg = 360 / SLOTS;
    var stop = 360 * 6 - (idx * seg + seg / 2);
    wheel.style.transform = 'rotate(' + stop + 'deg)';

    // Absolute, not relative. A published site is served from its own
    // subdomain by a different worker, and a relative path would post the
    // lead into that worker's 404 page.
    fetch('https://garage.co.nz/api/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone, prize: prize, won: won }),
    }).catch(function () { /* the spin still happened as far as they are concerned */ });

    try { localStorage.setItem(KEY, JSON.stringify({ prize: prize, won: won })); } catch (e) {}

    setTimeout(function () {
      document.getElementById('gsp-play').style.display = 'none';
      document.getElementById('gsp-prize').textContent = prize;
      document.getElementById('gsp-head').textContent = won ? 'Congratulations' : 'Not this time';
      document.getElementById('gsp-sub').textContent = won
        ? 'Here is what you landed on.'
        : 'The wheel was not kind. Thanks for playing.';
      document.getElementById('gsp-won').classList.add('on');
      if (won) confetti(${JSON.stringify(accent)});
    }, 5400);
  });
})();
</script>`;
}
