// The 3D chess board: a second view of the game in session.svelte.js. It draws only when
// something changes (a move, a selection, the camera), so it costs nothing while it sits idle.
import * as THREE from 'three';
import { isWhite } from './rules.js';

const CREAM = 0xeadcb6, PURPLE = 0x7b45a6;
const where = sq => [(sq & 7) - 3.5, (sq >> 3) - 3.5];          // files along x, rank 8 at the far (-z) side

/* ------------------------------------------------------------------ pieces */
// Most pieces are a profile [radius, height] turned on a lathe; one square is 1 unit wide.
const foot = r => [[0, 0], [r, 0], [r, .07], [r * .8, .12], [r * .55, .2]];
const ball = (y, r) => Array.from({ length: 9 }, (_, i) => { const a = -1 + i * (Math.PI / 2 + 1) / 8; return [r * Math.cos(a), y + r * Math.sin(a)]; });
const PROFILE = {
  p: [...foot(.3), [.11, .42], [.19, .46], [.11, .5], ...ball(.66, .17)],
  r: [...foot(.34), [.2, .3], [.19, .7], [.28, .74], [.28, .98], [.2, .98], [.2, .88], [0, .88]],
  n: [...foot(.34), [.21, .26], [.23, .32], [0, .32]],
  b: [...foot(.34), [.13, .5], [.11, .78], [.2, .82], [.12, .86], [.17, .98], [.16, 1.08], [.08, 1.22], [.05, 1.27], ...ball(1.31, .05)],
  q: [...foot(.36), [.14, .55], [.12, .98], [.22, 1.02], [.13, 1.06], [.2, 1.3], [.24, 1.34], [.14, 1.34], [.06, 1.38], ...ball(1.43, .07)],
  k: [...foot(.36), [.15, .6], [.13, 1.08], [.23, 1.12], [.14, 1.16], [.2, 1.38], [.22, 1.42], [0, 1.44]],
};
// The knight's head is a silhouette facing +x, given some thickness.
const HEAD = [[-.2, .3], [.2, .3], [.12, .5], [.14, .62], [.32, .62], [.36, .74], [.16, 1.0], [.1, 1.14], [.02, 1.0], [-.14, .9], [-.22, .6]];

const partsCache = {};
function partsOf(type) {
  if (partsCache[type]) return partsCache[type];
  const parts = [new THREE.LatheGeometry(PROFILE[type].map(([r, y]) => new THREE.Vector2(r, y)), 24)];
  if (type === 'n') {
    const head = new THREE.ExtrudeGeometry(new THREE.Shape(HEAD.map(([x, y]) => new THREE.Vector2(x, y))), { depth: .16, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 1 });
    parts.push(head.translate(0, 0, -.08));
  }
  if (type === 'k') parts.push(new THREE.BoxGeometry(.07, .3, .07).translate(0, 1.58, 0), new THREE.BoxGeometry(.22, .07, .07).translate(0, 1.61, 0));
  return (partsCache[type] = parts);
}

export function createBoard3D(canvas, host, hooks) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x27a2ad);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1); sun.position.set(4, 10, 6); scene.add(sun);

  /* ---------------------------------------------------------------- board */
  const slab = new THREE.Mesh(new THREE.BoxGeometry(8.5, .3, 8.5), new THREE.MeshLambertMaterial({ color: 0x1b2226 }));
  slab.position.y = -.152; scene.add(slab);
  const tile = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const LIGHT = new THREE.MeshLambertMaterial({ color: 0xcfe6e2 }), DARK = new THREE.MeshLambertMaterial({ color: 0x14181b });
  const pickables = [];
  for (let sq = 0; sq < 64; sq++) {
    const m = new THREE.Mesh(tile, ((sq >> 3) + (sq & 7)) % 2 ? DARK : LIGHT), [x, z] = where(sq);
    m.position.set(x, 0, z); m.userData.sq = sq; scene.add(m); pickables.push(m);
  }
  // flat markers laid just above the squares
  const flat = (geo, color, opacity, y) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); m.position.y = y; m.visible = false; scene.add(m); return m; };
  const lastMarks = [flat(tile, 0xffe27a, .3, .004), flat(tile, 0xffe27a, .3, .004)];
  const selMark = flat(tile, 0xffe27a, .6, .006);
  const dotGeo = new THREE.CircleGeometry(.17, 20).rotateX(-Math.PI / 2), ringGeo = new THREE.RingGeometry(.37, .47, 28).rotateX(-Math.PI / 2);
  const dots = [], rings = [];
  const mark = (pool, geo, color, sq) => {
    const m = pool.find(d => !d.visible) || (pool.push(flat(geo, color, .9, .008)), pool.at(-1));
    const [x, z] = where(sq); m.position.x = x; m.position.z = z; m.visible = true;
  };
  const put = (m, sq) => { const [x, z] = where(sq); m.position.x = x; m.position.z = z; m.visible = true; };

  /* --------------------------------------------------------------- pieces */
  const MAT = { w: new THREE.MeshPhongMaterial({ color: CREAM, specular: 0x555555, shininess: 45, side: THREE.DoubleSide }),
                b: new THREE.MeshPhongMaterial({ color: PURPLE, specular: 0x555555, shininess: 45, side: THREE.DoubleSide }) };
  const at = new Array(64).fill(null);          // the piece object standing on each square
  let tweens = [];

  function piece(ch, sq) {
    const g = new THREE.Group(), W = isWhite(ch);
    for (const geo of partsOf(ch.toLowerCase())) g.add(new THREE.Mesh(geo, MAT[W ? 'w' : 'b']));
    if (ch.toLowerCase() === 'n') g.rotation.y = W ? Math.PI / 2 : -Math.PI / 2;      // knights face the enemy
    const [x, z] = where(sq); g.position.set(x, 0, z); g.userData = { ch, sq };
    scene.add(g); pickables.push(g); return g;
  }
  function remove(g) { scene.remove(g); const i = pickables.indexOf(g); if (i >= 0) pickables.splice(i, 1); }

  function slide(from, to, becomes) {
    let g = at[from]; if (!g) return;
    if (becomes) { remove(g); g = piece(becomes, from); }       // a promoting pawn changes on the way
    const victim = at[to], [x, z] = where(to);
    at[to] = g; at[from] = null; g.userData.sq = to;
    tweens.push({ g, x0: g.position.x, z0: g.position.z, x, z, t: 0, hop: g.userData.ch.toLowerCase() === 'n' ? .9 : .3, victim });
  }
  function settle() {      // jump any move still in flight to its end
    for (const tw of tweens) { tw.g.position.set(tw.x, 0, tw.z); if (tw.victim) remove(tw.victim); }
    tweens = [];
  }

  /* ------------------------------------------------------------ selection */
  let selected = -1, targets = [];
  function select(sq) {
    if (selected >= 0 && at[selected] && !tweens.some(t => t.g === at[selected])) at[selected].position.y = 0;
    selected = sq; targets = sq >= 0 ? hooks.movesFrom(sq) : [];
    if (!targets.length) selected = -1;
    for (const d of [...dots, ...rings]) d.visible = false;
    selMark.visible = false;
    if (selected >= 0) {
      put(selMark, selected); at[selected].position.y = .18;
      for (const sqTo of new Set(targets.map(m => m.to))) targets.find(m => m.to === sqTo).cap !== '.' ? mark(rings, ringGeo, 0xff3355, sqTo) : mark(dots, dotGeo, 0x22c85a, sqTo);
    }
    draw();
  }
  function clickSquare(sq) {
    const moves = targets.filter(m => m.to === sq);
    if (selected >= 0 && moves.length) {
      const m = moves.find(m => m.promo === 'q') || moves[0];     // promotion takes a queen; type e8=N in the text window for anything else
      select(-1); hooks.play(m); return;
    }
    select(sq === selected ? -1 : sq);
  }

  /* --------------------------------------------------------------- camera */
  let side = 'w', flipped = false, yaw = .55, pitch = .62, dist = 13.5;
  function aim() {
    const a = yaw + (side === 'b' ? Math.PI : 0) + (flipped ? Math.PI : 0);
    camera.position.set(dist * Math.cos(pitch) * Math.sin(a), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.cos(a));
    camera.lookAt(0, .2, 0);
  }

  /* ----------------------------------------------------------------- draw */
  let raf = 0, lastT = 0;
  function draw() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;                                         // window hidden; the resize observer redraws when it returns
    if (canvas.width !== w || canvas.height !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
    for (const tw of tweens) {
      tw.t = Math.min(1, tw.t + dt / .32);
      const k = tw.t * tw.t * (3 - 2 * tw.t);
      tw.g.position.set(tw.x0 + (tw.x - tw.x0) * k, Math.sin(Math.PI * k) * tw.hop, tw.z0 + (tw.z - tw.z0) * k);
      if (tw.t >= 1 && tw.victim) remove(tw.victim);
    }
    tweens = tweens.filter(tw => tw.t < 1);
    aim(); renderer.render(scene, camera);
    if (tweens.length) draw(); else lastT = 0;
  }
  const observer = new ResizeObserver(draw); observer.observe(host);

  /* ---------------------------------------------------------------- input */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function squareAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let o = ray.intersectObjects(pickables, true)[0]?.object;
    while (o && o.userData.sq === undefined) o = o.parent;
    return o ? o.userData.sq : -1;
  }
  let ptr = null;
  const listeners = {
    pointerdown: e => { canvas.setPointerCapture(e.pointerId); ptr = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, drag: false }; },
    pointermove: e => {
      if (!ptr) return;
      if (!ptr.drag && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 4) ptr.drag = true;
      if (ptr.drag) {
        yaw -= (e.clientX - ptr.x) * .008; pitch = Math.max(.18, Math.min(1.5, pitch + (e.clientY - ptr.y) * .008));
        draw();
      }
      ptr.x = e.clientX; ptr.y = e.clientY;
    },
    pointerup: e => { const p = ptr; ptr = null; if (p && !p.drag) { const sq = squareAt(e); sq >= 0 ? clickSquare(sq) : select(-1); } },
    pointercancel: () => { ptr = null; },
    wheel: e => { e.preventDefault(); dist = Math.max(7, Math.min(24, dist * (e.deltaY > 0 ? 1.08 : .93))); draw(); },
  };
  for (const [type, fn] of Object.entries(listeners)) canvas.addEventListener(type, fn, { passive: false });

  return {
    // Show a position. `last` is the move that led to it, if it should be animated.
    show(position, last, human) {
      settle();
      if (human !== side) { side = human; flipped = false; }
      if (last && at[last.from]?.userData.ch === last.piece) {
        slide(last.from, last.to, last.promo && (isWhite(last.piece) ? last.promo.toUpperCase() : last.promo));
        if (last.flag === 'castle') last.to > last.from ? slide(last.to + 1, last.to - 1) : slide(last.to - 2, last.to + 1);
      }
      // then make every other square agree with the position
      for (let sq = 0; sq < 64; sq++) {
        const want = position.b[sq], have = at[sq];
        if (have && have.userData.ch === want) continue;
        if (have) { remove(have); at[sq] = null; }
        if (want !== '.') at[sq] = piece(want, sq);
      }
      lastMarks.forEach((m, i) => { m.visible = false; if (last) put(m, i ? last.to : last.from); });
      select(-1);
    },
    flip() { flipped = !flipped; draw(); },
    resetView() { yaw = .55; pitch = .62; dist = 13.5; flipped = false; draw(); },
    dispose() {
      cancelAnimationFrame(raf); observer.disconnect();
      for (const [type, fn] of Object.entries(listeners)) canvas.removeEventListener(type, fn);
      renderer.dispose();
    },
  };
}
