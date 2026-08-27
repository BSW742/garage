// The owner's message inbox at <slug>.garage.co.nz/admin.
// Authorised by the site's edit_token, passed as ?k= once and then remembered,
// so there is nothing to log into.


/**
 * The manifest that makes the inbox installable. start_url keeps the key,
 * because an icon on someone's home screen that opens to "who are you" is
 * worse than no icon at all.
 */
export function inboxManifest(slug: string, key: string): string {
  return JSON.stringify(
    {
      name: 'Messages — ' + slug + '.garage.co.nz',
      short_name: 'Messages',
      description: 'Customer messages and orders for ' + slug + '.garage.co.nz',
      start_url: '/admin?k=' + encodeURIComponent(key),
      scope: '/admin',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#0a0a0a',
      icons: [
        { src: 'https://garage.co.nz/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    },
    null,
    2
  );
}

export function renderInbox(slug: string): string {
  const s = JSON.stringify(slug);
  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Messages</title>
<link rel="manifest" id="mf" href="/admin/manifest.webmanifest" />
<script>(function(){var k=new URLSearchParams(location.search).get('k');if(k){document.getElementById('mf').href='/admin/manifest.webmanifest?k='+encodeURIComponent(k);}})();</script>
<meta name="theme-color" content="#0a0a0a" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Messages" />
<link rel="apple-touch-icon" href="https://garage.co.nz/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
:root{--ink:#10131a;--soft:#626b7d;--line:#dfe4ec;--wash:#f4f6fa;--accent:#2563eb}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,-apple-system,sans-serif;background:var(--wash);color:var(--ink);height:100dvh;display:flex;flex-direction:column}
header{padding:.9rem 1rem;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:.6rem}
header b{font-size:1rem}
header span{font-size:.8rem;color:var(--soft)}
header button{margin-left:auto;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-size:.8rem;padding:.35rem .7rem;border-radius:999px;cursor:pointer}
main{flex:1;overflow-y:auto}
.row-wrap{position:relative;border-bottom:1px solid var(--line);background:#fff}
.row{display:block;width:100%;text-align:left;border:0;background:transparent;padding:.85rem 3rem .85rem 1rem;cursor:pointer;font:inherit}
.bin{position:absolute;right:.55rem;top:50%;transform:translateY(-50%);border:0;background:none;
color:var(--soft);cursor:pointer;padding:.4rem .5rem;border-radius:8px;font:inherit;font-size:.78rem;
display:inline-flex;align-items:center;line-height:1}
.bin:hover{color:#dc2626;background:#fef2f2}
.bin.armed{color:#fff;background:#dc2626}
.bin[disabled]{opacity:.6;cursor:default}
.row-wrap:hover{background:#fafbfd}
.row b{display:block;font-size:.92rem}
.row p{margin:.2rem 0 0;font-size:.85rem;color:var(--soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row .ago{float:right;font-size:.72rem;color:var(--soft);font-weight:400}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:.4rem;vertical-align:middle}
.log{padding:1rem;display:flex;flex-direction:column;gap:.6rem}
.m{max-width:78%;padding:.6rem .85rem;border-radius:14px;font-size:.95rem;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
.them{align-self:flex-start;background:#fff;border:1px solid var(--line)}
.me{align-self:flex-end;background:var(--accent);color:#fff}
.m.bot{align-self:flex-end;background:#eef2ff;color:#1e3a8a;border:1px solid #c7d2fe}
.m.bot:before{content:'Assistant';display:block;font-size:.62rem;letter-spacing:.1em;
text-transform:uppercase;font-weight:700;opacity:.65;margin-bottom:.2rem}
form{display:flex;gap:.5rem;padding:.75rem;background:#fff;border-top:1px solid var(--line)}
/* display:flex on the element beats the browser's own [hidden] rule, so the
   reply box was showing on views with nothing to reply to. */
form[hidden]{display:none}
input{flex:1;font:inherit;padding:.6rem .8rem;border:1px solid var(--line);border-radius:12px;outline:none}
input:focus{border-color:var(--accent)}
button.send{border:0;background:var(--accent);color:#fff;font:inherit;font-weight:600;padding:0 1.1rem;border-radius:12px;cursor:pointer}
.note{padding:2rem 1.2rem;text-align:center;color:var(--soft);line-height:1.6}
.order{border-bottom:1px solid var(--line);background:#fff;padding:.9rem 1rem}
.order b{font-size:.95rem}
.order .ago{float:right;font-size:.72rem;color:var(--soft);font-weight:400}
.order .who{display:block;font-size:.8rem;color:var(--soft);margin-top:.15rem}
.order ul{margin:.5rem 0 0;padding-left:1.1rem;font-size:.85rem}
.order .total{display:block;margin-top:.4rem;font-weight:700;color:var(--accent)}
.order .note-text{margin:.4rem 0 0;font-size:.82rem;color:var(--soft);font-style:italic}
#here-tab{margin-left:auto;display:inline-flex;align-items:center;gap:.35rem;border:1px solid var(--line);
background:#fff;color:var(--soft);font:inherit;font-size:.8rem;padding:.35rem .7rem;border-radius:999px;
cursor:pointer}
#here-tab i{width:.5rem;height:.5rem;border-radius:50%;background:#cbd5e1;display:block}
#here-tab.on{border-color:#16a34a;color:#166534;background:#f0fdf4}
#here-tab.on i{background:#16a34a}
#signups-tab{margin-left:.4rem;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;
font-size:.8rem;padding:.35rem .7rem;border-radius:999px;cursor:pointer}
.camp{border-bottom:1px solid var(--line);background:#fff;padding:.9rem 1rem}
.camp b{font-size:.95rem;display:block}
.camp .at{font-size:.78rem;color:var(--soft);word-break:break-all}
.camp .bar{height:6px;background:var(--line);border-radius:99px;margin:.6rem 0 .5rem;overflow:hidden}
.camp .bar i{display:block;height:100%;background:var(--accent);border-radius:99px}
.camp .num{font-size:.82rem;color:var(--soft)}
.camp .num b{display:inline;color:var(--ink)}
.camp textarea{width:100%;margin-top:.6rem;min-height:6.5rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
font-size:.78rem;border:1px solid var(--line);border-radius:10px;padding:.6rem;color:var(--ink);
background:#fafbfd;resize:vertical;line-height:1.55}
.camp .copy{margin-top:.5rem;border:0;background:var(--accent);color:#fff;font:inherit;font-size:.8rem;
font-weight:600;padding:.4rem .8rem;border-radius:999px;cursor:pointer}
#orders-tab{border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;
font-size:.8rem;padding:.35rem .7rem;border-radius:999px;cursor:pointer}
.note code{background:#fff;border:1px solid var(--line);border-radius:6px;padding:.15rem .4rem;font-size:.85rem}
</style>
</head>
<body>
<header>
  <div><b id="title">Messages</b><br /><span id="sub">${slug}.garage.co.nz</span></div>
  <button id="here-tab" title="While this is on, visitors are told you are here">
    <i></i><span>Away</span></button>
  <button id="signups-tab">Sign-ups</button>
  <button id="orders-tab">Orders</button>
  <button id="back" hidden>All messages</button>
</header>
<main id="main"><p class="note">Loading…</p></main>
<form id="form" hidden>
  <input id="text" placeholder="Write a reply…" autocomplete="off" />
  <button class="send" type="submit">Send</button>
</form>

<script>
(function(){
var SLUG = ${s};
var API = 'https://garage.co.nz';
var KEY_STORE = 'garage-admin:' + SLUG;
var key = '';
var openThread = null;
var timer = null;

try {
  var q = new URLSearchParams(location.search).get('k');
  if (q) { localStorage.setItem(KEY_STORE, q); history.replaceState({}, '', location.pathname); }
  key = localStorage.getItem(KEY_STORE) || '';
} catch (e) {}

var main = document.getElementById('main');
var form = document.getElementById('form');
var text = document.getElementById('text');
var back = document.getElementById('back');
var title = document.getElementById('title');

function ago(iso){
  var mins = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm';
  if (mins < 1440) return Math.floor(mins / 60) + 'h';
  return Math.floor(mins / 1440) + 'd';
}

function noKey(){
  main.innerHTML = '<p class="note">Open this page using the link from your alert, ' +
    'the one ending in <code>/admin?k=…</code>.<br />That link is what proves the site is yours.</p>';
}

async function list(){
  if (!key) return noKey();
  var res = await fetch(API + '/api/chat/inbox?slug=' + encodeURIComponent(SLUG) + '&key=' + encodeURIComponent(key));
  var data = await res.json();
  if (!res.ok) {
    main.innerHTML = '<p class="note">' + (data.error || 'Could not load your messages') + '</p>';
    return;
  }
  form.hidden = true; back.hidden = true; title.textContent = 'Messages'; openThread = null;
  if (!data.threads.length) {
    main.innerHTML = '<p class="note">No messages yet.<br />They will appear here when someone asks a question on your site.</p>';
    return;
  }
  main.innerHTML = '';
  data.threads.forEach(function(t){
    var wrap = document.createElement('div');
    wrap.className = 'row-wrap';

    var b = document.createElement('button');
    b.className = 'row';
    var waiting = t.last_sender === 'visitor';
    b.innerHTML = '<span class="ago">' + ago(t.last_message_at) + '</span><b>' +
      (waiting ? '<span class="dot"></span>' : '') +
      escapeHtml(t.visitor_name || 'Name not given') + '</b>';
    var p = document.createElement('p');
    p.textContent = t.last_body || '';
    b.appendChild(p);
    b.addEventListener('click', function(){ show(t); });
    wrap.appendChild(b);

    // Two taps, not one. A bin on a phone is easy to catch by accident, and
    // behind it is somebody's phone number.
    var bin = document.createElement('button');
    bin.className = 'bin';
    bin.title = 'Delete this conversation';
    bin.setAttribute('aria-label', 'Delete this conversation');
    bin.innerHTML = TRASH;
    var armed = false, timer = null;
    bin.addEventListener('click', async function(e){
      e.stopPropagation();
      if (!armed) {
        armed = true;
        bin.classList.add('armed');
        bin.textContent = 'Delete?';
        timer = setTimeout(function(){
          armed = false; bin.classList.remove('armed'); bin.innerHTML = TRASH;
        }, 3000);
        return;
      }
      clearTimeout(timer);
      bin.disabled = true;
      bin.textContent = '…';
      var res = await fetch(API + '/api/chat/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: SLUG, key: key, threadId: t.id })
      });
      if (res.ok) { wrap.remove(); if (!main.querySelector('.row-wrap')) list(); }
      else { bin.disabled = false; bin.innerHTML = TRASH; bin.classList.remove('armed'); armed = false; }
    });
    wrap.appendChild(bin);

    main.appendChild(wrap);
  });
}

var TRASH = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6"/>' +
  '<path d="M10 11v6M14 11v6"/></svg>';

function escapeHtml(v){ var d = document.createElement('div'); d.textContent = v; return d.innerHTML; }

async function show(t){
  openThread = t.id;
  var res = await fetch(API + '/api/chat/inbox?slug=' + encodeURIComponent(SLUG) +
    '&key=' + encodeURIComponent(key) + '&threadId=' + encodeURIComponent(t.id));
  var data = await res.json();
  if (!res.ok) return;
  title.textContent = t.visitor_name || 'Someone on your site';
  document.getElementById('sub').textContent = t.visitor_contact || (SLUG + '.garage.co.nz');
  back.hidden = false; form.hidden = false;
  main.innerHTML = '';
  var log = document.createElement('div');
  log.className = 'log';
  data.messages.forEach(function(m){
    var d = document.createElement('div');
    // Three senders now, not two. An owner scanning a thread has to be able to
    // see at a glance which lines were theirs, which were the visitor's, and
    // which the assistant sent on their behalf.
    d.className = 'm ' + (m.sender === 'owner' ? 'me' : m.sender === 'bot' ? 'bot' : 'them');
    d.textContent = m.body;
    log.appendChild(d);
  });
  main.appendChild(log);
  main.scrollTop = main.scrollHeight;
}

document.getElementById('orders-tab').addEventListener('click', async function(){
  if (!key) return noKey();
  var res = await fetch(API + '/api/chat/inbox?orders=1&slug=' + encodeURIComponent(SLUG) + '&key=' + encodeURIComponent(key));
  var data = await res.json();
  if (!res.ok) { main.innerHTML = '<p class="note">' + (data.error || 'Could not load orders') + '</p>'; return; }
  form.hidden = true; back.hidden = false; openThread = null; title.textContent = 'Orders';
  if (!data.orders.length) {
    main.innerHTML = '<p class="note">No orders yet.<br />They appear here when someone sends a cart through.</p>';
    return;
  }
  main.innerHTML = '';
  data.orders.forEach(function(o){
    var items = [];
    try { items = JSON.parse(o.items || '[]'); } catch (e) {}
    var el = document.createElement('div');
    el.className = 'order';
    el.innerHTML = '<span class="ago">' + ago(o.created_at) + '</span><b>' + escapeHtml(o.name || 'Someone') + '</b>' +
      '<span class="who">' + escapeHtml([o.email, o.phone].filter(Boolean).join(' · ')) + '</span>' +
      '<ul>' + items.map(function(i){
        return '<li>' + escapeHtml(i.qty + ' × ' + i.name + (i.price ? ' — ' + i.price : '')) + '</li>';
      }).join('') + '</ul>' +
      (o.total ? '<span class="total">' + escapeHtml(o.total) + '</span>' : '') +
      (o.note ? '<p class="note-text">' + escapeHtml(o.note) + '</p>' : '');
    main.appendChild(el);
  });
});

// Presence is a heartbeat, not a flag. If the tab is closed or the laptop is
// shut the stamp goes stale on its own within ninety seconds, so nobody is
// ever promised a person who walked away.
(function(){
  var here = document.getElementById('here-tab');
  var label = here.querySelector('span');
  var beating = null;
  var on = false;

  async function beat(state){
    if (!key) return;
    try {
      await fetch(API + '/api/chat/presence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: SLUG, key: key, on: state })
      });
    } catch (e) { /* the next beat will do */ }
  }

  function set(next){
    on = next;
    here.classList.toggle('on', on);
    label.textContent = on ? 'Here' : 'Away';
    try { localStorage.setItem('garage-here:' + SLUG, on ? '1' : ''); } catch (e) {}
    if (beating) { clearInterval(beating); beating = null; }
    if (on) { beat(true); beating = setInterval(function(){ beat(true); }, 30000); }
    else beat(false);
  }

  here.addEventListener('click', function(){ set(!on); });
  try { if (localStorage.getItem('garage-here:' + SLUG)) set(true); } catch (e) {}

  // Leaving the page stands somebody down straight away rather than waiting
  // for the stamp to rot.
  window.addEventListener('pagehide', function(){
    if (!on || !key) return;
    try {
      navigator.sendBeacon(API + '/api/chat/presence',
        new Blob([JSON.stringify({ slug: SLUG, key: key, on: false })],
          { type: 'application/json' }));
    } catch (e) {}
  });
})();

document.getElementById('signups-tab').addEventListener('click', async function(){
  if (!key) return noKey();
  var res = await fetch(API + '/api/rally/list', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, key: key })
  });
  var data = await res.json();
  if (!res.ok) { main.innerHTML = '<p class="note">' + (data.error || 'Could not load sign-ups') + '</p>'; return; }
  form.hidden = true; back.hidden = false; openThread = null; title.textContent = 'Sign-ups';
  var camps = data.campaigns || [];
  if (!camps.length) {
    main.innerHTML = '<p class="note">No campaign pages yet.<br />' +
      'Ask for one in the editor — something you would only run if enough people were keen — ' +
      'and whoever puts their hand up shows here.</p>';
    return;
  }
  main.innerHTML = '';
  camps.forEach(function(c){
    var pct = Math.min(100, Math.round(c.rows.length / c.target * 100));
    var el = document.createElement('div');
    el.className = 'camp';
    el.innerHTML = '<b>' + escapeHtml(c.title) + '</b>' +
      '<span class="at">' + escapeHtml(SLUG + '.garage.co.nz/' + c.path) + '</span>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<span class="num"><b>' + c.rows.length + '</b> of ' + c.target +
        (c.rows.length >= c.target ? ' — it is on' : ' needed') + '</span>';
    if (c.rows.length) {
      var box = document.createElement('textarea');
      box.readOnly = true;
      box.value = c.rows.map(function(r){ return r.name + ',' + r.email; }).join('\\n');
      var btn = document.createElement('button');
      btn.className = 'copy';
      btn.textContent = 'Copy the list';
      btn.addEventListener('click', function(){
        try { box.select(); box.setSelectionRange(0, 99999); } catch (e) {}
        var done = function(){ btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = 'Copy the list'; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(box.value).then(done, function(){
            try { document.execCommand('copy'); done(); } catch (e) {} });
        } else { try { document.execCommand('copy'); done(); } catch (e) {} }
      });
      el.appendChild(box);
      el.appendChild(btn);
    }
    main.appendChild(el);
  });
});

back.addEventListener('click', function(){
  document.getElementById('sub').textContent = SLUG + '.garage.co.nz';
  list();
});

form.addEventListener('submit', async function(e){
  e.preventDefault();
  var body = text.value.trim();
  if (!body || !openThread) return;
  text.value = '';
  await fetch(API + '/api/chat/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, key: key, threadId: openThread, body: body })
  });
  show({ id: openThread, visitor_name: title.textContent });
});

list();
timer = setInterval(function(){
  if (openThread) { show({ id: openThread, visitor_name: title.textContent }); }
  else if (title.textContent === 'Messages') { list(); }
}, 8000);
})();
</script>
</body>
</html>`;
}
