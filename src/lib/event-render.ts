// THE EVENT — a campaign page that lives at a path on a business's own site.
//
// raglanphysio.garage.co.nz/spring. Not a separate site: it borrows the
// parent's nav, colours and type, so every share carries their name and every
// visitor is one click from the real page.
//
// The proposition is deliberately not "buy this". It is "this happens if
// enough people want it" — a workshop, a supper club, a group rate on a whole
// street's worth of work. Nobody is asked for money, only for whether it
// should exist. That makes it worth passing on to a mate, which is the only
// reason any of this works: it does not run unless people recruit.
//
// For the business the output is an email list and proof of demand before they
// give up a Saturday. Emails are never rendered publicly — only first names,
// which are the social proof. The full list is behind the site's edit token.

import type { SiteConfig } from './site-render';

export interface EventCampaign {
  path: string;                  // "spring" — lives at /spring
  title: string;
  blurb?: string;
  detail?: string;
  target: number;
  when?: string;                 // when the thing itself happens: "Saturday 4 October, 10am"
  closesAt?: string;             // YYYY-MM-DD, so the bar can count down to it
  closes?: string;               // the same thing in words, for the page
  cta?: string;
}

export interface EventState {
  count: number;
  names: string[];
  latest?: string;               // ISO timestamp of the most recent sign-up
}

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

export const EVENT_CSS = `
.ral{padding:3.5rem 0 1rem}
.ral-wrap{max-width:44rem;margin:0 auto;padding:0 1.2rem}
.ral-eyebrow{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;
font-weight:700;color:var(--primary);margin-bottom:.9rem}
.ral h1{font-size:clamp(2rem,6vw,3.2rem);line-height:1.08;margin-bottom:0;text-align:left}
.ral-blurb{margin-top:1rem;font-size:1.08rem;line-height:1.65;color:var(--soft);max-width:34rem}
.ral-detail{margin-top:1.1rem;color:var(--soft);line-height:1.7;white-space:pre-wrap}

/* -- The count. Nobody is being sold to; they are being asked. -- */
.ral-box{margin-top:2rem;background:var(--card);border:1px solid var(--line);
border-radius:16px;padding:1.8rem 1.5rem}
.ral-count{display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap}
.ral-num{font-size:clamp(2.4rem,9vw,3.4rem);font-weight:800;line-height:.95;
color:var(--primary);letter-spacing:-.02em}
.ral-of{color:var(--soft);font-size:1rem}
.ral-bar{height:9px;background:var(--line);border-radius:99px;margin:1.1rem 0 .9rem;
overflow:hidden}
.ral-bar i{display:block;height:100%;background:var(--primary);border-radius:99px;
transition:width .8s cubic-bezier(.16,1,.3,1)}
.ral-state{font-size:.94rem;color:var(--soft);line-height:1.6}
.ral-state b{color:var(--ink)}
.ral-closes{margin-top:.5rem;font-size:.85rem;color:var(--soft)}

.ral-on{background:var(--primary);border-color:var(--primary);color:#fff}
.ral-on .ral-num,.ral-on .ral-of,.ral-on .ral-state,.ral-on .ral-state b,
.ral-on .ral-closes{color:#fff}
.ral-on .ral-bar{background:rgba(255,255,255,.3)}
.ral-on .ral-bar i{background:#fff}
.ral-badge{display:inline-block;background:#fff;color:var(--primary);border-radius:999px;
padding:.3rem .9rem;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;
font-weight:800;margin-bottom:.9rem}

/* -- Joining in -- */
.ral-form{margin-top:1.4rem;display:grid;gap:.6rem}
@media(min-width:560px){.ral-form{grid-template-columns:1fr 1fr;align-items:start}
.ral-form .ral-go,.ral-form .ral-note{grid-column:1/-1}}
.ral-form input{width:100%;background:var(--page);border:1px solid var(--line);
border-radius:10px;padding:.8rem .9rem;font-size:.97rem;color:var(--ink);
font-family:inherit}
.ral-form input::placeholder{color:var(--soft);opacity:.8}
.ral-go{background:var(--ink);color:var(--page);border:0;border-radius:999px;padding:.85rem;
font-size:.98rem;font-weight:600;cursor:pointer;font-family:inherit}
.ral-go[disabled]{opacity:.45;cursor:default}
.ral-on .ral-go{background:#fff;color:var(--primary)}
.ral-note{font-size:.8rem;color:var(--soft);line-height:1.5;margin:0}
.ral-on .ral-note{color:rgba(255,255,255,.85)}
.ral-msg{font-size:.88rem;min-height:1.2em;margin:0}

/* -- Who is in. First names only, never an email. -- */
.ral-who{margin-top:1.6rem}
.ral-who h2{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--soft);
font-weight:700;margin-bottom:.7rem;text-align:left}
.ral-chips{display:flex;flex-wrap:wrap;gap:.4rem}
.ral-chip{background:var(--card);border:1px solid var(--line);border-radius:999px;
padding:.28rem .75rem;font-size:.84rem;color:var(--soft)}

/* -- Passing it on -- */
.ral-pass{margin-top:2rem;border-top:1px solid var(--line);padding-top:1.8rem}
.ral-pass h2{font-size:1.25rem;margin-bottom:.4rem;text-align:left}
.ral-pass p{color:var(--soft);font-size:.94rem;margin-bottom:1rem}
.ral-link{display:flex;gap:.5rem;max-width:28rem}
.ral-link input{flex:1;min-width:0;background:var(--card);border:1px solid var(--line);
border-radius:10px;padding:.7rem .85rem;font-size:.88rem;color:var(--ink);font-family:inherit}
.ral-copy{background:var(--ink);color:var(--page);border:0;border-radius:10px;
padding:.7rem 1.05rem;font-size:.88rem;font-weight:600;cursor:pointer;font-family:inherit;
white-space:nowrap}
.ral-copy.done{background:var(--primary);color:#fff}
.ral-share{margin-top:.7rem;background:none;border:1px solid var(--line);border-radius:999px;
padding:.65rem 1.3rem;font-size:.9rem;font-weight:600;cursor:pointer;color:var(--ink);
font-family:inherit}

/* -- What the owner sees, with their key on the URL -- */
.ral-owner{margin-top:2rem;border:1px solid var(--line);border-radius:14px;
padding:1.3rem;background:var(--card)}
.ral-owner h2{font-size:1rem;margin-bottom:.6rem;text-align:left}
.ral-owner p{font-size:.86rem;color:var(--soft);margin-bottom:.8rem}
.ral-list{width:100%;min-height:9rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
font-size:.8rem;background:var(--page);border:1px solid var(--line);border-radius:10px;
padding:.8rem;color:var(--ink);resize:vertical;line-height:1.6}
.ral-hide{display:none}
@media(prefers-reduced-motion:reduce){.ral-bar i{transition:none}}
`;

/**
 * The campaign page. Everything about it is inherited from the parent site —
 * nav, colours, type — so it reads as part of their business rather than as a
 * landing page somebody bolted on.
 */
export function renderEventBody(
  site: SiteConfig,
  slug: string,
  campaign: EventCampaign,
  state: EventState,
  nav: string,
  foot: string
): string {
  const business = site.name || slug;
  const count = state.count;
  const target = Math.max(1, Math.min(500, Math.round(Number(campaign.target)) || 10));
  const togo = Math.max(0, target - count);
  const pct = Math.min(100, Math.round((count / target) * 100));
  const on = count >= target;
  const url = `https://${slug}.garage.co.nz/${String(campaign.path).replace(/^\/+/, '')}`;

  const chips = [...new Set(state.names.filter(Boolean))]
    .slice(0, 40)
    .map((who) => `<span class="ral-chip">${esc(who)}</span>`)
    .join('');

  return `${nav}
<section class="ral"><div class="ral-wrap">
  <p class="ral-eyebrow">${esc(business)}</p>
  <h1>${esc(campaign.title)}</h1>
  ${campaign.blurb ? `<p class="ral-blurb">${esc(campaign.blurb)}</p>` : ''}
  ${campaign.detail ? `<p class="ral-detail">${esc(campaign.detail)}</p>` : ''}

  <div class="ral-box${on ? ' ral-on' : ''}" id="ral-box">
    ${on ? '<span class="ral-badge">It is on</span>' : ''}
    <div class="ral-count">
      <span class="ral-num" id="ral-num">${count}</span>
      <span class="ral-of">of ${target} needed</span>
    </div>
    <div class="ral-bar"><i id="ral-fill" style="width:${pct}%"></i></div>
    <p class="ral-state" id="ral-state">${
      on
        ? `Enough people are in, so it is going ahead. <b>Still open</b> if you want on the list.`
        : togo === 1
          ? `<b>One more person</b> and it goes ahead.`
          : `<b>${togo} more</b> and it goes ahead. Nothing to pay — this is just whether it happens.`
    }</p>
    ${campaign.closes ? `<p class="ral-closes">${esc(campaign.closes)}</p>` : ''}

    <div class="ral-form" id="ral-form">
      <input type="text" id="ral-name" maxlength="40" placeholder="Your name" autocomplete="given-name" />
      <input type="email" id="ral-email" maxlength="120" placeholder="Email" autocomplete="email" />
      <button type="button" class="ral-go" id="ral-go" disabled>${esc(campaign.cta || 'Count me in')}</button>
      <p class="ral-note">${esc(business)} will only use this to tell you what happens with
        this. Your email is never shown on this page, and nobody else gets it.</p>
      <p class="ral-msg" id="ral-msg"></p>
    </div>
  </div>

  ${chips ? `<section class="ral-who"><h2>Already in</h2><div class="ral-chips">${chips}</div></section>` : ''}

  <section class="ral-pass">
    <h2>${on ? 'Know somebody who would want in?' : `It needs ${togo} more`}</h2>
    <p>${
      on
        ? 'Send it on — the more the better now it is running.'
        : 'Send it to a couple of people. It only happens if enough hands go up.'
    }</p>
    <div class="ral-link">
      <input type="text" id="ral-url" value="${esc(url)}" readonly aria-label="Link to this page" />
      <button type="button" class="ral-copy" id="ral-copy">Copy link</button>
    </div>
    <button type="button" class="ral-share" id="ral-share">Share it</button>
  </section>

  <section class="ral-owner ral-hide" id="ral-owner">
    <h2>Your list</h2>
    <p>Only you can see this. Copy it straight into your mail app or a spreadsheet.</p>
    <textarea class="ral-list" id="ral-rows" readonly></textarea>
    <button type="button" class="ral-copy" id="ral-copy-list">Copy the list</button>
  </section>
</div></section>
${foot}

<script>(function(){
var SLUG=${JSON.stringify(slug)};
var PATH=${JSON.stringify(String(campaign.path).replace(/^\/+/, ''))};
var URLS=${JSON.stringify(url)};
var WHAT=${JSON.stringify(String(campaign.title))};

function copyFrom(el,btn){
  var was=btn.textContent;
  try{el.select();el.setSelectionRange(0,99999);}catch(e){}
  var done=function(){btn.textContent='Copied';btn.classList.add('done');
    setTimeout(function(){btn.textContent=was;btn.classList.remove('done');},1600);};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(el.value).then(done,function(){
      try{document.execCommand('copy');done();}catch(e){}});
  }else{try{document.execCommand('copy');done();}catch(e){}}
}
var copy=document.getElementById('ral-copy'),urlBox=document.getElementById('ral-url');
copy.addEventListener('click',function(){copyFrom(urlBox,copy);});
document.getElementById('ral-share').addEventListener('click',function(){
  var text='They only run this if enough people are keen — '+WHAT+'. Put your hand up.';
  if(navigator.share){navigator.share({title:WHAT,text:text,url:URLS}).catch(function(){});}
  else{copyFrom(urlBox,copy);}
});

var name=document.getElementById('ral-name'),email=document.getElementById('ral-email');
var go=document.getElementById('ral-go'),msg=document.getElementById('ral-msg');
function ok(){return name.value.trim().length>0&&/^[^@\\s]+@[^@\\s.]+\\.[^@\\s]+$/.test(email.value.trim());}
function ready(){go.disabled=!ok();}
name.addEventListener('input',ready);email.addEventListener('input',ready);
email.addEventListener('keydown',function(e){if(e.key==='Enter'&&ok())go.click();});
go.addEventListener('click',function(){
  if(go.disabled)return;
  go.disabled=true;msg.textContent='Adding you…';
  fetch('https://garage.co.nz/api/rally',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({slug:SLUG,path:PATH,name:name.value,email:email.value})})
    .then(function(x){return x.json();})
    .then(function(d){
      if(!d||!d.ok){msg.textContent=(d&&d.error)||'That did not go through, sorry.';
        go.disabled=false;return;}
      document.getElementById('ral-num').textContent=d.count;
      document.getElementById('ral-fill').style.width=
        Math.min(100,Math.round(d.count/d.target*100))+'%';
      document.getElementById('ral-form').innerHTML=
        '<p class="ral-note" style="font-size:.95rem">'+
        (d.on?'You are on the list, and it is going ahead.'
             :'You are in. '+(d.togo===1?'One more person and it happens.'
                                        :d.togo+' more and it happens.'))+
        ' Sending it on is what gets it there.</p>';
      document.getElementById('ral-state').innerHTML=d.on
        ?'Enough people are in, so it is going ahead.'
        :'<b>'+d.togo+' more</b> and it goes ahead.';
    })
    .catch(function(){msg.textContent='That did not go through, sorry.';go.disabled=false;});
});

// The owner arrives with the site's edit key on the URL. Emails never appear
// in the page for anybody else, so this is fetched rather than rendered.
var key=new URLSearchParams(location.search).get('k');
if(key){
  fetch('https://garage.co.nz/api/rally/list',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({slug:SLUG,path:PATH,key:key})})
    .then(function(x){return x.json();})
    .then(function(d){
      if(!d||!d.ok||!d.rows)return;
      var panel=document.getElementById('ral-owner'),rows=document.getElementById('ral-rows');
      rows.value=d.rows.map(function(r){return r.name+','+r.email;}).join('\\n')||'Nobody yet.';
      panel.classList.remove('ral-hide');
      var b=document.getElementById('ral-copy-list');
      b.addEventListener('click',function(){copyFrom(rows,b);});
    }).catch(function(){});
}
})();</script>`;
}

// ── The event as a widget ────────────────────────────────────────────────────
//
// The campaign page only works if somebody lands on it, and most people on a
// business's site never will. So the event also rides along on every page as a
// bar at the bottom of the screen.
//
// The count is the whole pitch and it does not need help. "8 more and it's on"
// is a better line than anything that could be written around it: a number,
// moving, that stops if nobody acts. So the bar is mostly that number — the
// progress fills the bar itself rather than sitting in a widget inside it, the
// figure is set large enough to read across a room, and when it lands the whole
// thing turns and says IT'S ON.
//
// It is deliberately at the bottom centre rather than an edge tab. The wheel
// sits on the right and the short notice list on the left; a third tab would be
// a row of tabs, and this one is a shout rather than a bookmark.

export const EVENT_BAR_CSS = `
/* The site's own colour, not a slab of black. A near-black bar reads as a
   cookie banner — something the site is doing to you — where the site's own
   accent reads as part of the page. */
.grl-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9987;
display:flex;align-items:center;gap:.8rem;cursor:pointer;border:0;text-align:left;
width:min(30rem,calc(100vw - 1.6rem));padding:.62rem .7rem .62rem .62rem;
background:var(--grl-a);color:var(--grl-ink);border-radius:999px;overflow:hidden;
font-family:var(--font-sans,system-ui,sans-serif);
box-shadow:0 2px 0 rgba(0,0,0,.06) inset,0 18px 44px -12px color-mix(in srgb,var(--grl-a) 55%,transparent),
0 0 0 1px color-mix(in srgb,var(--grl-ink) 12%,transparent);
animation:grlUp .5s cubic-bezier(.16,1,.3,1) .6s both}
@keyframes grlUp{from{opacity:0;transform:translateX(-50%) translateY(1.2rem)}
to{opacity:1;transform:translateX(-50%) translateY(0)}}
.grl-bar:hover{filter:brightness(1.05)}
.grl-bar>*{position:relative;z-index:1}

/* Who is already in. Initials do what a number cannot: they make it people. */
.grl-faces{display:flex;flex:none;align-items:center}
.grl-face{width:1.85rem;height:1.85rem;border-radius:50%;display:grid;place-items:center;
font-size:.66rem;font-weight:800;letter-spacing:.02em;margin-right:-.5rem;
background:color-mix(in srgb,var(--grl-ink) 88%,transparent);color:var(--grl-a);
box-shadow:0 0 0 2px var(--grl-a)}
.grl-face:last-child{margin-right:0}
.grl-face.more{background:color-mix(in srgb,var(--grl-ink) 16%,transparent);color:var(--grl-ink);
font-size:.6rem}

.grl-say{flex:1;min-width:0;line-height:1.25}
.grl-say strong{display:block;font-size:.88rem;font-weight:800;letter-spacing:-.012em;
white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.grl-say span{display:block;font-size:.7rem;font-weight:600;white-space:nowrap;
overflow:hidden;text-overflow:ellipsis;opacity:.72}

/* Free is the whole hook, so it is a badge rather than a line of small print.
   Every event here is free — there is no paid mode — so it is always true. */
.grl-free{flex:none;font-size:.6rem;font-weight:900;letter-spacing:.14em;
padding:.28rem .5rem;border-radius:5px;background:color-mix(in srgb,var(--grl-ink) 88%,transparent);
color:var(--grl-a)}

.grl-heart{flex:none;display:flex;align-items:center;gap:.28rem;border:0;cursor:pointer;
padding:.42rem .62rem;border-radius:999px;font:800 .74rem/1 var(--font-sans,system-ui,sans-serif);
background:color-mix(in srgb,var(--grl-ink) 12%,transparent);color:var(--grl-ink);
transition:transform .15s,background .15s}
.grl-heart:hover{background:color-mix(in srgb,var(--grl-ink) 20%,transparent)}
.grl-heart svg{width:.95rem;height:.95rem;fill:none;stroke:currentColor;stroke-width:2}
.grl-heart.mine svg{fill:currentColor;stroke:currentColor}
.grl-heart.pop{animation:grlPop .42s cubic-bezier(.2,1.6,.4,1)}
@keyframes grlPop{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}

.grl-go{flex:none;font-size:.7rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;
padding:.55rem .9rem;border-radius:999px;white-space:nowrap;
background:color-mix(in srgb,var(--grl-ink) 92%,transparent);color:var(--grl-a)}

.grl-bar.on{background:var(--grl-ink);color:var(--grl-a)}
.grl-bar.on .grl-free,.grl-bar.on .grl-go{background:var(--grl-a);color:var(--grl-ink)}
.grl-bar.on .grl-face{background:var(--grl-a);color:var(--grl-ink);box-shadow:0 0 0 2px var(--grl-ink)}
@media(prefers-reduced-motion:reduce){.grl-bar{animation:none}.grl-heart.pop{animation:none}}
@media(max-width:640px){
  .grl-bar{bottom:auto;top:10px;gap:.55rem;padding:.55rem .6rem}
  .grl-faces,.grl-free{display:none}
  .grl-say strong{font-size:.8rem}}

.grl-veil{position:fixed;inset:0;z-index:9993;background:rgba(4,5,8,.82);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.grl-veil.on{display:flex}
.grl-card{position:relative;width:min(27rem,100%);max-height:96vh;overflow:hidden;
background:#fff;color:#14161c;border-radius:20px;padding:1.6rem 1.5rem 1.3rem;
font-family:var(--font-sans,system-ui,sans-serif);
box-shadow:0 40px 90px -24px rgba(0,0,0,.7)}
.grl-x{position:absolute;right:.8rem;top:.8rem;width:1.9rem;height:1.9rem;border-radius:50%;
border:1px solid rgba(0,0,0,.12);background:transparent;color:#6b7280;font-size:1rem;
cursor:pointer;line-height:1}
.grl-x:hover{color:#14161c}
.grl-tags{display:flex;gap:.4rem;margin-bottom:.7rem}
.grl-tag{font-size:.6rem;font-weight:900;letter-spacing:.14em;padding:.28rem .5rem;
border-radius:5px;background:var(--grl-a);color:var(--grl-ink)}
.grl-tag.plain{background:rgba(0,0,0,.06);color:#4b5563}
.grl-card h2{font-size:1.35rem;font-weight:700;letter-spacing:-.02em;margin:0 0 .3rem;
color:#14161c;line-height:1.2}
.grl-when{font-size:.84rem;color:#14161c;margin:0 0 .55rem;font-weight:700}
.grl-blurb{color:#5b616e;font-size:.87rem;margin:0;line-height:1.55}
.grl-track{margin:1rem 0 .45rem;height:7px;border-radius:999px;background:rgba(0,0,0,.08);
overflow:hidden}
.grl-track i{display:block;height:100%;width:0;background:var(--grl-a);border-radius:999px;
transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
.grl-state{font-size:.83rem;color:#5b616e;margin:0}
.grl-state b{color:#14161c}
.grl-form{display:grid;gap:.5rem;margin-top:1rem}
.grl-form input{width:100%;font:inherit;font-size:.92rem;padding:.72rem .9rem;border-radius:8px;
border:1px solid rgba(0,0,0,.16);background:#fff;color:#14161c}
.grl-form input:focus{outline:none;border-color:var(--grl-a)}
.grl-err{margin:.1rem 0 0;font-size:.78rem;color:#b91c1c;min-height:1.05em}
.grl-join{width:100%;border:0;border-radius:8px;cursor:pointer;background:var(--grl-a);
color:var(--grl-ink);font:900 .84rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.09em;
text-transform:uppercase;padding:.92rem 1rem}
.grl-join:disabled{opacity:.5;cursor:default}
.grl-small{margin:.75rem 0 0;font-size:.7rem;color:#6b7280;line-height:1.6}
.grl-done{display:none;text-align:center}
.grl-done.on{display:block}
.grl-done h3{font-size:1.3rem;font-weight:700;margin:.3rem 0 .3rem}
.grl-share{display:grid;gap:.45rem;margin-top:1rem}
.grl-share button{border:1px solid rgba(0,0,0,.16);background:#fff;border-radius:8px;
cursor:pointer;font:800 .8rem/1 var(--font-sans,system-ui,sans-serif);padding:.8rem 1rem;
color:#14161c}
.grl-share button.hot{background:var(--grl-a);color:var(--grl-ink);border-color:transparent}
`;

/** Days between now and a YYYY-MM-DD, in New Zealand rather than UTC. */
function daysLeft(closesAt?: string): number | null {
  if (!closesAt || !/^\d{4}-\d{2}-\d{2}$/.test(closesAt)) return null;
  const end = Date.parse(closesAt + 'T23:59:59+12:00');
  if (!Number.isFinite(end)) return null;
  return Math.ceil((end - Date.now()) / 86400000);
}

/** The bar and its panel. Empty when there is no event on this site. */
export function renderEventBar(site: SiteConfig, slug: string): string {
  // The first campaign, because a bar at the bottom of the screen can only
  // shout about one thing. Everything else is still on its own page.
  const event = ((site as any).campaigns || [])[0] as EventCampaign | undefined;
  const path = String(event?.path || '').replace(/^\/+/, '').toLowerCase();
  const target = Math.max(1, Math.min(500, Math.round(Number(event?.target)) || 0));
  if (!event?.title || !path || !target) return '';

  const accent = site.palette?.primary || '#2563eb';
  const who = esc(site.name || slug);
  const left = daysLeft(event.closesAt);

  return `
<button class="grl-bar" id="grl-bar" type="button" hidden
        style="--grl-a:${esc(accent)};--grl-ink:#fff">
  <span class="grl-faces" id="grl-faces"></span>
  <span class="grl-free">FREE</span>
  <span class="grl-say">
    <strong id="grl-hook">${esc(event.title)}</strong>
    <span id="grl-sub">Happens if enough people are in</span>
  </span>
  <span class="grl-heart" id="grl-heart" role="button" aria-label="Interested">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.6-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.4 12 20 12 20z"/></svg>
    <b id="grl-hearts">0</b>
  </span>
  <span class="grl-go" id="grl-cta">${esc(event.cta || "I'm in")}</span>
</button>

<div class="grl-veil" id="grl-veil" role="dialog" aria-modal="true"
     style="--grl-a:${esc(accent)};--grl-ink:#fff" aria-label="${esc(event.title)}">
  <div class="grl-card">
    <button class="grl-x" id="grl-x" type="button" aria-label="Close">&times;</button>
    <div id="grl-ask">
      <div class="grl-tags">
        <span class="grl-tag">FREE</span>
        ${left !== null && left >= 0
          ? `<span class="grl-tag plain" id="grl-left">${left === 0 ? 'Last day' : left + ' days left'}</span>`
          : ''}
      </div>
      <h2>${esc(event.title)}</h2>
      ${event.when ? `<p class="grl-when">${esc(event.when)}</p>` : ''}
      ${event.blurb ? `<p class="grl-blurb">${esc(event.blurb)}</p>` : ''}
      <div class="grl-track"><i id="grl-track-fill"></i></div>
      <p class="grl-state" id="grl-state"></p>
      <form class="grl-form" id="grl-form" novalidate>
        <input id="grl-name" maxlength="40" placeholder="Your name" autocomplete="given-name" />
        <input id="grl-email" type="email" maxlength="120" placeholder="Email" autocomplete="email" />
        <p class="grl-err" id="grl-err" role="alert"></p>
        <button class="grl-join" id="grl-join" type="submit">${esc(event.cta || "I'm in")}</button>
      </form>
      <p class="grl-small">Free, and nothing to pay at any point.
        <a href="/${esc(path)}" style="color:inherit">See the whole thing</a>.</p>
    </div>
    <div class="grl-done" id="grl-done">
      <h3>You are in</h3>
      <p class="grl-blurb" id="grl-done-sub"></p>
      <div class="grl-share">
        <button type="button" class="hot" id="grl-send">Send it to someone</button>
        <button type="button" id="grl-copy">Copy the link</button>
      </div>
    </div>
  </div>
</div>

<script>
(function () {
  var SLUG = ${JSON.stringify(slug)}, PATH = ${JSON.stringify(path)}, TARGET = ${target};
  var TITLE = ${JSON.stringify(String(event.title))}, WHO = ${JSON.stringify(String(site.name || slug))};
  var LEFT = ${left === null ? 'null' : left};
  var $ = function (id) { return document.getElementById(id); };
  var bar = $('grl-bar'), veil = $('grl-veil'), form = $('grl-form');
  if (!bar || !veil || !form) return;
  var URLS = 'https://' + SLUG + '.garage.co.nz/' + PATH;
  var HEART_KEY = 'garage-heart:' + SLUG + ':' + PATH;

  function initials(name) {
    var bits = String(name).trim().split(/\\s+/);
    return ((bits[0] || '?')[0] + (bits[1] ? bits[1][0] : '')).toUpperCase();
  }

  function paint(d) {
    var count = d.count, togo = Math.max(0, TARGET - count);
    var pct = Math.min(100, Math.round((count / TARGET) * 100));
    $('grl-track-fill').style.width = pct + '%';
    bar.classList.toggle('on', togo === 0);

    // Two scarcities at once: how many more, and how long. One of them is
    // always moving, which is what gets somebody to act today.
    var more = togo === 0 ? 'It is going ahead'
      : togo === 1 ? 'One more and it runs' : togo + ' more and it runs';
    var clock = LEFT === null || LEFT < 0 ? '' : LEFT === 0 ? ' · last day' : ' · ' + LEFT + ' days left';
    $('grl-hook').textContent = more;
    $('grl-sub').textContent = TITLE + clock;
    if (togo === 0) $('grl-cta').textContent = 'It is on';

    $('grl-state').innerHTML = togo === 0
      ? '<b>Enough people are in</b>, so it is going ahead. Still open if you want on the list.'
      : '<b>' + (togo === 1 ? 'One more person' : togo + ' more') + '</b> and it goes ahead.'
        + (d.hearts ? ' ' + d.hearts + ' more like the look of it.' : '');

    var faces = $('grl-faces');
    faces.innerHTML = '';
    (d.names || []).slice(0, 3).forEach(function (n) {
      var el = document.createElement('span');
      el.className = 'grl-face'; el.textContent = initials(n);
      faces.appendChild(el);
    });
    if (count > (d.names || []).length) {
      var rest = document.createElement('span');
      rest.className = 'grl-face more'; rest.textContent = '+' + (count - (d.names || []).length);
      faces.appendChild(rest);
    }
    $('grl-hearts').textContent = d.hearts || 0;
    bar.hidden = false;
  }

  fetch('https://garage.co.nz/api/rally?slug=' + encodeURIComponent(SLUG) + '&path=' + encodeURIComponent(PATH))
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.ok) paint(d); })
    .catch(function () { /* no bar rather than a wrong one */ });

  try { if (localStorage.getItem(HEART_KEY)) $('grl-heart').classList.add('mine'); } catch (e) {}

  // The heart is the cheap half of the ask: one tap, nothing to fill in, and
  // it never counts towards the target.
  $('grl-heart').addEventListener('click', function (e) {
    e.stopPropagation();
    var h = $('grl-heart');
    h.classList.add('pop');
    setTimeout(function () { h.classList.remove('pop'); }, 450);
    fetch('https://garage.co.nz/api/heart', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, path: PATH }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) return;
        $('grl-hearts').textContent = d.hearts;
        h.classList.toggle('mine', d.mine);
        try { d.mine ? localStorage.setItem(HEART_KEY, '1') : localStorage.removeItem(HEART_KEY); } catch (e) {}
      })
      .catch(function () {});
  });

  bar.addEventListener('click', function () { veil.classList.add('on'); });
  function close() { veil.classList.remove('on'); }
  $('grl-x').addEventListener('click', close);
  veil.addEventListener('click', function (e) { if (e.target === veil) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function share() {
    var text = TITLE + ' at ' + WHO + ' — it only runs if enough of us are in.';
    if (navigator.share) { navigator.share({ title: TITLE, text: text, url: URLS }).catch(function () {}); }
    else copy();
  }
  function copy() {
    var btn = $('grl-copy'), was = btn.textContent;
    var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = was; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(URLS).then(done).catch(function () {});
    else done();
  }
  $('grl-send').addEventListener('click', share);
  $('grl-copy').addEventListener('click', copy);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('grl-err'); err.textContent = '';
    var name = $('grl-name').value.trim();
    var email = $('grl-email').value.trim();
    if (!name) { err.textContent = 'Put your name in.'; return; }
    if (!/^[^@\\s]+@[^@\\s.]+\\.[^@\\s]+$/.test(email)) { err.textContent = 'That email looks wrong.'; return; }
    var go = $('grl-join');
    go.disabled = true; go.textContent = 'Counting you in';
    fetch('https://garage.co.nz/api/rally', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, path: PATH, name: name, email: email }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.error) || 'That did not go through');
        paint({ count: d.count, hearts: Number($('grl-hearts').textContent) || 0, names: [name] });
        $('grl-ask').style.display = 'none';
        // The moment somebody has just said yes is the only moment they will
        // send it on, so the panel turns into the ask rather than a receipt.
        $('grl-done-sub').textContent = d.on
          ? 'It is going ahead. You will hear the details by email.'
          : (d.togo === 1 ? 'One more person and it runs.' : d.togo + ' more and it runs.')
            + ' Who else would want in?';
        $('grl-done').classList.add('on');
      })
      .catch(function (e) {
        err.textContent = e.message || 'That did not go through.';
        go.disabled = false; go.textContent = ${JSON.stringify(event.cta || "I'm in")};
      });
  });
})();
</script>`;
}
