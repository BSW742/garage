// FOOD DIARY TEMPLATE (style: "diet")
//
// Accountability by audience. Every day you post a photo or a clip of what you
// actually ate and mark it good or bad, and the page keeps the tally in public.
//
// It reads as a diary, not a scoreboard: one row per day, newest at the top,
// the date on the left and what was eaten beside it. Somebody catching up
// should be able to run their eye down the page and see the week.
//
// Good and bad are marked, but quietly — a small tag on the row and a colour
// in the thirty-day strip. Days nobody posted stay in the list as a faint
// line, which is all the shame the page needs to carry.
//
// Verdicts are self-declared. Anyone can lie to a website; nobody lies to a
// website their friends are reading.

import type { SiteConfig } from './site-render';

export const DIET_FONT_QUERY = '&family=Anton';

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

export const DIET_CSS = `
.dt{--paper:#faf9f5;--ink:#1a1915;--dim:#7d786e;--line:#e4e0d6;--card:#fff;
--good:#1f8a4c;--bad:#cf3626;
--display:'Anton',Impact,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.dt{background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.55}
html:has(body.dt),body.dt{overflow-x:clip}
.dt h1,.dt h2{font-family:var(--display);font-weight:400;text-transform:uppercase;
line-height:1;text-align:left;margin-bottom:0}
.dt ::selection{background:var(--ink);color:var(--paper)}
.dt-wrap{max-width:46rem;margin:0 auto;padding:0 1.1rem}

/* -- Masthead. One line of it. -- */
.dt-head{padding:2.2rem 0 1rem;display:flex;flex-wrap:wrap;align-items:baseline;gap:.5rem 1rem}
.dt-head h1{font-size:clamp(1.5rem,4.5vw,2.1rem)}
.dt-sub{color:var(--dim);font-size:.88rem}
.dt-sub b{font-weight:600;color:var(--ink)}
.dt-sub .g{color:var(--good)}
.dt-sub .b{color:var(--bad)}
.dt-lede{color:var(--dim);font-size:.92rem;padding-bottom:1rem;max-width:34rem}

/* -- The run, kept small. A glance, not a billboard. -- */
.dt-strip{display:flex;gap:2px;flex-wrap:nowrap;padding-bottom:1.4rem}
.dt-day{flex:1 1 0;min-width:0;height:1.1rem;background:var(--line);border-radius:2px}
.dt-day.good{background:var(--good)}
.dt-day.bad{background:var(--bad)}
.dt-day.today{box-shadow:0 0 0 1.5px var(--ink)}

/* -- The diary. One row a day, newest first. -- */
.dt-days{border-top:1px solid var(--line)}
.dt-row{display:grid;grid-template-columns:1fr;gap:.55rem;padding:1rem 0;
border-bottom:1px solid var(--line)}
@media(min-width:640px){.dt-row{grid-template-columns:7.5rem 1fr;gap:1.2rem;align-items:start}}
.dt-rowhead{display:flex;align-items:center;gap:.5rem}
@media(min-width:640px){.dt-rowhead{display:block;padding-top:.15rem}}
.dt-when{font-size:.74rem;letter-spacing:.11em;text-transform:uppercase;font-weight:700;
color:var(--dim)}
.dt-row.is-today .dt-when{color:var(--ink)}
.dt-mark{display:inline-block;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;
font-weight:700;padding:.12rem .42rem;border-radius:3px;color:#fff;white-space:nowrap}
@media(min-width:640px){.dt-mark{margin-top:.4rem}}
.dt-mark.good{background:var(--good)}
.dt-mark.bad{background:var(--bad)}
.dt-mark.none{background:transparent;color:var(--dim);border:1px solid var(--line);font-weight:600}

.dt-shots{display:flex;flex-wrap:wrap;gap:.4rem}
.dt-shot{width:clamp(4.5rem,17vw,6.5rem);aspect-ratio:1;background:#ece8de;border:0;padding:0;
line-height:0;cursor:zoom-in;border-radius:4px;overflow:hidden;position:relative;display:block}
.dt-shot img,.dt-shot video{width:100%;height:100%;object-fit:cover;display:block}
.dt-vid{position:absolute;right:.2rem;bottom:.2rem;background:rgba(0,0,0,.68);color:#fff;
font-size:.56rem;letter-spacing:.1em;text-transform:uppercase;padding:.1rem .3rem;
border-radius:2px;font-weight:700;line-height:1.5}
.dt-said{margin-top:.5rem;font-size:.92rem}
.dt-said em{font-style:normal;color:var(--dim)}
.dt-row.nowt{opacity:.62}
.dt-row.nowt .dt-said{color:var(--dim);font-size:.88rem;margin-top:0}
@media(min-width:640px){.dt-row.nowt{padding:.5rem 0}}

.dt-empty{padding:2.5rem 0;color:var(--dim)}

/* -- Post it -- */
.dt-post-btn{display:inline-block;background:var(--ink);color:var(--paper);border:0;
font-size:.86rem;font-weight:600;padding:.6rem 1.1rem;cursor:pointer;border-radius:6px;
font-family:var(--body)}
.dt-post-btn:hover{background:var(--bad)}
.dt-cta{padding:1.6rem 0 3rem}
.dt-foot{border-top:1px solid var(--line);padding:1.4rem 0 2.5rem;color:var(--dim);
font-size:.78rem;display:block;text-align:left}
.dt-foot a{color:var(--dim);border-bottom:1px solid var(--line)}

/* -- Lightbox -- */
.dt-box{position:fixed;inset:0;z-index:90;display:none;place-items:center;padding:3vw;
background:rgba(10,10,8,.93);cursor:zoom-out}
.dt-box.on{display:grid}
.dt-box img,.dt-box video{max-width:94vw;max-height:88vh;width:auto;height:auto;object-fit:contain}

/* -- Sheet -- */
.dt-sheet{position:fixed;inset:0;z-index:95;display:none;place-items:center;padding:1.2rem;
background:rgba(20,19,14,.7);backdrop-filter:blur(4px)}
.dt-sheet.on{display:grid}
.dt-card{background:var(--card);border:1px solid var(--line);border-radius:12px;
padding:1.5rem 1.4rem;width:min(400px,100%);max-height:92vh;overflow:auto}
.dt-card h2{font-size:1.3rem;margin-bottom:.4rem}
.dt-card p{color:var(--dim);font-size:.87rem;margin-bottom:1.1rem}
.dt-pick{display:block;border:1.5px dashed var(--line);border-radius:8px;padding:1.3rem 1rem;
text-align:center;color:var(--dim);cursor:pointer;margin-bottom:.8rem;font-size:.88rem}
.dt-pick:hover{border-color:var(--ink);color:var(--ink)}
.dt-card input[type=text]{width:100%;background:var(--paper);border:1px solid var(--line);
border-radius:7px;color:var(--ink);padding:.65rem .75rem;font-size:.92rem;margin-bottom:.6rem;
font-family:var(--body)}
.dt-card input[type=text]::placeholder{color:#a8a298}
.dt-choice{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin:.2rem 0 1rem}
.dt-choice button{font-size:.9rem;font-weight:600;padding:.65rem .5rem;border:1.5px solid var(--line);
background:var(--paper);color:var(--dim);cursor:pointer;border-radius:7px;font-family:var(--body)}
.dt-choice button.on.good{background:var(--good);border-color:var(--good);color:#fff}
.dt-choice button.on.bad{background:var(--bad);border-color:var(--bad);color:#fff}
.dt-send{width:100%;background:var(--ink);color:var(--paper);border:0;padding:.75rem;
font-size:.94rem;font-weight:600;cursor:pointer;border-radius:8px;font-family:var(--body)}
.dt-send[disabled]{opacity:.45;cursor:default}
.dt-msg{margin-top:.7rem;font-size:.83rem;color:var(--dim);min-height:1.2em}
.dt-x{margin-top:.6rem;background:none;border:0;color:var(--dim);cursor:pointer;font-size:.83rem;
width:100%}
`;

export interface DietPost {
  url: string;
  kind?: string;              // 'video' or anything else, treated as a picture
  caption?: string;
  who?: string;
  verdict?: string;           // 'good' | 'bad'
  created_at?: string;
}

const DAY_MS = 86_400_000;

/**
 * The calendar day in New Zealand for an instant. Day boundaries have to be
 * local or the streak breaks at 1pm, which is exactly the sort of thing that
 * makes someone stop trusting the counter.
 */
function nzDay(when: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(when);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;
  } catch {
    // Some runtimes ship without the timezone data; UTC is close enough to
    // keep the page working.
  }
  return when.toISOString().slice(0, 10);
}

function dateLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-NZ', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function prettyDay(day: string, today: string, yesterday: string): string {
  if (day === today) return 'Today';
  if (day === yesterday) return 'Yesterday';
  return dateLabel(day);
}

/**
 * The diary. Every day from the first post to today gets a row, whether or not
 * anything was posted on it.
 */
export function renderDietBody(site: SiteConfig, slug: string, posts: DietPost[] = []): string {
  const who = site.name || slug;
  const now = new Date();
  const today = nzDay(now);
  const yesterday = nzDay(new Date(now.getTime() - DAY_MS));

  // The two words the page uses. One field, split on the slash, because
  // "Good boy / Bad girl" is the whole joke and it should be theirs to set.
  const pair = String(site.cta || '').split('/');
  const goodWord = esc((pair[0] || 'Good').trim() || 'Good');
  const badWord = esc((pair[1] || 'Bad').trim() || 'Bad');

  const clean = posts
    .map((p) => ({
      url: safeUrl(p.url),
      kind: p.kind === 'video' ? 'video' : 'photo',
      caption: p.caption || '',
      who: p.who || '',
      verdict: p.verdict === 'bad' ? 'bad' : 'good',
      day: nzDay(p.created_at ? new Date(p.created_at) : now),
    }))
    .filter((p) => p.url) as (DietPost & { day: string; verdict: string })[];

  // Everything that happened on a day, in the order it happened.
  const days = new Map<string, typeof clean>();
  for (const post of clean) {
    const list = days.get(post.day) || [];
    list.push(post);
    days.set(post.day, list);
  }

  // A day is only good if nothing bad went in it. One biscuit spoils the day,
  // which is the honest version and also the funnier one.
  const verdictFor = (day: string): string | null => {
    const list = days.get(day);
    if (!list || !list.length) return null;
    return list.some((p) => p.verdict === 'bad') ? 'bad' : 'good';
  };

  // The streak runs back from today, or from yesterday while today is still
  // open — nobody has failed at 9am.
  let streak = 0;
  let cursor = new Date(now.getTime());
  if (!days.has(today)) cursor = new Date(now.getTime() - DAY_MS);
  for (let i = 0; i < 400; i++) {
    if (verdictFor(nzDay(cursor)) !== 'good') break;
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  let good = 0;
  let bad = 0;
  days.forEach((_, day) => (verdictFor(day) === 'bad' ? bad++ : good++));

  // Thirty days of history, oldest on the left.
  const strip: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = nzDay(new Date(now.getTime() - i * DAY_MS));
    const verdict = verdictFor(day);
    strip.push(
      `<div class="dt-day${verdict ? ' ' + verdict : ''}${day === today ? ' today' : ''}" title="${esc(
        prettyDay(day, today, yesterday)
      )} — ${verdict === 'bad' ? badWord : verdict === 'good' ? goodWord : 'nothing posted'}"></div>`
    );
  }

  // Every day from the first post to today, so the gaps are part of the list
  // rather than something you have to notice is missing.
  const stamps = [...days.keys()].sort();
  const rows: string[] = [];
  if (stamps.length) {
    const first = stamps[0];
    for (let i = 0; i < 400; i++) {
      const at = new Date(now.getTime() - i * DAY_MS);
      const day = nzDay(at);
      const list = days.get(day);
      const verdict = verdictFor(day);
      const when = esc(prettyDay(day, today, yesterday));

      if (!list) {
        rows.push(`<div class="dt-row nowt">
      <div class="dt-rowhead"><span class="dt-when">${when}</span></div>
      <div><p class="dt-said">Nothing posted.</p></div>
    </div>`);
      } else {
        const shots = list
          .map(
            (post, n) => `<button type="button" class="dt-shot" data-full="${esc(post.url)}"
          data-kind="${esc(post.kind)}" aria-label="${esc(post.caption || 'What was eaten')}">
          ${
            post.kind === 'video'
              ? `<video src="${esc(post.url)}" preload="metadata" muted playsinline></video><span class="dt-vid">Video</span>`
              : `<img src="${esc(post.url)}" alt="${esc(post.caption || 'What was eaten')}" loading="${
                  i < 3 && n < 3 ? 'eager' : 'lazy'
                }" />`
          }
        </button>`
          )
          .join('');
        const said = list
          .map((post) => (post.caption ? esc(post.caption) : ''))
          .filter(Boolean)
          .join(' &middot; ');
        const sender = list.find((p) => p.who)?.who;
        rows.push(`<div class="dt-row${day === today ? ' is-today' : ''}">
      <div class="dt-rowhead">
        <span class="dt-when">${when}</span>
        <span class="dt-mark ${verdict === 'bad' ? 'bad' : 'good'}">${
          verdict === 'bad' ? badWord : goodWord
        }</span>
      </div>
      <div>
        <div class="dt-shots">${shots}</div>
        ${said ? `<p class="dt-said">${said}</p>` : ''}
        ${sender && !said ? `<p class="dt-said"><em>Posted by ${esc(sender)}</em></p>` : ''}
      </div>
    </div>`);
      }
      if (day === first) break;
    }
  }

  const tally = stamps.length
    ? `<p class="dt-sub"><b>${streak}</b> day streak &middot; <b class="g">${good}</b> ${goodWord.toLowerCase()} &middot; <b class="b">${bad}</b> ${badWord.toLowerCase()}</p>`
    : '';

  return `
<div class="dt-wrap">
  <header class="dt-head" id="top">
    <h1>${esc(who)}</h1>
    ${site.eyebrow ? `<p class="dt-sub">${esc(site.eyebrow)}</p>` : ''}
    ${tally}
  </header>
  ${site.lede ? `<p class="dt-lede">${esc(site.lede)}</p>` : ''}
  <div class="dt-strip">${strip.join('')}</div>

  <div class="dt-days">
    ${rows.length ? rows.join('') : '<p class="dt-empty">Nothing posted yet. Day one starts with a photograph.</p>'}
  </div>

  <div class="dt-cta">
    <button type="button" class="dt-post-btn" id="dt-open">Post what you ate</button>
  </div>

  <footer class="dt-foot">
    <span>Everything ${esc(who)} eats, in public.</span> &middot;
    <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
  </footer>
</div>

<div class="dt-box" id="dt-box" aria-hidden="true"></div>

<div class="dt-sheet" id="dt-sheet" aria-hidden="true">
  <div class="dt-card">
    <h2>What did you eat?</h2>
    <p>It goes on the page straight away, for everybody.</p>
    <label class="dt-pick" id="dt-pick">Choose a photo or video
      <input type="file" accept="image/*,video/*" id="dt-file" hidden /></label>
    <div class="dt-choice">
      <button type="button" class="good" id="dt-good" aria-pressed="false">${goodWord}</button>
      <button type="button" class="bad" id="dt-bad" aria-pressed="false">${badWord}</button>
    </div>
    <input type="text" id="dt-cap" maxlength="90" placeholder="What was it? (optional)" />
    <input type="text" id="dt-who" maxlength="40" placeholder="Your name (optional)" />
    <button type="button" class="dt-send" id="dt-send" disabled>Put it up</button>
    <p class="dt-msg" id="dt-msg"></p>
    <button type="button" class="dt-x" id="dt-cancel">Not now</button>
  </div>
</div>

<script>(function(){
var SLUG=${JSON.stringify(slug)};

// Tap a thumbnail to see it properly. That is the whole interaction.
var box=document.getElementById('dt-box');
document.addEventListener('click',function(e){
  var shot=e.target.closest&&e.target.closest('.dt-shot');
  if(shot){
    var kind=shot.getAttribute('data-kind'),url=shot.getAttribute('data-full');
    box.innerHTML=kind==='video'
      ?'<video src="'+url+'" controls autoplay playsinline></video>'
      :'<img alt="" src="'+url+'" />';
    box.classList.add('on');box.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';return;
  }
  if(e.target===box||box.contains(e.target)&&e.target.tagName==='IMG'){
    box.classList.remove('on');box.setAttribute('aria-hidden','true');
    box.innerHTML='';document.body.style.overflow='';
  }
});

var sheet=document.getElementById('dt-sheet'),file=document.getElementById('dt-file');
var send=document.getElementById('dt-send'),msg=document.getElementById('dt-msg');
var pick=document.getElementById('dt-pick'),chosen=null,verdict=null;
var gb=document.getElementById('dt-good'),bb=document.getElementById('dt-bad');
function close(){sheet.classList.remove('on');sheet.setAttribute('aria-hidden','true');}
document.getElementById('dt-open').addEventListener('click',function(){
  sheet.classList.add('on');sheet.setAttribute('aria-hidden','false');});
document.getElementById('dt-cancel').addEventListener('click',close);
sheet.addEventListener('click',function(e){if(e.target===sheet)close();});
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if(sheet.classList.contains('on'))close();
  if(box.classList.contains('on')){box.classList.remove('on');box.innerHTML='';
    document.body.style.overflow='';}
});
function ready(){send.disabled=!(chosen&&verdict);}
function choose(v){
  verdict=v;
  gb.classList.toggle('on',v==='good');gb.setAttribute('aria-pressed',String(v==='good'));
  bb.classList.toggle('on',v==='bad');bb.setAttribute('aria-pressed',String(v==='bad'));
  ready();
}
gb.addEventListener('click',function(){choose('good');});
bb.addEventListener('click',function(){choose('bad');});
file.addEventListener('change',function(){
  chosen=file.files&&file.files[0];
  if(chosen){pick.textContent=chosen.name.slice(0,40);ready();}
});
// Photos get shrunk in the browser. Video cannot be, so it is capped instead
// and the page says so rather than failing at the far end.
function shrink(f){return new Promise(function(res){
  if(!/^image\//.test(f.type)||/svg/.test(f.type))return res(f);
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
  if(!chosen||!verdict)return;
  if(/^video\//.test(chosen.type)&&chosen.size>9000000){
    msg.textContent='That clip is too long — keep it under about ten seconds.';return;}
  send.disabled=true;msg.textContent='Putting it up…';
  shrink(chosen).then(function(f){
    var r=new FileReader();
    r.onload=function(){
      fetch('https://garage.co.nz/api/diary',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({slug:SLUG,file:r.result,verdict:verdict,
          caption:document.getElementById('dt-cap').value,
          who:document.getElementById('dt-who').value})})
        .then(function(x){return x.json();})
        .then(function(d){
          if(d&&d.ok){msg.textContent='Up it goes.';
            setTimeout(function(){close();location.reload();},1200);}
          else{msg.textContent=(d&&d.error)||'That did not go up, sorry.';send.disabled=false;}})
        .catch(function(){msg.textContent='That did not go up, sorry.';send.disabled=false;});
    };
    r.onerror=function(){msg.textContent='Could not read that file.';send.disabled=false;};
    r.readAsDataURL(f);
  });
});
})();</script>`;
}
