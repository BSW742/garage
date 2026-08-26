// TRIBUTE TEMPLATE (style: "tribute")
// A memorial page, and the only template here that is not selling anything.
//
// Every other template is words with pictures in support. This one inverts it:
// a name, two dates, and then a wall of photographs from the top of the page to
// the bottom. Nobody visiting wants a services grid or a call to action. They
// want to see the person.
//
// The wall is masonry by CSS columns rather than a fixed grid, because family
// photographs are whatever shape they are — portrait phone snaps next to square
// prints next to a scanned landscape from 1974 — and cropping them all to a
// tidy square is the one thing that would make it feel like a website again.
//
// Photos arrive two ways: whatever the family put up, and whatever people send
// in through the page itself. Sent-in photos go straight onto the wall — the
// family can take one down at <slug>/photos, but nothing waits on them.

import type { SiteConfig } from './site-render';

export const TRIBUTE_FONT_QUERY = '&family=Cormorant+Garamond:wght@300;400;500';

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

export const TRIBUTE_CSS = `
.tr{--ink:#f2efe9;--dim:#9a958c;--deep:#0d0d0e;--panel:#17171a;--line:#26262a;
--accent:var(--primary);
--display:'Cormorant Garamond',Georgia,serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.tr{background:var(--deep);color:var(--ink);font-family:var(--body);line-height:1.7}
html:has(body.tr),body.tr{overflow-x:clip}
.tr h1,.tr h2{font-family:var(--display);font-weight:300;letter-spacing:.005em;
line-height:1.1;text-align:center;margin-bottom:0}
.tr ::selection{background:var(--ink);color:var(--deep)}

/* ── The head. A name, two dates, and nothing else. ── */
.tr-head{padding:6rem 1.5rem 3.5rem;text-align:center;max-width:52rem;margin:0 auto}
@media(min-width:800px){.tr-head{padding:8rem 1.5rem 4.5rem}}
.tr-portrait{width:clamp(9rem,22vw,13rem);aspect-ratio:1;border-radius:50%;margin:0 auto 2.4rem;
background:var(--panel) center/cover;box-shadow:0 0 0 1px var(--line),0 30px 60px -30px #000}
.tr-head h1{font-size:clamp(2.8rem,8vw,5.4rem);line-height:1}
.tr-dates{margin-top:1.2rem;font-family:var(--display);font-size:clamp(1.1rem,2.6vw,1.5rem);
color:var(--dim);letter-spacing:.06em}
.tr-note{margin-top:1.8rem;color:var(--dim);font-size:1rem;line-height:1.8;max-width:34rem;
margin-left:auto;margin-right:auto}
.tr-rule{width:2.5rem;height:1px;background:var(--line);margin:2.8rem auto 0}

/* ── The wall. Masonry, because family photos are every shape. ── */
.tr-wall{padding:2.5rem .6rem 5rem;column-count:2;column-gap:.6rem}
@media(min-width:640px){.tr-wall{column-count:3;column-gap:.75rem;padding-left:.75rem;padding-right:.75rem}}
@media(min-width:1040px){.tr-wall{column-count:4}}
@media(min-width:1500px){.tr-wall{column-count:5}}
.tr-pic{break-inside:avoid;margin-bottom:.6rem;position:relative;display:block;width:100%;
background:var(--panel);border:0;padding:0;cursor:zoom-in;overflow:hidden;line-height:0}
@media(min-width:640px){.tr-pic{margin-bottom:.75rem}}
.tr-pic img{width:100%;height:auto;display:block;
filter:saturate(.96);transition:transform .5s cubic-bezier(.16,1,.3,1),filter .4s ease}
.tr-pic:hover img{transform:scale(1.03);filter:saturate(1.06)}
.tr-pic figcaption{position:absolute;left:0;right:0;bottom:0;padding:1.4rem .9rem .7rem;
font-size:.82rem;line-height:1.5;color:#fff;text-align:left;
background:linear-gradient(transparent,rgba(0,0,0,.72));
opacity:0;transition:opacity .3s ease}
.tr-pic:hover figcaption,.tr-pic:focus-visible figcaption{opacity:1}
.tr-pic figcaption b{display:block;font-weight:500}
.tr-pic figcaption span{color:rgba(255,255,255,.72);font-size:.76rem}
.tr-pic:focus-visible{outline:2px solid var(--ink);outline-offset:2px}

.tr-empty{text-align:center;color:var(--dim);padding:4rem 1.5rem 6rem;font-size:1rem}

/* ── Send a photo ────────────────────────────────── */
.tr-invite{text-align:center;padding:1rem 1.5rem 6rem}
.tr-invite p{color:var(--dim);margin-bottom:1.3rem;font-size:.98rem}
.tr-add{display:inline-block;border:1px solid var(--line);color:var(--ink);
padding:.9rem 2rem;border-radius:999px;font-size:.92rem;background:var(--panel);
transition:border-color .25s ease,background .25s ease;cursor:pointer}
.tr-add:hover{border-color:var(--dim);background:#1e1e22}

.tr-foot{border-top:1px solid var(--line);padding:2.6rem 1.5rem;text-align:center;
color:var(--dim);font-size:.82rem}
.tr-foot a{color:var(--dim);border-bottom:1px solid var(--line)}

/* ── Lightbox ────────────────────────────────────── */
.tr-box{position:fixed;inset:0;z-index:90;display:none;place-items:center;padding:3vw;
background:rgba(6,6,7,.94);cursor:zoom-out}
.tr-box.on{display:grid}
.tr-box img{max-width:94vw;max-height:86vh;width:auto;height:auto;object-fit:contain;
box-shadow:0 40px 90px -40px #000}
.tr-box-cap{position:absolute;left:0;right:0;bottom:1.4rem;text-align:center;color:#fff;
font-size:.9rem;padding:0 1.5rem}
.tr-box-cap span{color:rgba(255,255,255,.6)}
.tr-box-x{position:absolute;top:1.1rem;right:1.3rem;background:none;border:0;color:#fff;
font-size:2rem;line-height:1;cursor:pointer;opacity:.7;padding:.2rem .5rem}
.tr-box-x:hover{opacity:1}
.tr-box-nav{position:absolute;top:50%;transform:translateY(-50%);background:none;border:0;
color:#fff;font-size:2.6rem;line-height:1;cursor:pointer;opacity:.55;padding:1rem}
.tr-box-nav:hover{opacity:1}
.tr-box-nav.prev{left:.4rem}.tr-box-nav.next{right:.4rem}
@media(prefers-reduced-motion:reduce){.tr-pic img{transition:none}}

/* ── Send-a-photo sheet ──────────────────────────── */
.tr-sheet{position:fixed;inset:0;z-index:95;display:none;place-items:center;padding:1.5rem;
background:rgba(6,6,7,.8);backdrop-filter:blur(4px)}
.tr-sheet.on{display:grid}
.tr-sheet-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;
padding:2rem 1.7rem;width:min(420px,100%);text-align:center}
.tr-sheet-card h2{font-size:1.7rem;margin-bottom:.6rem}
.tr-sheet-card p{color:var(--dim);font-size:.92rem;margin-bottom:1.6rem}
.tr-sheet-card input[type=text]{width:100%;background:var(--deep);border:1px solid var(--line);
color:var(--ink);border-radius:10px;padding:.75rem .9rem;font-size:.95rem;margin-bottom:.7rem;
font-family:var(--body)}
.tr-sheet-card input[type=text]::placeholder{color:#5f5b55}
.tr-pick{display:block;border:1px dashed var(--line);border-radius:12px;padding:1.6rem 1rem;
color:var(--dim);cursor:pointer;margin-bottom:1rem;font-size:.92rem}
.tr-pick:hover{border-color:var(--dim);color:var(--ink)}
.tr-send{width:100%;background:var(--ink);color:var(--deep);border:0;border-radius:999px;
padding:.85rem;font-size:.95rem;font-weight:600;cursor:pointer;font-family:var(--body)}
.tr-send[disabled]{opacity:.5;cursor:default}
.tr-sheet-msg{margin-top:.9rem;font-size:.86rem;color:var(--dim);min-height:1.2em}
.tr-sheet-x{margin-top:1rem;background:none;border:0;color:var(--dim);cursor:pointer;font-size:.86rem}
`;

export interface TributePhoto {
  url: string;
  caption?: string;
  who?: string;
}

/**
 * The wall. Photos from the site config come first (whatever the family put
 * up), then anything sent in and approved.
 */
export function renderTributeBody(site: SiteConfig, slug: string, sent: TributePhoto[] = []): string {
  const name = site.name || slug;
  const portrait = safeUrl(site.heroImage);

  // Anything in images, plus anything sitting in a gallery section — some
  // other path may still put photos there, and a photo that reached the config
  // should never be invisible on a page whose whole job is showing photos.
  const fromSections = (site.sections || [])
    .filter((s) => s && s.type === 'gallery')
    .flatMap((s) => s.images || []);

  const seen = new Set<string>();
  const own: TributePhoto[] = [...(site.images || []), ...fromSections]
    .map((u) => safeUrl(u))
    .filter((u): u is string => !!u && !seen.has(u) && !!seen.add(u))
    .map((url) => ({ url }));

  const clean = sent
    .map((p) => ({ url: safeUrl(p.url), caption: p.caption || '', who: p.who || '' }))
    .filter((p) => p.url) as TributePhoto[];

  const all = [...own, ...clean];

  const wall = all.length
    ? `<div class="tr-wall" id="wall">${all
        .map((p, i) => {
          const cap = p.caption ? `<b>${esc(p.caption)}</b>` : '';
          const who = p.who ? `<span>Sent by ${esc(p.who)}</span>` : '';
          return `<figure class="tr-pic" data-i="${i}" data-full="${esc(p.url)}"
            data-cap="${esc(p.caption || '')}" data-who="${esc(p.who || '')}" tabindex="0" role="button"
            aria-label="${esc(p.caption || 'Photograph')}">
            <img src="${esc(p.url)}" alt="${esc(p.caption || `A photograph of ${name}`)}" loading="lazy" />
            ${cap || who ? `<figcaption>${cap}${who}</figcaption>` : ''}
          </figure>`;
        })
        .join('')}</div>`
    : `<p class="tr-empty">No photographs yet. If you have one, please send it.</p>`;

  return `
<header class="tr-head" id="top">
  ${portrait ? `<div class="tr-portrait" style="background-image:url(${esc(portrait)})"></div>` : ''}
  <h1>${esc(name)}</h1>
  ${site.eyebrow ? `<p class="tr-dates">${esc(site.eyebrow)}</p>` : ''}
  ${site.lede ? `<p class="tr-note">${esc(site.lede)}</p>` : ''}
  <div class="tr-rule"></div>
</header>
${wall}
<section class="tr-invite">
  <p>${esc(site.cta || 'If you have a photograph of ' + name + ', please add it.')}</p>
  <button type="button" class="tr-add" id="tr-add">Add a photograph</button>
</section>
<footer class="tr-foot">
  <span>In memory of ${esc(name)}</span> &middot;
  <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
</footer>

<div class="tr-box" id="tr-box" aria-hidden="true">
  <button class="tr-box-x" type="button" aria-label="Close">&times;</button>
  <button class="tr-box-nav prev" type="button" aria-label="Previous">&#8249;</button>
  <img alt="" />
  <button class="tr-box-nav next" type="button" aria-label="Next">&#8250;</button>
  <div class="tr-box-cap"></div>
</div>

<div class="tr-sheet" id="tr-sheet" aria-hidden="true">
  <div class="tr-sheet-card">
    <h2>Add a photograph</h2>
    <p>It will appear on the page straight away.</p>
    <label class="tr-pick" id="tr-pick">Choose a photo<input type="file" accept="image/*" id="tr-file" hidden /></label>
    <input type="text" id="tr-cap" maxlength="90" placeholder="A few words about it (optional)" />
    <input type="text" id="tr-who" maxlength="40" placeholder="Your name (optional)" />
    <button type="button" class="tr-send" id="tr-send" disabled>Send it</button>
    <p class="tr-sheet-msg" id="tr-msg"></p>
    <button type="button" class="tr-sheet-x" id="tr-cancel">Not now</button>
  </div>
</div>

<script>(function(){
var SLUG=${JSON.stringify(slug)};
var pics=[].slice.call(document.querySelectorAll('.tr-pic'));
var box=document.getElementById('tr-box'),img=box.querySelector('img'),cap=box.querySelector('.tr-box-cap');
var at=0;
function show(i){
  if(!pics.length)return;
  at=(i+pics.length)%pics.length;
  var p=pics[at];
  img.src=p.getAttribute('data-full');
  var c=p.getAttribute('data-cap'),w=p.getAttribute('data-who');
  cap.innerHTML=(c?c:'')+(w?' <span>Sent by '+w+'</span>':'');
  box.classList.add('on');box.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function hide(){box.classList.remove('on');box.setAttribute('aria-hidden','true');
document.body.style.overflow='';img.src='';}
pics.forEach(function(p,i){
  p.addEventListener('click',function(){show(i);});
  p.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();show(i);}});
});
box.addEventListener('click',function(e){if(e.target===box||e.target===img)hide();});
box.querySelector('.tr-box-x').addEventListener('click',hide);
box.querySelector('.prev').addEventListener('click',function(e){e.stopPropagation();show(at-1);});
box.querySelector('.next').addEventListener('click',function(e){e.stopPropagation();show(at+1);});
document.addEventListener('keydown',function(e){
  if(!box.classList.contains('on'))return;
  if(e.key==='Escape')hide();
  if(e.key==='ArrowLeft')show(at-1);
  if(e.key==='ArrowRight')show(at+1);
});

// Sending one in. Shrunk in the browser first: these are phone photos and
// people are on phone data at a funeral.
var sheet=document.getElementById('tr-sheet'),file=document.getElementById('tr-file');
var send=document.getElementById('tr-send'),msg=document.getElementById('tr-msg');
var pick=document.getElementById('tr-pick'),chosen=null;
document.getElementById('tr-add').addEventListener('click',function(){
  sheet.classList.add('on');sheet.setAttribute('aria-hidden','false');});
function close(){sheet.classList.remove('on');sheet.setAttribute('aria-hidden','true');}
document.getElementById('tr-cancel').addEventListener('click',close);
sheet.addEventListener('click',function(e){if(e.target===sheet)close();});
file.addEventListener('change',function(){
  chosen=file.files&&file.files[0];
  if(chosen){pick.textContent=chosen.name.slice(0,40);send.disabled=false;}
});
function shrink(f){return new Promise(function(res){
  if(!/^image\\//.test(f.type)||/svg/.test(f.type))return res(f);
  var im=new Image(),src=URL.createObjectURL(f);
  im.onload=function(){URL.revokeObjectURL(src);
    var s=Math.min(1,2000/Math.max(im.width,im.height));
    if(s===1&&f.size<1200000)return res(f);
    try{var c=document.createElement('canvas');
      c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      c.toBlob(function(b){res(b&&b.size<f.size?b:f);},'image/jpeg',.88);
    }catch(e){res(f);}};
  im.onerror=function(){URL.revokeObjectURL(src);res(f);};
  im.src=src;});}
send.addEventListener('click',function(){
  if(!chosen)return;
  send.disabled=true;msg.textContent='Sending…';
  shrink(chosen).then(function(f){
    var r=new FileReader();
    r.onload=function(){
      fetch('https://garage.co.nz/api/tribute',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({slug:SLUG,image:r.result,
          caption:document.getElementById('tr-cap').value,
          who:document.getElementById('tr-who').value})})
        .then(function(x){return x.json();})
        .then(function(d){
          if(d&&d.ok){msg.textContent='Thank you. Refresh to see it on the wall.';
            setTimeout(function(){close();location.reload();},1800);}
          else{msg.textContent=(d&&d.error)||'That did not send, sorry.';send.disabled=false;}})
        .catch(function(){msg.textContent='That did not send, sorry.';send.disabled=false;});
    };
    r.onerror=function(){msg.textContent='Could not read that file.';send.disabled=false;};
    r.readAsDataURL(f);
  });
});
})();</script>`;
}
