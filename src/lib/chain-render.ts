// THE CHAIN (style: "chain")
//
// A collective message for one person — a farewell, a big birthday, a new baby
// — with a lock on it. The page collects messages until it hits a target, and
// until then nobody can read a single one. Not the people who wrote them, not
// even whoever started it.
//
// That lock is the entire design. Every other page here asks to be shared as a
// favour; this one cannot function unless it is passed on, because the only
// way anybody sees what they wrote is to get the thing full. So the share step
// is not a footer link, it is what happens immediately after you contribute,
// and the progress count is the biggest thing on the page.
//
// While it is locked the page shows who has added, but never what they said.
// Names are the proof it is real and the reason to join in; the words are the
// reward for finishing it.

import type { SiteConfig } from './site-render';

export const CHAIN_FONT_QUERY = '&family=Newsreader:ital,wght@0,300;0,400;0,500;1,300';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

function safeUrl(url: unknown): string | null {
  const value = String(url || '').trim();
  if (!/^https?:\/\//i.test(value)) return null;
  return value.replace(/[()"'\s]/g, encodeURIComponent);
}

export const CHAIN_CSS = `
.ch{--paper:#f6f2ea;--card:#fffdf8;--ink:#1c1a16;--dim:#7a7266;--line:#e2dacb;
--accent:var(--primary);
--seal:color-mix(in srgb,var(--primary) 88%,#000 12%);
--display:'Newsreader',Georgia,serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.ch{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.6}
html:has(body.ch),body.ch{overflow-x:clip}
.ch h1,.ch h2{font-family:var(--display);font-weight:400;letter-spacing:-.01em;
line-height:1.05;text-align:center;margin-bottom:0}
.ch ::selection{background:var(--ink);color:var(--paper)}
.ch-wrap{max-width:54rem;margin:0 auto;padding:0 1.2rem}

/* -- Who it is for -- */
.ch-head{padding:3.4rem 0 1.6rem;text-align:center}
.ch-occasion{font-family:var(--display);font-style:italic;font-size:1.05rem;color:var(--dim);
margin-bottom:.7rem}
.ch-head h1{font-size:clamp(2.4rem,8vw,4.2rem)}
.ch-lede{margin:1.1rem auto 0;color:var(--dim);max-width:32rem;font-size:1rem}

/* -- The count. The biggest thing on a locked page. -- */
.ch-lock{margin:1.8rem auto 0;max-width:34rem;background:var(--card);
border:1px solid var(--line);border-radius:18px;padding:2.2rem 1.6rem;text-align:center;
box-shadow:0 24px 50px -40px rgba(28,26,22,.5)}
.ch-count{font-family:var(--display);font-size:clamp(3rem,13vw,5rem);line-height:.9;
letter-spacing:-.02em}
.ch-count small{font-size:.36em;color:var(--dim);letter-spacing:0}
.ch-togo{margin-top:.6rem;font-size:.9rem;color:var(--dim)}
.ch-bar{height:9px;background:var(--line);border-radius:99px;margin:1.4rem 0 1.2rem;
overflow:hidden}
.ch-bar i{display:block;height:100%;background:var(--accent);border-radius:99px;
transition:width .8s cubic-bezier(.16,1,.3,1)}
.ch-sealed{font-size:.92rem;color:var(--dim);line-height:1.6;max-width:26rem;margin:0 auto}
.ch-sealed b{color:var(--ink);font-weight:600}

.ch-btn{display:inline-block;background:var(--ink);color:var(--paper);border:0;
padding:.9rem 1.8rem;border-radius:999px;font-size:.98rem;font-weight:600;cursor:pointer;
font-family:var(--body);margin-top:1.5rem}
.ch-btn:hover{background:var(--seal);color:#fff}
.ch-btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line);
margin-top:.7rem}
.ch-btn.ghost:hover{background:var(--card);color:var(--ink);border-color:var(--dim)}

/* -- Who is in. Names, never words. -- */
.ch-who{margin:2.4rem auto 0;max-width:40rem;text-align:center}
.ch-who h2{font-size:.76rem;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);
font-family:var(--body);font-weight:700;margin-bottom:1rem}
.ch-chips{display:flex;flex-wrap:wrap;gap:.45rem;justify-content:center}
.ch-chip{background:var(--card);border:1px solid var(--line);border-radius:999px;
padding:.35rem .85rem;font-size:.86rem}
.ch-chip.new{border-color:var(--accent)}
.ch-latest{margin-top:1rem;font-size:.85rem;color:var(--dim)}

/* -- Passing it on -- */
.ch-pass{margin:2.6rem auto 0;max-width:34rem;text-align:center;
border-top:1px solid var(--line);padding-top:2.2rem}
.ch-pass h2{font-family:var(--display);font-size:1.6rem;margin-bottom:.5rem}
.ch-pass p{color:var(--dim);font-size:.93rem;margin-bottom:1.2rem}
.ch-link{display:flex;gap:.5rem;align-items:stretch;max-width:26rem;margin:0 auto}
.ch-link input{flex:1;min-width:0;background:var(--card);border:1px solid var(--line);
border-radius:10px;padding:.7rem .85rem;font-size:.9rem;color:var(--ink);font-family:var(--body)}
.ch-copy{background:var(--ink);color:var(--paper);border:0;border-radius:10px;
padding:.7rem 1.1rem;font-size:.9rem;font-weight:600;cursor:pointer;font-family:var(--body);
white-space:nowrap}
.ch-copy.done{background:var(--accent)}

/* -- Unlocked -- */
.ch-open{text-align:center;padding:1.4rem 0 .4rem}
.ch-open span{display:inline-block;background:var(--accent);color:#fff;border-radius:999px;
padding:.35rem 1rem;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;
font-weight:700}
.ch-notes{padding:1.8rem 0 1rem;column-count:1;column-gap:1rem}
@media(min-width:640px){.ch-notes{column-count:2}}
@media(min-width:1000px){.ch-notes{column-count:3}}
.ch-note{break-inside:avoid;margin-bottom:1rem;background:var(--card);
border:1px solid var(--line);border-radius:14px;padding:1.3rem 1.2rem;
box-shadow:0 14px 30px -28px rgba(28,26,22,.6)}
.ch-note img{width:100%;border-radius:9px;margin-bottom:.9rem;display:block}
.ch-note p{font-size:.97rem;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}
.ch-note cite{display:block;margin-top:.9rem;font-family:var(--display);font-style:italic;
color:var(--dim);font-size:.95rem}
.ch-empty{text-align:center;color:var(--dim);padding:3rem 0}

/* -- Whoever started it, arriving with their key in the URL -- */
.ch-owner{display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center;justify-content:center;
background:var(--card);border:1px solid var(--line);border-radius:12px;
padding:.7rem 1rem;margin-top:1.2rem;font-size:.86rem;color:var(--dim)}
.ch-owner button{background:none;border:0;color:var(--ink);font-weight:600;cursor:pointer;
font-size:.86rem;font-family:var(--body);border-bottom:1px solid var(--line)}
.ch-owner button:hover{border-bottom-color:var(--ink)}

.ch-foot{border-top:1px solid var(--line);margin-top:2.5rem;padding:2rem 0 3rem;
text-align:center;color:var(--dim);font-size:.82rem;display:block}
.ch-foot a{color:var(--dim);border-bottom:1px solid var(--line)}

/* -- The sheet -- */
.ch-sheet{position:fixed;inset:0;z-index:95;display:none;place-items:center;padding:1.2rem;
background:rgba(24,22,18,.72);backdrop-filter:blur(4px)}
.ch-sheet.on{display:grid}
.ch-card{background:var(--card);border-radius:18px;padding:1.8rem 1.6rem;
width:min(440px,100%);max-height:92vh;overflow:auto;text-align:center}
.ch-card h2{font-family:var(--display);font-size:1.7rem;margin-bottom:.4rem}
.ch-card p{color:var(--dim);font-size:.92rem;margin-bottom:1.3rem}
.ch-card textarea{width:100%;background:var(--paper);border:1px solid var(--line);
border-radius:11px;padding:.85rem;font-size:.96rem;color:var(--ink);font-family:var(--body);
min-height:8.5rem;resize:vertical;margin-bottom:.7rem;line-height:1.6}
.ch-card input[type=text]{width:100%;background:var(--paper);border:1px solid var(--line);
border-radius:11px;padding:.75rem .85rem;font-size:.94rem;color:var(--ink);
font-family:var(--body);margin-bottom:.7rem}
.ch-card textarea::placeholder,.ch-card input::placeholder{color:#a89f91}
.ch-pick{display:block;border:1px dashed var(--line);border-radius:11px;padding:.9rem;
color:var(--dim);cursor:pointer;margin-bottom:.9rem;font-size:.88rem}
.ch-pick:hover{border-color:var(--dim);color:var(--ink)}
.ch-send{width:100%;background:var(--ink);color:var(--paper);border:0;border-radius:999px;
padding:.85rem;font-size:.98rem;font-weight:600;cursor:pointer;font-family:var(--body)}
.ch-send[disabled]{opacity:.45;cursor:default}
.ch-msg{margin-top:.8rem;font-size:.86rem;color:var(--dim);min-height:1.2em}
.ch-x{margin-top:.7rem;background:none;border:0;color:var(--dim);cursor:pointer;
font-size:.86rem;width:100%}
.ch-done .ch-tick{font-size:2.6rem;line-height:1;margin-bottom:.6rem}
.ch-hide{display:none}
@media(prefers-reduced-motion:reduce){.ch-bar i{transition:none}}
`;

export interface ChainNote {
  body?: string;
  who?: string;
  url?: string;
  created_at?: string;
}

function ago(when: string | undefined): string {
  if (!when) return '';
  const then = new Date(when).getTime();
  if (!then) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/**
 * The target. Stored as text like everything else the agent writes, so it gets
 * coerced here, and it never sits below what has already come in — a target
 * that has been passed is just an unlocked page.
 */
function targetFor(site: SiteConfig, count: number): number {
  const asked = Math.round(Number((site as any).target));
  if (!Number.isFinite(asked) || asked < 1) return Math.max(10, count);
  return Math.min(500, asked);
}

export function renderChainBody(
  site: SiteConfig,
  slug: string,
  notes: ChainNote[] = [],
  unlocked = false
): string {
  const forWhom = site.name || slug;
  const count = notes.length;
  const target = targetFor(site, count);
  const togo = Math.max(0, target - count);
  const pct = Math.min(100, Math.round((count / Math.max(1, target)) * 100));
  const open = unlocked || count >= target;
  const url = `https://${slug}.garage.co.nz`;

  const names = notes.map((n) => String(n.who || '').trim()).filter(Boolean);
  const chips = [...new Set(names)]
    .slice(0, 60)
    .map((who) => `<span class="ch-chip">${esc(who)}</span>`)
    .join('');

  const last = notes[notes.length - 1];
  const latest = last && last.who && ago(last.created_at)
    ? `<p class="ch-latest">${esc(last.who)} added theirs ${esc(ago(last.created_at))}.</p>`
    : '';

  // Passing it on is the mechanic, so it gets the same weight as contributing.
  const pass = `<section class="ch-pass">
    <h2>${open ? 'Know somebody else who should add one?' : `It needs ${togo} more`}</h2>
    <p>${
      open
        ? 'It stays open. Anything added now appears straight away.'
        : 'Send it to two people. That is how these fill up — nobody sees a word until it does.'
    }</p>
    <div class="ch-link">
      <input type="text" id="ch-url" value="${esc(url)}" readonly aria-label="Link to this page" />
      <button type="button" class="ch-copy" id="ch-copy">Copy link</button>
    </div>
  </section>`;

  const locked = `<div class="ch-lock">
    <div class="ch-count">${count}<small>&nbsp;of ${target}</small></div>
    <p class="ch-togo">${
      togo === 1 ? 'One more and it opens.' : `${togo} more and it opens.`
    }</p>
    <div class="ch-bar"><i style="width:${pct}%"></i></div>
    <p class="ch-sealed">Every message is <b>sealed until then</b> — including from
      whoever started this. Add yours, then pass it on.</p>
    <button type="button" class="ch-btn" id="ch-open-sheet">Add yours</button>
  </div>
  ${chips ? `<section class="ch-who"><h2>Already in</h2><div class="ch-chips">${chips}</div>${latest}</section>` : ''}`;

  const wall = notes.length
    ? `<div class="ch-notes">${notes
        .map((note) => {
          const shot = safeUrl(note.url);
          return `<figure class="ch-note">
        ${shot ? `<img src="${esc(shot)}" alt="" loading="lazy" />` : ''}
        ${note.body ? `<p>${esc(note.body)}</p>` : ''}
        ${note.who ? `<cite>— ${esc(note.who)}</cite>` : ''}
      </figure>`;
        })
        .join('')}</div>`
    : `<p class="ch-empty">Nothing in it yet.</p>`;

  const opened = `<div class="ch-open"><span>Open &middot; ${count} ${
    count === 1 ? 'message' : 'messages'
  }</span></div>
  ${wall}
  <div style="text-align:center"><button type="button" class="ch-btn" id="ch-open-sheet">Add yours</button></div>`;

  return `
<div class="ch-wrap">
  <div class="ch-owner ch-hide" id="ch-owner">
    <span>You started this. It opens on its own at ${target}.</span>
    <button type="button" id="ch-unlock">Open it now</button>
  </div>
  <header class="ch-head" id="top">
    ${site.eyebrow ? `<p class="ch-occasion">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(forWhom)}</h1>
    ${site.lede ? `<p class="ch-lede">${esc(site.lede)}</p>` : ''}
  </header>

  ${open ? opened : locked}
  ${pass}

  <footer class="ch-foot">
    <span>For ${esc(forWhom)}</span> &middot;
    <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
  </footer>
</div>

<div class="ch-sheet" id="ch-sheet" aria-hidden="true">
  <div class="ch-card">
    <div id="ch-form">
      <h2>For ${esc(forWhom)}</h2>
      <p>${
        open
          ? 'It is open, so yours will show straight away.'
          : 'Nobody reads this until it is full. Say the thing you would actually say.'
      }</p>
      <textarea id="ch-body" maxlength="900" placeholder="Write it here…"></textarea>
      <input type="text" id="ch-who" maxlength="40" placeholder="Your name" />
      <label class="ch-pick" id="ch-pick">Add a photo too (optional)
        <input type="file" accept="image/*" id="ch-file" hidden /></label>
      <button type="button" class="ch-send" id="ch-send" disabled>Add mine</button>
      <p class="ch-msg" id="ch-msg"></p>
      <button type="button" class="ch-x" id="ch-cancel">Not now</button>
    </div>

    <div id="ch-done" class="ch-done ch-hide">
      <div class="ch-tick">&#10003;</div>
      <h2>Yours is in</h2>
      <p id="ch-done-say"></p>
      <div class="ch-link">
        <input type="text" id="ch-url2" value="${esc(url)}" readonly aria-label="Link to this page" />
        <button type="button" class="ch-copy" id="ch-copy2">Copy link</button>
      </div>
      <button type="button" class="ch-btn" id="ch-share">Send it to two people</button>
      <button type="button" class="ch-btn ghost" id="ch-close2">Done</button>
    </div>
  </div>
</div>

<script>(function(){
var SLUG=${JSON.stringify(slug)};
var URLS=${JSON.stringify(url)};
var FOR=${JSON.stringify(String(site.name || slug))};

function copyFrom(input,btn){
  var was=btn.textContent;
  try{input.select();input.setSelectionRange(0,999);}catch(e){}
  var done=function(){btn.textContent='Copied';btn.classList.add('done');
    setTimeout(function(){btn.textContent=was;btn.classList.remove('done');},1600);};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(input.value).then(done,function(){
      try{document.execCommand('copy');done();}catch(e){}});
  }else{try{document.execCommand('copy');done();}catch(e){}}
}
[['ch-copy','ch-url'],['ch-copy2','ch-url2']].forEach(function(p){
  var b=document.getElementById(p[0]),i=document.getElementById(p[1]);
  if(b&&i)b.addEventListener('click',function(){copyFrom(i,b);});
});

var sheet=document.getElementById('ch-sheet');
var form=document.getElementById('ch-form'),thanks=document.getElementById('ch-done');
var body=document.getElementById('ch-body'),who=document.getElementById('ch-who');
var send=document.getElementById('ch-send'),msg=document.getElementById('ch-msg');
var file=document.getElementById('ch-file'),pick=document.getElementById('ch-pick');
var chosen=null;
function open(){sheet.classList.add('on');sheet.setAttribute('aria-hidden','false');
  setTimeout(function(){body.focus();},60);}
function close(){sheet.classList.remove('on');sheet.setAttribute('aria-hidden','true');}
var opener=document.getElementById('ch-open-sheet');
if(opener)opener.addEventListener('click',open);
document.getElementById('ch-cancel').addEventListener('click',close);
document.getElementById('ch-close2').addEventListener('click',function(){location.reload();});
sheet.addEventListener('click',function(e){if(e.target===sheet)close();});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&sheet.classList.contains('on'))close();});

function ready(){send.disabled=!(body.value.trim().length>1&&who.value.trim().length>0);}
body.addEventListener('input',ready);who.addEventListener('input',ready);
file.addEventListener('change',function(){
  chosen=file.files&&file.files[0];
  if(chosen)pick.textContent=chosen.name.slice(0,40);
});
function shrink(f){return new Promise(function(res){
  if(!f)return res(null);
  if(!/^image\\//.test(f.type)||/svg/.test(f.type))return res(f);
  var im=new Image(),src=URL.createObjectURL(f);
  im.onload=function(){URL.revokeObjectURL(src);
    var s=Math.min(1,1800/Math.max(im.width,im.height));
    if(s===1&&f.size<1000000)return res(f);
    try{var c=document.createElement('canvas');
      c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      c.toBlob(function(b){res(b&&b.size<f.size?b:f);},'image/jpeg',.86);
    }catch(e){res(f);}};
  im.onerror=function(){URL.revokeObjectURL(src);res(f);};
  im.src=src;});}
function post(image){
  fetch('https://garage.co.nz/api/chain',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({slug:SLUG,body:body.value,who:who.value,image:image||null})})
    .then(function(x){return x.json();})
    .then(function(d){
      if(!d||!d.ok){msg.textContent=(d&&d.error)||'That did not send, sorry.';
        send.disabled=false;return;}
      form.classList.add('ch-hide');thanks.classList.remove('ch-hide');
      var say=document.getElementById('ch-done-say');
      say.textContent=d.unlocked
        ? 'That was the one that opened it. Go and have a look.'
        : (d.togo===1
            ? 'One more and it opens. You could be the one who finds them.'
            : d.togo+' more and it opens for everyone, including you.');
    })
    .catch(function(){msg.textContent='That did not send, sorry.';send.disabled=false;});
}
send.addEventListener('click',function(){
  if(send.disabled)return;
  send.disabled=true;msg.textContent='Adding…';
  if(!chosen)return post(null);
  shrink(chosen).then(function(f){
    if(!f)return post(null);
    var r=new FileReader();
    r.onload=function(){post(r.result);};
    r.onerror=function(){post(null);};
    r.readAsDataURL(f);
  });
});

// Whoever started this arrives with the edit key on the URL. A chain that
// never reaches its target would otherwise stay sealed forever, so they get
// one control: open it early.
var key=new URLSearchParams(location.search).get('k');
var strip=document.getElementById('ch-owner');
if(key&&strip&&${open ? 'false' : 'true'}){
  strip.classList.remove('ch-hide');
  document.getElementById('ch-unlock').addEventListener('click',function(){
    var b=this;b.textContent='Opening…';b.disabled=true;
    fetch('https://garage.co.nz/api/chain/unlock',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({slug:SLUG,key:key})})
      .then(function(x){return x.json();})
      .then(function(d){
        if(d&&d.ok){location.href=location.pathname;}
        else{b.textContent=(d&&d.error)||'Could not open it';}})
      .catch(function(){b.textContent='Could not open it';});
  });
}

// The share step. Native sheet where there is one, so it lands in whatever
// people already use; the copied link everywhere else.
document.getElementById('ch-share').addEventListener('click',function(){
  var text='I have added mine to this for '+FOR+' — add yours and pass it on. '
    +'Nobody can read any of it until it is full.';
  if(navigator.share){
    navigator.share({title:'For '+FOR,text:text,url:URLS}).catch(function(){});
  }else{
    var i=document.getElementById('ch-url2'),b=document.getElementById('ch-copy2');
    copyFrom(i,b);
  }
});
})();</script>`;
}
