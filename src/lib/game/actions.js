// Game rules: what selecting, opening and executing files does, and how a run starts and ends.
import { nodes, ROOT, RUN, hexdump } from './fs.js';
import { game, ui, refs, log, fmt } from './state.svelte.js';
import { sfx, initAudio, setSoundOn } from './audio.js';
import { stats } from './stats.js';

let engine = null;
export function attachEngine(e) { engine = e; }

// Standard button behaviour: click blip, drop focus so game keys keep working, then act.
export const press = fn => e => { sfx.click(); e.currentTarget.blur(); fn(); };

/* ------------------------------------------------------------------ flight */
export const flyToDir = n => engine.flyToDir(n);
export const flyHome = () => engine.flyToDir(ROOT);
export const flyUp = () => engine.flyToDir(game.cwd.parent || ROOT);
export const overview = () => engine.overview();
export const cancelTween = () => engine?.cancelTween();
export const inPlay = fn => () => { if (game.mode === 'play') fn(); };

export function goTo(r) {
  if (game.mode !== 'play') return;
  if (r.file) { select(r.file); flyToDir(r.file.dir); } else flyToDir(r.dir);
}

/* --------------------------------------------------------------- selection */
export function select(f) {
  if (game.sel === f) return;
  game.sel = f;
  engine.beamTo(f);
  if (f) sfx.select();
}
function showViewer(f, text) {
  ui.viewer = { title: 'view — ' + f.path, text };
  ui.open('viewer');
  if (refs.viewtext) refs.viewtext.scrollTop = 0;
}
export const closeViewer = () => ui.close('viewer');

export function markRead(f) { f.read = true; engine.dimRead(f); }

export function openFile(f) {
  if (game.mode !== 'play' || !f) return;
  stats.iget++;
  if (f.type === 'key') {
    if (!game.keys.includes(f.who)) game.keys.push(f.who);
    sfx.key();
    log(`SIGNATURE LOADED: ${f.who} (${game.keys.length}/3)`, 'k');
    engine.removeFile(f);
    f.dir.files.splice(f.dir.files.indexOf(f), 1);
    if (game.hover === f) game.hover = null;
    select(null);
    if (game.keys.length === 3) log('All signatures on file. Find the signed build.', 'w');
    return;
  }
  sfx.open();
  if (f.name === 'chess.sav') {          // Lindqvist's saved game starts the chess program
    ui.open('chess'); refs.chessin?.focus();
    if (!f.read) { markRead(f); log('chess: loaded ' + f.path); }
    return;
  }
  showViewer(f, f.type === 'bin' ? hexdump(f) : f.text);
  if (!f.read) { markRead(f); log('read ' + f.path); }
}
export function execFile(f) {
  if (game.mode !== 'play' || !f) return;
  stats.exec++;
  if (f.type !== 'cmd') { sfx.err(); log(`${f.name}: not executable`, 'e'); return; }
  if (f.dead) { sfx.err(); log(`${f.name}: build quarantined`, 'e'); return; }
  if (!f.real) {
    f.dead = true; engine.quarantine(f);
    game.time -= 30; sfx.penalty();
    game.timerHit = true; setTimeout(() => { game.timerHit = false; }, 500);
    log(`${f.name}: CHECKSUM MISMATCH  -00:30`, 'e');
    if (game.watchdogs < 3) { engine.spawnWatchdog(f.dir); log('watchdogd: second instance spawned', 'e'); }
    return;
  }
  if (game.keys.length < 3) {
    sfx.err();
    log(`${f.name}: signature valid. AUTH REFUSED: ${game.keys.length} of 3 keys loaded`, 'w');
    return;
  }
  win();
}
export function activate(f) { f.type === 'cmd' ? execFile(f) : openFile(f); }

/* -------------------------------------------------------------- end states */
function win() {
  game.mode = 'won'; sfx.win(); closeViewer();
  engine.allClear();
  log('OVERRIDE ACCEPTED. BULKHEADS RELEASED.', 'k');
  setTimeout(() => ui.showDialog('secd: override', `<h2>BULKHEADS C1&ndash;C6 RELEASED</h2>
    <p>WHITEOUT aborted with <b>${fmt(game.time)}</b> left on the clock.</p>
    <p>The doors are open. The corridor beyond them is colder than it should be, and every growlight in the hydro bay is on.</p>
    <p>Core 31 is still not in its rack. That is a day-shift problem.</p>`, 'Run Again', () => location.reload()), 1100);
}
export function lose() {
  game.mode = 'lost'; game.time = 0; sfx.lose(); closeViewer();
  game.alarm = false;
  log('WHITEOUT EXECUTED.', 'e');
  setTimeout(() => ui.showDialog('secd: whiteout', `<h2>WHITEOUT EXECUTED</h2>
    <p class="warn">Wing C sterilised. Ops terminal 4: no carrier.</p>
    <p>Signatures loaded: ${game.keys.length} of 3. The signed build was <b>ovr_${RUN.ids[0]}.cmd</b> in ${RUN.ovrDirs[0]}.</p>`, 'Try Again', () => location.reload()), 2400);
}

/* ------------------------------------------------------------------ system */
export function toggleSound() {
  game.soundOn = !game.soundOn; setSoundOn(game.soundOn);
}

export const HELP = `<table>
  <tr><td>Drag</td><td>look around</td></tr>
  <tr><td>W A S D / arrows</td><td>fly forward, back, strafe (arrows turn)</td></tr>
  <tr><td>R / F</td><td>climb / dive &nbsp; (Shift = boost)</td></tr>
  <tr><td>Click pedestal</td><td>fly to that directory</td></tr>
  <tr><td>Click block</td><td>select file</td></tr>
  <tr><td>Double-click / Enter</td><td>open file, or run an executable</td></tr>
  <tr><td>H &nbsp; U &nbsp; O</td><td>home, parent directory, overview</td></tr>
</table>
<div class="keyrow">
  <span><i class="sw" style="background:#2fd68f"></i>log / text</span>
  <span><i class="sw" style="background:#4aa3ff"></i>mail</span>
  <span><i class="sw" style="background:#ffd23a"></i>signature key</span>
  <span><i class="sw" style="background:#ff4466"></i>executable</span>
  <span><i class="sw" style="background:#8a7fc0"></i>binary</span>
</div>`;

// A dialog that stops the clock while it is up.
export function pausedDialog(title, html) {
  if (game.mode !== 'play') return;
  game.paused = true;
  ui.showDialog(title, html, 'Resume', () => { game.paused = false; });
}
export const showHelp = () => pausedDialog('fsnav: help', '<h2>CONTROLS</h2>' + HELP + '<p>The clock is stopped while this window is open.</p>');

export function fatal() {
  ui.showDialog('fsnav: fatal', '<h2>CANNOT START RENDERER</h2><p>This browser could not create a WebGL context. Enable hardware acceleration or try another browser, then reload.</p>', 'Reload', () => location.reload());
}

export function boot() {
  log('m9-ops fsnav 2.3 ready');
  ui.showDialog('secd: WHITEOUT armed', `<h2>MERIDIAN-9 &middot; OPS TERMINAL 4</h2>
  <p class="warn">Wing C has lost containment. Sterilant flood in 05:00. The bulkheads are sealed and you are on the wrong side of them.</p>
  <p>The security override is somewhere on this file system. It will not run without three staff <b>signature keys</b>, and of the four builds staged, only one is signed. The logs and the mail spool say which, and where the keys were left.</p>
  <p>Stay clear of the red <b>watchdog</b>. Inside its ring the clock runs three times as fast.</p>
  ${HELP}
  <p class="version">Lockdown v${__APP_VERSION__}</p>`, 'Log In', () => {
    initAudio(); sfx.open();
    game.mode = 'play'; engine.resetClock();
    engine.spawnWatchdog(nodes['/sys/sec/vault']);
    log('WHITEOUT armed. T-05:00', 'e');
    log('hint: open /README.1st', 'w');
  });
}
