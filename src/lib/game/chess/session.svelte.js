// The chess game in progress: the position, the transcript, and the typed commands.
import { start, moves, make, san, parse, result, key, inCheck, FILES } from './rules.js';
import { search } from './ai.js';

const THINK_MS = 500;
const SIDE = { w: 'White', b: 'Black' };
const HELP = `Type a move, then Enter:
  e2e4  e7e8q      from-square, to-square (and the piece to promote to)
  Nf3  exd5  O-O   or standard algebraic notation
Commands:
  new [black]      start again (as Black if you say so)
  undo             take back your last move
  moves            list your legal moves
  resign           give up
  3d               open the 3D board
  help             this text`;

class Chess {
  position = $state.raw(start());
  human = $state('w');
  thinking = $state(false);
  ended = $state.raw(null);          // the result once the game is over
  lastMove = null;                   // the move that produced the current position, for the 3D board to animate
  lines = $state.raw([]);            // transcript: { id, msg, cls }
  past = [];                         // [{ position, san }] every position before the current one
  game = 0;                          // bumped on new/undo so a late reply from the search is dropped
  worker = null;
  nextId = 0;

  say(msg, cls = '') { this.lines = [...this.lines, { id: ++this.nextId, msg, cls }].slice(-300); }

  get status() {
    if (this.ended) return this.ended;
    const side = SIDE[this.position.turn], check = inCheck(this.position) ? ' (check)' : '';
    return this.thinking ? `${side} is thinking...` : `${side} to move${check}`;
  }
  // Rows of the board as text, from the human's side of the table.
  get board() {
    const flip = this.human === 'b', idx = [0, 1, 2, 3, 4, 5, 6, 7], ord = flip ? idx.toReversed() : idx;
    return { files: ord.map(c => FILES[c]), rows: ord.map(r => ({ rank: 8 - r, cells: ord.map(c => this.position.b[r * 8 + c]) })) };
  }

  reset(human = 'w') {
    this.game++; this.past = []; this.lastMove = null; this.position = start(); this.human = human; this.thinking = false; this.ended = null;
    this.say(`New game. You are ${SIDE[human]}. Type "help" for how to move.`, 'w');
    if (human === 'b') this.think();
  }

  // Play a legal move for whoever is to move, then see whether the game is over.
  apply(m) {
    const p = this.position, text = san(p, m);
    this.say(p.turn === 'w' ? `${p.full}. ${text}` : `${p.full}... ${text}`, p.turn === this.human ? 'k' : '');
    this.past.push({ position: p, san: text });
    this.lastMove = m; this.position = make(p, m);
    const r = result(this.position, this.past.map(x => key(x.position)));
    if (r) this.finish(r.over === 'checkmate' ? `Checkmate. ${SIDE[r.winner]} wins.` : `Draw by ${r.over}.`);
    return !r;
  }
  finish(text) { this.ended = text; this.thinking = false; this.say(text + ' Type "new" to play again.', 'w'); }

  think() {
    this.thinking = true;
    const id = this.game, position = this.position;
    const done = found => { if (id === this.game && found) { this.thinking = false; this.apply(found.move); } };
    try {
      this.worker ??= new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      this.worker.onmessage = e => { if (e.data.id === id) done(e.data.found); };
      this.worker.onerror = () => { this.worker = null; setTimeout(() => done(search(position, THINK_MS / 2)), 20); };
      this.worker.postMessage({ id, position, budget: THINK_MS });
    } catch {
      // no worker support: search here, after the screen has had a chance to update
      setTimeout(() => done(search(position, THINK_MS / 2)), 20);
    }
  }

  // For the 3D board: the legal moves of the human's piece on a square, when it is their turn.
  movesFrom(sq) {
    const p = this.position;
    return this.ended || this.thinking || p.turn !== this.human ? [] : moves(p).filter(m => m.from === sq);
  }
  play(m) { if (!this.ended && !this.thinking && this.position.turn === this.human && this.apply(m)) this.think(); }

  input(text) {
    text = text.trim(); if (!text) return;
    this.say('> ' + text, 'k');
    const [cmd, arg] = text.toLowerCase().split(/\s+/);
    if (cmd === 'help' || cmd === '?') return this.say(HELP);
    if (cmd === 'new') return this.reset(arg === 'black' || arg === 'b' ? 'b' : 'w');
    if (cmd === 'undo') {
      if (this.thinking) return this.say('Wait for the reply first.', 'e');
      // back to the last position where it was the human's turn
      let i = this.past.length - 1;
      while (i >= 0 && this.past[i].position.turn !== this.human) i--;
      if (i < 0) return this.say('Nothing to take back.', 'e');
      this.game++; this.lastMove = null; this.position = this.past[i].position; this.past.length = i; this.ended = null;
      return this.say('Taken back.', 'w');
    }
    if (this.ended) return this.say('The game is over. Type "new" to play again.', 'e');
    if (cmd === 'resign') return this.finish(`${SIDE[this.human]} resigns.`);
    if (this.thinking) return this.say('Wait for the reply first.', 'e');
    if (cmd === 'moves') { const p = this.position, legal = moves(p); return this.say(legal.map(m => san(p, m, legal)).join('  ')); }
    const m = parse(this.position, text);
    if (m.error) return this.say(m.error + '. Type "moves" to see what is legal.', 'e');
    if (this.apply(m)) this.think();
  }
}

export const chess = new Chess();
chess.say('chess  --  m9-ops recreation services', 'w');
chess.say('You are White. Type a move such as e2e4 or Nf3, or "help".');
