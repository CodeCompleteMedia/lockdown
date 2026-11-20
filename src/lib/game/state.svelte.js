// Reactive state shared by the 3D engine, the game rules and the desktop UI.
import { flushSync } from 'svelte';
import { ROOT } from './fs.js';
import { sfx } from './audio.js';
import { stats } from './stats.js';

export const START_TIME = 300;

export const fmt = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0'); };

// sel, hover and cwd hold the live file / directory objects from fs.js. They are
// $state.raw so they are never proxied: the engine compares them by identity.
class Game {
  mode = $state('intro');            // intro | play | won | lost
  time = $state(START_TIME);
  keys = $state([]);                 // names of the staff whose signature keys are loaded
  sel = $state.raw(null);
  hover = $state.raw(null);
  cwd = $state.raw(ROOT);
  drain = $state(1);                 // clock multiplier; 3 while a watchdog has contact
  alarm = $state(false);
  paused = $state(false);
  soundOn = $state(true);
  timerHit = $state(false);
  watchdogs = $state(0);
  hoverTag = $state('');
  hot = $state(false);               // pointer is over something clickable in the 3D view
  dragging = $state(false);
  logs = $state.raw([]);             // { id, msg, cls }
}
export const game = new Game();

let logId = 0;
export function log(msg, cls = '') {
  game.logs = [...game.logs, { id: ++logId, msg, cls }].slice(-200);
}

// Desktop chrome: windows, the pop-up menu, the modal dialog.
//
// A window is open or closed; an open one may be minimized (shown as an icon tile instead)
// or maximized. rect is its geometry in px. h: null means "as tall as the content", and
// rect: null means the window still has its stylesheet default (the navigator, which
// tracks the viewport until it is first moved or resized).
const win = (x, y, w) => ({ open: false, min: false, max: false, z: 20, rect: { x, y, w, h: null } });
class Desktop {
  wins = $state({
    main: { open: true, min: false, max: false, z: 10, rect: null },
    viewer: win(190, 150, 520),
    find: win(200, 140, 430),
    conwin: win(240, 180, 580),
    sysman: win(280, 130, 430),
    osview: win(150, 70, 400),
    chess: win(330, 90, 350),
    chess3d: win(700, 120, 470),
    calc: win(150, 300, 240),
    imgview: win(420, 60, 330),
  });
  zTop = 20;
  dual = $state(false);              // the Macintosh is in a window of its own, on a second display
  extended = $state(false);          // the browser reports that the desktop spans more than one display
  monitor = $state('right');         // which of the two monitors is on screen: 'right' is the workstation, 'left' the Macintosh
  menu = $state.raw(null);           // { key, items, anchor: the button it hangs from, below? }
  dialog = $state.raw(null);         // { title, html, btn, action }
  viewer = $state.raw({ title: 'view', text: '' });
  image = $state.raw({ title: 'image', src: '' });
  findQ = $state('');
  findRes = $state.raw([]);
  findNote = $state('Type part of a name or path.');
  conCleared = $state(0);            // the console window hides log lines up to this id

  shown(id) { const w = this.wins[id]; return w.open && !w.min; }
  // The navigator always stays beneath the other windows: it fills the desktop, and
  // clicking in the 3D view should not bury the file you are reading.
  raise(id) { if (id !== 'main') this.wins[id].z = ++this.zTop; }
  // Opens, or restores from an icon. Flushes so callers can focus or scroll inside straight away.
  open(id) { const w = this.wins[id]; if (!w.open) stats.fork++; w.open = true; w.min = false; this.raise(id); flushSync(); }
  close(id) { const w = this.wins[id]; if (w.open) { w.open = false; w.min = false; sfx.close(); } }
  minimize(id) { if (this.shown(id)) { this.wins[id].min = true; sfx.close(); } }
  toggleMax(id) { this.wins[id].max = !this.wins[id].max; }
  closeMenu() { this.menu = null; }
  // Escape closes the menu, then the front-most window. Never the navigator.
  escape() {
    if (this.menu) return this.closeMenu();
    const top = Object.keys(this.wins).filter(id => id !== 'main' && this.shown(id)).sort((a, b) => this.wins[b].z - this.wins[a].z)[0];
    if (top) this.close(top);
  }
  showDialog(title, html, btn, action) { this.dialog = { title, html, btn, action }; }
  dialogOk() { const d = this.dialog; this.dialog = null; d?.action?.(); }
}
export const ui = new Desktop();

// DOM nodes the actions need to focus or scroll. Filled in by the components.
export const refs = {};
