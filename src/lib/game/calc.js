// Scientific calculator: evaluates what is typed on the display, and formats the answer.
// The expression is text in the same symbols the keys show (× ÷ − π √ ² and so on).

const FUNCS = {
  sin: (x, k) => Math.sin(x * k), cos: (x, k) => Math.cos(x * k), tan: (x, k) => Math.tan(x * k),
  asin: (x, k) => Math.asin(x) / k, acos: (x, k) => Math.acos(x) / k, atan: (x, k) => Math.atan(x) / k,
  ln: Math.log, log: Math.log10, exp: Math.exp, '√': Math.sqrt, '∛': Math.cbrt,
};
const NAMES = Object.keys(FUNCS).sort((a, b) => b.length - a.length);     // longest first, so asin is not read as a·sin

function factorial(n) {
  if (n < 0 || n !== Math.floor(n)) throw new Error('n! needs a whole number');
  if (n > 170) return Infinity;
  let f = 1; for (let i = 2; i <= n; i++) f *= i;
  return f;
}

// Split the text into numbers, names and symbols.
function tokens(text) {
  const out = [], s = text.replace(/\s+/g, '');
  for (let i = 0; i < s.length;) {
    const num = /^(\d+\.?\d*|\.\d+)(E[−-]?\d+)?/.exec(s.slice(i));
    if (num) { out.push({ num: parseFloat(num[0].replace('−', '-')) }); i += num[0].length; continue; }
    const fn = NAMES.find(n => s.startsWith(n, i));
    if (fn) { out.push({ fn }); i += fn.length; continue; }
    if (s.startsWith('Ans', i)) { out.push({ ans: true }); i += 3; continue; }
    out.push({ sym: s[i++] });
  }
  return out;
}

/**
 * Work out an expression. Angles are degrees when `deg` is set. Throws on anything malformed.
 * Precedence, loosest first: + −, × ÷ (and writing two values side by side), unary −, ^, then
 * the postfix marks ! % ² ³.
 */
export function evaluate(text, { deg = true, ans = 0 } = {}) {
  const t = tokens(text), k = deg ? Math.PI / 180 : 1;
  let i = 0;
  const sym = c => t[i]?.sym === c && (i++, true);
  const startsValue = () => { const x = t[i]; return x && (x.num !== undefined || x.fn || x.ans || '(πe'.includes(x.sym)); };

  function sum() {
    let v = product();
    for (;;) { if (sym('+')) v += product(); else if (sym('−') || sym('-')) v -= product(); else return v; }
  }
  function product() {
    let v = unary();
    for (;;) {
      if (sym('×') || sym('*')) v *= unary();
      else if (sym('÷') || sym('/')) v /= unary();
      else if (startsValue()) v *= unary();           // 2π, 3(4+1), 2sin(30)
      else return v;
    }
  }
  function unary() { return sym('−') || sym('-') ? -unary() : sym('+') ? unary() : power(); }
  function power() { const base = postfix(); return sym('^') ? Math.pow(base, unary()) : base; }
  function postfix() {
    let v = primary();
    for (;;) {
      if (sym('!')) v = factorial(v); else if (sym('%')) v /= 100;
      else if (sym('²')) v *= v; else if (sym('³')) v = v * v * v; else return v;
    }
  }
  function primary() {
    const x = t[i];
    if (!x) throw new Error('incomplete');
    if (x.num !== undefined) { i++; return x.num; }
    if (x.ans) { i++; return ans; }
    if (x.fn) { i++; const arg = sym('(') ? group() : unary(); return FUNCS[x.fn](arg, k); }
    if (sym('(')) return group();
    if (sym('π')) return Math.PI;
    if (sym('e')) return Math.E;
    throw new Error('unexpected ' + x.sym);
  }
  // the inside of a bracket; a missing closing bracket at the very end is forgiven
  function group() { const v = sum(); if (!sym(')') && i < t.length) throw new Error('expected )'); return v; }

  const v = sum();
  if (i < t.length) throw new Error('unexpected ' + (t[i].sym ?? 'value'));
  return v;
}

// A number as the display shows it: up to 12 significant digits, exponent form when very large or small.
export function format(v) {
  if (Number.isNaN(v)) return 'Error';
  if (!Number.isFinite(v)) return v > 0 ? 'Overflow' : '−Overflow';
  if (v === 0) return '0';
  const a = Math.abs(v);
  let s = a >= 1e12 || a < 1e-9 ? v.toExponential(9).replace(/\.?0+e/, 'e').replace('e+', 'E').replace('e', 'E') : String(parseFloat(v.toPrecision(12)));
  return s.replace(/-/g, '−');
}
