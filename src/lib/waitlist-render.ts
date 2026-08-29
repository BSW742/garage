// THE WAITLIST — a tab for a business that is booked out.
//
// The physio says "we have nothing until November, shall I put you on the
// cancellation list?", writes a name on a pad, and rings down it when somebody
// drops out. This is that, without the pad and the ringing.
//
// The language matters more than the mechanism here, and it runs one way on
// both sides: this is not a mailing list and nobody is being marketed at. The
// person joining wants one thing — to get in earlier — and the message they
// eventually get is the answer to the question they asked, not an offer.
//
// So: "want in sooner", not "subscribe". "A spot has come up", not "special
// offer". And no discount anywhere, because they already wanted that slot at
// full price and could not have it.

import type { SiteConfig, Waitlist } from './site-render';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

const INK = '#0a0c11';
const CARD = '#0e111a';
const GREEN = '#1f7a4d';
const LINE = 'rgba(255,255,255,.12)';
const DIM = '#7d8598';

export const WAITLIST_CSS = `
.gwl-tab{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:9988;
display:flex;align-items:center;border:0;cursor:pointer;
background:${CARD};color:#eef1f7;font:600 .76rem/1 var(--font-sans,system-ui,sans-serif);
padding:1.05rem .72rem;border-radius:0 8px 8px 0;writing-mode:vertical-rl;
letter-spacing:.14em;text-transform:uppercase;
box-shadow:1px 0 0 ${LINE},14px 0 34px -14px rgba(0,0,0,.7);
transition:padding .22s ease,color .22s ease}
.gwl-tab:after{content:'';position:absolute;right:0;top:0;bottom:0;width:2px;background:${GREEN}}
.gwl-tab:hover{padding-left:1.05rem;color:#fff}
@media(max-width:520px){.gwl-tab{top:auto;bottom:92px;transform:none}}

.gwl-veil{position:fixed;inset:0;z-index:9989;background:rgba(4,5,8,.82);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.gwl-veil.on{display:flex}

.gwl-card{position:relative;width:min(27rem,100%);max-height:96vh;overflow:auto;
background:${CARD};color:#eef1f7;border:1px solid ${LINE};border-radius:18px;
padding:1.7rem 1.5rem 1.4rem;font-family:var(--font-sans,system-ui,sans-serif);
box-shadow:0 40px 90px -24px rgba(0,0,0,.9)}
.gwl-x{position:absolute;right:.85rem;top:.85rem;width:1.9rem;height:1.9rem;border-radius:50%;
border:1px solid ${LINE};background:transparent;color:${DIM};font-size:1rem;cursor:pointer;
line-height:1;transition:color .15s,border-color .15s}
.gwl-x:hover{color:#fff;border-color:rgba(255,255,255,.3)}
.gwl-eyebrow{font-size:.62rem;letter-spacing:.26em;text-transform:uppercase;color:${GREEN};
margin:0 0 .5rem;font-weight:700}
.gwl-card h2{font-size:1.4rem;font-weight:600;letter-spacing:-.018em;margin:0 0 .35rem;
color:#fff;line-height:1.15}
.gwl-blurb{color:${DIM};font-size:.86rem;margin:0;line-height:1.55}
.gwl-form{display:grid;gap:.55rem;margin-top:1.1rem}
.gwl-form input{width:100%;font:inherit;font-size:.92rem;padding:.72rem .9rem;
border-radius:6px;border:1px solid ${LINE};background:${INK};color:#fff}
.gwl-form input::placeholder{color:#5f6675}
.gwl-form input:focus{outline:none;border-color:${GREEN}}
.gwl-err{margin:.1rem 0 0;font-size:.78rem;color:#e88;min-height:1.05em}
.gwl-go{width:100%;border:1px solid ${GREEN};border-radius:6px;cursor:pointer;
background:${GREEN};color:#fff;font:600 .86rem/1 var(--font-sans,system-ui,sans-serif);
letter-spacing:.08em;text-transform:uppercase;padding:.9rem 1rem;
transition:background .18s}
.gwl-go:hover{background:#24905b}
.gwl-go:disabled{opacity:.5;cursor:default}
.gwl-small{margin:.85rem 0 0;font-size:.68rem;color:#5f6675;line-height:1.6}
.gwl-done{display:none;text-align:center;padding:.6rem 0 .2rem}
.gwl-done.on{display:block}
.gwl-done h3{font-size:1.2rem;font-weight:600;color:#fff;margin:.4rem 0 .3rem}
`;

export function renderWaitlist(site: SiteConfig, slug: string): string {
  const list = site.waitlist as Waitlist | undefined;
  if (!list?.on) return '';
  const who = esc(site.name || slug);
  const tab = esc(list.title || 'Waitlist');

  return `
<button class="gwl-tab" id="gwl-tab" type="button" aria-haspopup="dialog">${tab}</button>

<div class="gwl-veil" id="gwl-veil" role="dialog" aria-modal="true" aria-label="${tab}">
  <div class="gwl-card">
    <button class="gwl-x" id="gwl-x" type="button" aria-label="Close">&times;</button>

    <div id="gwl-ask">
      <p class="gwl-eyebrow">${who}</p>
      <h2>Want in sooner?</h2>
      <p class="gwl-blurb">${esc(
        list.blurb ||
          'We are booked a fair way ahead, but people cancel. Put your name down and we will let you know the moment something opens up.'
      )}</p>
      <form class="gwl-form" id="gwl-form" novalidate>
        <input id="gwl-name" placeholder="Your name" autocomplete="name" />
        <input id="gwl-email" type="email" placeholder="Email" autocomplete="email" />
        <input id="gwl-phone" type="tel" placeholder="Phone" autocomplete="tel" />
        <input id="gwl-note" placeholder="When suits you? e.g. any weekday morning" maxlength="120" />
        <p class="gwl-err" id="gwl-err" role="alert"></p>
        <button class="gwl-go" id="gwl-go" type="submit">Put me on the waitlist</button>
      </form>
      <p class="gwl-small">No charge and no discount &mdash; the same slot at the same price, you
        just hear about it first. One email when something frees up, and you can come off the list
        in a tap.</p>
    </div>

    <div class="gwl-done" id="gwl-done">
      <p class="gwl-eyebrow">${who}</p>
      <h3>You are on the list</h3>
      <p class="gwl-blurb">We will email you the moment a slot comes free. First to claim it
        gets it, so it is worth opening.</p>
    </div>
  </div>
</div>

<script>
(function () {
  var slug = ${JSON.stringify(slug)};
  var $ = function (id) { return document.getElementById(id); };
  var veil = $('gwl-veil'), form = $('gwl-form');
  if (!veil || !form) return;

  $('gwl-tab').addEventListener('click', function () { veil.classList.add('on'); });
  function close() { veil.classList.remove('on'); }
  $('gwl-x').addEventListener('click', close);
  veil.addEventListener('click', function (e) { if (e.target === veil) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('gwl-err'); err.textContent = '';
    var name = $('gwl-name').value.trim();
    var email = $('gwl-email').value.trim();
    var phone = $('gwl-phone').value.trim();
    var note = $('gwl-note').value.trim();
    if (!name) { err.textContent = 'We need a name.'; return; }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { err.textContent = 'That email does not look right.'; return; }

    var go = $('gwl-go');
    go.disabled = true; go.textContent = 'Adding you';
    fetch('https://garage.co.nz/api/waitlist/join', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, name: name, email: email, phone: phone, note: note }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.error) || 'That did not go through');
        $('gwl-ask').style.display = 'none';
        $('gwl-done').classList.add('on');
      })
      .catch(function (e) {
        err.textContent = e.message || 'That did not go through. Try again shortly.';
        go.disabled = false; go.textContent = 'Put me on the waitlist';
      });
  });
})();
</script>`;
}
