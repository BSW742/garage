// WATER RING TOSS (widget)
//
// The handheld toy: a sealed tank of water, two red buttons that fire bursts
// of bubbles, and rings that tumble up through the water and — with enough
// dedication — settle onto the pegs. Pure skill. No dice, no push-your-luck,
// no hidden judgement anywhere: the water does what water does, in front of
// you, and the prize ladder pays out on rings landed before the clock runs
// out. Sixty seconds, five rings, two thumbs.
//
// The whole widget is the physics. What makes the toy feel like the toy:
//  - Rings sink slowly (buoyancy fighting gravity), with heavy drag, and they
//    tumble — a burst does not launch them, it *billows* them.
//  - Each button moves the water on its own side, harder near the vent, with
//    turbulence, so a press is a judgement about position, not a reflex.
//  - A ring lands only if it comes down over a peg, close and lying flat —
//    then it slides down the post and stacks, exactly like the real thing.
//  - The clock starts on the first press, not on opening the box: reading the
//    water first is how the toy is actually played.
//
// Same covenant as the wheel and the balloon: details go to the owner and
// nowhere else, nobody is emailed, nobody leaves empty-handed (the
// consolation covers a scoreless round), one game per person per site.

import type { SiteConfig } from './site-render';

export interface RingToss {
  on?: boolean;
  title?: string;        // "Ring Toss"
  blurb?: string;        // a line under the title
  prizes?: string[];     // the ladder, smallest first; more rings, better rung
  bust?: string;         // the consolation for a scoreless round
  terms?: string;        // "One game per person."
  test?: boolean;        // no form, no one-play lock, no lead recorded
}

const INK = '#14202b';
const SHELL = '#e33d3d';      // the toy's plastic
const SHELL_D = '#b52c2c';
const LINE = 'rgba(20,32,43,.14)';
const SOFT = '#5f7385';

const RINGS = 5;
const SECONDS = 60;

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

/** How many rings each rung needs, spread over the ladder. The last rung is
 *  always all five, because the top prize should cost the full performance. */
function thresholds(count: number): number[] {
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? RINGS : Math.max(1, Math.round(((i + 1) * RINGS) / count))
  );
}

export const RINGTOSS_CSS = `
/* The tab: a little ring on a peg, wobbling in its water. */
.gwr-tab{position:fixed;left:1.5rem;bottom:1.3rem;z-index:9990;width:88px;height:88px;
padding:0;border:0;border-radius:22px;cursor:pointer;
background:linear-gradient(180deg,#bfe6f7,#8fd0ee);
box-shadow:inset 0 0 0 5px ${SHELL},inset 0 2px 0 6px rgba(255,255,255,.35),
0 10px 24px rgba(0,0,0,.32);
transition:transform .25s ease}
.gwr-tab:hover{transform:scale(1.07) rotate(-2deg)}
.gwr-tab:active{transform:scale(.95)}
.gwr-tab i{position:absolute;left:50%;bottom:16px;width:5px;height:30px;margin-left:-2.5px;
background:#fff;border-radius:3px}
/* He peers over the top of the tank, head breaking the border — the curious
   face that makes a thumbnail get clicked. */
.gwr-peek{position:absolute;top:-34px;left:50%;transform:translateX(-50%) rotate(-7deg);
width:52px;height:52px;object-fit:cover;object-position:50% 3%;border-radius:50%;
border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);pointer-events:none;
animation:gwr-peek 3.6s ease-in-out infinite}
@keyframes gwr-peek{0%,100%{transform:translateX(-50%) rotate(-7deg)}
50%{transform:translateX(-46%) rotate(5deg)}}
@media(prefers-reduced-motion:reduce){.gwr-peek{animation:none}}
.gwr-tab u{position:absolute;left:50%;top:22px;width:34px;height:14px;margin-left:-17px;
border:5px solid #ffd23f;border-radius:50%;text-decoration:none;
animation:gwr-bob 2.8s ease-in-out infinite}
@keyframes gwr-bob{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(7px) rotate(10deg)}}
@media(prefers-reduced-motion:reduce){.gwr-tab u{animation:none}}
.gwr-tab em{position:absolute;left:0;right:0;bottom:-19px;font:800 10px/1 var(--font-sans,system-ui,sans-serif);
font-style:normal;letter-spacing:.12em;color:#fff;text-transform:uppercase;
text-shadow:0 1px 3px rgba(0,0,0,.6)}
.gwr-tx{position:absolute;top:-4px;right:-2px;width:22px;height:22px;background:none;
color:#c2c7d0;font:300 17px/22px var(--font-sans,system-ui,sans-serif);text-align:center;
cursor:pointer;z-index:3;text-shadow:0 1px 3px rgba(0,0,0,.5)}
.gwr-tx:hover{color:#fff}
/* Sharing the corner: whatever game tab rendered before it, this one steps up. */
.gbl-tab ~ .gwr-tab,.gdg-tab ~ .gwr-tab{bottom:10.4rem}
body.gz-noted .gwr-tab{bottom:9.6rem}
@media(max-width:520px){.gwr-tab{left:1rem;bottom:1rem}}

/* ── The arcade ──────────────────────────────────────────────── */
.gwr-veil{position:fixed;inset:0;z-index:9991;background:rgba(8,18,26,.66);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.gwr-veil.on{display:flex}
.gwr-card{position:relative;width:min(26rem,100%);max-height:96vh;overflow-y:auto;
background:#f4f8fb;border:1px solid ${LINE};border-radius:18px;
padding:1.5rem 1.5rem 1.3rem;color:${INK};text-align:center;
font-family:var(--font-sans,system-ui,sans-serif)}
.gwr-x{position:absolute;top:.6rem;right:.7rem;width:2rem;height:2rem;border:0;
background:none;color:${SOFT};font-size:1.3rem;cursor:pointer;z-index:2}
.gwr-x:hover{color:${INK}}
.gwr-kicker{font:700 .64rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.18em;
text-transform:uppercase;color:${SHELL_D};margin:0 0 .4rem}
.gwr-title{font-size:clamp(1.5rem,4.5vw,1.9rem);font-weight:800;letter-spacing:-.02em;
line-height:1.05;margin:0 0 .5rem}
.gwr-blurb{margin:0 auto .9rem;font-size:.86rem;color:${SOFT};line-height:1.55;max-width:21rem}

/* The rungs: rings needed, prize earned. The one you are on is lit. */
.gwr-steps{display:flex;justify-content:center;gap:.35rem;flex-wrap:wrap;margin:0 0 1rem}
.gwr-steps span{font:700 .6rem/1.3 var(--font-sans,system-ui,sans-serif);letter-spacing:.03em;
text-transform:uppercase;color:${SOFT};border:1px solid ${LINE};border-radius:999px;
padding:.34rem .6rem;transition:all .25s}
.gwr-steps span.held{background:${SHELL};border-color:${SHELL};color:#fff}

/* ── The toy itself ──────────────────────────────────────────── */
.gwr-toy{position:relative;width:min(20rem,100%);margin:0 auto;user-select:none;
-webkit-user-select:none}
.gwr-tank{display:block;width:100%;border-radius:26px;
box-shadow:inset 0 0 0 8px ${SHELL},inset 0 4px 0 9px rgba(255,255,255,.28),
0 18px 40px -18px rgba(0,0,0,.45);background:#9ed7f0;touch-action:none}
.gwr-hud{position:absolute;top:16px;left:0;right:0;display:flex;justify-content:center;
pointer-events:none}
.gwr-clock{font:800 .95rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;
color:#0b3550;background:rgba(255,255,255,.55);border-radius:999px;padding:.32rem .8rem;
font-variant-numeric:tabular-nums}
.gwr-btns{display:flex;justify-content:space-between;padding:.9rem 1.4rem 0}
.gwr-btn{width:4.4rem;height:4.4rem;border-radius:50%;border:0;cursor:pointer;
background:radial-gradient(circle at 34% 30%,#ff7a7a,${SHELL} 55%,${SHELL_D});
box-shadow:0 6px 0 ${SHELL_D},0 10px 18px rgba(0,0,0,.3);
transition:transform .06s,box-shadow .06s;touch-action:manipulation}
.gwr-btn:active,.gwr-btn.down{transform:translateY(5px);box-shadow:0 1px 0 ${SHELL_D},0 4px 10px rgba(0,0,0,.3)}
.gwr-hint{margin:.7rem 0 0;font-size:.72rem;color:${SOFT};min-height:1.1em}
/* The moment a ring lands: the tank announces it. */
.gwr-toast{position:absolute;top:54px;left:0;right:0;text-align:center;pointer-events:none;
font:800 .95rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.04em;color:#0b3550;
text-transform:uppercase;opacity:0;transform:translateY(8px) scale(.9);
transition:opacity .25s,transform .35s cubic-bezier(.2,1.4,.4,1)}
.gwr-toast.on{opacity:1;transform:none}
.gwr-toast b{color:${SHELL_D}}
@keyframes gwr-pulse{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
.gwr-steps span.pop{animation:gwr-pulse .5s ease-out}

.gwr-form{display:grid;gap:.5rem;text-align:left;margin-top:1rem}
.gwr-form input{width:100%;font:inherit;font-size:.9rem;padding:.68rem .85rem;
border-radius:8px;border:1px solid ${LINE};background:#fff;color:${INK}}
.gwr-form input::placeholder{color:#a9b6c0}
.gwr-form input:focus{outline:none;border-color:${SHELL}}
.gwr-err{margin:.1rem 0 0;font-size:.78rem;color:${SHELL_D};min-height:1.05em}
.gwr-start{width:100%;border:0;border-radius:10px;cursor:pointer;background:${SHELL};
color:#fff;font:800 .85rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.08em;
text-transform:uppercase;padding:1rem}
.gwr-start:hover{background:${SHELL_D}}
.gwr-small{margin:.7rem 0 0;font-size:.66rem;color:${SOFT};line-height:1.6;text-align:center}

/* A challenge arriving: somebody's score, worn as a gauntlet. */
.gwr-dare{display:none;margin:0 0 .9rem;padding:.55rem .9rem;border-radius:10px;
background:#fdeeee;border:1px solid rgba(181,44,44,.25);font-size:.82rem;color:${SHELL_D};
font-weight:700}
.gwr-dare.on{display:block}
.gwr-share{display:inline-flex;align-items:center;gap:.5rem;margin-top:1rem;
border:0;border-radius:999px;cursor:pointer;background:${SHELL};color:#fff;
font:800 .8rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.06em;
text-transform:uppercase;padding:.85rem 1.4rem}
.gwr-share:hover{background:${SHELL_D}}
.gwr-share-note{margin:.55rem 0 0;font-size:.7rem;color:${SOFT}}

.gwr-done{display:none;padding:.3rem 0 .1rem}
.gwr-done.on{display:block;animation:gwrIn .45s cubic-bezier(.16,1,.3,1) both}
@keyframes gwrIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.gwr-shout{font-size:clamp(1.4rem,4.6vw,2rem);font-weight:800;line-height:1.1;
letter-spacing:-.02em;margin:.2rem 0 .6rem}
.gwr-shout em{font-style:normal;color:${SHELL_D}}
.gwr-note{font-size:.85rem;color:${SOFT};line-height:1.6;margin:0}
`;

export function renderRingToss(site: SiteConfig, slug: string): string {
  const rt = (site as any).ringtoss as RingToss | undefined;
  if (!rt?.on) return '';
  const ladder = (rt.prizes || []).map((p) => String(p || '').trim()).filter(Boolean).slice(0, 5);
  if (ladder.length < 2) return '';
  const bust = String(rt.bust || '').trim();
  const title = rt.title || 'Ring Toss';
  const needs = thresholds(ladder.length);

  const steps = ladder
    .map((p, i) => `<span data-step="${i}">${needs[i]} ring${needs[i] === 1 ? '' : 's'} &middot; ${esc(p)}</span>`)
    .join('');

  return `
<button class="gwr-tab" id="gwr-tab" type="button" aria-haspopup="dialog" aria-label="${esc(title)}">
  <img class="gwr-peek" src="https://garage.co.nz/lean.png" alt="" draggable="false" />
  <i></i><u></u><em>Play</em>
  <span class="gwr-tx" role="button" tabindex="0" aria-label="Hide this">&times;</span>
</button>

<div class="gwr-veil" id="gwr-veil" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="gwr-card">
    <button class="gwr-x" id="gwr-x" type="button" aria-label="Close">&times;</button>
    <p class="gwr-kicker">${esc(site.name || slug)}</p>
    <h3 class="gwr-title">${esc(title)}</h3>
    <p class="gwr-dare" id="gwr-dare"></p>
    <div class="gwr-steps" id="gwr-steps">${steps}</div>

    <div class="gwr-toy" id="gwr-toy" style="display:none">
      <canvas class="gwr-tank" id="gwr-tank" width="360" height="430"></canvas>
      <div class="gwr-hud"><span class="gwr-clock" id="gwr-clock">${SECONDS}.0</span></div>
      <div class="gwr-toast" id="gwr-toast"></div>
      <div class="gwr-btns">
        <button class="gwr-btn" id="gwr-l" type="button" aria-label="Left burst"></button>
        <button class="gwr-btn" id="gwr-r" type="button" aria-label="Right burst"></button>
      </div>
      <p class="gwr-hint" id="gwr-hint">Buttons, or the left and right arrow keys.</p>
    </div>

    <form class="gwr-form" id="gwr-form">
      <input id="gwr-name" placeholder="Your name" autocomplete="name" required />
      <input id="gwr-email" type="email" placeholder="Email" autocomplete="email" required />
      <input id="gwr-phone" placeholder="Phone (optional)" autocomplete="tel" />
      <p class="gwr-err" id="gwr-err"></p>
      <button class="gwr-start" type="submit">Pick it up</button>
      <p class="gwr-small">A game of skill — nobody leaves empty-handed, and worst case is
      ${bust ? esc(bust) : 'a consolation prize'}. Your details go to ${esc(site.name || slug)}
      and nowhere else. We will not email you. ${rt.terms ? esc(rt.terms) : ''}</p>
    </form>

    <div class="gwr-done" id="gwr-done"></div>
  </div>
</div>

<script>
(function () {
  var slug = ${JSON.stringify(slug)};
  var ladder = ${JSON.stringify(ladder)};
  var NEEDS = ${JSON.stringify(needs)};
  var bust = ${JSON.stringify(bust)};
  var KEY = 'gwr:' + slug;
  var TEST = ${JSON.stringify(!!rt.test)};
  var SECONDS = ${SECONDS};

  var $ = function (id) { return document.getElementById(id); };
  var tab = $('gwr-tab'), veil = $('gwr-veil');

  tab.querySelector('.gwr-tx').addEventListener('click', function (e) {
    e.stopPropagation(); tab.style.display = 'none';
  });
  tab.addEventListener('click', function () { veil.classList.add('on'); });
  $('gwr-x').addEventListener('click', function () { veil.classList.remove('on'); });
  veil.addEventListener('click', function (e) { if (e.target === veil) veil.classList.remove('on'); });

  // A challenge in the letterbox: ?toss=N&by=Name opens the game already
  // knowing the score to beat, and says so.
  var qs = new URLSearchParams(location.search);
  var dare = null;
  if (qs.get('toss') !== null) {
    var dn = Math.max(0, Math.min(${RINGS}, parseInt(qs.get('toss'), 10) || 0));
    var db = String(qs.get('by') || '').slice(0, 24).replace(/[<>&"]/g, '');
    dare = { n: dn, by: db || 'Somebody' };
    var dareEl = $('gwr-dare');
    dareEl.textContent = dare.by + ' landed ' + dare.n + ' ring' + (dare.n === 1 ? '' : 's') + ' here. Beat that.';
    dareEl.classList.add('on');
    veil.classList.add('on');
  }

  var past = null;
  if (!TEST) {
    try { past = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    // A share buys one more game — once. The flag is spent by being used.
    var extra = false;
    try { extra = localStorage.getItem(KEY + ':extra') === '1'; } catch (e) {}
    if (past && extra) {
      try { localStorage.removeItem(KEY + ':extra'); localStorage.removeItem(KEY); } catch (e) {}
      past = null;
    }
    if (past) return finish(past.landed, past.prize, true);
  }

  var name = '', email = '', phone = '', armed = TEST, over = false;
  if (TEST) { $('gwr-form').style.display = 'none'; $('gwr-toy').style.display = ''; }

  $('gwr-form').addEventListener('submit', function (e) {
    e.preventDefault();
    name = $('gwr-name').value.trim();
    email = $('gwr-email').value.trim();
    phone = $('gwr-phone').value.trim();
    if (!name || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      $('gwr-err').textContent = 'We need a name and a real email.';
      return;
    }
    armed = true;
    $('gwr-form').style.display = 'none';
    $('gwr-toy').style.display = '';
  });

  // ── The tank ─────────────────────────────────────────────────
  var cv = $('gwr-tank'), ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  var WALL = 14;                       // inside the plastic
  var COLORS = ['#ff5a5a', '#ffd23f', '#3ecf6e', '#4aa8ff', '#c07bff'];

  // Two pegs, like the toy: white posts with a rounded tip on a little base.
  var PEGS = [
    { x: W * 0.34, top: H * 0.56, base: H * 0.86, stack: 0 },
    { x: W * 0.66, top: H * 0.50, base: H * 0.86, stack: 0 },
  ];
  var RING_R = 21, RING_T = 7;         // radius and tube thickness
  // The third dimension. Every ring lives at a depth z from 0 (against the
  // back wall) to 1 (against the lens); depth sets its size, its light and
  // its draw order, and the pegs live in the middle of the water at 0.5.
  var rings = [];
  for (var i = 0; i < ${RINGS}; i++) {
    rings.push({
      x: W * (0.16 + 0.17 * i), y: H * 0.84 - Math.random() * 10,
      z: 0.25 + Math.random() * 0.5, vz: 0,
      vx: 0, vy: 0,
      a: (Math.random() - 0.5) * 1.2, va: 0,
      c: COLORS[i], landed: -1, slide: 0,
    });
  }
  var bubbles = [];
  var clockLeft = SECONDS, running = false, ended = false;
  var slosh = 0;                        // the whole tank breathes after a press

  // Crisp on retina: the backing store runs at device pixels.
  (function () {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.maxWidth = '100%';
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.scale(dpr, dpr);
  })();

  function burst(side) {
    if (!armed || over || ended) return;
    if (!running) { running = true; }   // the clock starts on the first press
    var vx0 = side < 0 ? WALL + 44 : W - WALL - 44;
    var vy0 = H - WALL - 6;
    slosh = Math.min(1, slosh + 0.5);
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      if (r.landed >= 0) continue;
      // A plume, not a point blast: a rising column over the vent that lofts
      // whatever is in it clear to the surface — which is what the toy does.
      // The skill is the catch on the way down, not the launch.
      var dx = r.x - vx0;
      var column = Math.exp(-(dx * dx) / (2 * 95 * 95));
      var heightEase = 0.55 + 0.45 * ((r.y - WALL) / (H - WALL * 2));
      var k = 300 * column * heightEase;
      r.vy -= k * (1.4 + Math.random() * 0.9);
      r.vx += (dx > 0 ? 1 : -1) * k * 0.22 + (Math.random() - 0.5) * k * 0.5;
      r.vz += (Math.random() - 0.5) * 1.6 * column;
      r.va += (Math.random() - 0.5) * k * 0.05;
    }
    for (var b = 0; b < 16; b++) {
      bubbles.push({ x: vx0 + (Math.random() - 0.5) * 34, y: vy0 - Math.random() * 8,
        z: Math.random(), r: 1.5 + Math.random() * 4.5,
        vy: -(160 + Math.random() * 220), w: Math.random() * 6.3 });
    }
    var btn = side < 0 ? $('gwr-l') : $('gwr-r');
    btn.classList.add('down');
    setTimeout(function () { btn.classList.remove('down'); }, 90);
  }

  $('gwr-l').addEventListener('pointerdown', function (e) { e.preventDefault(); burst(-1); });
  $('gwr-r').addEventListener('pointerdown', function (e) { e.preventDefault(); burst(1); });
  document.addEventListener('keydown', function (e) {
    if (!veil.classList.contains('on')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); burst(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); burst(1); }
  });

  function landedCount() {
    var n = 0;
    for (var i = 0; i < rings.length; i++) if (rings[i].landed >= 0) n++;
    return n;
  }

  function rungFor(landed) {
    var rung = -1;
    for (var i = 0; i < NEEDS.length; i++) if (landed >= NEEDS[i]) rung = i;
    return rung;
  }

  function paintSteps() {
    var rung = rungFor(landedCount());
    for (var i = 0; i < ladder.length; i++) {
      var el = document.querySelector('#gwr-steps [data-step="' + i + '"]');
      el.classList.toggle('held', i === rung);
    }
  }

  function step(dt) {
    slosh *= Math.exp(-2.2 * dt);
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      if (r.landed >= 0) {
        if (r.slide > 0) {
          r.y = Math.min(r.y + 260 * dt, r.slideTo);
          if (r.y >= r.slideTo) r.slide = 0;
        }
        r.a *= 0.9;
        r.z += (0.5 - r.z) * 3 * dt;    // settles onto the peg's plane
        continue;
      }
      // Water: slow sink, heavy drag, and the slosh of the last press still
      // breathing through everything.
      r.vy += 46 * dt;
      r.vx += Math.sin(Date.now() / 900 + i * 2) * (5 + slosh * 40) * dt;
      r.vx *= Math.exp(-1.7 * dt);
      r.vy *= Math.exp(-1.7 * dt);
      r.vz *= Math.exp(-1.4 * dt);
      r.va *= Math.exp(-1.2 * dt);
      r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.va * dt;
      r.z += r.vz * dt;
      r.z += (0.5 - r.z) * 0.25 * dt;   // the water is deepest in the middle
      if (r.z < 0.05) { r.z = 0.05; r.vz = Math.abs(r.vz) * 0.4; }
      if (r.z > 0.95) { r.z = 0.95; r.vz = -Math.abs(r.vz) * 0.4; }

      var rr = RING_R * (0.75 + 0.5 * r.z);
      if (r.x < WALL + rr) { r.x = WALL + rr; r.vx = Math.abs(r.vx) * 0.4; }
      if (r.x > W - WALL - rr) { r.x = W - WALL - rr; r.vx = -Math.abs(r.vx) * 0.4; }
      if (r.y < WALL + rr) { r.y = WALL + rr; r.vy = Math.abs(r.vy) * 0.3; }
      if (r.y > H - WALL - 10) { r.y = H - WALL - 10; r.vy = -Math.abs(r.vy) * 0.2; r.va *= 0.5; }

      // The pegs, in the middle of the water. Close in x, near the peg's
      // depth, coming down, lying flat — and a ring falling anywhere near a
      // post is funnelled gently toward its plane, the way the water around
      // an obstacle actually pulls.
      for (var p = 0; p < PEGS.length; p++) {
        var peg = PEGS[p];
        var nearX = Math.abs(r.x - peg.x) < RING_R * 1.6;
        if (nearX && r.vy > 0 && r.y < peg.top) {
          r.z += (0.5 - r.z) * 2.2 * dt;
        }
        var flat = Math.abs(Math.sin(r.a)) < 0.55;
        if (r.vy > 8 && flat &&
            Math.abs(r.x - peg.x) < RING_R * 0.55 &&
            Math.abs(r.z - 0.5) < 0.22 &&
            r.y > peg.top - 6 && r.y < peg.top + 14) {
          r.landed = p;
          r.litAt = Date.now();
          r.x = peg.x; r.vx = 0; r.vy = 0; r.vz = 0; r.va = (Math.random() - 0.5) * 2;
          r.restTilt = (Math.random() - 0.5) * 0.16;
          r.slide = 1;
          r.slideTo = peg.base - 8 - peg.stack * (RING_T + 4);
          peg.stack++;
          // The tank celebrates: a crown of bubbles off the peg tip.
          for (var cb = 0; cb < 14; cb++) {
            var ang = (cb / 14) * Math.PI * 2;
            bubbles.push({ x: peg.x + Math.cos(ang) * 16, y: peg.top + Math.sin(ang) * 10,
              z: 0.5 + (Math.random() - 0.5) * 0.3, r: 1.5 + Math.random() * 3,
              vy: -(120 + Math.random() * 160), w: Math.random() * 6.3 });
          }
          var n = landedCount();
          var toast = $('gwr-toast');
          var rung2 = rungFor(n);
          toast.innerHTML = n + ' ring' + (n === 1 ? '' : 's') +
            (rung2 >= 0 ? ' &middot; <b>' + ladder[rung2] + '</b>' : '');
          toast.classList.add('on');
          clearTimeout(toast._t);
          toast._t = setTimeout(function () { toast.classList.remove('on'); }, 1500);
          paintSteps();
          var lit = document.querySelector('#gwr-steps span.held');
          if (lit) { lit.classList.remove('pop'); void lit.offsetWidth; lit.classList.add('pop'); }
          if (landedCount() >= rings.length) endRound(true);
          break;
        }
      }
    }
    for (var b = bubbles.length - 1; b >= 0; b--) {
      var bb = bubbles[b];
      bb.y += bb.vy * dt; bb.w += dt * 7; bb.x += Math.sin(bb.w) * 26 * dt;
      if (bb.y < WALL + 8) bubbles.splice(b, 1);
    }
    // The idle tank still lives: a stray bubble now and then.
    if (Math.random() < dt * 0.7) {
      bubbles.push({ x: WALL + 20 + Math.random() * (W - WALL * 2 - 40), y: H - WALL - 8,
        z: Math.random(), r: 1 + Math.random() * 2, vy: -(40 + Math.random() * 50), w: Math.random() * 6.3 });
    }
  }

  function shade(hex, f) {
    // The colour pushed toward the deep water: far rings go dim and cool.
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    r = Math.round(r * f + 30 * (1 - f)); g = Math.round(g * f + 70 * (1 - f)); b = Math.round(b * f + 110 * (1 - f));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawRing(r) {
    var depth = 0.75 + 0.5 * r.z;              // size with nearness
    var light = 0.55 + 0.45 * r.z;             // brightness with nearness
    var R = RING_R * depth, T = RING_T * depth;
    var squash = r.landed >= 0 ? 0.3 : 0.32 + 0.68 * Math.abs(Math.cos(r.a));
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.landed >= 0 ? (r.restTilt || 0) : Math.sin(r.a) * 0.5);
    if (r.landed >= 0 && r.litAt && Date.now() - r.litAt < 700) {
      // The catch, celebrated: a golden halo that burns off.
      var age = (Date.now() - r.litAt) / 700;
      ctx.lineWidth = T + 8 * (1 - age);
      ctx.strokeStyle = 'rgba(255,210,63,' + (0.7 * (1 - age)) + ')';
      ctx.beginPath(); ctx.ellipse(0, 0, R + 4 * (1 - age), (R + 4 * (1 - age)) * squash, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // The body of the torus, darker at the bottom of the tube.
    ctx.lineWidth = T;
    ctx.strokeStyle = shade(r.c, light * 0.82);
    ctx.beginPath(); ctx.ellipse(0, T * 0.16, R, R * squash, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = shade(r.c, light);
    ctx.beginPath(); ctx.ellipse(0, 0, R, R * squash, 0, 0, Math.PI * 2); ctx.stroke();
    // The hole reads only when the ring faces you.
    if (squash > 0.55) {
      ctx.lineWidth = 2 * depth;
      ctx.strokeStyle = 'rgba(10,30,45,' + (0.28 * light) + ')';
      ctx.beginPath(); ctx.ellipse(0, 0, R - T * 0.6, (R - T * 0.6) * squash, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // The glint along the top of the tube.
    ctx.lineWidth = 2.5 * depth;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.28 + 0.4 * r.z) + ')';
    ctx.beginPath();
    ctx.ellipse(0, -T * 0.24, R, R * squash, 0, Math.PI * 1.08, Math.PI * 1.82);
    ctx.stroke();
    ctx.restore();
  }

  var caustics = [
    { x: W * 0.3, y: H * 0.25, r: 90, s: 1.3 },
    { x: W * 0.7, y: H * 0.45, r: 120, s: 0.9 },
    { x: W * 0.45, y: H * 0.7, r: 100, s: 1.1 },
  ];

  function draw() {
    // The water: lit hardest at the top, falling to deep blue, with the back
    // wall visibly darker than the lens — that difference IS the depth.
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#cfeefb'); g.addColorStop(0.45, '#9ed7f0'); g.addColorStop(1, '#6cb4da');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var back = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.42, W * 0.75);
    back.addColorStop(0, 'rgba(255,255,255,0)'); back.addColorStop(1, 'rgba(20,60,95,.24)');
    ctx.fillStyle = back; ctx.fillRect(0, 0, W, H);

    // Caustic light, drifting slowly.
    var t = Date.now() / 1000;
    for (var c = 0; c < caustics.length; c++) {
      var ca = caustics[c];
      var cx = ca.x + Math.sin(t * 0.4 * ca.s + c * 2) * 24;
      var cy = ca.y + Math.cos(t * 0.3 * ca.s + c) * 14;
      var cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, ca.r);
      cg.addColorStop(0, 'rgba(255,255,255,.14)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, ca.r, 0, Math.PI * 2); ctx.fill();
    }

    // The floor, and every floating thing's shadow pooled on it — the single
    // strongest cue that the rings hang in a volume rather than on a plane.
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fillRect(WALL, H - WALL - 6, W - WALL * 2, 6);
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      var lift = (H - WALL - 10 - r.y) / (H - WALL * 2);
      var sw = RING_R * (0.75 + 0.5 * r.z) * (1 - lift * 0.45);
      ctx.fillStyle = 'rgba(15,45,70,' + (0.16 * (1 - lift * 0.8)) + ')';
      ctx.beginPath();
      ctx.ellipse(r.x, H - WALL - 7, sw, sw * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Everything in the water, painted back to front. The pegs live at 0.5,
    // so far rings pass behind the posts and near rings in front of them —
    // which is the moment the eye accepts the volume.
    var order = [];
    for (var i2 = 0; i2 < rings.length; i2++) order.push(rings[i2]);
    order.sort(function (a, b) { return a.z - b.z; });
    var pegsDrawn = false;
    function drawPegs() {
      for (var p2 = 0; p2 < PEGS.length; p2++) {
        var peg = PEGS[p2];
        ctx.fillStyle = 'rgba(15,45,70,.18)';
        ctx.beginPath(); ctx.ellipse(peg.x + 6, peg.base + 4, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f4fafd';
        ctx.beginPath(); ctx.ellipse(peg.x, peg.base, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(peg.x - 3.5, peg.top, 7, peg.base - peg.top);
        ctx.fillStyle = 'rgba(150,180,200,.55)';
        ctx.fillRect(peg.x + 1.2, peg.top + 4, 2.3, peg.base - peg.top - 8);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(peg.x, peg.top, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(peg.x - 1.7, peg.top - 1.7, 2, 0, Math.PI * 2); ctx.fill();
      }
      pegsDrawn = true;
    }
    for (var j = 0; j < order.length; j++) {
      if (!pegsDrawn && order[j].z >= 0.5) drawPegs();
      drawRing(order[j]);
    }
    if (!pegsDrawn) drawPegs();

    // Bubbles, sized by their own depth.
    for (var b = 0; b < bubbles.length; b++) {
      var bb = bubbles[b];
      var bd = 0.6 + 0.6 * (bb.z || 0.5);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.4 * (bb.z || 0.5)) + ')';
      ctx.beginPath(); ctx.arc(bb.x, bb.y, bb.r * bd, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(bb.x - bb.r * bd * 0.3, bb.y - bb.r * bd * 0.3, bb.r * bd * 0.3, 0, Math.PI * 2); ctx.fill();
    }

    // The lens: the toy's curved plastic, catching the room.
    var s1 = ctx.createLinearGradient(WALL, 0, WALL + 80, 0);
    s1.addColorStop(0, 'rgba(255,255,255,.32)'); s1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = s1; ctx.fillRect(WALL, WALL, 80, H - WALL * 2);
    var s2 = ctx.createLinearGradient(W - WALL - 40, 0, W - WALL, 0);
    s2.addColorStop(0, 'rgba(255,255,255,0)'); s2.addColorStop(1, 'rgba(20,60,95,.14)');
    ctx.fillStyle = s2; ctx.fillRect(W - WALL - 40, WALL, 40, H - WALL * 2);
  }

  function endRound(swept) {
    if (ended) return;
    ended = true;
    var landed = landedCount();
    var rung = rungFor(landed);
    var prize = rung >= 0 ? ladder[rung] : (bust || 'a consolation prize');
    setTimeout(function () { finish(landed, prize, false, rung >= 0, swept); }, swept ? 700 : 400);
  }

  // Test mode opens the hood, so a scripted player can prove the game is
  // winnable — the tower shipped unwinnable once, and never again.
  if (TEST) { try { window.__gwr = { rings: rings, pegs: PEGS, W: W, H: H }; } catch (e) {} }

  var prev = 0;
  function loop(now) {
    if (over) return;
    if (!prev) prev = now;
    var dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (running && !ended) {
      clockLeft -= dt;
      if (clockLeft <= 0) { clockLeft = 0; endRound(false); }
      $('gwr-clock').textContent = clockLeft.toFixed(1);
    }
    step(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function finish(landed, prize, replay, won, swept) {
    over = true;
    $('gwr-form').style.display = 'none';
    $('gwr-toy').style.display = 'none';
    var done = $('gwr-done');
    done.className = 'gwr-done on';
    var count = landed + ' ring' + (landed === 1 ? '' : 's');
    if (replay) {
      done.innerHTML = '<p class="gwr-shout">' + count + ' &mdash; <em>' + prize + '</em></p>' +
        '<p class="gwr-note">That was your game — one per person.</p>';
      return;
    }
    var verdict = '';
    if (dare) {
      verdict = landed > dare.n
        ? '<p class="gwr-note"><b>You beat ' + dare.by + '.</b> Send it back.</p>'
        : landed === dare.n
          ? '<p class="gwr-note"><b>Dead level with ' + dare.by + '.</b> Somebody has to settle this.</p>'
          : '<p class="gwr-note"><b>' + dare.by + ' still holds it</b> at ' + dare.n + '.</p>';
    }
    done.innerHTML = ((won === false && landed === 0)
      ? '<p class="gwr-shout">The water<br><em>won that one</em></p>' +
        '<p class="gwr-note">Nobody leaves empty-handed: <b>' + prize + '</b> is yours. ' +
        'Your details are with ' + ${JSON.stringify(esc(site.name || slug))} + ' and they will sort it with you.</p>'
      : '<p class="gwr-shout">' + (swept ? 'All five!' : count + ' landed') + '<br><em>' + prize + '</em></p>' +
        '<p class="gwr-note">' + (swept ? 'A clean sweep with ' + clockLeft.toFixed(1) + 's on the clock. ' : '') +
        'Your details are with ' + ${JSON.stringify(esc(site.name || slug))} + ' and they will sort it with you.</p>')
      + verdict
      + '<button class="gwr-share" id="gwr-share" type="button">Dare a mate &mdash; earn another game</button>'
      + '<p class="gwr-share-note" id="gwr-share-note">Your score travels with the link. When it leaves, you get one more go.</p>';

    var shareBtn = document.getElementById('gwr-share');
    if (shareBtn) shareBtn.addEventListener('click', function () {
      var who = (name || '').split(' ')[0] || 'A mate';
      var url = location.origin + location.pathname + '?toss=' + landed + '&by=' + encodeURIComponent(who);
      var text = who + ' landed ' + landed + ' ring' + (landed === 1 ? '' : 's') + ' on the ' +
        ${JSON.stringify(esc(site.name || slug))} + ' ring toss. Beat that.';
      var pay = function () {
        try { localStorage.setItem(KEY + ':extra', '1'); } catch (e) {}
        document.getElementById('gwr-share-note').textContent =
          'Sent. Reload whenever you want your extra game.';
        shareBtn.style.display = 'none';
      };
      if (navigator.share) {
        navigator.share({ title: 'Ring Toss', text: text, url: url }).then(pay).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text + ' ' + url).then(function () {
          document.getElementById('gwr-share-note').textContent = 'Copied — paste it to a mate. Your extra game is banked.';
          try { localStorage.setItem(KEY + ':extra', '1'); } catch (e) {}
          shareBtn.style.display = 'none';
        }).catch(function () {});
      }
    });

    if (TEST) return;
    try { localStorage.setItem(KEY, JSON.stringify({ landed: landed, prize: prize })); } catch (e) {}
    fetch('https://garage.co.nz/api/toss', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone,
                             prize: prize, won: landed > 0 }),
    }).catch(function () {});
  }
})();
</script>
`;
}
