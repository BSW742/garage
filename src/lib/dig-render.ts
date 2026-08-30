// THE BIG DIG (widget)
//
// A digger, a prize ladder, and buried services. Every scoop goes a level
// deeper and the prize gets better; somewhere down there is a pipe. Hit it and
// you drop to the consolation prize. Knock off at any time and keep what you
// have dug up. The Climber mechanic in work clothes — the tension is a real
// decision every scoop, and everybody who has ever held a spade knows the
// hit-a-buried-cable fear, whether they run a gym, a salon or a cafe.
//
// Same deal as the wheel: the visitor hands over their details to play, the
// details go to the owner and nowhere else, and nobody is ever emailed by us.
// And like the wheel it is honestly random — the first scoop always comes up,
// the odds after that are stated in the code and nowhere rigged. Nobody leaves
// empty-handed: the worst case is the consolation prize, so every play is a
// lead holding something.
//
// The owner sets the ladder smallest-first (up to five rungs) and the
// consolation. One play per person per site, kept in their browser.

import type { SiteConfig } from './site-render';

export interface Dig {
  on?: boolean;
  title?: string;        // "The Big Dig"
  blurb?: string;        // a line under the title
  prizes?: string[];     // the ladder, smallest first; deepest is best
  bust?: string;         // the consolation when they hit the pipe
  terms?: string;        // "One dig per person. Claim in store."
}

const INK = '#0a0c11';
const CARD = '#0e111a';
const LINE = 'rgba(255,255,255,.12)';
const HAZARD = '#f5b90a';
const SOIL = '#3b2a1c';
const SOIL2 = '#2a1d13';
const GOOD = '#3fb950';
const BAD = '#e5484d';

// Scoop one always comes up — everybody gets on the ladder — and after that
// each level is riskier than the last. Stated here, used verbatim below.
const RISK = [0, 0.22, 0.32, 0.42, 0.52];

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

export const DIG_CSS = `
/* The tab: a hazard-striped disc with a digger on it. Bottom left, because the
   wheel and the chat both live on the right and three things in one corner is
   a pile-up. */
.gdg-tab{position:fixed;left:1.4rem;bottom:1.4rem;z-index:9990;
width:96px;height:96px;padding:0;border:0;border-radius:50%;cursor:pointer;
background:repeating-linear-gradient(45deg,${HAZARD} 0 14px,#141821 14px 28px);
box-shadow:0 0 0 4px #fff,0 10px 24px rgba(0,0,0,.35),0 0 26px rgba(245,185,10,.45);
transition:transform .25s cubic-bezier(.2,1.2,.4,1)}
.gdg-tab:hover{transform:scale(1.07) rotate(-3deg)}
.gdg-tab:active{transform:scale(.95)}
.gdg-tab b{position:absolute;inset:22px;border-radius:50%;background:#fff;
display:grid;place-items:center;font:800 10px/1.2 var(--font-sans,system-ui,sans-serif);
letter-spacing:.08em;color:#141821;text-transform:uppercase}
.gdg-tab b i{font-style:normal;font-size:1.55rem;line-height:1}
.gdg-tx{position:absolute;top:0;right:2px;width:22px;height:22px;background:none;
color:#c2c7d0;font:300 17px/22px var(--font-sans,system-ui,sans-serif);text-align:center;
cursor:pointer;z-index:3;text-shadow:0 1px 3px rgba(0,0,0,.5)}
.gdg-tx:hover{color:#fff}
body.gz-noted .gdg-tab{bottom:9.6rem}
@media(max-width:520px){.gdg-tab{width:80px;height:80px;left:1rem;bottom:1rem}
  .gdg-tab b{inset:18px}}

/* ── The site office ─────────────────────────────────────────── */
.gdg-veil{position:fixed;inset:0;z-index:9991;background:rgba(4,5,8,.82);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.gdg-veil.on{display:flex}
.gdg-card{position:relative;width:min(30rem,100%);max-height:96vh;overflow-y:auto;
background:${CARD};border:1px solid ${LINE};border-radius:16px;
padding:1.5rem 1.5rem 1.3rem;color:#eef1f7;
font-family:var(--font-sans,system-ui,sans-serif)}
.gdg-x{position:absolute;top:.65rem;right:.75rem;width:2rem;height:2rem;border:0;
background:none;color:#8a90a0;font-size:1.3rem;cursor:pointer;z-index:2}
.gdg-x:hover{color:#fff}
.gdg-kicker{font:700 .66rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.16em;
text-transform:uppercase;color:${HAZARD};margin:0 0 .45rem}
.gdg-title{font-size:clamp(1.5rem,4.5vw,2rem);font-weight:800;letter-spacing:-.03em;
line-height:1;margin:0 0 .5rem;text-transform:uppercase}
.gdg-blurb{margin:0 0 1rem;font-size:.88rem;color:#aab0bf;line-height:1.55}

/* ── The ground ──────────────────────────────────────────────── */
.gdg-ground{border-radius:10px;overflow:hidden;border:1px solid ${LINE};margin:0 0 1rem}
.gdg-sky{display:flex;align-items:center;justify-content:space-between;
background:linear-gradient(180deg,#22314d,#182338);padding:.55rem .8rem;
font-size:1.3rem}
.gdg-sky small{font:600 .62rem/1.3 var(--font-sans,system-ui,sans-serif);
letter-spacing:.1em;text-transform:uppercase;color:#8a94ab}
.gdg-lvl{display:flex;align-items:center;gap:.7rem;padding:.62rem .8rem;
background:linear-gradient(180deg,${SOIL},${SOIL2});border-top:2px dashed rgba(0,0,0,.35);
font-size:.86rem;transition:background .3s}
.gdg-lvl em{font-style:normal;flex:none;width:2.1rem;font:700 .62rem/1 var(--font-sans,system-ui,sans-serif);
letter-spacing:.06em;color:#a08b6f}
.gdg-lvl b{font-weight:700;color:#d9cdb8}
.gdg-lvl i{font-style:normal;margin-left:auto;font-size:1.05rem;opacity:0;transition:opacity .3s}
.gdg-lvl.here{background:linear-gradient(180deg,#4a3624,#332516);box-shadow:inset 3px 0 0 ${HAZARD}}
.gdg-lvl.safe b{color:#fff}
.gdg-lvl.safe i{opacity:1}
.gdg-lvl.bust{background:linear-gradient(180deg,#4a1d1f,#331214)}
.gdg-lvl.bust b{color:#ffb3b6}
.gdg-lvl.bust i{opacity:1}

/* ── Controls ────────────────────────────────────────────────── */
.gdg-row{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
.gdg-dig{border:0;border-radius:8px;cursor:pointer;background:${HAZARD};color:#141821;
font:800 .88rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.08em;
text-transform:uppercase;padding:1rem .8rem}
.gdg-dig:hover{background:#ffd23f}
.gdg-dig:disabled{opacity:.45;cursor:default}
.gdg-keep{border:1px solid ${LINE};border-radius:8px;cursor:pointer;background:none;
color:#eef1f7;font:700 .8rem/1.25 var(--font-sans,system-ui,sans-serif);letter-spacing:.05em;
text-transform:uppercase;padding:.7rem .8rem}
.gdg-keep:hover{border-color:#fff}
.gdg-keep:disabled{opacity:.35;cursor:default}
.gdg-odds{margin:.55rem 0 0;text-align:center;font-size:.7rem;color:#6a7183;min-height:1em}

.gdg-form{display:grid;gap:.5rem}
.gdg-form input{width:100%;font:inherit;font-size:.9rem;padding:.68rem .85rem;
border-radius:6px;border:1px solid ${LINE};background:${INK};color:#fff}
.gdg-form input::placeholder{color:#5f6675}
.gdg-form input:focus{outline:none;border-color:${HAZARD}}
.gdg-err{margin:.1rem 0 0;font-size:.78rem;color:#e88;min-height:1.05em}
.gdg-start{width:100%;border:0;border-radius:8px;cursor:pointer;background:${HAZARD};
color:#141821;font:800 .88rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.08em;
text-transform:uppercase;padding:1rem}
.gdg-start:hover{background:#ffd23f}
.gdg-small{margin:.7rem 0 0;font-size:.66rem;color:#5f6675;line-height:1.6}

/* ── The end of the shift ────────────────────────────────────── */
.gdg-done{display:none;text-align:center;padding:.4rem 0 .2rem}
.gdg-done.on{display:block;animation:gdgIn .45s cubic-bezier(.16,1,.3,1) both}
@keyframes gdgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.gdg-shout{font-size:clamp(1.5rem,5vw,2.3rem);font-weight:800;line-height:1.05;
letter-spacing:-.03em;text-transform:uppercase;margin:.2rem 0 .6rem}
.gdg-shout.win{color:#fff}
.gdg-shout.win em{font-style:normal;color:${GOOD}}
.gdg-shout.lose em{font-style:normal;color:${BAD}}
.gdg-note{font-size:.85rem;color:#aab0bf;line-height:1.6;margin:0}
.gdg-quip{font-size:.78rem;color:#6a7183;margin:.7rem 0 0;font-style:italic}
`;

export function renderDig(site: SiteConfig, slug: string): string {
  const dig = (site as any).dig as Dig | undefined;
  if (!dig?.on) return '';
  const ladder = (dig.prizes || []).map((p) => String(p || '').trim()).filter(Boolean).slice(0, 5);
  if (ladder.length < 2) return '';
  const bust = String(dig.bust || '').trim();
  const title = dig.title || 'The Big Dig';

  const rows = ladder
    .map(
      (p, i) => `<div class="gdg-lvl" data-lvl="${i}">
      <em>${i + 1}m</em><b>${esc(p)}</b><i></i>
    </div>`
    )
    .join('');

  return `
<button class="gdg-tab" id="gdg-tab" type="button" aria-haspopup="dialog" aria-label="${esc(title)}">
  <b><i>&#128668;</i>Dig</b>
  <span class="gdg-tx" role="button" tabindex="0" aria-label="Hide this">&times;</span>
</button>

<div class="gdg-veil" id="gdg-veil" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="gdg-card">
    <button class="gdg-x" id="gdg-x" type="button" aria-label="Close">&times;</button>
    <p class="gdg-kicker">${esc(site.name || slug)}</p>
    <h3 class="gdg-title">${esc(title)}</h3>
    <p class="gdg-blurb">${esc(dig.blurb || 'Every scoop digs deeper and the prize gets better — but the services were never marked. Hit a pipe and you drop to the consolation. Knock off any time and keep what you have dug up.')}</p>

    <div class="gdg-ground">
      <div class="gdg-sky"><span>&#128668;</span><small id="gdg-hold">On the surface</small></div>
      ${rows}
    </div>

    <form class="gdg-form" id="gdg-form">
      <input id="gdg-name" placeholder="Your name" autocomplete="name" required />
      <input id="gdg-email" type="email" placeholder="Email" autocomplete="email" required />
      <input id="gdg-phone" placeholder="Phone (optional)" autocomplete="tel" />
      <p class="gdg-err" id="gdg-err"></p>
      <button class="gdg-start" type="submit">Start the machine</button>
      <p class="gdg-small">Nobody leaves empty-handed — worst case is ${bust ? esc(bust) : 'a consolation prize'}.
      Your details go to ${esc(site.name || slug)} and nowhere else. We will not email you.
      ${dig.terms ? esc(dig.terms) : ''}</p>
    </form>

    <div id="gdg-play" style="display:none">
      <div class="gdg-row">
        <button class="gdg-dig" id="gdg-dig" type="button">&#9935;&#65039; Dig</button>
        <button class="gdg-keep" id="gdg-keep" type="button" disabled>Knock off<br>&amp; keep it</button>
      </div>
      <p class="gdg-odds" id="gdg-odds">First scoop is on the house.</p>
    </div>

    <div class="gdg-done" id="gdg-done"></div>
  </div>
</div>

<script>
(function () {
  var slug = ${JSON.stringify(slug)};
  var ladder = ${JSON.stringify(ladder)};
  var bust = ${JSON.stringify(bust)};
  // Scoop one always comes up; after that each level is riskier than the last.
  var RISK = ${JSON.stringify(RISK)};
  var KEY = 'gdg:' + slug;

  var $ = function (id) { return document.getElementById(id); };
  var tab = $('gdg-tab'), veil = $('gdg-veil');

  tab.querySelector('.gdg-tx').addEventListener('click', function (e) {
    e.stopPropagation(); tab.style.display = 'none';
  });
  tab.addEventListener('click', function () { veil.classList.add('on'); });
  $('gdg-x').addEventListener('click', function () { veil.classList.remove('on'); });
  veil.addEventListener('click', function (e) { if (e.target === veil) veil.classList.remove('on'); });

  // One dig per person. If they have played, the modal simply shows how the
  // shift ended, which is also what they see if they reopen it.
  var past = null;
  try { past = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (past) return finish(past.won, past.prize, true);

  var name = '', email = '', phone = '', depth = -1, over = false;

  $('gdg-form').addEventListener('submit', function (e) {
    e.preventDefault();
    name = $('gdg-name').value.trim();
    email = $('gdg-email').value.trim();
    phone = $('gdg-phone').value.trim();
    if (!name || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      $('gdg-err').textContent = 'We need a name and a real email.';
      return;
    }
    $('gdg-form').style.display = 'none';
    $('gdg-play').style.display = 'block';
  });

  function level(i) { return document.querySelector('[data-lvl="' + i + '"]'); }

  $('gdg-dig').addEventListener('click', function () {
    if (over) return;
    var next = depth + 1;
    $('gdg-dig').disabled = true;
    var hit = Math.random() < (RISK[next] || 0.5);
    // A beat of engine noise before the reveal, or there is no tension at all.
    level(next).classList.add('here');
    $('gdg-hold').textContent = 'Digging…';
    setTimeout(function () {
      if (hit) {
        level(next).classList.remove('here');
        level(next).classList.add('bust');
        level(next).querySelector('i').textContent = '\\uD83D\\uDCA5';
        return finish(false, bust || 'a consolation prize', false);
      }
      depth = next;
      level(depth).classList.remove('here');
      level(depth).classList.add('safe');
      level(depth).querySelector('i').textContent = '\\u2714\\uFE0F';
      $('gdg-hold').textContent = 'Holding: ' + ladder[depth];
      $('gdg-keep').disabled = false;
      if (depth >= ladder.length - 1) return finish(true, ladder[depth], false);
      $('gdg-dig').disabled = false;
      var pct = Math.round((RISK[depth + 1] || 0.5) * 100);
      $('gdg-odds').textContent = 'Next scoop: ' + pct + '% chance you hit something.';
    }, 900);
  });

  $('gdg-keep').addEventListener('click', function () {
    if (over || depth < 0) return;
    finish(true, ladder[depth], false);
  });

  function finish(won, prize, replay) {
    over = true;
    $('gdg-form').style.display = 'none';
    $('gdg-play').style.display = 'none';
    var done = $('gdg-done');
    done.className = 'gdg-done on';
    done.innerHTML = won
      ? '<p class="gdg-shout win">You dug up<br><em>' + prize + '</em></p>' +
        '<p class="gdg-note">' + (replay ? 'That was your dig — one per person.' :
          'Nice knock-off. ' + (name ? name.split(' ')[0] + ', the' : 'The') +
          ' details are with the crew and they will sort it with you directly.') + '</p>'
      : '<p class="gdg-shout lose">You hit<br><em>the water main</em></p>' +
        '<p class="gdg-note">Still, nobody walks off site with nothing: <b>' + prize + '</b> is yours.' +
        (replay ? ' One dig per person.' : ' The crew has your details and will sort it with you.') + '</p>' +
        '<p class="gdg-quip">Should\\u2019ve dialled beforeUdig, mate.</p>';
    if (replay) return;
    try { localStorage.setItem(KEY, JSON.stringify({ won: won, prize: prize })); } catch (e) {}
    fetch('https://garage.co.nz/api/dig', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone,
                             prize: prize, won: won }),
    }).catch(function () {});
  }
})();
</script>
`;
}
