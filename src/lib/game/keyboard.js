// Window-level keyboard handling: flight keys, shortcuts, and dismissing things.
import { ROOT } from './fs.js';
import { game, ui } from './state.svelte.js';
import { keysDown } from './engine.js';
import { activate, cancelTween, closeViewer, flyToDir, flyUp, overview } from './actions.js';
import { mac } from './mac.svelte.js';
import { power } from './power.svelte.js';

const MOVE = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

function onKeyDown(e) {
  if (e.target.tagName === 'INPUT') { if (e.code === 'Escape') e.target.blur(); return; }
  if (power.dark) return;            // no power: neither machine hears the keyboard
  // on the Macintosh the keyboard belongs to that machine, not the workstation
  if (ui.monitor === 'left') {
    if (e.repeat) return;
    if (e.code === 'Escape') mac.escape(); else if (e.code === 'Enter' && mac.alert) mac.alert = null;
    return;
  }
  if (ui.dialog) { if (e.code === 'Enter' && !e.repeat) { e.preventDefault(); ui.dialogOk(); } return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (MOVE.includes(e.code)) { e.preventDefault(); keysDown.add(e.code); if (game.mode === 'play') cancelTween(); return; }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { keysDown.add('Shift'); return; }
  if (e.repeat) return;
  const viewing = ui.shown('viewer');
  if (e.code === 'Escape') { ui.escape(); }
  else if (e.code === 'Enter') { e.preventDefault(); if (viewing) closeViewer(); else if (game.sel) activate(game.sel); }
  else if (e.code === 'KeyH') flyToDir(ROOT);
  else if (e.code === 'KeyO') overview();
  else if (e.code === 'KeyU' || e.code === 'Backspace') { e.preventDefault(); flyUp(); }
}
function onKeyUp(e) { keysDown.delete(e.code); if (e.code.startsWith('Shift')) keysDown.delete('Shift'); }
const onBlur = () => keysDown.clear();
// Any press outside the menu and the buttons that open one closes the menu.
const onPointerDown = e => { if (!e.target.closest?.('#menu,#chest,.b.menu')) ui.closeMenu(); };

// Returns a function that removes the listeners again.
export function installKeyboard() {
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  addEventListener('blur', onBlur);
  addEventListener('pointerdown', onPointerDown, true);
  return () => {
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
    removeEventListener('blur', onBlur);
    removeEventListener('pointerdown', onPointerDown, true);
  };
}
