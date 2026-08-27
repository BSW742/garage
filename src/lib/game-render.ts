// GAME TEMPLATE (style: "game")
//
// Space Invaders, where the invaders are the business. Shoot one and it tells
// you what it was — a service, a dish, a price. Clear the board and you have
// read the whole site without once being asked to read anything.
//
// It only works because of one rule, learned from the bubbles template and
// worth restating: everything in the game is also on the page as ordinary
// HTML, underneath, always. A canvas is a black box. Nobody who uses a screen
// reader can play this, nobody on a train wants to, and no crawler or model
// can see a single pixel of it. So the game is a way through the content, not
// the place the content lives.
//
// The difficulty is deliberately gentle. This is somebody's website. Losing
// costs nothing, the invaders never speed up, and there is a "just show me the
// list" button on screen the entire time.

import type { SiteConfig } from './site-render';

export const GAME_FONT_QUERY = '&family=Press+Start+2P';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

export const GAME_CSS = `
.gm{--void:#07060d;--ink:#e9e6ff;--dim:#8e88a8;--line:#241f3a;
--pixel:'Press Start 2P',monospace;
--body:'Inter',system-ui,-apple-system,sans-serif}
.gm{background:var(--void);color:var(--ink);font-family:var(--body);line-height:1.65}
html:has(body.gm),body.gm{overflow-x:clip}
.gm h1,.gm h2{font-family:var(--pixel);font-weight:400;text-align:center;margin-bottom:0;
line-height:1.5;letter-spacing:0}
.gm ::selection{background:var(--primary);color:#fff}
.gm-wrap{max-width:56rem;margin:0 auto;padding:0 1.1rem}

/* -- Head -- */
.gm-head{padding:3rem 0 1.4rem;text-align:center}
.gm-head h1{font-size:clamp(1rem,3.6vw,1.9rem);color:var(--primary);
text-shadow:0 0 18px color-mix(in srgb,var(--primary) 50%,transparent)}
.gm-eyebrow{font-family:var(--pixel);font-size:.55rem;letter-spacing:.1em;color:var(--dim);
margin-bottom:1.2rem}
.gm-lede{margin:1.2rem auto 0;color:var(--dim);max-width:32rem;font-size:.97rem}

/* -- The board -- */
.gm-stage{position:relative;margin:1.6rem auto 0;max-width:44rem;
border:2px solid var(--line);border-radius:10px;overflow:hidden;
background:radial-gradient(40rem 20rem at 50% 0%,rgba(124,92,255,.14),transparent 70%),#05040a}
.gm-canvas{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair}
.gm-hud{display:flex;justify-content:space-between;align-items:center;gap:1rem;
padding:.6rem .8rem;border-bottom:2px solid var(--line);font-family:var(--pixel);
font-size:.55rem;color:var(--dim);letter-spacing:.06em}
.gm-hud b{color:var(--primary);font-weight:400}

/* What a shot invader turns out to have been. */
.gm-drop{position:absolute;left:0;right:0;bottom:0;padding:1rem 1.1rem;
background:linear-gradient(transparent,rgba(5,4,10,.95) 35%);
transform:translateY(100%);transition:transform .3s cubic-bezier(.16,1,.3,1)}
.gm-drop.on{transform:translateY(0)}
.gm-drop b{display:block;font-family:var(--pixel);font-size:.7rem;color:var(--primary);
line-height:1.6;margin-bottom:.45rem}
.gm-drop span{font-size:.9rem;color:var(--ink)}

/* End of the round, over the top of the board. */
.gm-over{position:absolute;inset:0;display:none;place-items:center;text-align:center;
background:rgba(5,4,10,.9);padding:1.5rem}
.gm-over.on{display:grid}
.gm-over h2{font-size:.9rem;color:var(--primary);margin-bottom:1rem}
.gm-over p{color:var(--dim);font-size:.92rem;max-width:22rem;margin:0 auto 1.3rem}

.gm-btn{font-family:var(--pixel);font-size:.6rem;letter-spacing:.05em;
background:var(--primary);color:#fff;border:0;border-radius:6px;padding:.85rem 1.2rem;
cursor:pointer;line-height:1.5}
.gm-btn.ghost{background:transparent;color:var(--dim);border:2px solid var(--line)}
.gm-btn.ghost:hover{color:var(--ink);border-color:var(--dim)}
.gm-doing{display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap;margin-top:1.1rem}
.gm-keys{margin-top:1rem;font-size:.78rem;color:var(--dim);text-align:center}

/* -- The list. Always here, always readable, never behind the game. -- */
.gm-list{padding:3.5rem 0 1rem}
.gm-list h2{font-size:.8rem;color:var(--dim);margin-bottom:1.6rem}
.gm-rows{display:grid;gap:.7rem;grid-template-columns:1fr}
@media(min-width:640px){.gm-rows{grid-template-columns:repeat(2,1fr)}}
.gm-row{border:1px solid var(--line);border-radius:10px;padding:.95rem 1.1rem;
background:rgba(233,230,255,.02)}
.gm-row b{display:block;font-size:.98rem;margin-bottom:.2rem}
.gm-row span{color:var(--dim);font-size:.88rem}

.gm-contact{text-align:center;padding:2.5rem 0 1rem}
.gm-contact a{display:inline-block;font-family:var(--pixel);font-size:.65rem;
background:var(--primary);color:#fff;border-radius:6px;padding:.9rem 1.4rem;line-height:1.5}
.gm-contact p{margin-top:1rem;color:var(--dim);font-size:.9rem}

.gm-foot{border-top:1px solid var(--line);margin-top:2rem;padding:2rem 0 3rem;
text-align:center;color:var(--dim);font-size:.8rem;display:block}
.gm-foot a{color:var(--dim);border-bottom:1px solid var(--line)}
@media(prefers-reduced-motion:reduce){.gm-drop{transition:none}}
`;

interface Thing {
  label: string;
  detail: string;
}

/**
 * Everything the business has to say, flattened into things an invader can be
 * carrying. Services, menu dishes, products, opening hours — whatever they
 * actually filled in.
 */
function thingsFrom(site: SiteConfig): Thing[] {
  const out: Thing[] = [];
  const push = (label: unknown, detail: unknown) => {
    const name = String(label || '').trim();
    if (!name) return;
    out.push({ label: name.slice(0, 40), detail: String(detail || '').trim().slice(0, 160) });
  };

  for (const product of site.products || []) {
    push(product?.name, [product?.text, product?.price].filter(Boolean).join(' — '));
  }
  for (const section of site.sections || []) {
    if (!section) continue;
    for (const item of section.items || []) push(item?.[0], item?.[1]);
    for (const row of section.rows || []) push(row?.[0], row?.[1]);
    for (const group of section.menu || []) {
      for (const dish of group?.items || []) {
        push(dish?.name, [dish?.text, dish?.price].filter(Boolean).join(' — '));
      }
    }
  }
  // 24 is two full waves. More than that and the board stops being readable.
  return out.slice(0, 24);
}

export function renderGameBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const things = thingsFrom(site);
  const contact = site.contact || {};
  const primary = (site.palette || {}).primary || '#7c5cff';

  // The board is sized to the wave. A fixed height leaves a business with four
  // services staring into a large black void.
  const cols = Math.min(8, Math.max(1, things.length));
  const waves = Math.ceil(things.length / cols);
  const boardH = Math.max(250, Math.min(460, 36 + waves * 46 + 150));

  const rows = things.length
    ? `<div class="gm-rows">${things
        .map(
          (t) => `<div class="gm-row"><b>${esc(t.label)}</b>${
            t.detail ? `<span>${esc(t.detail)}</span>` : ''
          }</div>`
        )
        .join('')}</div>`
    : `<p class="gm-keys">Nothing on the board yet — add what you do and it becomes the game.</p>`;

  const reach = contact.phone
    ? `<a href="tel:${esc(String(contact.phone).replace(/[^\d+]/g, ''))}">${esc(site.cta || 'Call us')}</a>`
    : contact.email
      ? `<a href="mailto:${esc(contact.email)}">${esc(site.cta || 'Get in touch')}</a>`
      : '';

  return `
<div class="gm-wrap">
  <header class="gm-head" id="top">
    ${site.eyebrow ? `<p class="gm-eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(who)}</h1>
    ${site.lede ? `<p class="gm-lede">${esc(site.lede)}</p>` : ''}
  </header>

  ${things.length ? `<div class="gm-stage" id="gm-stage">
    <div class="gm-hud">
      <span>FOUND <b id="gm-found">0</b>/${things.length}</span>
      <span id="gm-state">TAP OR PRESS SPACE</span>
    </div>
    <canvas class="gm-canvas" id="gm-canvas" width="640" height="${boardH}"
      aria-label="A game. Everything in it is also listed below."></canvas>
    <div class="gm-drop" id="gm-drop"><b id="gm-drop-name"></b><span id="gm-drop-text"></span></div>
    <div class="gm-over" id="gm-over">
      <div>
        <h2 id="gm-over-title"></h2>
        <p id="gm-over-say"></p>
        <div class="gm-doing">
          <button type="button" class="gm-btn" id="gm-again">Play again</button>
          <a class="gm-btn ghost" href="#everything">Just show me the list</a>
        </div>
      </div>
    </div>
  </div>
  <p class="gm-keys">Arrow keys or A and D to move, space to fire. On a phone, drag to move and
    tap to fire. Everything in the game is written out below.</p>` : ''}

  <section class="gm-list" id="everything">
    <h2>EVERYTHING, PLAINLY</h2>
    ${rows}
  </section>

  ${reach ? `<div class="gm-contact">${reach}
    ${contact.address ? `<p>${esc(contact.address)}</p>` : ''}</div>` : ''}

  <footer class="gm-foot">
    <span>${esc(who)}</span> &middot;
    <a href="https://garage.co.nz/ai">A page by garage.co.nz</a>
  </footer>
</div>

<script>(function(){
var THINGS=${JSON.stringify(things)};
var PRIMARY=${JSON.stringify(primary)};
if(!THINGS.length)return;

var canvas=document.getElementById('gm-canvas');
var ctx=canvas.getContext('2d');
var W=canvas.width,H=canvas.height;

// Classic 11x8 invader, drawn as blocks. No image to load, no licence to worry
// about, and it scales to whatever the board is.
var CRAB=['..X.....X..','...X...X...','..XXXXXXX..','.XX.XXX.XX.',
          'XXXXXXXXXXX','X.XXXXXXX.X','X.X.....X.X','...XX.XX...'];
var SHIP=['.....X.....','....XXX....','.XXXXXXXXX.','XXXXXXXXXXX'];

function blit(rows,x,y,px,colour){
  ctx.fillStyle=colour;
  for(var r=0;r<rows.length;r++){
    for(var c=0;c<rows[r].length;c++){
      if(rows[r][c]==='X')ctx.fillRect(x+c*px,y+r*px,px,px);
    }
  }
}

var px=3, IW=11*px, IH=8*px;
var ship,bullets,foes,dir,dropped,found,running,over;

function reset(){
  ship={x:W/2-(11*px)/2,w:11*px,speed:4.4};
  bullets=[];
  foes=[];
  var cols=Math.min(8,THINGS.length);
  var gapX=Math.floor((W-40)/cols);
  THINGS.forEach(function(t,i){
    var col=i%cols, row=Math.floor(i/cols);
    foes.push({x:20+col*gapX,y:36+row*46,alive:true,thing:t});
  });
  dir=1; dropped=0; found=0; running=true; over=false;
  document.getElementById('gm-found').textContent='0';
  document.getElementById('gm-over').classList.remove('on');
  document.getElementById('gm-drop').classList.remove('on');
  document.getElementById('gm-state').textContent='GO';
}

function show(thing){
  var d=document.getElementById('gm-drop');
  document.getElementById('gm-drop-name').textContent=thing.label;
  document.getElementById('gm-drop-text').textContent=thing.detail||'';
  d.classList.add('on');
  clearTimeout(show.t);
  show.t=setTimeout(function(){d.classList.remove('on');},2600);
}

function finish(won){
  running=false; over=true;
  document.getElementById('gm-over-title').textContent=won?'BOARD CLEARED':'THEY GOT THROUGH';
  document.getElementById('gm-over-say').textContent=won
    ? 'That is the lot — every one of them is written out below as well.'
    : 'No harm done. It is a website, not a boss fight. Have another go, or read the list.';
  document.getElementById('gm-over').classList.add('on');
  document.getElementById('gm-state').textContent=won?'CLEARED':'OVER';
}

function step(){
  ctx.clearRect(0,0,W,H);

  if(running){
    // Move the block, drop a row and turn at the edges.
    var left=W,right=0,low=0,any=false;
    foes.forEach(function(f){
      if(!f.alive)return;
      any=true;
      left=Math.min(left,f.x); right=Math.max(right,f.x+IW); low=Math.max(low,f.y+IH);
    });
    if(!any){finish(true);}
    else{
      if(right+dir*0.6>W-8||left+dir*0.6<8){
        dir*=-1;
        foes.forEach(function(f){f.y+=14;});
      } else {
        foes.forEach(function(f){f.x+=dir*0.6;});
      }
      if(low>H-52)finish(false);
    }
  }

  foes.forEach(function(f){
    if(f.alive)blit(CRAB,f.x,f.y,px,PRIMARY);
  });

  bullets.forEach(function(b){b.y-=7;});
  bullets=bullets.filter(function(b){return b.y>-10;});
  ctx.fillStyle='#e9e6ff';
  bullets.forEach(function(b){ctx.fillRect(b.x,b.y,3,10);});

  // Hits. Generous boxes on purpose — this is not meant to be hard.
  bullets.forEach(function(b){
    foes.forEach(function(f){
      if(!f.alive||b.dead)return;
      if(b.x>f.x-4&&b.x<f.x+IW+4&&b.y>f.y-4&&b.y<f.y+IH+4){
        f.alive=false; b.dead=true; found++;
        document.getElementById('gm-found').textContent=String(found);
        show(f.thing);
      }
    });
  });
  bullets=bullets.filter(function(b){return !b.dead;});

  blit(SHIP,ship.x,H-30,px,'#e9e6ff');
  requestAnimationFrame(step);
}

var keys={};
document.addEventListener('keydown',function(e){
  if(['ArrowLeft','ArrowRight','a','d','A','D',' '].indexOf(e.key)<0)return;
  // Only take the keys once somebody is actually playing.
  var box=document.getElementById('gm-stage').getBoundingClientRect();
  if(box.bottom<0||box.top>window.innerHeight)return;
  e.preventDefault();
  keys[e.key]=true;
  if(e.key===' '&&running&&bullets.length<3){
    bullets.push({x:ship.x+ship.w/2-1,y:H-34});
  }
});
document.addEventListener('keyup',function(e){keys[e.key]=false;});

function drive(){
  if(running){
    if(keys.ArrowLeft||keys.a||keys.A)ship.x-=ship.speed;
    if(keys.ArrowRight||keys.d||keys.D)ship.x+=ship.speed;
    ship.x=Math.max(4,Math.min(W-ship.w-4,ship.x));
  }
  requestAnimationFrame(drive);
}

// Touch: drag anywhere to steer, tap to fire.
var dragging=false;
function at(e){
  var r=canvas.getBoundingClientRect();
  var t=e.touches?e.touches[0]:e;
  return (t.clientX-r.left)*(W/r.width);
}
canvas.addEventListener('pointerdown',function(e){
  dragging=true; canvas.setPointerCapture(e.pointerId);
  if(running&&bullets.length<3)bullets.push({x:ship.x+ship.w/2-1,y:H-34});
});
canvas.addEventListener('pointermove',function(e){
  if(!dragging||!running)return;
  ship.x=Math.max(4,Math.min(W-ship.w-4,at(e)-ship.w/2));
});
canvas.addEventListener('pointerup',function(){dragging=false;});

document.getElementById('gm-again').addEventListener('click',reset);

reset(); step(); drive();
})();</script>`;
}
