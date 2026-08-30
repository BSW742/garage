// THE TOWER (widget)
//
// Jenga, which is the most embodied tension there is: everyone on earth has
// felt that wobble in their fingers. Pull a block and the prize climbs a rung;
// the tower leans a little further and sways a little faster; walk away while
// it stands and keep what you are holding. Pull once too often and down it
// comes, to the consolation.
//
// The whole game is the object, so the object has to be right:
//
//  - The tower is drawn the way a real one reads from the side — rows
//    alternating between one long side-grain face and three end-grain faces,
//    because that alternation is the Jenga silhouette.
//  - Pulls come out of the end-grain rows only, one block each, at positions
//    scattered ahead of time, so the gaps accumulate the way a real game's do.
//  - The dread is animated, not written: the sway's amplitude grows and its
//    period shortens with every pull, and a cumulative lean creeps in. The
//    resting tower already breathes, barely, because a perfectly still tower
//    reads as a picture of a tower.
//  - The collapse is the payoff for losing: every block gets its own
//    trajectory, assigned at render, and the card itself takes a thump.
//
// Same covenant as the wheel, the balloon and the dig: honest stated odds,
// first pull always holds, details go to the owner and nowhere else, nobody
// is emailed, nobody leaves empty-handed, one game per person per site.

import type { SiteConfig } from './site-render';

export interface Tower {
  on?: boolean;
  title?: string;        // "The Tower"
  blurb?: string;        // a line under the title
  prizes?: string[];     // the ladder, smallest first; the last pull is best
  bust?: string;         // the consolation when it comes down
  terms?: string;        // "One game per person."
}

const INK = '#2a241c';
const LINEN = '#f6f1e7';
const LINE = 'rgba(42,36,28,.14)';
const SOFT = '#8a7f6e';
const WALNUT = '#5d4327';
const BUSTC = '#b8452e';

// Pull one always holds; each after that is riskier. Same curve as the others.
const RISK = [0, 0.22, 0.32, 0.42, 0.52];

// Ten rows; the five end-grain rows are the ones a block can come out of.
const ROWS = 10;

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

// Deterministic scatter, so the tower renders the same on every load but no
// two blocks fall the same way.
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
/* The table line and the pool of shadow that grounds it. */
.gtw-stage:after{content:'';position:absolute;left:8%;right:8%;bottom:1.35rem;height:1.5px;
background:linear-gradient(90deg,transparent,rgba(42,36,28,.35),transparent)}
.gtw-shadow{position:absolute;left:50%;bottom:.9rem;transform:translateX(-50%);
width:9.5rem;height:.9rem;border-radius:50%;background:radial-gradient(ellipse,
rgba(42,36,28,.28),transparent 70%)}
.gtw-t{position:absolute;left:50%;bottom:1.4rem;width:8.6rem;margin-left:-4.3rem;
transform-origin:50% 100%;
animation:gtw-sway var(--pace,4.6s) ease-in-out infinite}
@keyframes gtw-sway{
0%,100%{transform:rotate(calc(var(--tilt,0deg) + var(--wob,.25deg)))}
50%{transform:rotate(calc(var(--tilt,0deg) - var(--wob,.25deg)))}}
@media(prefers-reduced-motion:reduce){.gtw-t{animation:none;transform:rotate(var(--tilt,0deg))}}
.gtw-t.down{animation:none;transform:rotate(var(--tilt,0deg))}

.gtw-row{display:flex;gap:2px;margin-top:2px;height:1.32rem}
.gtw-b{position:relative;border-radius:2.5px;flex:1;
box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -2px 3px rgba(42,36,28,.18);
transition:transform .8s cubic-bezier(.3,.5,.6,1),opacity .8s ease}
/* Side grain: one long piece, streaks running with it. */
.gtw-row.long .gtw-b{background:
repeating-linear-gradient(178deg,rgba(93,67,39,.14) 0 1px,transparent 1px 5px),
linear-gradient(180deg,#cfa268,#aa7c44)}
/* End grain: the sawn face, lighter, a ring hinted in it. */
.gtw-row.ends .gtw-b{background:
radial-gradient(ellipse 60% 45% at 50% 42%,rgba(255,255,255,.28),transparent 60%),
radial-gradient(ellipse 80% 70% at 50% 50%,rgba(93,67,39,.12),transparent 75%),
linear-gradient(180deg,#dcb77e,#c18f55)}
/* The socket a pulled block leaves: the dark inside of the tower. */
.gtw-b.out{background:linear-gradient(180deg,#3a2d1c,#241a0e);
box-shadow:inset 0 3px 8px rgba(0,0,0,.55)}
/* Mid-pull: the block slides clear before the verdict lands. */
.gtw-b.pulling{transform:translateX(var(--slide,130%));z-index:2}
/* The collapse: every block on its own path, on its own beat. */
.gtw-t.down .gtw-b{transform:translate(var(--fx),var(--fy)) rotate(var(--fr));
transition-delay:var(--fd);opacity:.92}

.gtw-hold{font:700 .7rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.12em;
text-transform:uppercase;color:${SOFT};margin:.5rem 0 .8rem;min-height:1em}

/* ── Controls ────────────────────────────────────────────────── */
.gtw-row2{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
.gtw-pull{border:0;border-radius:10px;cursor:pointer;background:${WALNUT};color:#f6ead3;
font:800 .85rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.08em;
text-transform:uppercase;padding:1rem .8rem}
.gtw-pull:hover{background:#4a351e}
.gtw-pull:disabled{opacity:.45;cursor:default}
.gtw-keep{border:1.5px solid ${INK};border-radius:10px;cursor:pointer;background:none;
color:${INK};font:700 .74rem/1.25 var(--font-sans,system-ui,sans-serif);letter-spacing:.04em;
text-transform:uppercase;padding:.7rem .8rem}
.gtw-keep:hover{background:${INK};color:#f6ead3}
.gtw-keep:disabled{opacity:.3;cursor:default}
.gtw-odds{margin:.55rem 0 0;font-size:.7rem;color:${SOFT};min-height:1em}

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

  // The rows, top down, ends and long alternating. Each block carries its own
  // collapse path so no two towers ever fall the same way twice — but this one
  // always falls its own way, which is what a deterministic scatter buys.
  let rows = '';
  const pulls: { row: number; idx: number; dir: number }[] = [];
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
      cells += `<span class="gtw-b" data-b="${r}-${c}" style="--fx:${fx}px;--fy:${fy}px;--fr:${fr}deg;--fd:${fd}s"></span>`;
    }
    rows += `<div class="gtw-row ${ends ? 'ends' : 'long'}">${cells}</div>`;
    if (ends) {
      const idx = Math.floor(jitter(r * 13 + 5) * 3);
      pulls.push({ row: r, idx, dir: idx === 0 ? -1 : 1 });
    }
  }
  // Pull from the middle of the tower first, the way people actually do,
  // then progressively nearer the ends.
  pulls.sort((a, b) => Math.abs(a.row - ROWS / 2) - Math.abs(b.row - ROWS / 2));

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
    <p class="gtw-blurb">${esc(tw.blurb || 'Pull a block and the prize gets better. Walk away while the tower stands and keep what you are holding — pull once too often and down it comes.')}</p>

    <div class="gtw-steps" id="gtw-steps">${steps}</div>

    <div class="gtw-stage">
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
      <p class="gtw-small">Nobody leaves empty-handed — worst case is ${bust ? esc(bust) : 'a consolation prize'}.
      Your details go to ${esc(site.name || slug)} and nowhere else. We will not email you.
      ${tw.terms ? esc(tw.terms) : ''}</p>
    </form>

    <div id="gtw-play" style="display:none">
      <div class="gtw-row2">
        <button class="gtw-pull" id="gtw-pull" type="button">Pull a block</button>
        <button class="gtw-keep" id="gtw-keep" type="button" disabled>Walk away<br>&amp; keep it</button>
      </div>
      <p class="gtw-odds" id="gtw-odds">The first pull always holds.</p>
    </div>

    <div class="gtw-done" id="gtw-done"></div>
  </div>
</div>

<script>
(function () {
  var slug = ${JSON.stringify(slug)};
  var ladder = ${JSON.stringify(ladder)};
  var bust = ${JSON.stringify(bust)};
  var RISK = ${JSON.stringify(RISK)};
  var PULLS = ${JSON.stringify(pulls)};
  var KEY = 'gtw:' + slug;

  var $ = function (id) { return document.getElementById(id); };
  var tab = $('gtw-tab'), veil = $('gtw-veil'), t = $('gtw-t');

  tab.querySelector('.gtw-tx').addEventListener('click', function (e) {
    e.stopPropagation(); tab.style.display = 'none';
  });
  tab.addEventListener('click', function () { veil.classList.add('on'); });
  $('gtw-x').addEventListener('click', function () { veil.classList.remove('on'); });
  veil.addEventListener('click', function (e) { if (e.target === veil) veil.classList.remove('on'); });

  var past = null;
  try { past = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (past) return finish(past.won, past.prize, true);

  var name = '', email = '', phone = '', depth = -1, over = false;

  $('gtw-form').addEventListener('submit', function (e) {
    e.preventDefault();
    name = $('gtw-name').value.trim();
    email = $('gtw-email').value.trim();
    phone = $('gtw-phone').value.trim();
    if (!name || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      $('gtw-err').textContent = 'We need a name and a real email.';
      return;
    }
    $('gtw-form').style.display = 'none';
    $('gtw-play').style.display = 'block';
  });

  function step(i) { return document.querySelector('#gtw-steps [data-step="' + i + '"]'); }
  function block(p) { return document.querySelector('[data-b="' + p.row + '-' + p.idx + '"]'); }

  // The dread, in numbers: more lean, more sway, less time between sways.
  function tension(d) {
    t.style.setProperty('--tilt', ((d + 1) * 0.55 * (d % 2 ? -1 : 1)) + 'deg');
    t.style.setProperty('--wob', (0.25 + (d + 1) * 0.5) + 'deg');
    t.style.setProperty('--pace', Math.max(1.4, 4.6 - (d + 1) * 0.7) + 's');
  }

  $('gtw-pull').addEventListener('click', function () {
    if (over) return;
    var next = depth + 1;
    var p = PULLS[next];
    $('gtw-pull').disabled = true;
    $('gtw-keep').disabled = true;
    var falls = Math.random() < (RISK[next] || 0.5);
    var b = block(p);
    b.style.setProperty('--slide', (p.dir * 135) + '%');
    b.classList.add('pulling');
    $('gtw-hold').textContent = 'Easy… easy…';
    setTimeout(function () {
      if (falls) {
        t.classList.add('down');
        $('gtw-card').classList.add('thump');
        for (var i = 0; i <= depth; i++) step(i).classList.add('gone');
        return setTimeout(function () { finish(false, bust || 'a consolation prize', false); }, 950);
      }
      b.classList.remove('pulling');
      b.classList.add('out');
      depth = next;
      tension(depth);
      if (depth > 0) step(depth - 1).classList.remove('held');
      step(depth).classList.add('held');
      $('gtw-hold').textContent = 'Holding: ' + ladder[depth];
      $('gtw-keep').disabled = false;
      if (depth >= ladder.length - 1) return finish(true, ladder[depth], false);
      $('gtw-pull').disabled = false;
      var pct = Math.round((RISK[depth + 1] || 0.5) * 100);
      $('gtw-odds').textContent = 'Next pull: ' + pct + '% chance it all comes down.';
    }, 780);
  });

  $('gtw-keep').addEventListener('click', function () {
    if (over || depth < 0) return;
    finish(true, ladder[depth], false);
  });

  function finish(won, prize, replay) {
    over = true;
    $('gtw-form').style.display = 'none';
    $('gtw-play').style.display = 'none';
    if (replay) {
      var st = document.querySelector('.gtw-stage');
      if (st) st.style.display = 'none';
      $('gtw-hold').style.display = 'none';
    }
    var done = $('gtw-done');
    done.className = 'gtw-done on';
    done.innerHTML = won
      ? '<p class="gtw-shout">Walked away with<br><em>' + prize + '</em></p>' +
        '<p class="gtw-note">' + (replay ? 'That was your game — one per person.' :
          'The tower never forgets a steady hand. Your details are with ' +
          ${JSON.stringify(esc(site.name || slug))} + ' and they will sort it with you.') + '</p>'
      : '<p class="gtw-shout lose">Down<br><em>it came</em></p>' +
        '<p class="gtw-note">Everyone heard it. Still, nobody leaves empty-handed: <b>' + prize +
        '</b> is yours.' + (replay ? ' One game per person.' : ' Your details are with ' +
          ${JSON.stringify(esc(site.name || slug))} + ' and they will sort it with you.') + '</p>';
    if (replay) return;
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
