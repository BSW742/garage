// THE BALLOON (widget)
//
// The same nerve as The Big Dig wearing silk instead of hi-vis. A balloon on
// screen; every pump makes it bigger and the prize better; pump once too often
// and it pops, dropping you to the consolation. Tie it off at any time and
// keep what it is holding. Where the digger suits a trade, this suits a salon
// or a cafe — soft colours, one object, no machinery.
//
// Same covenant as the wheel and the digger: details go to the owner and
// nowhere else, the visitor is never emailed, the odds are stated before every
// pump and nowhere rigged. First pump always holds. Nobody leaves
// empty-handed. One balloon per person, kept in their browser.

import type { SiteConfig } from './site-render';

export interface Balloon {
  on?: boolean;
  title?: string;        // "The Balloon"
  blurb?: string;        // a line under the title
  prizes?: string[];     // the ladder, smallest first; the last pump is best
  bust?: string;         // the consolation when it pops
  terms?: string;        // "One balloon per person."
}

const INK = '#2b2226';
const CREAM = '#fff9f5';
const LINE = 'rgba(43,34,38,.12)';
const BLUSH = '#e78aa4';
const ROSE = '#c9536f';
const SOFT = '#8a7a80';

// Pump one always holds; after that, each is riskier. Same curve as the dig.
const RISK = [0, 0.22, 0.32, 0.42, 0.52];

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

export const BALLOON_CSS = `
/* The tab: a balloon on a string, drifting. It shares the bottom-left with
   the digger's tab; if a site somehow runs both, this one rises above it. */
.gbl-tab{position:fixed;left:1.5rem;bottom:1.3rem;z-index:9990;width:84px;height:108px;
padding:0;border:0;background:none;cursor:pointer;
filter:drop-shadow(0 10px 22px rgba(0,0,0,.28)) drop-shadow(0 0 18px rgba(231,138,164,.5));
animation:gbl-drift 4.2s ease-in-out infinite;transition:transform .25s ease}
.gbl-tab:hover{transform:scale(1.08)}
.gbl-tab:active{transform:scale(.95)}
@keyframes gbl-drift{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-7px) rotate(2deg)}}
@media(prefers-reduced-motion:reduce){.gbl-tab{animation:none}}
.gbl-tab i{position:absolute;left:50%;top:0;transform:translateX(-50%);width:66px;height:80px;
background:radial-gradient(circle at 32% 26%,#f6c1d2 0 18%,${BLUSH} 55%,${ROSE} 100%);
border-radius:50% 50% 50% 50%/56% 56% 44% 44%;
display:grid;place-items:center;font:800 11px/1 var(--font-sans,system-ui,sans-serif);
font-style:normal;letter-spacing:.09em;color:#fff;text-transform:uppercase;
text-shadow:0 1px 2px rgba(0,0,0,.25)}
.gbl-tab i:after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);
border-style:solid;border-width:0 5px 7px 5px;border-color:transparent transparent ${ROSE} transparent}
.gbl-tab u{position:absolute;left:50%;top:84px;width:1.5px;height:24px;background:${SOFT};
opacity:.7;text-decoration:none}
.gbl-tx{position:absolute;top:-4px;right:-2px;width:22px;height:22px;background:none;
color:#b9aeb3;font:300 17px/22px var(--font-sans,system-ui,sans-serif);text-align:center;
cursor:pointer;z-index:3;text-shadow:0 1px 3px rgba(0,0,0,.35)}
.gbl-tx:hover{color:#fff}
.gdg-tab ~ .gbl-tab{bottom:9.2rem}
body.gz-noted .gbl-tab{bottom:9.6rem}
@media(max-width:520px){.gbl-tab{left:1rem;bottom:1rem}}

/* ── The parlour ─────────────────────────────────────────────── */
.gbl-veil{position:fixed;inset:0;z-index:9991;background:rgba(30,22,26,.6);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.gbl-veil.on{display:flex}
.gbl-card{position:relative;width:min(26rem,100%);max-height:96vh;overflow-y:auto;
background:${CREAM};border:1px solid ${LINE};border-radius:18px;
padding:1.6rem 1.6rem 1.4rem;color:${INK};text-align:center;
font-family:var(--font-sans,system-ui,sans-serif)}
.gbl-x{position:absolute;top:.6rem;right:.7rem;width:2rem;height:2rem;border:0;
background:none;color:${SOFT};font-size:1.3rem;cursor:pointer;z-index:2}
.gbl-x:hover{color:${INK}}
.gbl-kicker{font:700 .64rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.18em;
text-transform:uppercase;color:${ROSE};margin:0 0 .4rem}
.gbl-title{font-size:clamp(1.5rem,4.5vw,1.9rem);font-weight:800;letter-spacing:-.02em;
line-height:1.05;margin:0 0 .5rem}
.gbl-blurb{margin:0 auto .9rem;font-size:.86rem;color:${SOFT};line-height:1.55;max-width:21rem}

/* The ladder, as a quiet row of steps. The one they are holding is lit. */
.gbl-steps{display:flex;justify-content:center;gap:.35rem;flex-wrap:wrap;margin:0 0 1rem}
.gbl-steps span{font:600 .62rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.04em;
text-transform:uppercase;color:${SOFT};border:1px solid ${LINE};border-radius:999px;
padding:.34rem .6rem;transition:all .25s}
.gbl-steps span.held{background:${ROSE};border-color:${ROSE};color:#fff}
.gbl-steps span.gone{opacity:.35;text-decoration:line-through}

/* ── The balloon itself ──────────────────────────────────────── */
.gbl-stage{position:relative;height:12.5rem;display:grid;place-items:center;margin:0 0 .9rem}
.gbl-b{position:relative;width:5.2rem;height:6.4rem;transition:transform .55s cubic-bezier(.3,1.4,.5,1);
transform:scale(var(--fill,1))}
.gbl-b i{position:absolute;inset:0;
background:radial-gradient(circle at 32% 26%,#f6c1d2 0 18%,${BLUSH} 55%,${ROSE} 100%);
border-radius:50% 50% 50% 50%/56% 56% 44% 44%}
.gbl-b i:after{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);
border-style:solid;border-width:0 6px 8px 6px;border-color:transparent transparent ${ROSE} transparent}
.gbl-b u{position:absolute;left:50%;top:100%;margin-top:7px;width:1.5px;height:2.6rem;
background:${SOFT};opacity:.6;text-decoration:none}
.gbl-b.pop{animation:gbl-pop .5s ease-out both}
@keyframes gbl-pop{0%{transform:scale(var(--fill,1))}30%{transform:scale(calc(var(--fill,1) * 1.25))}
100%{transform:scale(0);opacity:0}}
.gbl-bang{position:absolute;font-size:2.6rem;opacity:0;pointer-events:none}
.gbl-bang.on{animation:gbl-bang .7s ease-out both}
@keyframes gbl-bang{0%{opacity:0;transform:scale(.4)}25%{opacity:1;transform:scale(1.25)}
100%{opacity:0;transform:scale(1.6)}}
.gbl-hold{font:700 .7rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.12em;
text-transform:uppercase;color:${SOFT};margin:0 0 .8rem;min-height:1em}

/* ── Controls ────────────────────────────────────────────────── */
.gbl-row{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
.gbl-pump{border:0;border-radius:999px;cursor:pointer;background:${ROSE};color:#fff;
font:800 .85rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.1em;
text-transform:uppercase;padding:1rem .8rem}
.gbl-pump:hover{background:#b4405c}
.gbl-pump:disabled{opacity:.45;cursor:default}
.gbl-keep{border:1.5px solid ${INK};border-radius:999px;cursor:pointer;background:none;
color:${INK};font:700 .76rem/1.25 var(--font-sans,system-ui,sans-serif);letter-spacing:.04em;
text-transform:uppercase;padding:.7rem .8rem}
.gbl-keep:hover{background:${INK};color:#fff}
.gbl-keep:disabled{opacity:.3;cursor:default}
.gbl-odds{margin:.55rem 0 0;font-size:.7rem;color:${SOFT};min-height:1em}

.gbl-form{display:grid;gap:.5rem;text-align:left}
.gbl-form input{width:100%;font:inherit;font-size:.9rem;padding:.68rem .85rem;
border-radius:8px;border:1px solid ${LINE};background:#fff;color:${INK}}
.gbl-form input::placeholder{color:#b9aeb3}
.gbl-form input:focus{outline:none;border-color:${ROSE}}
.gbl-err{margin:.1rem 0 0;font-size:.78rem;color:${ROSE};min-height:1.05em}
.gbl-start{width:100%;border:0;border-radius:999px;cursor:pointer;background:${ROSE};
color:#fff;font:800 .85rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.1em;
text-transform:uppercase;padding:1rem}
.gbl-start:hover{background:#b4405c}
.gbl-small{margin:.7rem 0 0;font-size:.66rem;color:${SOFT};line-height:1.6;text-align:center}

/* ── How it ends ─────────────────────────────────────────────── */
.gbl-done{display:none;padding:.3rem 0 .1rem}
.gbl-done.on{display:block;animation:gblIn .45s cubic-bezier(.16,1,.3,1) both}
@keyframes gblIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.gbl-shout{font-size:clamp(1.4rem,4.6vw,2rem);font-weight:800;line-height:1.1;
letter-spacing:-.02em;margin:.2rem 0 .6rem}
.gbl-shout em{font-style:normal;color:${ROSE}}
.gbl-note{font-size:.85rem;color:${SOFT};line-height:1.6;margin:0}
`;

export function renderBalloon(site: SiteConfig, slug: string): string {
  const bl = (site as any).balloon as Balloon | undefined;
  if (!bl?.on) return '';
  const ladder = (bl.prizes || []).map((p) => String(p || '').trim()).filter(Boolean).slice(0, 5);
  if (ladder.length < 2) return '';
  const bust = String(bl.bust || '').trim();
  const title = bl.title || 'The Balloon';

  const steps = ladder.map((p, i) => `<span data-step="${i}">${esc(p)}</span>`).join('');

  return `
<button class="gbl-tab" id="gbl-tab" type="button" aria-haspopup="dialog" aria-label="${esc(title)}">
  <i>Win</i><u></u>
  <span class="gbl-tx" role="button" tabindex="0" aria-label="Hide this">&times;</span>
</button>

<div class="gbl-veil" id="gbl-veil" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="gbl-card">
    <button class="gbl-x" id="gbl-x" type="button" aria-label="Close">&times;</button>
    <p class="gbl-kicker">${esc(site.name || slug)}</p>
    <h3 class="gbl-title">${esc(title)}</h3>
    <p class="gbl-blurb">${esc(bl.blurb || 'Every pump makes the prize better. Pump once too often and it pops. Tie it off whenever you like and keep what it is holding.')}</p>

    <div class="gbl-steps" id="gbl-steps">${steps}</div>

    <div class="gbl-stage">
      <div class="gbl-b" id="gbl-b"><i></i><u></u></div>
      <div class="gbl-bang" id="gbl-bang">&#128165;</div>
    </div>
    <p class="gbl-hold" id="gbl-hold">Not holding anything yet</p>

    <form class="gbl-form" id="gbl-form">
      <input id="gbl-name" placeholder="Your name" autocomplete="name" required />
      <input id="gbl-email" type="email" placeholder="Email" autocomplete="email" required />
      <input id="gbl-phone" placeholder="Phone (optional)" autocomplete="tel" />
      <p class="gbl-err" id="gbl-err"></p>
      <button class="gbl-start" type="submit">Pick up the pump</button>
      <p class="gbl-small">Nobody leaves empty-handed — worst case is ${bust ? esc(bust) : 'a consolation prize'}.
      Your details go to ${esc(site.name || slug)} and nowhere else. We will not email you.
      ${bl.terms ? esc(bl.terms) : ''}</p>
    </form>

    <div id="gbl-play" style="display:none">
      <div class="gbl-row">
        <button class="gbl-pump" id="gbl-pump" type="button">Pump</button>
        <button class="gbl-keep" id="gbl-keep" type="button" disabled>Tie it off<br>&amp; keep it</button>
      </div>
      <p class="gbl-odds" id="gbl-odds">The first pump always holds.</p>
    </div>

    <div class="gbl-done" id="gbl-done"></div>
  </div>
</div>

<script>
(function () {
  var slug = ${JSON.stringify(slug)};
  var ladder = ${JSON.stringify(ladder)};
  var bust = ${JSON.stringify(bust)};
  var RISK = ${JSON.stringify(RISK)};
  var KEY = 'gbl:' + slug;

  var $ = function (id) { return document.getElementById(id); };
  var tab = $('gbl-tab'), veil = $('gbl-veil'), b = $('gbl-b');

  tab.querySelector('.gbl-tx').addEventListener('click', function (e) {
    e.stopPropagation(); tab.style.display = 'none';
  });
  tab.addEventListener('click', function () { veil.classList.add('on'); });
  $('gbl-x').addEventListener('click', function () { veil.classList.remove('on'); });
  veil.addEventListener('click', function (e) { if (e.target === veil) veil.classList.remove('on'); });

  var past = null;
  try { past = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (past) return finish(past.won, past.prize, true);

  var name = '', email = '', phone = '', depth = -1, over = false;

  $('gbl-form').addEventListener('submit', function (e) {
    e.preventDefault();
    name = $('gbl-name').value.trim();
    email = $('gbl-email').value.trim();
    phone = $('gbl-phone').value.trim();
    if (!name || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      $('gbl-err').textContent = 'We need a name and a real email.';
      return;
    }
    $('gbl-form').style.display = 'none';
    $('gbl-play').style.display = 'block';
  });

  function step(i) { return document.querySelector('#gbl-steps [data-step="' + i + '"]'); }

  $('gbl-pump').addEventListener('click', function () {
    if (over) return;
    var next = depth + 1;
    $('gbl-pump').disabled = true;
    var popped = Math.random() < (RISK[next] || 0.5);
    // It swells either way — the pop happens at full stretch, which is the
    // whole physics of the dread.
    b.style.setProperty('--fill', String(1 + (next + 1) * 0.22));
    setTimeout(function () {
      if (popped) {
        b.classList.add('pop');
        $('gbl-bang').classList.add('on');
        for (var i = 0; i <= depth; i++) step(i).classList.add('gone');
        return setTimeout(function () { finish(false, bust || 'a consolation prize', false); }, 550);
      }
      depth = next;
      if (depth > 0) step(depth - 1).classList.remove('held');
      step(depth).classList.add('held');
      $('gbl-hold').textContent = 'Holding: ' + ladder[depth];
      $('gbl-keep').disabled = false;
      if (depth >= ladder.length - 1) return finish(true, ladder[depth], false);
      $('gbl-pump').disabled = false;
      var pct = Math.round((RISK[depth + 1] || 0.5) * 100);
      $('gbl-odds').textContent = 'Next pump: ' + pct + '% chance it pops.';
    }, 620);
  });

  $('gbl-keep').addEventListener('click', function () {
    if (over || depth < 0) return;
    finish(true, ladder[depth], false);
  });

  function finish(won, prize, replay) {
    over = true;
    $('gbl-form').style.display = 'none';
    $('gbl-play').style.display = 'none';
    if (replay) {
      var st = document.querySelector('.gbl-stage');
      if (st) st.style.display = 'none';
      $('gbl-hold').style.display = 'none';
    }
    var done = $('gbl-done');
    done.className = 'gbl-done on';
    done.innerHTML = won
      ? '<p class="gbl-shout">Tied off holding<br><em>' + prize + '</em></p>' +
        '<p class="gbl-note">' + (replay ? 'That was your balloon — one per person.' :
          'Lovely. Your details are with ' + ${JSON.stringify(esc(site.name || slug))} +
          ' and they will sort it with you directly.') + '</p>'
      : '<p class="gbl-shout">Oh &mdash; it <em>popped</em></p>' +
        '<p class="gbl-note">Still, nobody leaves empty-handed: <b>' + prize + '</b> is yours.' +
        (replay ? ' One balloon per person.' : ' Your details are with ' +
          ${JSON.stringify(esc(site.name || slug))} + ' and they will sort it with you.') + '</p>';
    if (replay) return;
    try { localStorage.setItem(KEY, JSON.stringify({ won: won, prize: prize })); } catch (e) {}
    fetch('https://garage.co.nz/api/balloon', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone,
                             prize: prize, won: won }),
    }).catch(function () {});
  }
})();
</script>
`;
}
