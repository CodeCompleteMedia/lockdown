// gr_osview: turns counters into the rows of stacked bars the monitor window draws.
//
// What is measured and what is modelled:
//   CPU0, CPU Wait, SysAct, Gfx   measured from this page (see stats.js)
//   RealMemoryPages               the JS heap where the browser reports it (Chromium),
//                                 otherwise a model of the station's 16384 pages
//   CPU1-3                        the station's daemons, modelled from the game state.
//                                 Browsers do not expose per-core load.
import { stats } from './stats.js';
import { game, ui } from './state.svelte.js';

export const INTERVAL = 200;   // ms; the "0.2sec" in the row labels

const BLUE = '#1600ff', RED = '#ff0000', YELLOW = '#ffff00', CYAN = '#00feff', MAGENTA = '#ff00ff', GREEN = '#0cff00';
const CPU = [['user', BLUE], ['sys', RED], ['intr', YELLOW], ['gfxf', CYAN], ['gfxc', MAGENTA], ['idle', GREEN]];
const MEM = [['fs ctl', CYAN], ['fsdirty', RED], ['fsclean', MAGENTA], ['free', GREEN], ['user', BLUE]];
const INPUT = ['pointerdown', 'pointerup', 'pointermove', 'keydown', 'keyup', 'wheel'];
const PAGE = 4096, STATION_PAGES = 16384;

const clamp = v => Math.max(0, Math.min(1, v));
// Round up to 1, 2 or 5 times a power of ten, the way osview picks a scale.
const nice = v => { const p = 10 ** Math.floor(Math.log10(v)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
const num = n => n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n));

// A row is { name, tip, legend: [[word, color]], segs: [[color, fraction]], top?, side? }.
// top is the text at the right of the label line; side is the boxes beside the bar.
function cpu(i, tip, user, sys = 0, intr = 0, gfxf = 0, gfxc = 0) {
  const parts = [user, sys, intr, gfxf, gfxc].map(clamp), sum = parts.reduce((a, b) => a + b, 0), k = sum > 1 ? 1 / sum : 1;
  return { name: `CPU${i} Usage`, tip, legend: CPU, segs: [...parts.map((p, j) => [CPU[j][1], p * k]), [GREEN, Math.max(0, 1 - sum)]] };
}

export function createMonitor() {
  let prev = { ...stats }, last = performance.now();
  const count = () => { stats.events++; };
  for (const t of INPUT) addEventListener(t, count, { capture: true, passive: true });

  // slow random walks so the modelled daemons do not look mechanical
  const drift = [.5, .5, .5];
  const wander = i => (drift[i] = clamp(drift[i] + (Math.random() - .5) * .3));
  let load0 = 0, draw0 = 0, secd = 0, dirty = 0, cache = 0;
  const peaks = { sys: [], gfx: [] };

  // A row of event counts for the interval, on a scale that follows the recent peak.
  function rate(key, name, tip, legend, counts, floor) {
    const total = counts.reduce((a, b) => a + b, 0), hist = peaks[key];
    hist.push(total); if (hist.length > 50) hist.shift();          // ten seconds
    const peak = Math.max(...hist), scale = nice(Math.max(floor, peak));
    return { name, tip, legend, segs: counts.map((c, i) => [legend[i][1], c / scale]), top: [num(scale), ''], side: [[num(peak), 'red']] };
  }

  function memory() {
    const m = performance.memory;
    if (m && m.totalJSHeapSize) {
      const total = m.totalJSHeapSize / PAGE, used = m.usedJSHeapSize / PAGE;
      return { name: 'RealMemoryPages', tip: 'Measured: this page\'s JavaScript heap, in 4 KB pages (total / in use / free).', legend: MEM,
        segs: [[BLUE, used / total], [GREEN, 1 - used / total]],
        top: [num(total), 'box'], side: [[num(used), 'red'], [num(total - used), 'blue']] };
    }
    // No heap figures in this browser: model the station's memory instead. Files that
    // have been read sit in the cache, loading a key dirties pages for a moment.
    const fsctl = 1300, user = 2300 + 350 * Object.values(ui.wins).filter(w => w.open).length;
    const free = STATION_PAGES - fsctl - user - cache - dirty;
    return { name: 'RealMemoryPages', tip: 'Modelled: the station\'s 16384 pages. This browser does not report memory use.', legend: MEM,
      segs: [[CYAN, fsctl], [RED, dirty], [MAGENTA, cache], [BLUE, user], [GREEN, free]].map(([c, p]) => [c, p / STATION_PAGES]),
      top: [num(STATION_PAGES), 'box'], side: [[num(STATION_PAGES - free), 'red'], [num(free), 'blue']] };
  }

  return {
    sample() {
      const now = performance.now(), dt = Math.max(1, now - last), d = {};
      for (const k in stats) d[k] = stats[k] - prev[k];
      prev = { ...stats }; last = now;
      const playing = game.mode === 'play' && !game.paused, contact = playing && game.drain > 1;

      // CPU0 is this page's main thread: time in the engine's frame, split at the draw.
      load0 += (d.update / dt - load0) * .5; draw0 += (d.render / dt - draw0) * .5;
      // secd works when files are opened and builds are run; the work tails off.
      secd = Math.min(.8, secd * .7 + d.iget * .3 + d.exec * .45 + d.fork * .12);
      dirty = Math.round(dirty * .85 + d.iget * 40 + d.exec * 120);
      cache = Math.min(5000, cache + d.iget * 90);

      return [
        cpu(0, 'Measured: this page\'s main thread. user = game logic, gfxc = submitting the scene to WebGL.', load0, 0, 0, 0, draw0),
        cpu(1, 'Modelled: watchdogd. Busier with each instance; sys time while one has contact with you.',
          playing ? .04 + .11 * game.watchdogs + .07 * wander(0) : .02, contact ? .3 + .15 * drift[0] : .015),
        cpu(2, 'Modelled: secd. sys time when files are opened or builds are run; climbs in the last minute.',
          playing ? (game.time < 60 ? .4 : .06) + .06 * wander(1) : .02, secd + .01),
        cpu(3, 'Modelled: life support and housekeeping.', .12 + .07 * Math.sin(now / 4000) + .06 * wander(2), .02, .015 + .02 * drift[2]),
        memory(),
        { name: 'CPU Wait', tip: 'Measured: share of the interval lost to frames that arrived late.', legend: [['io', BLUE], ['swap', YELLOW], ['pio', CYAN]], segs: [[BLUE, clamp(d.late / dt)]] },
        rate('sys', 'SysAct 0.2sec', 'Measured, per 0.2 s: input events, frames run, windows opened, commands and builds run, files opened.',
          [['syscall', BLUE], ['swtch', CYAN], ['fork', RED], ['exec', YELLOW], ['iget', MAGENTA]], [d.events, d.frames, d.fork, d.exec, d.iget], 50),
        rate('gfx', 'Gfx 0.2sec', 'Measured, per 0.2 s: WebGL draw calls, thousands of triangles, frames presented.',
          [['draw', BLUE], ['ktri', CYAN], ['swap', YELLOW]], [d.calls, d.tris / 1000, d.frames], 1000),
      ];
    },
    stop() { for (const t of INPUT) removeEventListener(t, count, { capture: true }); },
  };
}
