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
