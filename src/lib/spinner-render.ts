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
import { toPrizes, type Prize } from './prizes';

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
/**
 * Fill the eight slots.
 *
 * There are no losing slots — "Not this time" made the wheel mostly a way of
 * telling people no, and somebody who has just handed over an email to watch a
 * wheel say no has been badly used. Everybody wins something.
 *
 * The top prize gets exactly one slot, which is the gold one, so it comes up
 * one spin in eight. Everything else goes round the remaining seven in turn —
 * which works for two prizes or for seven, and never puts the same prize in
 * two touching wedges.
 */
export function layout(prizes: Prize[], _slug?: string): Prize[] {
  const all = prizes.slice(0, SLOTS);
  if (all.length < 2) return [];
  const rest = all.slice(1);
  const slots: Prize[] = [all[0]];
  for (let i = 1; i < SLOTS; i++) slots.push(rest[(i - 1) % rest.length]);
  return slots;
}

/**
 * What is on this site's wheel.
 *
 * An entry is either a catalogue id or the owner's own words. The catalogue is
 * the quick path and it only stretches as far as the trades we have thought
 * about; a physio cannot be offered a free coffee and a mechanic wants
 * something nobody has written down yet. So anything that is not an id is
 * taken as a label — capped hard at CUSTOM_MAX, which is what keeps a wedge
 * readable no matter who typed into it.
 */
export const CUSTOM_MAX = 14;

export function prizesOf(spin: Spinner | undefined): Prize[] {
  const raw = (spin?.prizes || []).length ? spin!.prizes! : (spin?.offers || []);
  const out: Prize[] = [];
  raw.forEach((entry, i) => {
    const key = String(entry || '').trim();
    if (!key) return;
    const known = toPrizes([key])[0];
    if (known) {
      if (!out.some((p) => p.id === known.id)) out.push(known);
      return;
    }
    const label = key.slice(0, CUSTOM_MAX);
    if (!out.some((p) => p.label.toLowerCase() === label.toLowerCase())) {
      out.push({ id: 'own' + i, icon: '<circle cx="12" cy="12" r="7.5"/>', label, note: label });
    }
  });
  return out.slice(0, SLOTS);
}

// The wheel goes red, blue, white, in that order — two blues next to each other
// was the problem, they read as one wide smudge with a seam down it. Alternating
// three colours means every wedge has a different neighbour on both sides, and
// the white ones give the whole thing air.
//
// The top prize is the gold slot, and there is only one of it.
const INK = '#0a0c11';
const CARD = '#0e111a';
const RED = '#b0202f';
const BLUE = '#1b3a6b';
const WHITE = '#eef1f7';
const GOLD = '#c8a23c';
const LINE = 'rgba(255,255,255,.12)';
const DIM = '#7d8598';

export const SPINNER_CSS = `
/* A wheel, turning, and nothing else. It used to be the words SPIN TO WIN set
   sideways up the edge of the screen, which asked to be read before it could
   be understood — and a vertical line of type is the one thing on a page
   nobody reads. A wheel that is already spinning needs no label at all.
   The colours are brighter than the real wheel inside: this one is competing
   with whatever the site itself is doing, and the wheel in the modal is not. */
.gsp-tab{position:fixed;right:1.1rem;top:50%;transform:translateY(-50%);
z-index:9990;width:92px;height:92px;padding:0;border:0;border-radius:50%;
background:none;cursor:pointer;display:block;
filter:drop-shadow(0 12px 26px rgba(0,0,0,.34));
transition:transform .25s cubic-bezier(.2,1.2,.4,1)}
.gsp-tab:hover{transform:translateY(-50%) scale(1.07)}
.gsp-tab:active{transform:translateY(-50%) scale(.96)}

/* The disc spins; the button does not — it is holding the translate that
   centres it, and an animation on the same element would throw that away. */
.gsp-disc{position:absolute;inset:0;border-radius:50%;
background:conic-gradient(
#fbbf24 0deg 45deg,#ef4444 45deg 90deg,#ffffff 90deg 135deg,#3b82f6 135deg 180deg,
#fbbf24 180deg 225deg,#ef4444 225deg 270deg,#ffffff 270deg 315deg,#3b82f6 315deg 360deg);
box-shadow:0 0 0 4px #fff,0 0 0 5px rgba(10,12,18,.18);
animation:gsp-turn 6.5s linear infinite}
.gsp-tab:hover .gsp-disc{animation-duration:1.6s}
@keyframes gsp-turn{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.gsp-disc{animation:none}}

/* The hub and the peg that reads as a wheel rather than a pie chart. */
.gsp-hub{position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;
border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(10,12,18,.16),
0 2px 5px rgba(0,0,0,.3)}
.gsp-hub:after{content:'';position:absolute;inset:6px;border-radius:50%;background:${RED}}
/* Dark, not white. The rim is white and so was the pointer, which left the
   one part that says which way it is pointing invisible against it. */
.gsp-pin{position:absolute;left:50%;top:-9px;margin-left:-9px;width:0;height:0;
border-style:solid;border-width:19px 9px 0 9px;
border-color:${CARD} transparent transparent transparent;
filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}

@media(max-width:520px){.gsp-tab{width:76px;height:76px;right:.85rem}
  .gsp-hub{width:18px;height:18px;margin:-9px 0 0 -9px}
  .gsp-pin{border-width:16px 8px 0 8px;margin-left:-8px;top:-8px}}

.gsp-veil{position:fixed;inset:0;z-index:9991;background:rgba(4,5,8,.82);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.gsp-veil.on{display:flex}

/* Two columns: what you could win on one side, who you are on the other, both
   on screen at once. The form used to slide up over the wheel, which meant the
   prizes were hidden at exactly the moment somebody was deciding whether to
   hand over an email for them. */
.gsp-card{position:relative;display:grid;gap:1.4rem;align-items:center;
grid-template-columns:1fr;width:min(50rem,100%);max-height:96vh;overflow:hidden;
background:${CARD};color:#eef1f7;border:1px solid ${LINE};border-radius:18px;
padding:1.5rem 1.4rem;font-family:var(--font-sans,system-ui,sans-serif);
box-shadow:0 40px 90px -24px rgba(0,0,0,.9)}
@media(min-width:760px){.gsp-card{grid-template-columns:1fr 1fr;gap:2.2rem;padding:2rem 2rem}}

.gsp-side{text-align:left;min-width:0}
.gsp-x{position:absolute;right:.85rem;top:.85rem;width:1.9rem;height:1.9rem;border-radius:50%;
border:1px solid ${LINE};background:transparent;color:${DIM};font-size:1rem;cursor:pointer;
line-height:1;z-index:5;transition:color .15s,border-color .15s}
.gsp-x:hover{color:#fff;border-color:rgba(255,255,255,.3)}
.gsp-eyebrow{font-size:.62rem;letter-spacing:.26em;text-transform:uppercase;color:${RED};
margin:0 0 .55rem;font-weight:700}
.gsp-card h2{font-size:clamp(1.25rem,3.4vw,1.65rem);font-weight:600;letter-spacing:-.018em;
margin:0 0 .35rem;color:#fff;line-height:1.15}
.gsp-blurb{color:${DIM};font-size:.84rem;margin:0;line-height:1.5}

/* Whichever it has less of, width or height, so the panel never scrolls. */
.gsp-wheel-wrap{position:relative;width:min(78vw,42vh,20rem);aspect-ratio:1;margin:0 auto}
@media(min-width:760px){.gsp-wheel-wrap{width:min(34vw,66vh,22rem)}}
.gsp-wheel-wrap:before{content:'';position:absolute;left:50%;top:-.35rem;transform:translateX(-50%);
border-style:solid;border-width:1.05rem .55rem 0 .55rem;
border-color:${WHITE} transparent transparent transparent;z-index:4;
filter:drop-shadow(0 2px 4px rgba(0,0,0,.55))}
.gsp-wheel{position:absolute;inset:0;border-radius:50%;
box-shadow:inset 0 0 0 1px ${LINE},0 0 0 1px ${LINE},0 24px 60px -24px rgba(0,0,0,.9);
transition:transform 5.4s cubic-bezier(.12,.86,.14,1)}
/* 15% across, so its edge sits at 42.5% and the labels' run to 42% clears it.
   A smaller hub suits the bigger wheel anyway. */
.gsp-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
width:15%;height:15%;border-radius:50%;background:${CARD};z-index:3;
box-shadow:0 0 0 1px ${LINE},0 4px 18px rgba(0,0,0,.8)}
.gsp-hub:after{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
width:26%;height:26%;border-radius:50%;background:${RED}}

/* Labels run along the radius, rim inward, which is the only way they stay
   readable while the wheel is turning. Upright labels look fine standing still
   and become a mess the moment it moves. */
.gsp-slot{position:absolute;inset:0;z-index:2;pointer-events:none}
.gsp-slot span{position:absolute;left:50%;top:4%;width:38%;
transform-origin:0 50%;transform:rotate(90deg);
display:flex;align-items:center;
font:700 .78rem/1 var(--font-sans,system-ui,sans-serif);color:#fff;
letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
/* Words only. Icons and typed prizes are one or the other: an icon means a
   catalogue with a fixed list, and typing means anybody can put anything on.
   Half the wheel carrying a generic circle because nobody had drawn "7 days
   beans" was the worst of both. From 4% to 42% is the run from rim to hub. */
.gsp-slot.dark span{color:${INK}}
.gsp-slot.top span{color:${INK};font-weight:800}
.gsp-slot.top svg,.gsp-slot.dark svg{opacity:1}

.gsp-form{display:grid;gap:.5rem;margin-top:1rem}
.gsp-form input{width:100%;font:inherit;font-size:.9rem;padding:.68rem .85rem;
border-radius:6px;border:1px solid ${LINE};background:${INK};color:#fff}
.gsp-form input::placeholder{color:#5f6675}
.gsp-form input:focus{outline:none;border-color:${RED}}
.gsp-err{margin:.1rem 0 0;font-size:.78rem;color:#e88;min-height:1.05em}
.gsp-go{width:100%;border:1px solid ${RED};border-radius:6px;cursor:pointer;
background:${RED};color:#fff;font:600 .86rem/1 var(--font-sans,system-ui,sans-serif);
letter-spacing:.1em;text-transform:uppercase;padding:.9rem 1rem;
transition:background .18s,border-color .18s}
.gsp-go:hover{background:#c0242f;border-color:#c0242f}
.gsp-go:disabled{opacity:.5;cursor:default}
.gsp-small{margin:.7rem 0 0;font-size:.66rem;color:#5f6675;line-height:1.6}

/* The celebration. Big enough that it is obviously the point of the screen. */
.gsp-won{display:none}
.gsp-won.on{display:block;animation:gspIn .45s cubic-bezier(.16,1,.3,1) both}
@keyframes gspIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.gsp-shout{font-size:clamp(1.65rem,5.4vw,2.9rem);font-weight:800;line-height:1.02;
letter-spacing:-.035em;color:#fff;margin:.1rem 0 .7rem;text-transform:uppercase}
.gsp-shout em{font-style:normal;color:${RED};display:inline}
.gsp-won .gsp-blurb{font-size:.9rem}
.gsp-won-note{margin-top:1.1rem;padding-top:1rem;border-top:1px solid ${LINE};
font-size:.72rem;color:#5f6675;line-height:1.6}

.gsp-conf{position:fixed;inset:0;pointer-events:none;z-index:9992;overflow:hidden}
.gsp-bit{position:absolute;width:.3rem;height:.7rem;opacity:0;animation:gspFall linear forwards}
@keyframes gspFall{
  0%{opacity:1;transform:translate3d(0,-10vh,0) rotate(0)}
  100%{opacity:0;transform:translate3d(var(--dx,0),105vh,0) rotate(var(--rot,540deg))}}
@media(prefers-reduced-motion:reduce){
  .gsp-wheel{transition-duration:.6s}
  .gsp-won.on{animation:none}
  .gsp-bit{display:none}}
`;

/** The tab, the panel and the wheel. Returns '' when the widget is off. */
export function renderSpinner(site: SiteConfig, slug: string): string {
  const spin = site.spinner as Spinner | undefined;
  if (!spin?.on) return '';
  const chosen = prizesOf(spin);
  if (chosen.length < 3) return '';

  const slots = layout(chosen, slug);
  const seg = 360 / SLOTS;
  const top = chosen[0];

  // Slot nought is the top prize and is gold. The other seven cycle red, blue,
  // white, so nothing touches its own colour.
  const CYCLE = [RED, BLUE, WHITE];
  const colour = (i: number) => (i === 0 ? GOLD : CYCLE[(i - 1) % 3]);
  const onLight = (i: number) => i === 0 || CYCLE[(i - 1) % 3] === WHITE;
  const wedges = slots.map((_, i) => `${colour(i)} ${i * seg}deg ${(i + 1) * seg}deg`).join(',');

  // The slot is a full-size layer turned to its wedge; the label inside it is
  // turned again so the words run down the radius from the rim.
  const faces = slots
    .map((p, i) => {
      const mid = i * seg + seg / 2;
      return `<div class="gsp-slot${i === 0 ? ' top' : ''}${onLight(i) ? ' dark' : ''}"
        style="transform:rotate(${mid}deg)">
        <span>${esc(p.label)}</span>
      </div>`;
    })
    .join('');

  const who = esc(site.name || slug);
  const jsSlots = slots.map((p) => ({ label: p.label, note: p.note }));

  return `
<button class="gsp-tab" id="gsp-tab" type="button" aria-haspopup="dialog"
        aria-label="${esc(spin.title || 'Spin to win')}"><span class="gsp-disc"></span><span class="gsp-hub"></span><span class="gsp-pin"></span></button>

<div class="gsp-veil" id="gsp-veil" role="dialog" aria-modal="true" aria-label="${esc(spin.title || 'Spin to win')}">
  <div class="gsp-card">
    <button class="gsp-x" id="gsp-x" type="button" aria-label="Close">&times;</button>

    <div class="gsp-side">
      <div id="gsp-play">
        <p class="gsp-eyebrow">${who}</p>
        <h2>${esc(spin.title || 'Spin to win')}</h2>
        <p class="gsp-blurb">${esc(spin.blurb || 'Three prizes on the wheel. Every spin wins one.')}</p>
        <form class="gsp-form" id="gsp-form" novalidate>
          <input id="gsp-name" placeholder="Your name" autocomplete="name" />
          <input id="gsp-email" type="email" placeholder="Email" autocomplete="email" />
          <input id="gsp-phone" type="tel" placeholder="Phone (optional)" autocomplete="tel" />
          <p class="gsp-err" id="gsp-err" role="alert"></p>
          <button class="gsp-go" id="gsp-go" type="submit">Spin the wheel</button>
        </form>
        <p class="gsp-small">Every slot is a prize &mdash; ${esc(top.note)} is the gold one, on one of the eight.
          Your details go to ${who} and nowhere else. We will not email you.</p>
      </div>

      <div class="gsp-won" id="gsp-won">
        <p class="gsp-eyebrow">${who}</p>
        <h2 class="gsp-shout" id="gsp-shout"></h2>
        <p class="gsp-blurb" id="gsp-sub">Nicely done. ${who} will be in touch about your prize.</p>
        <p class="gsp-won-note">${spin.terms ? esc(spin.terms) + ' ' : ''}Show them this screen,
          or just mention it next time you are in.</p>
      </div>
    </div>

    <div class="gsp-wheel-wrap">
      <div class="gsp-wheel" id="gsp-wheel" style="background:conic-gradient(${wedges})">${faces}</div>
      <span class="gsp-hub"></span>
    </div>
  </div>
</div>
<div class="gsp-conf" id="gsp-conf" aria-hidden="true"></div>

<script>
(function () {
  var SLOTS = ${SLOTS};
  var slots = ${JSON.stringify(jsSlots)};
  var slug = ${JSON.stringify(slug)};
  var $ = function (id) { return document.getElementById(id); };
  var veil = $('gsp-veil'), wheel = $('gsp-wheel'), form = $('gsp-form');
  if (!veil || !wheel || !form) return;

  var KEY = 'garage-spun:' + slug;
  $('gsp-tab').addEventListener('click', function () { veil.classList.add('on'); });
  function close() { veil.classList.remove('on'); }
  $('gsp-x').addEventListener('click', close);
  veil.addEventListener('click', function (e) { if (e.target === veil) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function esc(t) { return String(t).replace(/[&<>]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  function finish(slot, already) {
    $('gsp-play').style.display = 'none';
    $('gsp-shout').innerHTML = already
      ? 'You already won <em>' + esc(slot.note) + '</em>'
      : 'Hooray! You have won <em>' + esc(slot.note) + '</em>. Lucky you!';
    if (already) $('gsp-sub').textContent = 'You have already had your spin.';
    $('gsp-won').classList.add('on');
  }

  try {
    var prev = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (prev && prev.note) finish(prev, true);
  } catch (e) {}

  function confetti() {
    var box = $('gsp-conf');
    if (!box) return;
    var colours = ['${RED}', '#eef1f7', '${BLUE}', '#c0242f'];
    for (var i = 0; i < 90; i++) {
      var bit = document.createElement('span');
      bit.className = 'gsp-bit';
      bit.style.left = Math.random() * 100 + 'vw';
      bit.style.background = colours[i % colours.length];
      bit.style.setProperty('--dx', (Math.random() * 26 - 13) + 'vw');
      bit.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      bit.style.animationDuration = (2.6 + Math.random() * 1.9) + 's';
      bit.style.animationDelay = (Math.random() * 0.5) + 's';
      box.appendChild(bit);
      setTimeout(function (el) { return function () { el.remove(); }; }(bit), 5400);
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

    // The slot is chosen here, uniformly, before anything moves.
    var idx = Math.floor(Math.random() * SLOTS);
    var slot = slots[idx];

    var go = $('gsp-go');
    go.disabled = true; go.textContent = 'Spinning';

    var seg = 360 / SLOTS;
    wheel.style.transform = 'rotate(' + (360 * 7 - (idx * seg + seg / 2)) + 'deg)';

    fetch('https://garage.co.nz/api/spin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone,
                             prize: slot.note, won: true }),
    }).catch(function () {});

    try { localStorage.setItem(KEY, JSON.stringify(slot)); } catch (e) {}
    setTimeout(function () { finish(slot, false); confetti(); }, 5600);
  });
})();
</script>`;
}
