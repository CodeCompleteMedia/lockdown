// Putting the Macintosh on a real second display. The game stays one program in the main
// window: this opens an empty second window and draws the Macintosh desktop into it from
// here, so the clock, the sound and every bit of state are shared. Where the browser can
// say where the displays are (Chrome and Edge, with the player's permission) the window is
// placed on the other one; elsewhere it opens as an ordinary window to be dragged across.
import { mount, unmount } from 'svelte';
import { asset } from '$app/paths';
import MacDesktop from '#lib/components/mac/MacDesktop.svelte';
import { ui } from '#lib/game/state.svelte.js';
import { mac } from '#lib/game/mac.svelte.js';
import { sfx } from '#lib/game/audio.js';

const NAME = 'lockdown-macintosh';
let win = null, app = null;

// The second window's own keys: the same two the Macintosh answers to in the main window.
function keys(e) {
  if (e.repeat || e.target.tagName === 'INPUT') return;
  if (e.code === 'Escape') mac.escape(); else if (e.code === 'Enter' && mac.alert) mac.alert = null;
}

// The blank page must finish loading before anything is drawn into it.
const loaded = w => new Promise((resolve, reject) => {
  const started = Date.now();
  const timer = setInterval(() => {
    let ready = false;
    try { ready = w.closed || (w.document.readyState === 'complete' && w.location.pathname.endsWith('second.html')); } catch { /* still navigating */ }
    if (ready || Date.now() - started > 8000) { clearInterval(timer); ready && !w.closed ? resolve() : reject(new Error('second window did not load')); }
  }, 30);
});

// Move the window onto another display and fill it. Prefers the display to the left.
async function place(w, details) {
  try {
    const d = await details; if (!d) return;
    const here = d.currentScreen, others = d.screens.filter(s => s !== here);
    const there = others.find(s => s.left < here.left) || others[0];
    if (!there) return;
    w.moveTo(there.availLeft, there.availTop); w.resizeTo(there.availWidth, there.availHeight);
  } catch { /* permission refused or unsupported: the window stays where the browser put it */ }
}

function tidy() {
  if (!ui.dual) return;
  ui.dual = false;
  try { if (app) unmount(app); } catch { /* its document is already gone */ }
  app = null; win = null;
}

export async function openSecondDisplay() {
  if (win && !win.closed) return win.focus();
  // Both of these need the click that got us here, so they start before anything is awaited.
  const w = window.open(asset('second.html'), NAME, 'popup,width=960,height=720');
  const details = 'getScreenDetails' in window ? window.getScreenDetails().catch(() => null) : null;
  if (!w) {
    sfx.err();
    return ui.showDialog('second display', '<h2>WINDOW BLOCKED</h2><p>The browser stopped the second window from opening. Allow pop-ups for this site, then try again.</p>', 'OK', null);
  }
  try { await loaded(w); } catch { return; }
  win = w;
  // the page arrives bare: give it the game's stylesheets, then the Macintosh
  for (const node of document.querySelectorAll('style, link[rel="stylesheet"]')) {
    const copy = w.document.importNode(node, true);
    if (copy.tagName === 'LINK') copy.href = node.href;
    w.document.head.appendChild(copy);
  }
  ui.dual = true; ui.monitor = 'right'; ui.closeMenu();
  app = mount(MacDesktop, { target: w.document.body });
  w.addEventListener('keydown', keys);
  w.addEventListener('pagehide', tidy);          // the player closed it: back to one display
  place(w, details);
}

export function closeSecondDisplay() {
  const w = win;
  tidy();
  try { w?.close(); } catch { /* already closed */ }
}
export const toggleSecondDisplay = () => ui.dual ? closeSecondDisplay() : openSecondDisplay();

// Full screen for whichever window the element is in.
export function toggleFullScreen(el) {
  const doc = el.ownerDocument;
  if (doc.fullscreenElement) doc.exitFullscreen?.(); else doc.documentElement.requestFullscreen?.().catch(() => {});
}

// Keep ui.extended in step with whether the desktop spans more than one display, where the
// browser can tell. Returns a function that stops watching.
export function watchDisplays() {
  const update = () => { ui.extended = screen.isExtended === true; };
  update();
  screen.addEventListener?.('change', update);
  const bye = () => { try { win?.close(); } catch { /* nothing to close */ } };
  addEventListener('pagehide', bye);
  return () => { screen.removeEventListener?.('change', update); removeEventListener('pagehide', bye); };
}
