// The 3D file system view: scene, camera flight, watchdogs, picking and the frame loop.
// It owns everything three.js. Game rules live in actions.js and reach in through the
// object createEngine() returns; the engine calls back through `hooks`.
import * as THREE from 'three';
import { nodeList, ROOT, TYPES, CELL, BOUND, pick } from './fs.js';
import { game, START_TIME } from './state.svelte.js';
import { sfx, hum } from './audio.js';
import { stats } from './stats.js';

const WD_RANGE = 34;

// Movement keys currently held. Filled by keyboard.js.
export const keysDown = new Set();

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} view  the element the canvas fills; watched for resizes
 * @param {{ select: (f: any) => void, activate: (f: any) => void, lose: () => void }} hooks
 */
export function createEngine(canvas, view, hooks) {
  /* ----------------------------------------------------------------- scene */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  const HORIZON = new THREE.Color(0x17506c), ZENITH = new THREE.Color(0x01030a);
  scene.fog = new THREE.Fog(HORIZON.getHex(), 220, 1250);
  const camera = new THREE.PerspectiveCamera(58, 1, 1, 5000);
  camera.rotation.order = 'YXZ';

  // sky dome with a vertical gradient
  const skyGeo = new THREE.SphereGeometry(2400, 24, 14);
  {
    const pos = skyGeo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.max(0, pos.getY(i) / 2400);
      c.copy(HORIZON).lerp(ZENITH, Math.pow(t, .45)); col.set([c.r, c.g, c.b], i * 3);
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  scene.add(sky);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshBasicMaterial({ color: 0x03101a }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.05; scene.add(ground);
  const gridFine = new THREE.GridHelper(2400, 240, 0x0c6676, 0x0c6676); gridFine.position.set(0, 0, -120);
  const gridBig = new THREE.GridHelper(2400, 48, 0x35f0e0, 0x35f0e0); gridBig.position.set(0, .03, -120);
  scene.add(gridFine, gridBig);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(.5, 1, .8); scene.add(sun);

  function makeLabel(text, color, height) {
    const px = 44, c = document.createElement('canvas'), g = c.getContext('2d');
    const font = `bold ${px}px Helvetica, Arial, sans-serif`;
    g.font = font; c.width = Math.ceil(g.measureText(text).width) + 20; c.height = px + 18;
    g.font = font; g.textBaseline = 'middle';
    g.lineWidth = 7; g.strokeStyle = 'rgba(0,6,12,.9)'; g.strokeText(text, 10, c.height / 2);
    g.fillStyle = color; g.fillText(text, 10, c.height / 2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    s.userData.base = [height * c.width / c.height, height];
    s.scale.set(s.userData.base[0], height, 1); s.center.set(.5, 0);
    return s;
  }

  // Directories are pedestals, files are blocks standing on them. Each fs node and file
  // keeps a reference to its mesh, edges and label.
  const unitBox = new THREE.BoxGeometry(1, 1, 1), unitEdges = new THREE.EdgesGeometry(unitBox);
  const pickables = [];
  const linkPts = [];

  for (const n of nodeList) {
    const m = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: 0x23468c, flatShading: true }));
    m.scale.set(n.w, 2, n.d); m.position.set(n.x, 1, n.z); m.userData = { dir: n };
    n.edges = new THREE.LineSegments(unitEdges, new THREE.LineBasicMaterial({ color: 0x4fd8ff }));
    m.add(n.edges); scene.add(m); pickables.push(m); n.mesh = m;
    n.label = makeLabel(n.name, '#bff4ff', 4.2); n.label.position.set(n.x, .4, n.z + n.d / 2 + 2.5); scene.add(n.label);
    if (n.parent) linkPts.push(n.parent.x, .25, n.parent.z - n.parent.d / 2, n.x, .25, n.z + n.d / 2);

    n.files.forEach((f, i) => {
      const t = TYPES[f.type], h = Math.min(13, 2 + Math.log2(f.kb + 1) * 1.25);
      const fm = new THREE.Mesh(unitBox, new THREE.MeshLambertMaterial({ color: t.color, emissive: t.color, emissiveIntensity: .18, flatShading: true }));
      const col = i % 2, row = Math.floor(i / 2), rows = Math.ceil(n.files.length / 2);
      const fx = n.x + (col - .5) * CELL, fz = n.z + (row - (rows - 1) / 2) * CELL;
      fm.scale.set(4.2, h, 4.2); fm.position.set(fx, 2 + h / 2, fz); fm.userData = { file: f };
      f.edges = new THREE.LineSegments(unitEdges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75 }));
      fm.add(f.edges); scene.add(fm); pickables.push(fm);
      f.mesh = fm; f.h = h; f.top = new THREE.Vector3(fx, 2 + h, fz);
      f.label = makeLabel(f.name, f.type === 'key' ? '#ffe27a' : f.type === 'cmd' ? '#ff9aa8' : '#ffffff', 1.5);
      f.label.position.set(fx, 2 + h + .5 + col * 1.7, fz); f.label.visible = false; scene.add(f.label);
    });
  }
  {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(linkPts, 3));
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffe27a })));
  }

  // selection beam
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.3, 3.2, 70, 4, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.visible = false; scene.add(beam);

  /* ------------------------------------------------------------- watchdogs */
  const watchdogs = [];
  function spawnWatchdog(at) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(5.5), new THREE.MeshBasicMaterial({ color: 0xff2040, wireframe: true, fog: false })));
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(2.4), new THREE.MeshBasicMaterial({ color: 0xff6070, fog: false })));
    const ring = new THREE.Mesh(new THREE.RingGeometry(WD_RANGE - .8, WD_RANGE, 56),
      new THREE.MeshBasicMaterial({ color: 0xff2040, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = -13.6; g.add(ring);
    g.position.set(at.x, 14, at.z); scene.add(g);
    watchdogs.push({ g, ring, from: at, to: at, prev: null, t: 1 });
    game.watchdogs = watchdogs.length;
  }
  function stepWatchdog(w, dt) {
    if (w.t >= 1) {
      const here = w.to, nb = [here.parent, ...here.children].filter(Boolean);
      let next;
      if (Math.random() < .3) next = nb.reduce((a, b) => Math.hypot(a.x - camera.position.x, a.z - camera.position.z) < Math.hypot(b.x - camera.position.x, b.z - camera.position.z) ? a : b);
      else { const fresh = nb.filter(n => n !== w.prev); next = pick(fresh.length ? fresh : nb); }
      w.prev = here; w.from = here; w.to = next; w.t = 0;
    }
    const dist = Math.hypot(w.to.x - w.from.x, w.to.z - w.from.z) || 1;
    w.t = Math.min(1, w.t + 18 * dt / dist);
    w.g.position.x = w.from.x + (w.to.x - w.from.x) * w.t;
    w.g.position.z = w.from.z + (w.to.z - w.from.z) * w.t;
    w.g.children[0].rotation.y += dt * 1.8; w.g.children[1].rotation.y -= dt * 3;
    w.g.position.y = 14 + Math.sin(performance.now() / 300) * 1.2; w.ring.position.y = .3 - w.g.position.y;
  }

  /* ---------------------------------------------------------------- camera */
  let yaw = 0, pitch = 0, tween = null, speed = 0;

  function aimAt(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    return [Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))];
  }
  function flyTo(pos, look, quiet) {
    const [y1, x1] = aimAt(pos, look);
    let dy = (y1 - yaw) % (Math.PI * 2); if (dy > Math.PI) dy -= Math.PI * 2; if (dy < -Math.PI) dy += Math.PI * 2;
    const dist = camera.position.distanceTo(pos);
    tween = { p0: camera.position.clone(), p1: pos, y0: yaw, y1: yaw + dy, x0: pitch, x1, t: 0, dur: Math.min(2.2, Math.max(.6, dist / 190)) };
    if (!quiet) sfx.fly();
  }
  function flyToDir(n) {
    flyTo(new THREE.Vector3(n.x, 17 + n.d * .35, n.z + n.d / 2 + 30), new THREE.Vector3(n.x, 3, n.z));
  }
  function overview() { flyTo(new THREE.Vector3(0, 330, 210), new THREE.Vector3(0, 0, -150)); }

  camera.position.set(ROOT.x, 70, 120);
  [yaw, pitch] = aimAt(camera.position, new THREE.Vector3(ROOT.x, 0, -40));

  /* ----------------------------------------------------------------- input */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData : null;
  }
  let ptr = null, lastClick = { f: null, t: 0 };
  const listeners = {
    pointerdown: e => {
      if (game.mode !== 'play') return;
      canvas.setPointerCapture(e.pointerId);
      ptr = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, drag: false };
    },
    pointermove: e => {
      if (game.mode !== 'play') return;
      if (ptr) {
        if (!ptr.drag && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 5) { ptr.drag = true; tween = null; game.dragging = true; }
        if (ptr.drag) {
          yaw -= (e.clientX - ptr.x) * .0042;
          pitch = Math.max(-1.45, Math.min(1.2, pitch - (e.clientY - ptr.y) * .0042));
        }
        ptr.x = e.clientX; ptr.y = e.clientY; return;
      }
      const u = pickAt(e);
      game.hover = u && u.file || null;
      game.hot = !!u;
      game.hoverTag = u ? (u.file ? u.file.path : u.dir.path + (u.dir.path === '/' ? '' : '/')) : '';
    },
    pointerup: e => {
      const p = ptr; ptr = null; game.dragging = false;
      if (!p || p.drag || game.mode !== 'play') return;
      const u = pickAt(e);
      if (!u) { hooks.select(null); return; }
      if (u.dir) { flyToDir(u.dir); return; }
      const f = u.file, now = performance.now();
      if (lastClick.f === f && now - lastClick.t < 420) { lastClick.f = null; hooks.activate(f); return; }
      lastClick = { f, t: now };
      hooks.select(f);
      if (camera.position.distanceTo(f.top) > 75) flyToDir(f.dir);
    },
    pointercancel: () => { ptr = null; game.dragging = false; },
    pointerleave: () => { if (!ptr) { game.hover = null; game.hoverTag = ''; } },
  };
  for (const [type, fn] of Object.entries(listeners)) canvas.addEventListener(type, fn);

  /* ------------------------------------------------------------------ loop */
  function resize() {
    const w = view.clientWidth, h = view.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(view); resize();

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), probe = new THREE.Vector3();
  let last = performance.now(), alarmT = 0, lastWhole = Math.ceil(START_TIME * 2), raf = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const began = performance.now(), gap = now - last;
    if (gap > 34) stats.late += Math.min(gap, 1000) - 16.7;
    const dt = Math.max(0, Math.min(.05, gap / 1000)); last = now;
    const playing = game.mode === 'play' && !game.paused;

    if (playing) {
      // flight
      const prev = probe.copy(camera.position).clone();
      if (tween) {
        const tw = tween; tw.t = Math.min(1, tw.t + dt / tw.dur);
        const k = tw.t * tw.t * (3 - 2 * tw.t);
        camera.position.lerpVectors(tw.p0, tw.p1, k);
        yaw = tw.y0 + (tw.y1 - tw.y0) * k; pitch = tw.x0 + (tw.x1 - tw.x0) * k;
        if (tw.t >= 1) tween = null;
      } else {
        const K = c => keysDown.has(c) ? 1 : 0;
        yaw += (K('ArrowLeft') - K('ArrowRight')) * 1.7 * dt;
        const f = K('KeyW') + K('ArrowUp') - K('KeyS') - K('ArrowDown'), s = K('KeyD') - K('KeyA'), v = K('KeyR') + K('Space') - K('KeyF');
        const sp = (keysDown.has('Shift') ? 130 : 58) * dt;
        fwd.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
        right.set(Math.cos(yaw), 0, -Math.sin(yaw));
        camera.position.addScaledVector(fwd, f * sp).addScaledVector(right, s * sp);
        camera.position.y += v * sp * .8;
      }
      camera.position.x = Math.max(BOUND.x0, Math.min(BOUND.x1, camera.position.x));
      camera.position.z = Math.max(BOUND.z0, Math.min(BOUND.z1, camera.position.z));
      camera.position.y = Math.max(5, Math.min(340, camera.position.y));
      speed = camera.position.distanceTo(prev) / Math.max(dt, .001);

      // watchdogs + clock
      let contact = false;
      for (const w of watchdogs) {
        stepWatchdog(w, dt);
        if (camera.position.y < 110 && Math.hypot(w.g.position.x - camera.position.x, w.g.position.z - camera.position.z) < WD_RANGE) contact = true;
      }
      game.drain = contact ? 3 : 1;
      game.alarm = contact;
      if (contact) { alarmT -= dt; if (alarmT <= 0) { sfx.alarm(); alarmT = .4; } } else alarmT = 0;

      let time = game.time - dt * game.drain;
      game.time = time;
      const half = Math.ceil(time * 2);
      if (half < lastWhole) {
        if (time < 10 || (time < 60 && half % 2 === 0)) sfx.tick();
        lastWhole = half;
      }
      if (time <= 0) hooks.lose();

      // current directory = nearest pedestal to a point just ahead of the camera
      const ax = camera.position.x - Math.sin(yaw) * 30, az = camera.position.z - Math.cos(yaw) * 30;
      let cwd = game.cwd, best = cwd, bd = 1e9;
      for (const n of nodeList) { const d = Math.hypot(n.x - ax, n.z - az); if (d < bd) { bd = d; best = n; } }
      if (best !== cwd) {
        cwd.edges.material.color.set(0x4fd8ff); cwd.mesh.material.color.set(0x23468c);
        game.cwd = cwd = best;
      }
      cwd.edges.material.color.set(0xffffff); cwd.mesh.material.color.set(0x2f5cb8);
    } else speed = 0;

    hum(speed);

    camera.rotation.set(pitch, yaw, 0);
    sky.position.copy(camera.position);

    // labels: directory names grow with distance so the overview stays readable
    const sel = game.sel, hover = game.hover;
    for (const n of nodeList) {
      const k = Math.max(1, Math.min(4.5, camera.position.distanceTo(n.label.position) / 120));
      n.label.scale.set(n.label.userData.base[0] * k, n.label.userData.base[1] * k, 1);
      for (const f of n.files) {
        f.label.visible = f === sel || f === hover || camera.position.distanceTo(f.top) < 95;
        f.mesh.material.emissiveIntensity = f.dead ? 0 : f === hover ? .7 : f === sel ? .5 : f.type === 'key' ? .3 + .25 * Math.sin(now / 160) : .18;
      }
    }
    if (beam.visible) { beam.rotation.y += dt * 1.5; beam.material.opacity = .22 + .1 * Math.sin(now / 140); }

    const drawn = performance.now();
    renderer.render(scene, camera);
    stats.update += drawn - began; stats.render += performance.now() - drawn; stats.frames++;
    stats.calls += renderer.info.render.calls; stats.tris += renderer.info.render.triangles;
  }
  raf = requestAnimationFrame(frame);

  return {
    flyToDir,
    overview,
    spawnWatchdog,
    cancelTween() { tween = null; },
    // Restart frame timing so the time spent in a dialog is not charged to the clock.
    resetClock() { last = performance.now(); },
    // Move the selection beam onto a file, or hide it.
    beamTo(f) {
      beam.visible = !!f;
      if (f) beam.position.set(f.top.x, f.top.y + 35, f.top.z);
    },
    dimRead(f) { f.edges.material.opacity = .25; },
    quarantine(f) { f.mesh.material.color.set(0x444850); f.mesh.material.emissive.set(0x000000); },
    removeFile(f) { scene.remove(f.mesh, f.label); pickables.splice(pickables.indexOf(f.mesh), 1); },
    allClear() {
      gridBig.material.color.set(0x40ff90); gridFine.material.color.set(0x0c7040);
      for (const w of watchdogs) scene.remove(w.g);
    },
    dispose() {
      cancelAnimationFrame(raf); observer.disconnect();
      for (const [type, fn] of Object.entries(listeners)) canvas.removeEventListener(type, fn);
      renderer.dispose();
    },
  };
}
