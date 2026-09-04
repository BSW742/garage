// WATER RING TOSS, IN THE ROUND (the arcade page only)
//
// The same toy rings.garage.co.nz already runs, rebuilt in three.js so the
// water has real depth — and with Ben in the tank, two fingers up, playing
// the pegs. Rings are true tori with light and shadow on them; the fingers
// are capsules off a hand; his head bobs gently behind the water; a press
// raises a plume of sprite bubbles that lofts whatever hangs over it.
//
// Everything that made the 2D version honest carries over unchanged: no
// dice, the clock starts on the first press, land close-flat-falling or not
// at all, confetti, and the machine reloads itself. No form, no lock, no
// leads — this page is pure toy.
//
// The head texture is baked into the page as a data URI, because
// garage.co.nz serves images without CORS headers and a WebGL texture
// will not load cross-origin without them.

import type { SiteConfig } from './site-render';
import { BEN_HEAD_B64 } from './ben-head';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

const RINGS = 5;
const SECONDS = 60;

function thresholds(count: number): number[] {
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? RINGS : Math.max(1, Math.round(((i + 1) * RINGS) / count))
  );
}

const HEAD_B64 = BEN_HEAD_B64;

export function renderRingTossArcade3D(site: SiteConfig, slug: string): string {
  const rt = (site as any).ringtoss || {};
  const ladder = (rt.prizes || []).map((p: any) => String(p || '').trim()).filter(Boolean).slice(0, 5);
  const bust = String(rt.bust || '').trim();
  const needs = thresholds(Math.max(2, ladder.length));

  const steps = ladder
    .map((p: string, i: number) => `<span data-step="${i}">${needs[i]} ring${needs[i] === 1 ? '' : 's'} &middot; ${esc(p)}</span>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(site.name || 'Ring Toss')}</title>
<meta name="description" content="The water ring toss. Two buttons, five rings, sixty seconds — and Ben's fingers for pegs." />
<style>
* { box-sizing: border-box; margin: 0; }
body { min-height: 100vh; font-family: -apple-system, system-ui, sans-serif;
background: radial-gradient(circle at 50% 18%, #1c3a52, #0c1c2a 70%);
display: grid; place-items: center; padding: 1.2rem; color: #14202b; }
.card { width: min(26rem, 100%); background: #f4f8fb; border-radius: 18px;
padding: 1.3rem 1.3rem 1.2rem; text-align: center; position: relative;
box-shadow: 0 30px 80px -30px rgba(0,0,0,.7); }
.kicker { font: 700 .64rem/1 system-ui, sans-serif; letter-spacing: .18em;
text-transform: uppercase; color: #b52c2c; margin-bottom: .35rem; }
h1 { font-size: 1.7rem; font-weight: 800; letter-spacing: -.02em; margin-bottom: .7rem; }
.steps { display: flex; justify-content: center; gap: .35rem; flex-wrap: wrap; margin-bottom: .9rem; }
.steps span { font: 700 .6rem/1.3 system-ui, sans-serif; letter-spacing: .03em;
text-transform: uppercase; color: #5f7385; border: 1px solid rgba(20,32,43,.14);
border-radius: 999px; padding: .34rem .6rem; transition: all .25s; }
.steps span.held { background: #e33d3d; border-color: #e33d3d; color: #fff; }
@keyframes pulse { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1)} }
.steps span.pop { animation: pulse .5s ease-out; }
.stage { position: relative; }
#tank { display: block; width: 100%; border-radius: 22px;
box-shadow: inset 0 0 0 8px #e33d3d, inset 0 4px 0 9px rgba(255,255,255,.25),
0 18px 40px -18px rgba(0,0,0,.5); touch-action: none; }
.hud { position: absolute; top: 14px; right: 14px; display: flex;
justify-content: flex-end; pointer-events: none; }
.clock { font: 800 .95rem/1 ui-monospace, Menlo, monospace; color: #0b3550;
background: rgba(255,255,255,.6); border-radius: 999px; padding: .32rem .8rem;
font-variant-numeric: tabular-nums; }
.toast { position: absolute; top: 54px; left: 0; right: 0; text-align: center;
pointer-events: none; font: 800 .95rem/1 system-ui, sans-serif; letter-spacing: .04em;
color: #0b3550; text-transform: uppercase; opacity: 0;
transform: translateY(8px) scale(.9);
transition: opacity .25s, transform .35s cubic-bezier(.2,1.4,.4,1); }
.toast.on { opacity: 1; transform: none; }
.toast b { color: #b52c2c; }
.btns { display: flex; justify-content: space-between; padding: .9rem 1.4rem 0; }
.btn { width: 4.4rem; height: 4.4rem; border-radius: 50%; border: 0; cursor: pointer;
background: radial-gradient(circle at 34% 30%, #ff7a7a, #e33d3d 55%, #b52c2c);
box-shadow: 0 6px 0 #b52c2c, 0 10px 18px rgba(0,0,0,.3);
transition: transform .06s, box-shadow .06s; touch-action: manipulation; }
.btn:active, .btn.down { transform: translateY(5px);
box-shadow: 0 1px 0 #b52c2c, 0 4px 10px rgba(0,0,0,.3); }
.hint { margin-top: .7rem; font-size: .72rem; color: #5f7385; }
.done { display: none; padding: .5rem 0 .2rem; }
.done.on { display: block; }
.shout { font-size: 1.8rem; font-weight: 800; line-height: 1.1; letter-spacing: -.02em;
margin: .2rem 0 .6rem; }
.shout em { font-style: normal; color: #b52c2c; }
.note { font-size: .85rem; color: #5f7385; line-height: 1.6; }
</style>
</head>
<body>
<div class="card">
  <p class="kicker">${esc(site.name || slug)}</p>
  <h1>Ring Toss</h1>
  <div class="steps" id="steps">${steps}</div>
  <div class="stage" id="stage">
    <canvas id="tank" width="380" height="460"></canvas>
    <div class="hud"><span class="clock" id="clock">${SECONDS}.0</span></div>
    <div class="toast" id="toast"></div>
  </div>
  <div class="btns">
    <button class="btn" id="bl" type="button" aria-label="Left burst"></button>
    <button class="btn" id="br" type="button" aria-label="Right burst"></button>
  </div>
  <p class="hint">Land the rings on Ben's fingers. Buttons, or the arrow keys.</p>
  <div class="done" id="done"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js"></script>
<script>
(function () {
  var ladder = ${JSON.stringify(ladder)};
  var NEEDS = ${JSON.stringify(needs)};
  var bust = ${JSON.stringify(bust)};
  var SECONDS = ${SECONDS};
  var HEAD = ${JSON.stringify(HEAD_B64 ? 'data:image/png;base64,' + HEAD_B64 : '')};

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('tank');
  var Wpx = 380, Hpx = 460;

  // ── The scene ────────────────────────────────────────────────
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(Wpx, Hpx, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd0ee);
  scene.fog = new THREE.Fog(0x8fd0ee, 8, 16);

  var camera = new THREE.PerspectiveCamera(38, Wpx / Hpx, 0.1, 40);
  camera.position.set(0, 3.1, 8.2);
  camera.lookAt(0, 2.3, 0);

  scene.add(new THREE.AmbientLight(0xcfeaff, 0.85));
  var sun = new THREE.DirectionalLight(0xffffff, 1.15);
  sun.position.set(2.5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -1;
  scene.add(sun);
  var fill = new THREE.PointLight(0xbfe8ff, 0.5, 20);
  fill.position.set(-3, 4, 5);
  scene.add(fill);

  // The floor of the tank, where the shadows pool.
  var floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 40),
    new THREE.MeshStandardMaterial({ color: 0x9ed7f0, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ── Ben, in the tank ─────────────────────────────────────────
  var headGroup = new THREE.Group();
  if (HEAD) {
    new THREE.TextureLoader().load(HEAD, function (tex) {
      var aspect = tex.image.width / tex.image.height;
      var h = 2.2, w = h * aspect;
      var head = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: true })
      );
      // Clear above the fingertips: fingers reaching into his beard read as
      // antlers, which was the whole of the what-TF screenshot.
      head.position.set(0.1, 4.45, -1.8);
      headGroup.add(head);
    });
  }
  scene.add(headGroup);

  // The hand: a mound, a hint of arm, and two fingers up as the pegs.
  var skin = new THREE.MeshStandardMaterial({ color: 0xeaa06a, roughness: 0.65 });
  var hand = new THREE.Group();
  var mound = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 18), skin);
  mound.scale.set(1.1, 0.48, 0.72);
  mound.position.set(0, 0.34, 0);
  mound.castShadow = true;
  hand.add(mound);
  var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 1.4, 18), skin);
  arm.position.set(0.25, -0.35, 0);
  arm.rotation.z = -0.25;
  hand.add(arm);

  var FINGERS = [];
  function finger(x, tipY, lean) {
    var len = tipY - 0.6;
    var g = new THREE.Group();
    var f = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, len, 6, 14), skin);
    // a knuckle where the finger leaves the hand
    var kn = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 12), skin);
    kn.position.y = 0.62;
    g.add(kn);
    f.castShadow = true;
    f.position.y = 0.6 + len / 2;
    g.add(f);
    // a nail, for the read
    var nail = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xf6cfae, roughness: 0.4 })
    );
    nail.scale.set(1, 0.75, 0.55);
    nail.position.set(0, 0.6 + len + 0.02, 0.1);
    g.add(nail);
    g.position.x = x;
    g.rotation.z = lean;
    hand.add(g);
    // The peg maths: where the tip really is after the lean.
    FINGERS.push({ x: x - Math.sin(lean) * (len + 0.7), z: 0, tip: 0.6 + (len + 0.1) * Math.cos(lean), base: 0.85, stack: 0 });
    return g;
  }
  finger(-0.62, 2.5, 0.10);   // index, leaning out a touch
  finger(0.42, 2.9, -0.06);   // middle, taller
  scene.add(hand);

  // ── The rings ────────────────────────────────────────────────
  var COLORS = [0xff5a5a, 0xffd23f, 0x3ecf6e, 0x4aa8ff, 0xc07bff];
  var rings = [];
  for (var i = 0; i < ${RINGS}; i++) {
    var mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.13, 14, 28),
      new THREE.MeshStandardMaterial({ color: COLORS[i], roughness: 0.35, metalness: 0.05 })
    );
    mesh.castShadow = true;
    mesh.rotation.x = Math.PI / 2;    // flat = hole up
    scene.add(mesh);
    rings.push({
      m: mesh,
      x: [-1.75, -1.15, 0, 1.15, 1.75][i], y: 0.17, z: 0.55 + (i % 2) * 0.2,
      vx: 0, vy: 0, vz: 0,
      ax: (Math.random() - 0.5) * 0.8, az: (Math.random() - 0.5) * 0.8,
      vax: 0, vaz: 0, spin: Math.random() * 6.3,
      landed: -1, slideTo: 0, litAt: 0,
    });
  }

  // ── Bubbles: a pool of sprites ───────────────────────────────
  var bubTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 32;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(13, 12, 2, 16, 16, 15);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(0.5, 'rgba(255,255,255,.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  var bubbles = [];
  for (var b0 = 0; b0 < 70; b0++) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubTex, transparent: true, opacity: 0.85 }));
    sp.visible = false;
    scene.add(sp);
    bubbles.push({ s: sp, live: false, x: 0, y: 0, z: 0, vy: 0, w: 0, r: 1 });
  }
  function bubble(x, y, z, vy, size) {
    for (var i = 0; i < bubbles.length; i++) {
      var bb = bubbles[i];
      if (bb.live) continue;
      bb.live = true; bb.s.visible = true;
      bb.x = x; bb.y = y; bb.z = z; bb.vy = vy; bb.w = Math.random() * 6.3; bb.r = size;
      bb.s.scale.set(size, size, 1);
      return;
    }
  }

  // ── The game ─────────────────────────────────────────────────
  var clockLeft = SECONDS, running = false, ended = false, over = false;

  function burst(side) {
    if (over || ended) return;
    running = true;
    var vx0 = side < 0 ? -1.6 : 1.6;
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      if (r.landed >= 0) continue;
      var dx = r.x - vx0;
      var column = Math.exp(-(dx * dx) / (2 * 1.1 * 1.1));
      var heightEase = 0.55 + 0.45 * (1 - r.y / 5);
      var k = column * heightEase;
      r.vy += k * (5.2 + Math.random() * 1.8);
      r.vx += (dx > 0 ? 1 : -1) * k * 0.9 + (Math.random() - 0.5) * k * 1.6;
      r.vz += (Math.random() - 0.5) * k * 1.4;
      r.vax += (Math.random() - 0.5) * k * 4;
      r.vaz += (Math.random() - 0.5) * k * 4;
    }
    for (var b = 0; b < 16; b++) {
      bubble(vx0 + (Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.2,
        (Math.random() - 0.5) * 0.8, 2.2 + Math.random() * 2.4, 0.1 + Math.random() * 0.16);
    }
    var btn = side < 0 ? $('bl') : $('br');
    btn.classList.add('down');
    setTimeout(function () { btn.classList.remove('down'); }, 90);
  }
  $('bl').addEventListener('pointerdown', function (e) { e.preventDefault(); burst(-1); });
  $('br').addEventListener('pointerdown', function (e) { e.preventDefault(); burst(1); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); burst(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); burst(1); }
  });

  function landedCount() {
    var n = 0;
    for (var i = 0; i < rings.length; i++) if (rings[i].landed >= 0) n++;
    return n;
  }
  function rungFor(n) {
    var rung = -1;
    for (var i = 0; i < NEEDS.length; i++) if (n >= NEEDS[i]) rung = i;
    return rung;
  }
  function paintSteps() {
    var rung = rungFor(landedCount());
    for (var i = 0; i < ladder.length; i++) {
      var el = document.querySelector('#steps [data-step="' + i + '"]');
      if (el) el.classList.toggle('held', i === rung);
    }
  }

  function step(dt) {
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      if (r.landed >= 0) {
        if (r.y > r.slideTo) r.y = Math.max(r.slideTo, r.y - 3.2 * dt);
        r.ax *= 0.9; r.az *= 0.9;
      } else {
        r.vy -= 1.15 * dt;                        // sink, gently
        r.vx += Math.sin(Date.now() / 900 + i * 2) * 0.12 * dt;
        var drag = Math.exp(-1.6 * dt);
        r.vx *= drag; r.vy *= drag; r.vz *= drag;
        r.vax *= Math.exp(-1.1 * dt); r.vaz *= Math.exp(-1.1 * dt);
        r.x += r.vx * dt; r.y += r.vy * dt; r.z += r.vz * dt;
        r.ax += r.vax * dt; r.az += r.vaz * dt;
        r.spin += dt * 0.4;
        if (r.x < -2.1) { r.x = -2.1; r.vx = Math.abs(r.vx) * 0.4; }
        if (r.x > 2.1) { r.x = 2.1; r.vx = -Math.abs(r.vx) * 0.4; }
        if (r.z < -1.15) { r.z = -1.15; r.vz = Math.abs(r.vz) * 0.4; }
        if (r.z > 1.15) { r.z = 1.15; r.vz = -Math.abs(r.vz) * 0.4; }
        if (r.y > 4.9) { r.y = 4.9; r.vy = -Math.abs(r.vy) * 0.3; }
        if (r.y < 0.17) { r.y = 0.17; r.vy = Math.abs(r.vy) * 0.2; r.vax *= 0.5; r.vaz *= 0.5; }

        // The hand is solid: a ring pushed into the mound is pushed back out
        // along the surface, which is what stopped them reading as croissants
        // baked into a loaf.
        var mx = r.x / 1.35, my = (r.y - 0.34) / 0.75, mz = r.z / 0.98;
        var md = mx * mx + my * my + mz * mz;
        if (md < 1) {
          var mn = Math.sqrt(md) || 0.001;
          r.x = (mx / mn) * 1.35;
          r.y = 0.34 + (my / mn) * 0.75;
          r.z = (mz / mn) * 0.98;
          if (r.y < 0.17) r.y = 0.17;
          r.vx += (mx / mn) * 0.6; r.vy += Math.max(0, my / mn) * 0.6; r.vz += (mz / mn) * 0.6;
        }

        // The fingers. Close in x and z, coming down, lying flat, at tip
        // height — and water near a finger funnels the ring toward it.
        var flat = Math.cos(r.ax) * Math.cos(r.az) > 0.72;
        for (var f = 0; f < FINGERS.length; f++) {
          var fg = FINGERS[f];
          var hx = r.x - fg.x, hz = r.z - fg.z;
          var hd = Math.sqrt(hx * hx + hz * hz);
          if (hd < 0.9 && r.vy < 0 && r.y > fg.tip) {
            r.vx -= hx * 0.5 * dt; r.vz -= hz * 0.5 * dt;
          }
          if (r.vy < -0.1 && flat && hd < 0.24 &&
              r.y < fg.tip + 0.12 && r.y > fg.tip - 0.1) {
            r.landed = f;
            r.litAt = Date.now();
            r.x = fg.x; r.z = fg.z; r.vx = r.vy = r.vz = 0;
            r.ax = (Math.random() - 0.5) * 0.14; r.az = (Math.random() - 0.5) * 0.14;
            r.slideTo = fg.base + 0.02 + fg.stack * 0.30;
            fg.stack++;
            for (var cb = 0; cb < 12; cb++) {
              var ang = (cb / 12) * Math.PI * 2;
              bubble(fg.x + Math.cos(ang) * 0.3, fg.tip, fg.z + Math.sin(ang) * 0.3,
                2 + Math.random() * 2, 0.08 + Math.random() * 0.1);
            }
            var n = landedCount();
            var toast = $('toast');
            var rung = rungFor(n);
            toast.innerHTML = n + ' ring' + (n === 1 ? '' : 's') +
              (rung >= 0 ? ' &middot; <b>' + ladder[rung] + '</b>' : '');
            toast.classList.add('on');
            clearTimeout(toast._t);
            toast._t = setTimeout(function () { toast.classList.remove('on'); }, 1500);
            paintSteps();
            var lit = document.querySelector('#steps span.held');
            if (lit) { lit.classList.remove('pop'); void lit.offsetWidth; lit.classList.add('pop'); }
            if (landedCount() >= rings.length) endRound(true);
            break;
          }
        }
      }
      r.m.position.set(r.x, r.y, r.z);
      r.m.rotation.set(Math.PI / 2 + r.ax, r.spin, r.az);
      // the golden flash of a fresh catch
      if (r.landed >= 0 && r.litAt && Date.now() - r.litAt < 700) {
        var age = (Date.now() - r.litAt) / 700;
        r.m.material.emissive = new THREE.Color(0xffd23f);
        r.m.material.emissiveIntensity = 0.9 * (1 - age);
      } else if (r.m.material.emissiveIntensity) {
        r.m.material.emissiveIntensity = 0;
      }
    }
    for (var b2 = 0; b2 < bubbles.length; b2++) {
      var bb = bubbles[b2];
      if (!bb.live) continue;
      bb.y += bb.vy * dt; bb.w += dt * 7;
      bb.x += Math.sin(bb.w) * 0.5 * dt;
      bb.s.position.set(bb.x, bb.y, bb.z);
      if (bb.y > 5.1) { bb.live = false; bb.s.visible = false; }
    }
    if (Math.random() < dt * 0.8) {
      bubble(-2 + Math.random() * 4, 0.3, (Math.random() - 0.5), 0.9 + Math.random(), 0.05 + Math.random() * 0.06);
    }
    headGroup.position.y = Math.sin(Date.now() / 1400) * 0.05;
    headGroup.rotation.z = Math.sin(Date.now() / 1900) * 0.02;
    // the camera breathes, which is what sells the volume
    camera.position.x = Math.sin(Date.now() / 2600) * 0.35;
    camera.lookAt(0, 2.3, 0);
  }

  function endRound(swept) {
    if (ended) return;
    ended = true;
    var landed = landedCount();
    var rung = rungFor(landed);
    var prize = rung >= 0 ? ladder[rung] : (bust || 'a pat on the back');
    setTimeout(function () {
      over = true;
      $('stage').style.display = 'none';
      document.querySelector('.btns').style.display = 'none';
      document.querySelector('.hint').style.display = 'none';
      var done = $('done');
      done.className = 'done on';
      done.innerHTML = (landed === 0)
        ? '<p class="shout">The water<br><em>won that one</em></p><p class="note">' +
          (prize ? prize + ' all the same. ' : '') + 'It resets in a moment — go again.</p>'
        : '<p class="shout">' + (swept ? 'All five!' : landed + ' ring' + (landed === 1 ? '' : 's') + ' landed') +
          '<br><em>' + prize + '</em></p>' +
          '<p class="note">' + (swept ? 'A clean sweep with ' + clockLeft.toFixed(1) + 's on the clock. ' : '') +
          'It resets in a moment — go again.</p>';
      confetti();
    }, swept ? 700 : 400);
  }

  function confetti() {
    var c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    document.body.appendChild(c);
    var x = c.getContext('2d'); x.scale(dpr, dpr);
    var bits = [];
    var CC = ['#ff5a5a', '#ffd23f', '#3ecf6e', '#4aa8ff', '#c07bff', '#ff8fd0'];
    for (var i = 0; i < 160; i++) {
      bits.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
        w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
        vy: 130 + Math.random() * 220, vx: (Math.random() - 0.5) * 60,
        a: Math.random() * 6.3, va: (Math.random() - 0.5) * 8, c: CC[i % CC.length] });
    }
    var t0 = performance.now(), prev2 = t0;
    (function rain(now) {
      var dt = Math.min(0.05, (now - prev2) / 1000); prev2 = now;
      x.clearRect(0, 0, innerWidth, innerHeight);
      var alive = false;
      for (var i2 = 0; i2 < bits.length; i2++) {
        var bt = bits[i2];
        bt.y += bt.vy * dt; bt.x += bt.vx * dt + Math.sin(bt.a * 2) * 30 * dt; bt.a += bt.va * dt;
        if (bt.y < innerHeight + 30) alive = true;
        x.save(); x.translate(bt.x, bt.y); x.rotate(bt.a);
        x.fillStyle = bt.c; x.fillRect(-bt.w / 2, -bt.h / 2, bt.w, bt.h);
        x.restore();
      }
      if (now - t0 < 2400) {
        for (var i3 = 0; i3 < bits.length; i3++) {
          if (bits[i3].y > innerHeight + 30 && now - t0 < 2000) {
            bits[i3].y = -20; bits[i3].x = Math.random() * innerWidth;
          }
        }
      }
      if (alive) requestAnimationFrame(rain);
      else { c.remove(); location.reload(); }
    })(t0);
  }

  // The hood, open: the arcade hides nothing, and the reset path stays
  // provable by script forever.
  window.__gwr3 = { rings: rings, fingers: FINGERS };

  var prev = 0;
  (function loop(now) {
    if (over) return;
    if (!prev) prev = now;
    var dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (running && !ended) {
      clockLeft -= dt;
      if (clockLeft <= 0) { clockLeft = 0; endRound(false); }
      $('clock').textContent = clockLeft.toFixed(1);
    }
    step(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })(0);
})();
</script>
</body>
</html>`;
}
