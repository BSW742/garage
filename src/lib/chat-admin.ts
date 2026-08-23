// The owner's message inbox at <slug>.garage.co.nz/admin.
// Authorised by the site's edit_token, passed as ?k= once and then remembered,
// so there is nothing to log into.

export function renderInbox(slug: string): string {
  const s = JSON.stringify(slug);
  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Messages</title>
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
.row{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:#fff;padding:.85rem 1rem;cursor:pointer;font:inherit}
.row:hover{background:#fafbfd}
.row b{display:block;font-size:.92rem}
.row p{margin:.2rem 0 0;font-size:.85rem;color:var(--soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row .ago{float:right;font-size:.72rem;color:var(--soft);font-weight:400}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:.4rem;vertical-align:middle}
.log{padding:1rem;display:flex;flex-direction:column;gap:.6rem}
.m{max-width:78%;padding:.6rem .85rem;border-radius:14px;font-size:.95rem;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
.them{align-self:flex-start;background:#fff;border:1px solid var(--line)}
.me{align-self:flex-end;background:var(--accent);color:#fff}
form{display:flex;gap:.5rem;padding:.75rem;background:#fff;border-top:1px solid var(--line)}
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
#orders-tab{margin-left:auto;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;
font-size:.8rem;padding:.35rem .7rem;border-radius:999px;cursor:pointer}
.note code{background:#fff;border:1px solid var(--line);border-radius:6px;padding:.15rem .4rem;font-size:.85rem}
</style>
</head>
<body>
<header>
  <div><b id="title">Messages</b><br /><span id="sub">${slug}.garage.co.nz</span></div>
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
    var b = document.createElement('button');
    b.className = 'row';
    var waiting = t.last_sender === 'visitor';
    b.innerHTML = '<span class="ago">' + ago(t.last_message_at) + '</span><b>' +
      (waiting ? '<span class="dot"></span>' : '') +
      escapeHtml(t.visitor_name || 'Someone on your site') + '</b>';
    var p = document.createElement('p');
    p.textContent = t.last_body || '';
    b.appendChild(p);
    b.addEventListener('click', function(){ show(t); });
    main.appendChild(b);
  });
}

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
    d.className = 'm ' + (m.sender === 'owner' ? 'me' : 'them');
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
timer = setInterval(function(){ if (openThread) { show({ id: openThread, visitor_name: title.textContent }); } else { list(); } }, 8000);
})();
</script>
</body>
</html>`;
}
