// The computer opponent: alpha-beta search with a quiescence search on captures,
// deepened one ply at a time until the time budget runs out.
import { pseudo, play, inCheck, moves, isWhite } from './rules.js';

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;

// Score in centipawns from White's side: material plus a little positional sense.
function evaluate(s) {
  const { b } = s;
  let score = 0, heavy = 0;
  for (const p of b) if (p !== '.' && p !== 'P' && p !== 'p') heavy += VALUE[p.toLowerCase()];
  const endgame = heavy < 2600;
  for (let i = 0; i < 64; i++) {
    const p = b[i]; if (p === '.') continue;
    const W = isWhite(p), t = p.toLowerCase(), r = i >> 3, c = i & 7;
    const edge = Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)) - .5;     // 0 in the centre, 3 on the rim
    const rank = W ? 7 - r : r;                                           // 0 on the piece's own back rank
    let v = VALUE[t];
    if (t === 'p') v += rank * 6 + ((c === 3 || c === 4) && rank >= 3 ? 14 : 0) + (endgame ? rank * 8 : 0);
    else if (t === 'n') v += 24 - edge * 12;
    else if (t === 'b') v += 12 - edge * 6;
    else if (t === 'r') v += rank === 6 ? 18 : 0;
    else if (t === 'q') v += 4 - edge * 2;
    else v += endgame ? 20 - edge * 12 : (rank === 0 ? 12 : -20 * rank) + (c <= 2 || c >= 6 ? 18 : 0);
    if (t === 'n' || t === 'b') v -= rank === 0 ? 12 : 0;                 // get the minor pieces out
    score += W ? v : -v;
  }
  return score;
}

// Captures first, the most valuable victim taken by the least valuable attacker.
const order = list => list.sort((a, b) => rate(b) - rate(a));
const rate = m => (m.cap !== '.' ? 10 * VALUE[m.cap.toLowerCase()] - VALUE[m.piece.toLowerCase()] + 1000 : 0) + (m.promo === 'q' ? 900 : 0);

export function search(s, budget = 500, maxDepth = 5) {
  const deadline = performance.now() + budget;
  let nodes = 0;
  const tick = () => { if ((++nodes & 1023) === 0 && performance.now() > deadline) throw 'time'; };

  function quiesce(p, alpha, beta) {
    tick();
    const stand = evaluate(p) * (p.turn === 'w' ? 1 : -1);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    for (const m of order(pseudo(p, true))) {
      const n = play(p, m); if (!n) continue;
      const v = -quiesce(n, -beta, -alpha);
      if (v >= beta) return beta;
      if (v > alpha) alpha = v;
    }
    return alpha;
  }
  function negamax(p, depth, alpha, beta, ply) {
    if (depth <= 0) return quiesce(p, alpha, beta);
    tick();
    if (p.half >= 100) return 0;
    let any = false;
    for (const m of order(pseudo(p))) {
      const n = play(p, m); if (!n) continue;
      any = true;
      const v = -negamax(n, depth - 1, -beta, -alpha, ply + 1);
      if (v >= beta) return beta;
      if (v > alpha) alpha = v;
    }
    return any ? alpha : inCheck(p) ? -MATE + ply : 0;
  }

  const root = order(moves(s));
  if (!root.length) return null;
  // In the first few moves, pick at random among the near-best so games differ.
  const loose = s.full <= 4;
  let best = root[0], depth = 0;
  try {
    for (let d = 1; d <= maxDepth; d++) {
      let alpha = -MATE * 2; const scored = [];
      for (const m of root) {
        const v = -negamax(play(s, m), d - 1, -MATE * 2, loose ? MATE * 2 : -alpha, 1);
        scored.push([m, v]);
        if (v > alpha) alpha = v;
      }
      scored.sort((a, b) => b[1] - a[1]);
      const pool = loose ? scored.filter(([, v]) => v >= scored[0][1] - 15) : [scored[0]];
      best = pool[Math.floor(Math.random() * pool.length)][0]; depth = d;
      // search the best line first next time round
      root.sort((a, b) => scored.findIndex(x => x[0] === a) - scored.findIndex(x => x[0] === b));
      if (scored[0][1] > MATE - 100) break;
    }
  } catch (e) { if (e !== 'time') throw e; }
  return { move: best, depth, nodes };
}
