// The Macintosh on the left monitor: its windows, which has focus, and opening things.
import { ui } from './state.svelte.js';
import { keysDown } from './engine.js';
import { sfx } from './audio.js';
import { IMAGES } from './images.js';

export const MENUBAR = 20;      // height of the menu bar; windows stay below it

class Mac {
  // id -> { kind: 'list' | 'text' | 'image' | 'anim', title, node, open, shade, zoom, z, rect, ... }
  wins = $state({});
  focus = $state(null);          // the window in front, or null when the desktop has focus
  selected = $state(null);       // the highlighted icon or list row, by key
  expanded = $state({});         // folders opened in place in list views, by path
  alert = $state(null);          // text of the alert box, when one is up
  onOpen = null;                 // what File > Open does for the current selection
  zTop = 1; made = 0;
  screenEl = null;               // the Macintosh's screen element, wherever it is being drawn

  // The size of the Macintosh's screen. It may be in a second window, so never the main window's size.
  size() { const r = this.screenEl?.getBoundingClientRect(); return { w: r?.width || innerWidth, h: r?.height || innerHeight }; }

  front(id) { this.wins[id].z = ++this.zTop; this.focus = id; }
  close(id) {
    this.wins[id].open = false; sfx.close();
    if (this.focus === id) this.focus = Object.keys(this.wins).filter(k => this.wins[k].open).sort((a, b) => this.wins[b].z - this.wins[a].z)[0] ?? null;
  }
  closeFront() { if (this.focus) this.close(this.focus); }
  zoom(id) { this.wins[id].zoom = !this.wins[id].zoom; }
  // the window rolls up into its title bar: this machine's way of getting a window out of the way
  shade(id) { this.wins[id].shade = !this.wins[id].shade; }
  escape() { if (this.alert) this.alert = null; else this.closeFront(); }

  // Icons and rows: the first click selects, a click on the selected one opens it.
  click(key, open) {
    if (this.selected !== key) { this.selected = key; this.onOpen = open; return; }
    this.selected = null; this.onOpen = null; open();
  }
  openSelected() { const open = this.onOpen; this.selected = null; this.onOpen = null; open?.(); }

  // Bring a window to the front, making it first if this is the first time. Each new
  // window opens a little down and right of the last, as the Finder staggers them.
  show(id, make) {
    if (!this.wins[id]) {
      const n = this.made++ % 8, w = make();
      w.rect.h = Math.min(w.rect.h, this.size().h - 70);
      this.wins[id] = { open: true, shade: false, zoom: false, z: 1, ...w, rect: { x: 70 + n * 26, y: 46 + n * 22, ...w.rect } };
    }
    this.wins[id].open = true; this.wins[id].shade = false; this.front(id);
  }

  // Open a file or folder from the disk. `path` identifies it, so opening it twice finds the same window.
  open(node, path) {
    const what = node.open;
    if (node.kind === 'folder') return this.show('list:' + path, () => ({ kind: 'list', title: node.name, node, path, rect: { w: 554, h: node === ROOT_SIZED ? 560 : 260 } }));
    if (what?.text) return this.show('text:' + path, () => ({ kind: 'text', title: node.name, text: what.text, rect: { w: 400, h: 280 } }));
    if (what?.image) return this.show('image:' + path, () => ({ kind: 'image', title: node.name, src: IMAGES[what.image], aspect: null, rect: { w: 300, h: 380 } }));
    if (what?.anim) return this.show('anim:' + path, () => {
      // the movie opens big and square, in the middle of the screen, shrunk only to fit it
      const s = this.size(), w = Math.round(Math.max(180, Math.min(780, s.w - 16, s.h - 52))), h = w + 18;
      return { kind: 'anim', title: node.name, rect: { w, h, x: Math.max(4, Math.round((s.w - w) / 2)), y: Math.max(24, Math.round(20 + (s.h - 20 - h) / 2)) } };
    });
    sfx.err();
    this.alert = node.kind === 'application program'
      ? `The application program “${node.name}” could not be opened, because there is not enough memory available.`
      : `The document “${node.name}” could not be opened, because the application program that created it could not be found.`;
  }
}
// The disk's own window opens tall; MacDesktop says which folder that is.
let ROOT_SIZED = null;
export const tallWindowFor = node => { ROOT_SIZED = node; };

export const mac = new Mac();

// Slide to the other monitor.
export function lookAt(side) {
  if (ui.monitor === side) return;
  ui.monitor = side; ui.closeMenu(); keysDown.clear(); sfx.fly();
}
