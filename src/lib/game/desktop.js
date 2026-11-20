// Desktop tools built on the file system: Find, the console shell, the System Manager
// readout and the Toolchest menus.
import { ROOT, nodeList, TYPES, dirPath, search, resolve } from './fs.js';
import { game, ui, refs, log, fmt } from './state.svelte.js';
import { sfx } from './audio.js';
import { stats } from './stats.js';
import { select, openFile, execFile, markRead, flyToDir, flyHome, flyUp, overview, inPlay, toggleSound, showHelp, pausedDialog } from './actions.js';

/* -------------------------------------------------------------------- find */
export function runFind() {
  const q = ui.findQ, res = search(q);
  ui.findRes = res;
  ui.findNote = !q.trim() ? 'Type part of a name or path.'
    : res.length + (res.length === 1 ? ' match' : ' matches') + '. Click one to fly there. Mounted key images are not indexed.';
}
export function openFind(q) {
  ui.open('find');
  if (typeof q === 'string') { ui.findQ = q; runFind(); }
  refs.findq?.focus(); refs.findq?.select();
}

/* ----------------------------------------------------------------- console */
const SHELL_HELP = `ls [dir]     list a directory
cd [dir]     fly to a directory
pwd          print current directory
cat <file>   print a text file
open <file>  open in the viewer / load a key
run <file>   execute a build
find <text>  search names and paths
gr_osview    open the system monitor
chess        play chess (chess3d for the 3D board)
calc         open the calculator
clear        clear this window`;

export function shell(line) {
  line = line.trim(); if (!line) return;
  log('% ' + line, 'k'); stats.exec++;
  const [cmd, ...rest] = line.split(/\s+/), arg = rest.join(' ');
  if (cmd === 'help') return log(SHELL_HELP);
  if (cmd === 'gr_osview' || cmd === 'osview') return openOsview();
  if (cmd === 'chess') return openChess();
  if (cmd === 'chess3d') return openChess3D();
  if (cmd === 'calc') return openCalc();
  if (cmd === 'clear') { ui.conCleared = game.logs.at(-1).id; return; }
  if (game.mode !== 'play') return log('no active session', 'e');
  if (cmd === 'pwd') return log(game.cwd.path);
  if (cmd === 'find') {
    if (!arg) return log('usage: find <text>', 'e');
    const res = search(arg);
    return log(res.length ? res.map(r => r.dir ? dirPath(r.dir) : r.file.path).join('\n') : 'find: no matches');
  }
  if (!['ls', 'cd', 'cat', 'open', 'run'].includes(cmd)) { sfx.err(); return log(cmd + ': command not found (try help)', 'e'); }
  const r = cmd === 'cd' && !arg ? { dir: ROOT } : resolve(arg, game.cwd);
  const fail = why => { sfx.err(); log(`${cmd}: ${arg || '.'}: ${why}`, 'e'); };
  if (!r) return fail('no such file or directory');
  if (cmd === 'ls') {
    if (r.file) return log(r.file.name);
    const rows = [...r.dir.children.map(c => c.name + '/'), ...r.dir.files.map(f => f.name.padEnd(20) + String(f.kb).padStart(4) + ' KB  ' + TYPES[f.type].label)];
    return log(rows.length ? rows.join('\n') : '(empty)');
  }
  if (cmd === 'cd') return r.dir ? flyToDir(r.dir) : fail('not a directory');
  if (!r.file) return fail('is a directory');
  const f = r.file;
  if (cmd === 'open') { select(f); return openFile(f); }
  if (cmd === 'run') { select(f); return execFile(f); }
  if (f.type === 'key') return log(f.name + ': key image. Use "open" to load it.', 'w');
  if (f.type === 'bin') return log(`${f.name}: binary data, ${f.kb} KB`, 'w');
  log(f.text); markRead(f); stats.iget++;
}
export function openConsole() {
  ui.open('conwin');
  if (refs.conout) refs.conout.scrollTop = refs.conout.scrollHeight;
  refs.conin?.focus();
}

/* ---------------------------------------------------------- system manager */
export function sysInfo() {
  const files = nodeList.reduce((a, n) => a + n.files.length, 0), kb = nodeList.reduce((a, n) => a + n.files.reduce((b, f) => b + f.kb, 0), 0);
  return `host        m9-ops  (ops terminal 4)
system      M9/OS, fsnav rev 2.3
build       lockdown ${__APP_VERSION__}
session     ${{ intro: 'not logged in', play: 'operator, active', won: 'override accepted', lost: 'no carrier' }[game.mode]}
filesystem  ${nodeList.length} directories, ${files} files, ${kb} KB
cwd         ${game.cwd.path}
signatures  ${game.keys.length} of 3 loaded
watchdogd   ${game.watchdogs} running${game.drain > 1 ? '  ** CONTACT **' : ''}
whiteout    T-${fmt(game.time)}`;
}
export const openSys = () => ui.open('sysman');
export const openOsview = () => ui.open('osview');
export const openChess = () => { ui.open('chess'); refs.chessin?.focus(); };
export const openChess3D = () => ui.open('chess3d');
export const openCalc = () => { ui.open('calc'); refs.calc?.focus(); };
export const toggleConsole = () => ui.shown('conwin') ? ui.close('conwin') : openConsole();
export const toggleSys = () => ui.shown('sysman') ? ui.close('sysman') : openSys();

/* ------------------------------------------------------------------- menus */
// The window menu behind each title bar's top-left button.
export function toggleWindowMenu(id, button) {
  const key = 'win:' + id, was = ui.menu?.key === key;
  ui.closeMenu(); sfx.click();
  if (was) return;
  const w = ui.wins[id];
  ui.menu = { key, anchor: button, below: true, items: [
    ['Restore', () => ui.toggleMax(id), !w.max],
    ['Minimize', () => ui.minimize(id)],
    ['Maximize', () => ui.toggleMax(id), w.max],
    null,
    ['Close', () => ui.close(id)],
  ] };
}

// Each entry is [label, action, disabled]; null is a separator. Built when the menu opens.
const MENUS = {
  desktop: () => [
    ['Home Directory  /', inPlay(flyHome)],
    ['Parent Directory', inPlay(flyUp)],
    ['Overview', inPlay(overview)],
    null,
    ['File System Navigator', () => ui.open('main')],
    ['Open Console', openConsole],
    null,
    ['Chess', openChess],
    ['Chess 3D', openChess3D],
    ['Calculator', openCalc],
  ],
  selected: () => {
    const f = game.sel;
    return [
      [f ? f.name : '(nothing selected)', null],
      null,
      ['Open', () => openFile(f), !f],
      ['Execute', () => execFile(f), !f || f.type !== 'cmd'],
      ['Go To Its Directory', inPlay(() => flyToDir(f.dir)), !f],
      ['Deselect', () => select(null), !f],
    ];
  },
  find: () => [
    ['Search For Files...', () => openFind()],
    ['Files In ' + dirPath(game.cwd), () => openFind(dirPath(game.cwd))],
    ['Executables', () => openFind('.cmd')],
  ],
  system: () => [
    ['System Manager', openSys],
    ['System Monitor', openOsview],
    ['Console', openConsole],
    null,
    ['Sound: ' + (game.soundOn ? 'On' : 'Off'), toggleSound],
    ['Restart Session', () => location.reload()],
  ],
  help: () => [
    ['Controls', showHelp],
    ['About This Desktop', () => pausedDialog('about', `<h2>M9-OPS DESKTOP</h2>
      <p>The <b>Toolchest</b> is the way into everything on this terminal: <b>Desktop</b> moves the navigator, <b>Selected</b> acts on the file you have picked, <b>Find</b> searches the file system, and <b>System</b> opens the manager and the console.</p>
      <p>The console takes <b>ls</b>, <b>cd</b>, <b>pwd</b>, <b>cat</b>, <b>open</b>, <b>run</b> and <b>find</b>. It shares its current directory with the 3D view.</p>
      <p>Lockdown version <b>${__APP_VERSION__}</b>.</p>
      <p>The clock is stopped while this window is open.</p>`)],
  ],
};

export const TOOLCHEST = [['desktop', 'Desktop'], ['selected', 'Selected'], ['find', 'Find'], ['system', 'System'], ['help', 'Help']];

export function toggleMenu(key, button) {
  const was = ui.menu?.key === key;
  ui.closeMenu(); sfx.click(); button.blur();
  if (was) return;
  ui.menu = { key, items: MENUS[key](), anchor: button };
}
export function pickMenuItem(fn) { ui.closeMenu(); sfx.click(); fn(); }
