// The hard reset: cutting all power and bringing it back.
//
//   on     everything works. The Main Power window holds an interlock (a code to crack)
//          and, behind it, the switch.
//   off    the switch has been thrown: both screens are black.
//   ready  the workstation shows "System Ready" and nothing else.
//   grid   the Macintosh shows the power distribution board: the restore game.
//   boot   every area is back; a moment later both machines are.
//
// The clock is stopped from the moment the power goes until it is all back.
import { game, ui, log } from './state.svelte.js';
import { keysDown } from './engine.js';
import { sfx } from './audio.js';
import { fsnavOnline } from './actions.js';

/* ---------------------------------------------------------------- interlock */
// A four-figure release code, each figure 1 to 6. Every try is marked: how many figures
// are right and in place, and how many are right but in the wrong place.
export const CODE_LEN = 4, CODE_MAX = 6, TRIES = 8;

export function mark(code, guess) {
  let set = 0, loose = 0;
  const left = {};
  code.forEach((c, i) => { if (guess[i] === c) set++; else left[c] = (left[c] || 0) + 1; });
  guess.forEach((g, i) => { if (g !== code[i] && left[g]) { left[g]--; loose++; } });
  return { set, loose };
}

// The memo's four clues about a code, and how many of the 1296 codes share each set of them.
const clues = c => [c.reduce((a, b) => a + b, 0), new Set(c).size, Math.sign(c[0] - c[3]), c[1] % 2].join();
const SHARED = {};
for (let i = 0; i < CODE_MAX ** CODE_LEN; i++) {
  const k = clues(Array.from({ length: CODE_LEN }, (_, d) => 1 + Math.floor(i / CODE_MAX ** d) % CODE_MAX));
  SHARED[k] = (SHARED[k] || 0) + 1;
}

/* --------------------------------------------------------------------- grid */
// The areas of the park, four across and three down. Each breaker is wired to some of its
// neighbours, and throwing it flips every area on its circuit as well as its own.
export const COLS = 4, ROWS = 3;
export const AREAS = ['Main Gate', 'Visitor Hall', 'Control Room', 'Laboratory', 'Tour Track', 'Aviary', 'Cold Storage', 'Pump House', 'East Dock', 'Perimeter Fence', 'Maintenance', 'Radio Mast'];

// Which of the grid's links exist this time: a few are left out, so no two boards match.
// Any wiring at all can be brought fully on from fully off, so there is always a way.
function wire() {
  const all = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    if (i % COLS < COLS - 1) all.push([i, i + 1]);
    if (i + COLS < COLS * ROWS) all.push([i, i + COLS]);
  }
  for (let cut = 0; cut < 4; cut++) all.splice(Math.floor(Math.random() * all.length), 1);
  return all;
}

const DARK = 6500, HOLD = 2600, BOOT = 3200;

class Power {
  phase = $state('on');
  done = $state(false);              // the reset has been carried out: it happens once

  // interlock
  code = [];
  tries = $state([]);                // { guess, set, loose }
  released = $state(false);
  lockouts = $state(0);

  // grid
  links = $state.raw([]);
  live = $state([]);                 // per area: powered or not
  thrown = $state(0);

  constructor() { this.newCode(); }
  get dark() { return this.phase !== 'on'; }
  get online() { return this.live.filter(Boolean).length; }

  newCode() {
    // only a code the memo's clues leave several candidates for: never one they give away
    do this.code = Array.from({ length: CODE_LEN }, () => 1 + Math.floor(Math.random() * CODE_MAX));
    while (SHARED[clues(this.code)] < 6);
    this.tries = [];
  }
  // One try at the release code. Out of tries: the interlock re-keys and the clock pays.
  attempt(guess) {
    if (this.released || guess.length !== CODE_LEN) return;
    const m = mark(this.code, guess);
    this.tries.push({ guess: [...guess], ...m });
    if (m.set === CODE_LEN) { this.released = true; sfx.key(); log('main power: interlock released.', 'k'); return; }
    if (this.tries.length < TRIES) return sfx.err();
    this.lockouts++; game.time -= 30; sfx.penalty();
    game.timerHit = true; setTimeout(() => { game.timerHit = false; }, 500);
    log('main power: interlock re-keyed after ' + TRIES + ' bad codes. Penalty: 30 s.', 'e');
    this.newCode();
  }

  // What the service memo on the Macintosh says about the current code: enough to cut the
  // guessing down a long way, not enough to read the code off. It follows a re-key.
  memo() {
    const c = this.code, sum = c.reduce((a, b) => a + b, 0), kinds = new Set(c).size;
    const ends = c[0] === c[3] ? 'the same figure' : c[0] < c[3] ? 'first is the lower' : 'first is the higher';
    return `MAIN POWER INTERLOCK
service memo, kept off the workstation on purpose

The release key is four figures, each from 1 to ${CODE_MAX}. I am not writing the key down anywhere. These are the check values the panel prints for the key it is holding now:

  All four added together: ${sum}
  Different figures in it: ${kinds === CODE_LEN ? 'all four differ' : kinds === 1 ? 'one figure, four times' : kinds + ' (something repeats)'}
  First against last: ${ends}
  Second figure: ${c[1] % 2 ? 'odd' : 'even'}

Eight bad keys and the panel re-keys itself. The check values change with it, so close this and open it again.

Green lamp: right figure, right place. Yellow: right figure, wrong place. Work from the lamps, not from luck.`;
  }

  neighbours(i) { return this.links.filter(l => l.includes(i)).map(l => l[0] === i ? l[1] : l[0]); }

  // Throw the switch. Everything stops.
  cut() {
    if (this.dark || this.done || !this.released || game.mode !== 'play') return;
    this.phase = 'off'; game.paused = true; game.alarm = false;
    ui.closeMenu(); keysDown.clear(); document.activeElement?.blur?.();
    sfx.powerDown();
    this.links = wire(); this.live = AREAS.map(() => false); this.thrown = 0;
    setTimeout(() => { this.phase = 'ready'; sfx.tick(); }, DARK);
    setTimeout(() => { this.phase = 'grid'; }, DARK + HOLD);
  }
  // Throw one area's breaker on the Macintosh.
  flip(i) {
    if (this.phase !== 'grid') return;
    for (const k of [i, ...this.neighbours(i)]) this.live[k] = !this.live[k];
    this.thrown++; sfx.breaker();
    if (this.online < AREAS.length) return;
    this.phase = 'boot'; sfx.powerUp();
    setTimeout(() => {
      this.phase = 'on'; this.done = true; game.paused = false;
      log('main power restored. All areas online.', 'k');
      sfx.open(); fsnavOnline();
    }, BOOT);
  }
  tripAll() { if (this.phase === 'grid') { this.live = AREAS.map(() => false); sfx.close(); } }
}
export const power = new Power();
