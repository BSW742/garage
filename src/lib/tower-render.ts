// THE TOWER (widget)
//
// Jenga, which is the most embodied tension there is — and Jenga is a game of
// skill, so this is one too. There is no dice roll anywhere in it. You choose
// your block: centre blocks are solid, edge blocks are dicey, and a second
// block from a row that already has a gap is asking for it — the same reads
// as the real game. Then you press and hold to draw it out, and it only comes
// free if the tower is near upright while you pull. The tower sways, and
// every successful pull makes it sway wider and faster and lean further, so
// the safe moment shrinks as the prizes climb. Lose your nerve mid-pull and
// the block slides back, no harm done. Misjudge it and down it all comes.
//
// Walk away between pulls and keep what you are holding; a collapse drops to
// the consolation, so nobody leaves empty-handed.
//
// The drawing carries the game:
//  - Rows alternate one long side-grain face against three end-grain faces,
//    which is the Jenga silhouette. Pulls come from the end rows.
//  - The resting tower already breathes, barely — a perfectly still tower
//    reads as a picture of one.
//  - The pool of shadow under it warms whenever the tower is outside the safe
//    band, which is how the game teaches its own timing without a word.
//  - The collapse gives every block its own trajectory and thumps the card.
//
// Same covenant as the wheel and the balloon: details go to the owner and
// nowhere else, nobody is emailed, nobody leaves empty-handed, one game per
// person — and no hidden odds, because there are no odds at all.

import type { SiteConfig } from './site-render';

export interface Tower {
  on?: boolean;
  title?: string;        // "The Tower"
  blurb?: string;        // a line under the title
  prizes?: string[];     // the ladder, smallest first; the last pull is best
  bust?: string;         // the consolation when it comes down
  terms?: string;        // "One game per person."
  test?: boolean;        // no form, no one-play lock, no lead recorded
}

const INK = '#2a241c';
const LINEN = '#f6f1e7';
const LINE = 'rgba(42,36,28,.14)';
const SOFT = '#8a7f6e';
const WALNUT = '#5d4327';
const BUSTC = '#b8452e';

// Ten rows; the five end-grain rows are the ones a block can come out of.
const ROWS = 10;

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

// Deterministic scatter for the collapse, so the tower renders the same on
// every load but no two blocks fall the same way.
function jitter(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const TOWER_CSS = `
/* The tab: a tiny tower that already leans. */
.gtw-tab{position:fixed;left:1.5rem;bottom:1.4rem;z-index:9990;width:88px;height:104px;
padding:0;border:0;background:none;cursor:pointer;
filter:drop-shadow(0 10px 20px rgba(0,0,0,.3));
transition:transform .25s ease}
.gtw-tab:hover{transform:scale(1.08)}
.gtw-tab:active{transform:scale(.95)}
.gtw-tab .gtw-mini{position:absolute;left:50%;bottom:20px;transform:translateX(-50%) rotate(-2.5deg);
transform-origin:50% 100%;width:54px;animation:gtw-idle 3.4s ease-in-out infinite}
@keyframes gtw-idle{0%,100%{transform:translateX(-50%) rotate(-2.5deg)}
50%{transform:translateX(-50%) rotate(-.5deg)}}
@media(prefers-reduced-motion:reduce){.gtw-tab .gtw-mini{animation:none}}
.gtw-tab .gtw-mini i{display:block;height:11px;margin-bottom:1px;border-radius:2px;
background:linear-gradient(180deg,#cfa268,#aa7c44)}
.gtw-tab .gtw-mini i:nth-child(2n){background:
linear-gradient(90deg,#d9b177 0 32%,#c89a5e 34% 66%,#d9b177 68% 100%)}
.gtw-tab em{position:absolute;left:0;right:0;bottom:0;font:800 10px/1 var(--font-sans,system-ui,sans-serif);
font-style:normal;letter-spacing:.14em;color:#fff;text-transform:uppercase;
text-shadow:0 1px 3px rgba(0,0,0,.6)}
.gtw-tx{position:absolute;top:-2px;right:2px;width:22px;height:22px;background:none;
color:#c2c7d0;font:300 17px/22px var(--font-sans,system-ui,sans-serif);text-align:center;
cursor:pointer;z-index:3;text-shadow:0 1px 3px rgba(0,0,0,.5)}
.gtw-tx:hover{color:#fff}
body.gz-noted .gtw-tab{bottom:9.6rem}
@media(max-width:520px){.gtw-tab{left:1rem;bottom:1rem}}

/* ── The table ───────────────────────────────────────────────── */
.gtw-veil{position:fixed;inset:0;z-index:9991;background:rgba(26,21,14,.62);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.gtw-veil.on{display:flex}
.gtw-card{position:relative;width:min(27rem,100%);max-height:96vh;overflow-y:auto;
background:${LINEN};border:1px solid ${LINE};border-radius:18px;
padding:1.6rem 1.6rem 1.4rem;color:${INK};text-align:center;
font-family:var(--font-sans,system-ui,sans-serif)}
.gtw-card.thump{animation:gtw-thump .5s ease-out}
@keyframes gtw-thump{0%{transform:none}20%{transform:translate(3px,4px)}
40%{transform:translate(-3px,-2px)}60%{transform:translate(2px,2px)}
80%{transform:translate(-1px,-1px)}100%{transform:none}}
.gtw-x{position:absolute;top:.6rem;right:.7rem;width:2rem;height:2rem;border:0;
background:none;color:${SOFT};font-size:1.3rem;cursor:pointer;z-index:2}
.gtw-x:hover{color:${INK}}
.gtw-kicker{font:700 .64rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.18em;
text-transform:uppercase;color:${WALNUT};margin:0 0 .4rem}
.gtw-title{font-size:clamp(1.5rem,4.5vw,1.9rem);font-weight:800;letter-spacing:-.02em;
line-height:1.05;margin:0 0 .5rem}
.gtw-blurb{margin:0 auto .9rem;font-size:.86rem;color:${SOFT};line-height:1.55;max-width:21rem}

/* The ladder as a row of little wooden offcuts; the held one is branded. */
.gtw-steps{display:flex;justify-content:center;gap:.35rem;flex-wrap:wrap;margin:0 0 .9rem}
.gtw-steps span{font:700 .6rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.04em;
text-transform:uppercase;color:#6e5636;border-radius:4px;padding:.4rem .55rem;
background:linear-gradient(180deg,#e9cfa4,#d9b177);
box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 1px 2px rgba(42,36,28,.25);
transition:all .25s}
.gtw-steps span.held{background:linear-gradient(180deg,#7a5a33,#5d4327);color:#f6ead3;
box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 2px 6px rgba(42,36,28,.35)}
.gtw-steps span.gone{opacity:.35}

/* ── The tower ───────────────────────────────────────────────── */
.gtw-stage{position:relative;height:15.5rem;overflow:hidden;margin:0 0 .2rem}
.gtw-stage:after{content:'';position:absolute;left:8%;right:8%;bottom:1.35rem;height:1.5px;
background:linear-gradient(90deg,transparent,rgba(42,36,28,.35),transparent)}
/* The pool of shadow doubles as the game's tell: it warms whenever the tower
   is outside the safe band, which is how the timing teaches itself. */
.gtw-shadow{position:absolute;left:50%;bottom:.9rem;transform:translateX(-50%);
width:9.5rem;height:.9rem;border-radius:50%;background:radial-gradient(ellipse,
rgba(42,36,28,.28),transparent 70%);transition:background .2s}
.gtw-stage.hot .gtw-shadow{background:radial-gradient(ellipse,
rgba(184,69,46,.55),transparent 70%)}
.gtw-t{position:absolute;left:50%;bottom:1.4rem;width:8.6rem;margin-left:-4.3rem;
transform-origin:50% 100%;
animation:gtw-sway var(--pace,4.6s) ease-in-out infinite}
@keyframes gtw-sway{
0%,100%{transform:rotate(calc(var(--tilt,0deg) + var(--wob,.45deg)))}
50%{transform:rotate(calc(var(--tilt,0deg) - var(--wob,.45deg)))}}
@media(prefers-reduced-motion:reduce){.gtw-t{animation:none;transform:rotate(var(--tilt,0deg))}}
.gtw-t.down{animation:none;transform:rotate(var(--tilt,0deg))}

.gtw-row{display:flex;gap:2px;margin-top:2px;height:1.32rem}
.gtw-b{position:relative;border-radius:2.5px;flex:1;
box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 3px rgba(42,36,28,.18);
transition:transform .8s cubic-bezier(.3,.5,.6,1),opacity .8s ease,filter .2s}
/* Side grain: one long piece, streaks running with it. */
.gtw-row.long .gtw-b{background:
repeating-linear-gradient(178deg,rgba(93,67,39,.14) 0 1px,transparent 1px 5px),
linear-gradient(180deg,#cfa268,#aa7c44)}
/* End grain: the sawn face, lighter, a ring hinted in it. */
.gtw-row.ends .gtw-b{background:
radial-gradient(ellipse 60% 45% at 50% 42%,rgba(255,255,255,.28),transparent 60%),
radial-gradient(ellipse 80% 70% at 50% 50%,rgba(93,67,39,.12),transparent 75%),
linear-gradient(180deg,#dcb77e,#c18f55)}
/* A block you could take: it invites the hand. */
.gtw-b.can{cursor:grab}
.gtw-b.can:hover{filter:brightness(1.12);
box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 3px rgba(42,36,28,.18),
0 0 0 2px rgba(93,67,39,.45)}
/* Mid-pull: the block eases out under the hand, the travel driven by a
   transition whose duration is the pull itself. */
.gtw-b.pulling{cursor:grabbing;z-index:2;filter:brightness(1.15);
transition:transform .82s linear}
/* The socket a taken block leaves. */
.gtw-b.out{background:linear-gradient(180deg,#3a2d1c,#241a0e);
box-shadow:inset 0 3px 8px rgba(0,0,0,.55);cursor:default}
/* The collapse: every block on its own path, on its own beat. */
.gtw-t.down .gtw-b{transform:translate(var(--fx),var(--fy)) rotate(var(--fr));
transition:transform .8s cubic-bezier(.3,.5,.6,1),opacity .8s ease;
transition-delay:var(--fd);opacity:.92}

.gtw-hold{font:700 .7rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.12em;
text-transform:uppercase;color:${SOFT};margin:.5rem 0 .8rem;min-height:2.1em;line-height:1.5}

/* ── Controls ────────────────────────────────────────────────── */
.gtw-keep{border:1.5px solid ${INK};border-radius:10px;cursor:pointer;background:none;
color:${INK};font:700 .74rem/1.25 var(--font-sans,system-ui,sans-serif);letter-spacing:.04em;
text-transform:uppercase;padding:.8rem 1.4rem}
.gtw-keep:hover{background:${INK};color:#f6ead3}
.gtw-keep:disabled{opacity:.3;cursor:default}

.gtw-form{display:grid;gap:.5rem;text-align:left}
.gtw-form input{width:100%;font:inherit;font-size:.9rem;padding:.68rem .85rem;
border-radius:8px;border:1px solid ${LINE};background:#fff;color:${INK}}
.gtw-form input::placeholder{color:#b3a893}
.gtw-form input:focus{outline:none;border-color:${WALNUT}}
.gtw-err{margin:.1rem 0 0;font-size:.78rem;color:${BUSTC};min-height:1.05em}
.gtw-start{width:100%;border:0;border-radius:10px;cursor:pointer;background:${WALNUT};
color:#f6ead3;font:800 .85rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.08em;
text-transform:uppercase;padding:1rem}
.gtw-start:hover{background:#4a351e}
.gtw-small{margin:.7rem 0 0;font-size:.66rem;color:${SOFT};line-height:1.6;text-align:center}

/* ── How the game ends ───────────────────────────────────────── */
.gtw-done{display:none;padding:.3rem 0 .1rem}
.gtw-done.on{display:block;animation:gtwIn .45s cubic-bezier(.16,1,.3,1) both}
@keyframes gtwIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.gtw-shout{font-size:clamp(1.4rem,4.6vw,2rem);font-weight:800;line-height:1.1;
letter-spacing:-.02em;margin:.2rem 0 .6rem}
.gtw-shout em{font-style:normal;color:${WALNUT}}
.gtw-shout.lose em{color:${BUSTC}}
.gtw-note{font-size:.85rem;color:${SOFT};line-height:1.6;margin:0}
`;

export function renderTower(site: SiteConfig, slug: string): string {
  const tw = (site as any).tower as Tower | undefined;
  if (!tw?.on) return '';
  const ladder = (tw.prizes || []).map((p) => String(p || '').trim()).filter(Boolean).slice(0, 5);
  if (ladder.length < 2) return '';
  const bust = String(tw.bust || '').trim();
  const title = tw.title || 'The Tower';

  // Rows top down, ends and long alternating; every block carries its own
  // collapse path, assigned here so the fall is scattered but repeatable.
  let rows = '';
  for (let r = 0; r < ROWS; r++) {
    const ends = r % 2 === 1;
    const count = ends ? 3 : 1;
    let cells = '';
    for (let c = 0; c < count; c++) {
      const seed = r * 7 + c * 3 + 1;
      const fx = Math.round((jitter(seed) - 0.5) * 260);
      const fy = Math.round(240 + jitter(seed + 1) * 160);
      const fr = Math.round((jitter(seed + 2) - 0.5) * 260);
      const fd = ((r / ROWS) * 0.22 + jitter(seed + 3) * 0.1).toFixed(2);
      cells += `<span class="gtw-b${ends ? ' can' : ''}" data-b="${r}-${c}" data-row="${r}" data-c="${c}" style="--fx:${fx}px;--fy:${fy}px;--fr:${fr}deg;--fd:${fd}s"></span>`;
    }
    rows += `<div class="gtw-row ${ends ? 'ends' : 'long'}">${cells}</div>`;
  }

  const steps = ladder.map((p, i) => `<span data-step="${i}">${esc(p)}</span>`).join('');
  const mini = Array.from({ length: 5 }, () => '<i></i>').join('');

  return `
<button class="gtw-tab" id="gtw-tab" type="button" aria-haspopup="dialog" aria-label="${esc(title)}">
  <span class="gtw-mini">${mini}</span><em>Pull</em>
  <span class="gtw-tx" role="button" tabindex="0" aria-label="Hide this">&times;</span>
</button>

<div class="gtw-veil" id="gtw-veil" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="gtw-card" id="gtw-card">
    <button class="gtw-x" id="gtw-x" type="button" aria-label="Close">&times;</button>
    <p class="gtw-kicker">${esc(site.name || slug)}</p>
    <h3 class="gtw-title">${esc(title)}</h3>
    <p class="gtw-blurb">${esc(tw.blurb || 'Pick your block, hold to draw it out, and let go if your nerve fails — it slides back. Pull while the tower stands tall; pull while it leans and down it all comes. Every block out is a better prize.')}</p>

    <div class="gtw-steps" id="gtw-steps">${steps}</div>

    <div class="gtw-stage" id="gtw-stage">
      <div class="gtw-shadow"></div>
      <div class="gtw-t" id="gtw-t">${rows}</div>
    </div>
    <p class="gtw-hold" id="gtw-hold">The tower stands</p>

    <form class="gtw-form" id="gtw-form">
      <input id="gtw-name" placeholder="Your name" autocomplete="name" required />
      <input id="gtw-email" type="email" placeholder="Email" autocomplete="email" required />
      <input id="gtw-phone" placeholder="Phone (optional)" autocomplete="tel" />
      <p class="gtw-err" id="gtw-err"></p>
      <button class="gtw-start" type="submit">Steady your hand</button>
      <p class="gtw-small">A game of skill, not luck — and nobody leaves empty-handed: worst case is
      ${bust ? esc(bust) : 'a consolation prize'}. Your details go to ${esc(site.name || slug)}
      and nowhere else. We will not email you. ${tw.terms ? esc(tw.terms) : ''}</p>
    </form>

    <div id="gtw-play" style="display:none">
      <button class="gtw-keep" id="gtw-keep" type="button" disabled>Walk away &amp; keep it</button>
    </div>

    <div class="gtw-done" id="gtw-done"></div>
  </div>
</div>

<script>
(function () {
  var slug = ${JSON.stringify(slug)};
  var ladder = ${JSON.stringify(ladder)};
  var bust = ${JSON.stringify(bust)};
  var KEY = 'gtw:' + slug;
  var TEST = ${JSON.stringify(!!tw.test)};

  var $ = function (id) { return document.getElementById(id); };
  var tab = $('gtw-tab'), veil = $('gtw-veil'), t = $('gtw-t'), stage = $('gtw-stage');

  tab.querySelector('.gtw-tx').addEventListener('click', function (e) {
    e.stopPropagation(); tab.style.display = 'none';
  });
  tab.addEventListener('click', function () { veil.classList.add('on'); });
  $('gtw-x').addEventListener('click', function () { veil.classList.remove('on'); });
  veil.addEventListener('click', function (e) { if (e.target === veil) veil.classList.remove('on'); });

  var past = null;
  if (!TEST) {
    try { past = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (past) return finish(past.won, past.prize, true);
  }

  var name = '', email = '', phone = '', depth = -1, over = false, armed = TEST;
  var pulled = {};   // row -> a block is already gone from it

  if (TEST) {
    $('gtw-form').style.display = 'none';
    $('gtw-play').style.display = 'block';
    $('gtw-hold').textContent = 'Pick your block and hold to pull';
  }

  $('gtw-form').addEventListener('submit', function (e) {
    e.preventDefault();
    name = $('gtw-name').value.trim();
    email = $('gtw-email').value.trim();
    phone = $('gtw-phone').value.trim();
    if (!name || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      $('gtw-err').textContent = 'We need a name and a real email.';
      return;
    }
    armed = true;
    $('gtw-form').style.display = 'none';
    $('gtw-play').style.display = 'block';
    $('gtw-hold').textContent = 'Pick your block and hold to pull';
  });

  function step(i) { return document.querySelector('#gtw-steps [data-step="' + i + '"]'); }

  // The tower's actual angle right now, read off the running animation.
  function angle() {
    var m = getComputedStyle(t).transform;
    if (!m || m === 'none') return 0;
    var p = m.slice(7, -1).split(',');
    return Math.atan2(parseFloat(p[1]), parseFloat(p[0])) * 180 / Math.PI;
  }

  function wob() { return 0.45 + (depth + 1) * 0.5; }
  function tilt() { return parseFloat(t.style.getPropertyValue('--tilt')) || 0; }

  // How much of the sway counts as "standing tall" for this block. Centre
  // blocks forgive the most; edge blocks less; a second block from a gapped
  // row, much less. That hierarchy IS the block-choosing skill.
  function safeBand(el) {
    var row = el.getAttribute('data-row'), c = +el.getAttribute('data-c');
    var f = c === 1 ? 0.62 : 0.4;
    if (pulled[row]) f *= 0.45;
    return Math.max(0.18, wob() * f);
  }

  // The read, offered when they touch a block — what a player who has seen a
  // few towers would already know.
  function readOf(el) {
    var row = el.getAttribute('data-row'), c = +el.getAttribute('data-c');
    if (pulled[row]) return 'Same row as a gap. Asking for it.';
    return c === 1 ? 'Centre block. Solid.' : 'Edge block. Dicey.';
  }

  var live = null;   // the pull in progress
  function watch() {
    if (over) return;
    var off = Math.abs(angle() - tilt());
    // The shadow warms whenever a pull started now would jam — tuned to the
    // centre block's band so it teaches the timing, not the block choice.
    stage.classList.toggle('hot', armed && off > wob() * 0.62);
    if (live) {
      var dt = Date.now() - live.at;
      // The judged moment is the grab and the first breaking-free of the
      // block — after that it is clear of the tower and committed. Judging
      // the whole draw made every pull impossible: the sway always leaves
      // centre, so an 820ms window can never stay inside the band.
      if (off > live.band && dt > 60 && dt < 340) return collapse();
      if (dt > 820) {
        var el = live.el; live = null;
        el.classList.remove('pulling');
        el.classList.remove('can');
        el.classList.add('out');
        el.style.transform = '';
        pulled[el.getAttribute('data-row')] = 1;
        depth += 1;
        t.style.setProperty('--tilt', ((depth + 1) * 0.55 * (depth % 2 ? -1 : 1)) + 'deg');
        t.style.setProperty('--wob', wob() + 'deg');
        t.style.setProperty('--pace', Math.max(1.5, 4.6 - (depth + 1) * 0.62) + 's');
        if (depth > 0) step(depth - 1).classList.remove('held');
        step(depth).classList.add('held');
        $('gtw-keep').disabled = false;
        if (depth >= ladder.length - 1) return finish(true, ladder[depth], false);
        $('gtw-hold').textContent = 'Holding: ' + ladder[depth] + ' — it sways faster now';
      }
    }
    requestAnimationFrame(watch);
  }
  requestAnimationFrame(watch);

  function start(e) {
    if (!armed || over || live) return;
    var el = e.target.closest('.gtw-b.can');
    if (!el || el.classList.contains('out')) return;
    e.preventDefault();
    var band = safeBand(el);
    // Grabbing it while the tower leans is already the mistake.
    if (Math.abs(angle() - tilt()) > band) return collapse();
    live = { el: el, at: Date.now(), band: band };
    var c = +el.getAttribute('data-c');
    el.classList.add('pulling');
    el.style.transform = 'translateX(' + (c === 0 ? -135 : 135) + '%)';
    $('gtw-hold').textContent = 'Easy… hold it steady…';
  }
  function stop() {
    if (!live || over) return;
    // Nerve went: the block slides home. No harm, no prize.
    var el = live.el; live = null;
    el.classList.remove('pulling');
    el.style.transform = '';
    $('gtw-hold').textContent = depth >= 0
      ? 'Holding: ' + ladder[depth] + ' — that one slid back'
      : 'It slid back in. Pick your moment.';
  }
  t.addEventListener('pointerdown', start);
  document.addEventListener('pointerup', stop);
  document.addEventListener('pointercancel', stop);
  t.addEventListener('pointerover', function (e) {
    if (!armed || over || live) return;
    var el = e.target.closest('.gtw-b.can');
    if (el && !el.classList.contains('out')) $('gtw-hold').textContent = readOf(el);
  });

  function collapse() {
    if (over) return;
    over = true; live = null;
    stage.classList.remove('hot');
    t.classList.add('down');
    $('gtw-card').classList.add('thump');
    for (var i = 0; i <= depth; i++) step(i).classList.add('gone');
    setTimeout(function () { finish(false, bust || 'a consolation prize', false); }, 950);
  }

  $('gtw-keep').addEventListener('click', function () {
    if (over || depth < 0) return;
    finish(true, ladder[depth], false);
  });

  function finish(won, prize, replay) {
    over = true; live = null;
    $('gtw-form').style.display = 'none';
    $('gtw-play').style.display = 'none';
    if (replay) {
      stage.style.display = 'none';
      $('gtw-hold').style.display = 'none';
    }
    var done = $('gtw-done');
    done.className = 'gtw-done on';
    done.innerHTML = won
      ? '<p class="gtw-shout">Walked away with<br><em>' + prize + '</em></p>' +
        '<p class="gtw-note">' + (replay ? 'That was your game — one per person.' :
          'A steady hand. Your details are with ' + ${JSON.stringify(esc(site.name || slug))} +
          ' and they will sort it with you.') + '</p>'
      : '<p class="gtw-shout lose">Down<br><em>it came</em></p>' +
        '<p class="gtw-note">Everyone heard it. Still, nobody leaves empty-handed: <b>' + prize +
        '</b> is yours.' + (replay ? ' One game per person.' : ' Your details are with ' +
          ${JSON.stringify(esc(site.name || slug))} + ' and they will sort it with you.') + '</p>';
    if (replay || TEST) return;
    try { localStorage.setItem(KEY, JSON.stringify({ won: won, prize: prize })); } catch (e) {}
    fetch('https://garage.co.nz/api/tower', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone,
                             prize: prize, won: won }),
    }).catch(function () {});
  }
})();
</script>
`;
}
