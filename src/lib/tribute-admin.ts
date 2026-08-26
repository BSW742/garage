// Where the family takes something down. Photos sent in go straight onto the
// wall, so this is not a gate — it is the recourse. Served from
// <slug>.garage.co.nz/photos, unlocked by the edit token in ?k=, the same
// arrangement as the message inbox: nobody wants an account to look after a
// memorial page.

export function renderPhotoQueue(slug: string): string {
  const s = JSON.stringify(slug);
  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Photographs</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
:root{--ink:#f2efe9;--dim:#9a958c;--deep:#0d0d0e;--panel:#17171a;--line:#26262a}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,sans-serif;background:var(--deep);color:var(--ink)}
header{padding:1.1rem 1.2rem;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:.7rem}
header b{font-size:1.05rem;font-weight:600}header span{font-size:.85rem;color:var(--dim)}
main{padding:1.2rem;max-width:70rem;margin:0 auto}
h2{font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);
font-weight:600;margin:1.8rem 0 .9rem}
.grid{display:grid;gap:.9rem;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#000}
.meta{padding:.6rem .7rem;font-size:.82rem}
.meta b{display:block;font-weight:500}
.meta span{color:var(--dim);font-size:.76rem}
.acts{display:flex;gap:.4rem;padding:0 .7rem .7rem}
button{flex:1;font:inherit;font-size:.8rem;font-weight:600;padding:.45rem;border-radius:8px;
cursor:pointer;border:1px solid var(--line);background:#1e1e22;color:var(--ink)}
button.yes{background:var(--ink);color:var(--deep);border-color:var(--ink)}
button:disabled{opacity:.5;cursor:default}
.note{color:var(--dim);font-size:.9rem;padding:1rem 0}
.card.is-down{opacity:.45}
</style>
</head>
<body>
<header><b>Photographs</b><span id="sub">checking…</span></header>
<main>
  <p class="note">Everything people send appears on the page straight away. Take anything down that should not be there.</p>
  <div id="liveWrap" hidden><div class="grid" id="live"></div></div>
  <div id="goneWrap" hidden><h2>Taken down</h2><div class="grid" id="gone"></div></div>
  <p class="note" id="note"></p>
</main>
<script>
var SLUG=${s};
var API='https://garage.co.nz';
var key=new URLSearchParams(location.search).get('k')||'';
function esc(t){var d=document.createElement('div');d.textContent=t==null?'':t;return d.innerHTML;}

function card(p){
  var down=p.status==='hidden';
  return '<div class="card'+(down?' is-down':'')+'" data-id="'+esc(p.id)+'">'
    +'<img src="'+esc(p.url)+'" alt="" loading="lazy" />'
    +'<div class="meta">'+(p.caption?'<b>'+esc(p.caption)+'</b>':'')
    +(p.who?'<span>Sent by '+esc(p.who)+'</span>':'<span>No name given</span>')+'</div>'
    +'<div class="acts">'
    +(down?'<button class="yes" data-act="approved">Put it back</button>'
          :'<button data-act="hidden">Take down</button>')
    +'</div></div>';
}

async function load(){
  if(!key){document.getElementById('sub').textContent='needs the family link';return;}
  var r=await fetch(API+'/api/tribute/queue?slug='+encodeURIComponent(SLUG)+'&key='+encodeURIComponent(key)+'&all=1');
  var d=await r.json().catch(function(){return null;});
  if(!d||!d.ok){document.getElementById('sub').textContent='that link is not right';return;}
  var live=d.photos.filter(function(p){return p.status!=='hidden';});
  var gone=d.photos.filter(function(p){return p.status==='hidden';});
  document.getElementById('sub').textContent=live.length
    ? live.length+(live.length===1?' photograph sent in':' photographs sent in')
    : 'none sent in yet';
  document.getElementById('liveWrap').hidden=!live.length;
  document.getElementById('goneWrap').hidden=!gone.length;
  document.getElementById('live').innerHTML=live.map(card).join('');
  document.getElementById('gone').innerHTML=gone.map(card).join('');
  if(!d.photos.length)document.getElementById('note').textContent='Nobody has sent a photograph yet.';
}

document.addEventListener('click',async function(e){
  var b=e.target.closest('button[data-act]');
  if(!b)return;
  var id=b.closest('.card').getAttribute('data-id');
  b.disabled=true;
  await fetch(API+'/api/tribute/queue',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({slug:SLUG,key:key,id:id,action:b.getAttribute('data-act')})});
  load();
});
load();
</script>
</body></html>`;
}
