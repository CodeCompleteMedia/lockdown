// Chess rules: positions, legal moves, notation, and how a game ends.
// A position is { b, turn, castle, ep, half, full }: b is 64 characters from a8 to h1
// (upper case White, lower case Black, '.' empty), castle is a subset of "KQkq", ep is the
// square a pawn may capture onto en passant (or -1), half counts plies for the fifty-move
// rule. Positions are never mutated; make() returns a new one.

export const FILES = 'abcdefgh';
export const name = i => FILES[i & 7] + (8 - (i >> 3));
export const isWhite = p => p >= 'A' && p <= 'Z';

export function fromFen(fen) {
  const [rows, turn, castle, ep, half, full] = fen.split(' '), b = [];
  for (const ch of rows) {
    if (ch === '/') continue;
    if (ch >= '1' && ch <= '8') for (let i = 0; i < +ch; i++) b.push('.'); else b.push(ch);
  }
  return { b, turn, castle: castle === '-' ? '' : castle, ep: !ep || ep === '-' ? -1 : FILES.indexOf(ep[0]) + (8 - +ep[1]) * 8, half: +half || 0, full: +full || 1 };
}
export const start = () => fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

// What repetition compares: the placement, whose turn, and the rights that affect moves.
export const key = s => s.b.join('') + s.turn + s.castle + s.ep;

const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]], BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ALL = [...ROOK, ...BISHOP];
const on = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

// Is square sq attacked by the side `by` ('w' or 'b')?
export function attacked(b, sq, by) {
  const r = sq >> 3, c = sq & 7, W = by === 'w';
  const P = W ? 'P' : 'p', N = W ? 'N' : 'n', K = W ? 'K' : 'k', R = W ? 'R' : 'r', B = W ? 'B' : 'b', Q = W ? 'Q' : 'q';
  const pr = r + (W ? 1 : -1);
  if (pr >= 0 && pr < 8 && ((c > 0 && b[pr * 8 + c - 1] === P) || (c < 7 && b[pr * 8 + c + 1] === P))) return true;
  for (const [dr, dc] of KNIGHT) if (on(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === N) return true;
  for (const [dr, dc] of ALL) if (on(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === K) return true;
  for (const [dirs, slider] of [[ROOK, R], [BISHOP, B]]) for (const [dr, dc] of dirs) {
    for (let rr = r + dr, cc = c + dc; on(rr, cc); rr += dr, cc += dc) {
      const p = b[rr * 8 + cc];
      if (p !== '.') { if (p === slider || p === Q) return true; break; }
    }
  }
  return false;
}

// Moves that obey how the pieces move but may leave the mover's king in check.
// A move is { from, to, piece, cap, flag, promo }; flag is 'double', 'ep' or 'castle'.
export function pseudo(s, capturesOnly = false) {
  const { b } = s, W = s.turn === 'w', out = [];
  const mine = p => p !== '.' && isWhite(p) === W, theirs = p => p !== '.' && isWhite(p) !== W;
  const add = (from, to, flag, promo) => out.push({ from, to, piece: b[from], cap: flag === 'ep' ? (W ? 'p' : 'P') : b[to], flag, promo });
  for (let i = 0; i < 64; i++) {
    const p = b[i]; if (!mine(p)) continue;
    const r = i >> 3, c = i & 7, t = p.toLowerCase();
    if (t === 'p') {
      const d = W ? -1 : 1, r1 = r + d, last = r1 === (W ? 0 : 7);
      const push = to => { if (last) for (const q of 'qrbn') add(i, to, undefined, q); else add(i, to); };
      if ((!capturesOnly || last) && b[r1 * 8 + c] === '.') {
        push(r1 * 8 + c);
        if (!capturesOnly && r === (W ? 6 : 1) && b[(r1 + d) * 8 + c] === '.') add(i, (r1 + d) * 8 + c, 'double');
      }
      for (const dc of [-1, 1]) {
        if (c + dc < 0 || c + dc > 7) continue;
        const to = r1 * 8 + c + dc;
        if (theirs(b[to])) push(to); else if (to === s.ep) add(i, to, 'ep');
      }
    } else if (t === 'n' || t === 'k') {
      for (const [dr, dc] of t === 'n' ? KNIGHT : ALL) {
        if (!on(r + dr, c + dc)) continue;
        const to = (r + dr) * 8 + c + dc;
        if (capturesOnly ? theirs(b[to]) : !mine(b[to])) add(i, to);
      }
      const home = W ? 60 : 4;
      if (t === 'k' && !capturesOnly && i === home && s.castle) {
        const foe = W ? 'b' : 'w', rook = W ? 'R' : 'r', safe = (...sq) => sq.every(q => !attacked(b, q, foe));
        if (s.castle.includes(W ? 'K' : 'k') && b[home + 1] === '.' && b[home + 2] === '.' && b[home + 3] === rook && safe(home, home + 1, home + 2)) add(home, home + 2, 'castle');
        if (s.castle.includes(W ? 'Q' : 'q') && b[home - 1] === '.' && b[home - 2] === '.' && b[home - 3] === '.' && b[home - 4] === rook && safe(home, home - 1, home - 2)) add(home, home - 2, 'castle');
      }
    } else {
      for (const [dr, dc] of t === 'r' ? ROOK : t === 'b' ? BISHOP : ALL) {
        for (let rr = r + dr, cc = c + dc; on(rr, cc); rr += dr, cc += dc) {
          const to = rr * 8 + cc;
          if (b[to] === '.') { if (!capturesOnly) add(i, to); continue; }
          if (theirs(b[to])) add(i, to);
          break;
        }
      }
    }
  }
  return out;
}

const RIGHTS = { 60: /[KQ]/g, 4: /[kq]/g, 63: 'K', 56: 'Q', 7: 'k', 0: 'q' };   // a move from or to these squares ends the right

export function make(s, m) {
  const b = s.b.slice(), W = s.turn === 'w';
  b[m.to] = m.promo ? (W ? m.promo.toUpperCase() : m.promo) : m.piece; b[m.from] = '.';
  if (m.flag === 'ep') b[(m.from & ~7) | (m.to & 7)] = '.';
  if (m.flag === 'castle') {
    if (m.to > m.from) { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = '.'; }
    else { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = '.'; }
  }
  let castle = s.castle;
  if (castle) for (const sq of [m.from, m.to]) if (sq in RIGHTS) castle = castle.replace(RIGHTS[sq], '');
  return { b, turn: W ? 'b' : 'w', castle, ep: m.flag === 'double' ? (m.from + m.to) >> 1 : -1,
    half: m.piece === 'P' || m.piece === 'p' || m.cap !== '.' ? 0 : s.half + 1, full: s.full + (W ? 0 : 1) };
}

const other = t => t === 'w' ? 'b' : 'w';
const kingOf = (b, t) => b.indexOf(t === 'w' ? 'K' : 'k');
export const inCheck = s => attacked(s.b, kingOf(s.b, s.turn), other(s.turn));

// The position after m, or null if m would leave the mover in check.
export function play(s, m) {
  const n = make(s, m);
  return attacked(n.b, kingOf(n.b, s.turn), n.turn) ? null : n;
}
export const moves = s => pseudo(s).filter(m => play(s, m));

// How the game stands: null while it continues. `seen` is the keys of every earlier position.
export function result(s, seen = []) {
  if (!moves(s).length) return inCheck(s) ? { over: 'checkmate', winner: other(s.turn) } : { over: 'stalemate' };
  const rest = s.b.filter(p => p !== '.' && p !== 'K' && p !== 'k');
  if (!rest.length || (rest.length === 1 && 'nbNB'.includes(rest[0]))) return { over: 'insufficient material' };
  if (s.half >= 100) return { over: 'the fifty-move rule' };
  const k = key(s);
  if (seen.filter(x => x === k).length >= 2) return { over: 'threefold repetition' };
  return null;
}

/* ---------------------------------------------------------------- notation */
export const coord = m => name(m.from) + name(m.to) + (m.promo || '');

// Standard algebraic notation for a legal move m in position s.
export function san(s, m, legal = moves(s)) {
  let out;
  const t = m.piece.toUpperCase();
  if (m.flag === 'castle') out = m.to > m.from ? 'O-O' : 'O-O-O';
  else if (t === 'P') out = (m.cap !== '.' ? FILES[m.from & 7] + 'x' : '') + name(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
  else {
    const rivals = legal.filter(o => o.piece === m.piece && o.to === m.to && o.from !== m.from);
    const dis = !rivals.length ? '' : !rivals.some(o => (o.from & 7) === (m.from & 7)) ? FILES[m.from & 7]
      : !rivals.some(o => (o.from >> 3) === (m.from >> 3)) ? String(8 - (m.from >> 3)) : name(m.from);
    out = t + dis + (m.cap !== '.' ? 'x' : '') + name(m.to);
  }
  const n = make(s, m);
  return out + (inCheck(n) ? (moves(n).length ? '+' : '#') : '');
}

// Read a move typed as coordinates (e2e4, e7e8q) or algebraic (Nf3, exd5, O-O, e8=Q).
// Returns the move, or { error }.
export function parse(s, text) {
  const legal = moves(s), raw = text.trim().replace(/\s+/g, '');
  const co = raw.toLowerCase().replace(/[-x=]/g, '');
  let hits = legal.filter(m => coord(m) === co);
  if (!hits.length) hits = legal.filter(m => m.promo === 'q' && coord(m) === co + 'q');     // promotion defaults to a queen
  if (!hits.length) {
    const strip = t => t.replace(/[+#!?x=]/g, '').replace(/0/g, 'O');
    const want = strip(raw), all = legal.map(m => [m, strip(san(s, m, legal))]);
    hits = all.filter(([, t]) => t === want).map(([m]) => m);
    if (!hits.length) hits = all.filter(([, t]) => t.toLowerCase() === want.toLowerCase() || (t.endsWith('Q') && t.slice(0, -1).toLowerCase() === want.toLowerCase())).map(([m]) => m);
  }
  if (hits.length === 1) return hits[0];
  return { error: hits.length ? `"${text.trim()}" could be ${hits.map(m => san(s, m, legal)).join(' or ')}` : `"${text.trim()}" is not a legal move here` };
}
