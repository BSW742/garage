// THE RALLY — a campaign page that lives at a path on a business's own site.
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

export interface RallyCampaign {
  path: string;                  // "spring" — lives at /spring
  title: string;
  blurb?: string;
  detail?: string;
  target: number;
  when?: string;                 // when the thing itself happens: "Saturday 4 October, 10am"
  closes?: string;               // free text: "Closes 12 September"
  cta?: string;
}

export interface RallyState {
  count: number;
  names: string[];
  latest?: string;               // ISO timestamp of the most recent sign-up
}

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

export const RALLY_CSS = `
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
export function renderRallyBody(
  site: SiteConfig,
  slug: string,
  campaign: RallyCampaign,
  state: RallyState,
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

// ── The rally as a widget ────────────────────────────────────────────────────
//
// The campaign page only works if somebody lands on it, and most people on a
// business's site never will. So the rally also rides along on every page as a
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

export const RALLY_TAB_CSS = `
.grl-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(0);
z-index:9987;display:flex;align-items:center;gap:.85rem;cursor:pointer;border:0;
width:min(26rem,calc(100vw - 1.6rem));padding:.72rem .95rem .72rem .78rem;
background:#0e111a;color:#eef1f7;border-radius:999px;overflow:hidden;
font-family:var(--font-sans,system-ui,sans-serif);text-align:left;
box-shadow:0 0 0 1px rgba(255,255,255,.1),0 18px 44px -14px rgba(0,0,0,.85);
animation:grlUp .5s cubic-bezier(.16,1,.3,1) .6s both}
@keyframes grlUp{from{opacity:0;transform:translateX(-50%) translateY(1.2rem)}
to{opacity:1;transform:translateX(-50%) translateY(0)}}
.grl-bar:hover{box-shadow:0 0 0 1px rgba(255,255,255,.2),0 22px 52px -14px rgba(0,0,0,.9)}

/* The progress is the background, not a bar inside it. */
.grl-fill{position:absolute;inset:0;width:0;background:linear-gradient(90deg,
color-mix(in srgb,var(--grl-a) 55%,transparent),color-mix(in srgb,var(--grl-a) 22%,transparent));
transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
.grl-bar>*{position:relative;z-index:1}

/* A bubble that says how many are going, not a fraction. "12 going" is a
   room filling up; "12/20" is a progress bar for a spreadsheet. The target is
   still there — it is the line beside it, "8 more and it is on" — so nothing
   is lost by making the warm half the loud one. */
.grl-num{display:flex;align-items:baseline;gap:.28rem;flex:none;
padding:.34rem .7rem;border-radius:999px;background:rgba(0,0,0,.35);
box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.grl-num b{font-size:1.2rem;font-weight:800;letter-spacing:-.02em;line-height:1}
.grl-num i{font-style:normal;font-size:.66rem;font-weight:700;letter-spacing:.1em;
text-transform:uppercase;color:#9aa3b5}

.grl-say{flex:1;min-width:0;line-height:1.25}
.grl-say strong{display:block;font-size:.86rem;font-weight:700;letter-spacing:-.01em;
white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.grl-say span{display:block;font-size:.7rem;color:#9aa3b5;white-space:nowrap;
overflow:hidden;text-overflow:ellipsis}
.grl-go{flex:none;font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
padding:.45rem .8rem;border-radius:999px;background:var(--grl-a);color:#08131a;white-space:nowrap}

/* Nearly there: the number breathes. Not a klaxon, just enough to notice. */
.grl-bar.close .grl-num{animation:grlPulse 2.4s ease-in-out infinite}
@keyframes grlPulse{0%,100%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 0 0 0 transparent}
50%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.3),0 0 0 .5rem color-mix(in srgb,var(--grl-a) 0%,transparent)}}

/* It landed. */
.grl-bar.on{background:var(--grl-a);color:#08131a;
box-shadow:0 0 0 1px color-mix(in srgb,var(--grl-a) 60%,#fff),0 18px 50px -12px color-mix(in srgb,var(--grl-a) 55%,transparent)}
.grl-bar.on .grl-fill{display:none}
.grl-bar.on .grl-num{background:rgba(0,0,0,.16);box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
.grl-bar.on .grl-num i,.grl-bar.on .grl-say span{color:rgba(8,19,26,.7)}
.grl-bar.on .grl-go{background:#08131a;color:var(--grl-a)}
@media(prefers-reduced-motion:reduce){
  .grl-bar{animation:none}.grl-fill{transition:none}.grl-bar.close .grl-num{animation:none}}
@media(max-width:520px){.grl-bar{bottom:auto;top:12px}}

.grl-veil{position:fixed;inset:0;z-index:9993;background:rgba(4,5,8,.82);
backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:.75rem}
.grl-veil.on{display:flex}
.grl-card{position:relative;width:min(27rem,100%);max-height:96vh;overflow:hidden;
background:#0e111a;color:#eef1f7;border:1px solid rgba(255,255,255,.12);border-radius:18px;
padding:1.7rem 1.5rem 1.4rem;font-family:var(--font-sans,system-ui,sans-serif)}
.grl-x{position:absolute;right:.85rem;top:.85rem;width:1.9rem;height:1.9rem;border-radius:50%;
border:1px solid rgba(255,255,255,.12);background:transparent;color:#7d8598;font-size:1rem;
cursor:pointer;line-height:1}
.grl-x:hover{color:#fff}
.grl-eyebrow{font-size:.62rem;letter-spacing:.26em;text-transform:uppercase;color:var(--grl-a);
margin:0 0 .5rem;font-weight:700}
.grl-card h2{font-size:1.32rem;font-weight:600;letter-spacing:-.018em;margin:0 0 .4rem;color:#fff}
.grl-when{font-size:.8rem;color:#eef1f7;margin:0 0 .6rem;font-weight:600}
.grl-blurb{color:#7d8598;font-size:.86rem;margin:0;line-height:1.55}
.grl-track{margin:1.1rem 0 .5rem;height:6px;border-radius:999px;background:rgba(255,255,255,.1);
overflow:hidden}
.grl-track i{display:block;height:100%;width:0;background:var(--grl-a);border-radius:999px;
transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
.grl-state{font-size:.82rem;color:#7d8598;margin:0 0 .2rem}
.grl-state b{color:#fff}
.grl-form{display:grid;gap:.55rem;margin-top:1rem}
.grl-form input{width:100%;font:inherit;font-size:.92rem;padding:.72rem .9rem;border-radius:6px;
border:1px solid rgba(255,255,255,.12);background:#0a0c11;color:#fff}
.grl-form input::placeholder{color:#5f6675}
.grl-form input:focus{outline:none;border-color:var(--grl-a)}
.grl-err{margin:.1rem 0 0;font-size:.78rem;color:#e88;min-height:1.05em}
.grl-join{width:100%;border:0;border-radius:6px;cursor:pointer;background:var(--grl-a);
color:#08131a;font:700 .86rem/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.08em;
text-transform:uppercase;padding:.9rem 1rem}
.grl-join:disabled{opacity:.5;cursor:default}
.grl-small{margin:.8rem 0 0;font-size:.68rem;color:#5f6675;line-height:1.6}
.grl-done{display:none;text-align:center}
.grl-done.on{display:block}
.grl-done h3{font-size:1.25rem;font-weight:600;color:#fff;margin:.4rem 0 .3rem}
`;

/** The bar and its panel. Empty when there is no rally on this site. */
export function renderRallyTab(site: SiteConfig, slug: string): string {
  // The first campaign, because a bar at the bottom of the screen can only
  // shout about one thing. Everything else is still on its own page.
  const rally = ((site as any).campaigns || [])[0] as RallyCampaign | undefined;
  const path = String(rally?.path || '').replace(/^\/+/, '').toLowerCase();
  const target = Math.max(1, Math.min(500, Math.round(Number(rally?.target)) || 0));
  if (!rally?.title || !path || !target) return '';

  const accent = site.palette?.primary || '#3ddc97';
  const who = esc(site.name || slug);

  return `
<button class="grl-bar" id="grl-bar" type="button" style="--grl-a:${esc(accent)}" hidden>
  <span class="grl-fill" id="grl-fill"></span>
  <span class="grl-num"><b id="grl-count">0</b><i>going</i></span>
  <span class="grl-say">
    <strong id="grl-hook">Happens if enough people are in</strong>
    <span id="grl-sub">${esc(rally.title)}</span>
  </span>
  <span class="grl-go" id="grl-cta">${esc(rally.cta || 'Count me in')}</span>
</button>

<div class="grl-veil" id="grl-veil" role="dialog" aria-modal="true" style="--grl-a:${esc(accent)}"
     aria-label="${esc(rally.title)}">
  <div class="grl-card">
    <button class="grl-x" id="grl-x" type="button" aria-label="Close">&times;</button>
    <div id="grl-ask">
      <p class="grl-eyebrow">${who}</p>
      <h2>${esc(rally.title)}</h2>
      ${rally.when ? `<p class="grl-when">${esc(rally.when)}</p>` : ''}
      ${rally.blurb ? `<p class="grl-blurb">${esc(rally.blurb)}</p>` : ''}
      <div class="grl-track"><i id="grl-track-fill"></i></div>
      <p class="grl-state" id="grl-state"></p>
      <form class="grl-form" id="grl-form" novalidate>
        <input id="grl-name" maxlength="40" placeholder="Your name" autocomplete="given-name" />
        <input id="grl-email" type="email" maxlength="120" placeholder="Email" autocomplete="email" />
        <p class="grl-err" id="grl-err" role="alert"></p>
        <button class="grl-join" id="grl-join" type="submit">${esc(rally.cta || 'Count me in')}</button>
      </form>
      <p class="grl-small">Nothing to pay &mdash; this is only whether it happens.
        ${rally.closes ? esc(rally.closes) + '. ' : ''}<a href="/${esc(path)}"
        style="color:inherit;text-decoration:underline">See the whole thing</a>.</p>
    </div>
    <div class="grl-done" id="grl-done">
      <p class="grl-eyebrow">${who}</p>
      <h3>You are in</h3>
      <p class="grl-blurb" id="grl-done-sub"></p>
    </div>
  </div>
</div>

<script>
(function () {
  var SLUG = ${JSON.stringify(slug)}, PATH = ${JSON.stringify(path)}, TARGET = ${target};
  var $ = function (id) { return document.getElementById(id); };
  var bar = $('grl-bar'), veil = $('grl-veil'), form = $('grl-form');
  if (!bar || !veil || !form) return;

  function paint(count) {
    var togo = Math.max(0, TARGET - count);
    var pct = Math.min(100, Math.round((count / TARGET) * 100));
    $('grl-count').textContent = count;
    $('grl-fill').style.width = pct + '%';
    $('grl-track-fill').style.width = pct + '%';
    bar.classList.toggle('on', togo === 0);
    bar.classList.toggle('close', togo > 0 && togo <= 3);
    $('grl-hook').textContent = togo === 0
      ? 'It is going ahead'
      : togo === 1 ? 'One more and it is on' : togo + ' more and it is on';
    if (togo === 0) $('grl-cta').textContent = 'It is on';
    $('grl-state').innerHTML = togo === 0
      ? '<b>Enough people are in</b>, so it is going ahead. Still open if you want on the list.'
      : togo === 1
        ? '<b>One more person</b> and it goes ahead.'
        : '<b>' + togo + ' more</b> and it goes ahead.';
    // Held back until the real number is in, so nobody ever sees it say nought.
    bar.hidden = false;
  }

  fetch('https://garage.co.nz/api/rally?slug=' + encodeURIComponent(SLUG) + '&path=' + encodeURIComponent(PATH))
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.ok) paint(d.count); })
    .catch(function () { /* no bar rather than a wrong one */ });

  bar.addEventListener('click', function () { veil.classList.add('on'); });
  function close() { veil.classList.remove('on'); }
  $('grl-x').addEventListener('click', close);
  veil.addEventListener('click', function (e) { if (e.target === veil) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

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
        paint(d.count);
        $('grl-ask').style.display = 'none';
        $('grl-done-sub').textContent = d.on
          ? 'It is going ahead. You will hear the details by email.'
          : (d.togo === 1 ? 'One more person and it is on.' : d.togo + ' more and it is on.')
            + ' Send it to somebody who would want in.';
        $('grl-done').classList.add('on');
      })
      .catch(function (e) {
        err.textContent = e.message || 'That did not go through.';
        go.disabled = false; go.textContent = ${JSON.stringify(rally.cta || 'Count me in')};
      });
  });
})();
</script>`;
}
