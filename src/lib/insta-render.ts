// INSTA TEMPLATE (style: "insta")
//
// A wall of somebody's own Instagram posts, packed tight.
//
// What Instagram will and will not let a page do shaped every part of this,
// and it is worth writing down because none of it is guessable:
//
//   - The picture cannot be borrowed. fbcdn serves post images with
//     Cross-Origin-Resource-Policy: same-origin, so an <img> pointing at one
//     is refused by the browser before it renders. curl fetches it happily,
//     which is exactly the trap: it looks fine from a terminal and is a broken
//     tile on the page.
//   - Instagram's own embed is the only sanctioned way to show a post, and it
//     does work — the iframe at /p/{code}/embed/ renders the picture, the
//     handle, the caption and the like count, and links back. It is also
//     around 600KB each, so mounting a wall of them on load is not an option.
//   - oEmbed answers without a token again and returns 400 for a shortcode
//     that does not exist, so it makes a real gate: nothing reaches this page
//     without Instagram confirming the post is public first.
//
// So: tiles mount only as they come near the viewport, and only ever the
// uncaptioned embed, which is the shorter of the two. Clicking one opens the
// captioned version over the page, where there is room for the words.
//
// Everything on the wall belongs to the account that posted it. This template
// is for showing your own.

import type { SiteConfig } from './site-render';

export const INSTA_FONT_QUERY = '&family=Space+Grotesk:wght@400;500;700';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

export type InstaPost = { code: string; kind?: string; note?: string };

// Instagram shortcodes are the usual base64 alphabet and run to about a dozen
// characters. Anything else never reaches the page.
const CODE = /^[A-Za-z0-9_-]{5,24}$/;

export function postsOf(rows: InstaPost[]): InstaPost[] {
  const out: InstaPost[] = [];
  for (const r of rows || []) {
    const code = String(r?.code || '');
    if (CODE.test(code) && !out.some((p) => p.code === code)) {
      out.push({ code, kind: r?.kind === 'reel' ? 'reel' : 'p', note: r?.note || '' });
    }
  }
  return out;
}

export const INSTA_CSS = `
.ig{--room:#0a0a0b;--panel:#141416;--ink:#f6f6f7;--dim:#8d8d96;--line:#232329;
--accent:var(--primary);
--display:'Space Grotesque','Space Grotesk',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.ig{background:var(--room);color:var(--ink);font-family:var(--body);line-height:1.6}
html:has(body.ig),body.ig{background:var(--room)}
.ig h1,.ig h2{font-family:var(--display);font-weight:700;line-height:1.03;
letter-spacing:-.03em;text-align:left;margin-bottom:0}
.ig ::selection{background:var(--accent);color:#000}
.ig-wrap{max-width:82rem;margin:0 auto;padding:0 1rem}

.ig-head{padding:2.6rem 0 1.6rem}
.ig-eyebrow{font-size:.7rem;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);
margin-bottom:.85rem}
.ig-head h1{font-size:clamp(2.1rem,6.5vw,4rem);max-width:16ch}
.ig-lede{margin-top:.9rem;max-width:34rem;color:var(--dim)}
.ig-who{margin-top:1rem;display:inline-flex;align-items:center;gap:.45rem;font-size:.9rem;
color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:.35rem .85rem}
.ig-who:hover{border-color:var(--accent);color:var(--ink)}

/* -- The wall. Tight on purpose: the gap is a hairline, not a margin. -- */
.ig-grid{display:grid;gap:6px;grid-template-columns:repeat(2,1fr);padding-bottom:3rem}
@media(min-width:700px){.ig-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1100px){.ig-grid{grid-template-columns:repeat(4,1fr)}}
/* 1/1.16 is the embed's own header plus a square picture. Instagram will not
   report the height of what is inside the frame, and a post can be square,
   portrait or landscape, so no single crop is right for all three — a square
   post lands exactly, a landscape one leaves a little white below. This is the
   ceiling of what the embed route can do; a truly uniform grid needs our own
   copies of the pictures. */
.ig-cell{position:relative;aspect-ratio:1/1.16;background:var(--panel);
border:1px solid var(--line);border-radius:4px;overflow:hidden;cursor:pointer}
/* The embed is the picture here, not a control — the cell owns the click.
   326px is the embed's own minimum width, so it cannot be made narrower; it is
   scaled down instead to fill whatever the column is. The picture sits at the
   top of the embed and the like bar, the comment box and the rest sit under
   it, so the cell crops to the top and keeps only the photograph. */
.ig-cell iframe{position:absolute;top:0;left:0;width:326px;height:620px;border:0;
pointer-events:none;background:#fff;transform-origin:0 0}
.ig-cell:before{content:'';position:absolute;inset:0;z-index:2}
.ig-cell:after{content:'';position:absolute;inset:0;z-index:1;background:var(--panel);
opacity:1;transition:opacity .35s}
.ig-cell.up:after{opacity:0;pointer-events:none}
.ig-cell:hover{border-color:var(--accent)}
.ig-dots{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1;
color:var(--dim);font-size:.7rem;letter-spacing:.2em;text-transform:uppercase}
.ig-cell.up .ig-dots{display:none}

/* -- The overlay. Same idea as the reel wall: room for the caption. -- */
.ig-box{position:fixed;inset:0;z-index:80;display:none;place-items:center;padding:1.2rem;
background:rgba(4,4,6,.94);backdrop-filter:blur(14px)}
.ig-box.on{display:grid}
.ig-box-in{width:min(30rem,100%);max-height:100%}
.ig-box-screen{position:relative;width:100%;height:min(80vh,44rem);background:#fff;
border-radius:6px;overflow:hidden}
.ig-box-screen iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.ig-box-cap{margin-top:.8rem;display:flex;gap:1rem;align-items:baseline}
.ig-box-cap a{margin-left:auto;color:var(--dim);font-size:.85rem;
border-bottom:1px solid var(--line)}
.ig-box-cap a:hover{color:var(--ink);border-bottom-color:var(--ink)}
.ig-shut{position:fixed;top:1rem;right:1.2rem;width:2.6rem;height:2.6rem;border-radius:50%;
background:var(--panel);border:1px solid var(--line);color:var(--ink);font-size:1.35rem;
line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;z-index:81}
.ig-shut:hover{border-color:var(--accent)}

/* -- Paste box. Only ever rendered for the owner. -- */
.ig-add{margin:0 0 2rem;padding:1rem;border:1px solid var(--line);border-radius:8px;
background:var(--panel)}
.ig-add form{display:flex;gap:.5rem;flex-wrap:wrap}
.ig-add input{flex:1;min-width:16rem;background:var(--room);border:1px solid var(--line);
border-radius:6px;padding:.7rem .8rem;color:var(--ink);font:inherit;font-size:.92rem}
.ig-add button{background:var(--accent);color:#000;border:0;border-radius:6px;
padding:.7rem 1.3rem;font:inherit;font-weight:600;cursor:pointer}
.ig-add button:disabled{opacity:.5;cursor:default}
.ig-add p{margin:.6rem 0 0;color:var(--dim);font-size:.84rem}

.ig-end{padding:2.4rem 0 4rem;border-top:1px solid var(--line)}
.ig-credit{color:var(--dim);font-size:.88rem;max-width:42rem}
.ig-credit b{color:var(--ink);font-weight:600}
`;

export function renderInstaBody(
  site: SiteConfig,
  slug: string,
  posts: InstaPost[],
  opts: { canAdd?: boolean } = {}
): string {
  const who = site.name || slug;
  const list = postsOf(posts);
  const handle = String((site as any).instagram || '').replace(/^@/, '').trim();

  const wall = list.length
    ? `<div class="ig-grid">${list
        .map(
          (p) => `<article class="ig-cell" data-ig="${esc(p.code)}" data-kind="${esc(p.kind || 'p')}"
        tabindex="0" role="button" aria-label="Open post"><span class="ig-dots">Loading</span></article>`
        )
        .join('')}</div>`
    : `<p class="ig-lede" style="padding-bottom:3rem">Nothing on the wall yet.</p>`;

  // The paste box is the whole point of the test: share a link, see it land.
  const add = opts.canAdd
    ? `<div class="ig-add">
    <form id="ig-add-form">
      <input id="ig-add-url" type="url" inputmode="url" autocomplete="off"
             placeholder="Paste an Instagram link" required />
      <button type="submit">Add</button>
    </form>
    <p id="ig-add-say">Copy Link in Instagram, paste it here. Only you can see this box.</p>
  </div>`
    : '';

  return `
<header class="ig-head"><div class="ig-wrap">
  ${site.eyebrow ? `<p class="ig-eyebrow">${esc(site.eyebrow)}</p>` : ''}
  <h1>${esc(site.headline || who)}</h1>
  ${site.lede ? `<p class="ig-lede">${esc(site.lede)}</p>` : ''}
  ${handle
    ? `<a class="ig-who" href="https://www.instagram.com/${esc(handle)}/" target="_blank"
         rel="noopener">@${esc(handle)}</a>`
    : ''}
</div></header>

<div class="ig-wrap">${add}${wall}</div>

<div class="ig-box" id="ig-box" role="dialog" aria-modal="true" aria-label="Post">
  <button type="button" class="ig-shut" aria-label="Close">&times;</button>
  <div class="ig-box-in">
    <div class="ig-box-screen"></div>
    <div class="ig-box-cap">
      <a href="https://www.instagram.com/" target="_blank" rel="noopener">Open in Instagram</a>
    </div>
  </div>
</div>

<section class="ig-end"><div class="ig-wrap">
  <p class="ig-credit">
    <b>These posts are on Instagram.</b> Nothing here is a copy &mdash; every tile is
    Instagram's own embed, loaded from Instagram when you scroll to it, and every
    one links back to the post.
  </p>
</div></section>

<script>
(function () {
  var box = document.getElementById('ig-box');
  var screen = box && box.querySelector('.ig-box-screen');
  var link = box && box.querySelector('.ig-box-cap a');

  function url(code, kind, captioned) {
    return 'https://www.instagram.com/' + (kind === 'reel' ? 'reel' : 'p') + '/' + code +
      '/embed/' + (captioned ? 'captioned/' : '');
  }

  function frame(src, title) {
    var f = document.createElement('iframe');
    f.src = src;
    f.setAttribute('scrolling', 'no');
    f.setAttribute('allowtransparency', 'true');
    f.loading = 'lazy';
    f.title = title;
    return f;
  }

  // Six hundred kilobytes a tile means the wall has to fill as you reach it,
  // never on load.
  var cells = [].slice.call(document.querySelectorAll('.ig-cell'));
  function mount(cell) {
    if (cell.dataset.up) return;
    cell.dataset.up = '1';
    var f = frame(url(cell.dataset.ig, cell.dataset.kind, false), 'Instagram post');
    f.addEventListener('load', function () { cell.classList.add('up'); });
    cell.appendChild(f);
    f.style.transform = 'scale(' + (cell.clientWidth / 326) + ')';
  }
  // The embed will not go below 326px, so scale it to whatever the column is
  // and keep the crop square.
  function fit() {
    cells.forEach(function (c) {
      var f = c.querySelector('iframe');
      if (!f) return;
      var k = c.clientWidth / 326;
      f.style.transform = 'scale(' + k + ')';
    });
  }
  window.addEventListener('resize', fit);

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { mount(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '600px 0px' });
    cells.forEach(function (c) { io.observe(c); });
  } else {
    cells.forEach(mount);
  }

  function open(cell) {
    var code = cell.dataset.ig, kind = cell.dataset.kind;
    if (!code) return;
    link.href = 'https://www.instagram.com/' + (kind === 'reel' ? 'reel' : 'p') + '/' + code + '/';
    screen.innerHTML = '';
    screen.appendChild(frame(url(code, kind, true), 'Instagram post'));
    box.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function shut() {
    if (!box.classList.contains('on')) return;
    box.classList.remove('on');
    screen.innerHTML = '';
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var cell = e.target.closest ? e.target.closest('.ig-cell') : null;
    if (cell) return open(cell);
    if (e.target.closest && e.target.closest('.ig-shut')) return shut();
    if (e.target === box) return shut();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') return shut();
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement &&
        document.activeElement.classList.contains('ig-cell')) {
      e.preventDefault();
      open(document.activeElement);
    }
  });

  var form = document.getElementById('ig-add-form');
  if (form) {
    var say = document.getElementById('ig-add-say');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('ig-add-url');
      var btn = form.querySelector('button');
      btn.disabled = true;
      say.textContent = 'Checking with Instagram\\u2026';
      fetch('https://garage.co.nz/api/insta/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: ${JSON.stringify(slug)},
          url: input.value,
          key: new URLSearchParams(location.search).get('add') || '',
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) { say.textContent = 'Added. Reloading\\u2026'; location.reload(); }
          else { say.textContent = (d && d.message) || 'That did not work.'; btn.disabled = false; }
        })
        .catch(function () { say.textContent = 'Could not reach the server.'; btn.disabled = false; });
    });
  }
})();
</script>`;
}
