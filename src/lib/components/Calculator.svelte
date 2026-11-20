<script>
  // Scientific calculator. You build an expression on the display and press = to work it out.
  import { refs } from '#lib/game/state.svelte.js';
  import { sfx } from '#lib/game/audio.js';
  import { evaluate, format } from '#lib/game/calc.js';
  import Window from './Window.svelte';

  let expr = $state('');            // what has been typed
  let shown = $state('0');          // the big line: the answer, or the expression as it grows
  let done = $state(false);         // the display is showing an answer
  let deg = $state(true), inv = $state(false);
  let ans = 0;

  // Five columns by seven rows, after the original: yellow function keys, a white number
  // pad, and the arithmetic in black down the right. A key is [label, what it types or a
  // command, colour]. INV swaps the function keys to their inverses for one press.
  const KEYS = $derived([
    ['INV', () => { inv = !inv; }, inv ? 'on' : ''], [deg ? 'DEG' : 'RAD', () => { deg = !deg; }], ['(', '('], [')', ')'], ['AC', clear],
    inv ? ['asin', 'asin('] : ['sin', 'sin('], inv ? ['acos', 'acos('] : ['cos', 'cos('], inv ? ['atan', 'atan('] : ['tan', 'tan('], inv ? ['e', 'e'] : ['π', 'π'], ['⌫', back],
    inv ? ['eˣ', 'exp('] : ['ln', 'ln('], inv ? ['10ˣ', '10^'] : ['log', 'log('], inv ? ['∛', '∛('] : ['√', '√('], inv ? ['x³', '³'] : ['x²', '²'], ['÷', '÷', 'op'],
    ['7', '7', 'num'], ['8', '8', 'num'], ['9', '9', 'num'], ['xʸ', '^'], ['×', '×', 'op'],
    ['4', '4', 'num'], ['5', '5', 'num'], ['6', '6', 'num'], ['1/x', '^(−1)'], ['−', '−', 'op'],
    ['1', '1', 'num'], ['2', '2', 'num'], ['3', '3', 'num'], ['n!', '!'], ['+', '+', 'op'],
    ['0', '0', 'num'], ['.', '.', 'num'], ['±', negate, 'num'], ['EE', 'E'], ['=', equals, 'op'],
  ]);

  // Things that carry on from an answer rather than starting a new sum.
  const CONTINUES = /^[+−×÷^!%²³]/;

  function type(text) {
    if (done) { expr = CONTINUES.test(text) ? 'Ans' : ''; done = false; }
    expr += text; shown = expr; inv = false;
  }
  function clear() { expr = ''; shown = '0'; done = false; inv = false; }
  function back() {
    if (done) return clear();
    // a function name and its bracket go together
    expr = expr.replace(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|ln\(|log\(|exp\(|√\(|∛\(|Ans|.)$/, '');
    shown = expr || '0';
  }
  function negate() {
    if (done) { expr = 'Ans'; done = false; }
    expr = !expr ? '−' : /^−\(.*\)$/.test(expr) ? expr.slice(2, -1) : `−(${expr})`;
    shown = expr || '0';
  }
  // Work out the display. Returns the value, or null if it does not make sense yet.
  function equals() {
    if (done || !expr) return done ? ans : null;
    try {
      const v = evaluate(expr, { deg, ans });
      shown = format(v); done = true; inv = false;
      if (Number.isFinite(v)) ans = v; else sfx.err();
      return Number.isFinite(v) ? v : null;
    } catch { shown = 'Error'; done = true; sfx.err(); return null; }
  }

  function press(key) { sfx.click(); typeof key[1] === 'function' ? key[1]() : type(key[1]); }

  // Typing works while the calculator has focus, and stops there so the keys do not fly the camera.
  const TYPED = { '*': '×', '/': '÷', '-': '−', 'p': 'π', 'E': 'E' };
  function keydown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Escape' || e.key === 'Tab') return;
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); sfx.click(); equals(); }
    else if (e.key === 'Backspace') { e.preventDefault(); back(); }
    else if (e.key === 'Delete') clear();
    else if (/^[0-9.+^()!%e]$/.test(e.key) || TYPED[e.key]) { e.preventDefault(); type(TYPED[e.key] ?? e.key); }
  }
</script>

<Window id="calc" title="calculator" minW={210} minH={300}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
  <div id="calc-body" tabindex="0" bind:this={refs.calc} onkeydown={keydown}>
    <div class="display inset">
      <div class="flags"><span>{deg ? 'DEG' : 'RAD'}</span><span>{inv ? 'INV' : ''}</span><span class="was">{done ? expr + ' =' : ''}</span></div>
      <div class="value">{shown}</div>
    </div>
    <div class="keys">
      {#each KEYS as key, i (i)}
        <button class={key[2] || ''} onclick={() => press(key)}>{key[0]}</button>
      {/each}
    </div>
  </div>
</Window>

<style>
  #calc-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px;padding:6px;outline:none;background:#d8d2a4}
  .display{flex:none;background:#f6f4e2;color:#111;padding:3px 6px 4px;font-family:"Courier New",monospace;overflow:hidden}
  .flags{display:flex;gap:8px;height:13px;font-size:10px;line-height:13px;white-space:nowrap}
  .was{flex:1;min-width:0;overflow:hidden;display:flex;justify-content:flex-end;font-weight:normal}
  /* long expressions keep their right-hand end in view */
  .value{font-size:20px;line-height:26px;white-space:nowrap;overflow:hidden;display:flex;justify-content:flex-end}
  .keys{flex:1;display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:minmax(26px,1fr);gap:4px}
  /* yellow unless it is a number (white) or arithmetic (black) */
  .keys button,.keys button:active{padding:0;font:bold 13px Helvetica,Arial,sans-serif;
    background:#efdf7c;border-color:#fbf3bd #8f8336 #8f8336 #fbf3bd}
  .keys button:active,.keys .on{background:#d9c85e;border-color:#8f8336 #fbf3bd #fbf3bd #8f8336}
  .keys .num{background:#f7f7f4;border-color:#fff #8a8a86 #8a8a86 #fff}
  .keys .num:active{background:#deded9;border-color:#8a8a86 #fff #fff #8a8a86}
  .keys .op{color:#fff;background:#161616;border-color:#6a6a6a #000 #000 #6a6a6a;font-size:15px}
  .keys .op:active{background:#000;border-color:#000 #6a6a6a #6a6a6a #000}
</style>
