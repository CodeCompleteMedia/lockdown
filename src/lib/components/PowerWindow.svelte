<script>
  // Main Power: a release code to crack, and behind it the switch that cuts everything.
  import { power, CODE_LEN, CODE_MAX, TRIES } from '#lib/game/power.svelte.js';
  import { game, refs } from '#lib/game/state.svelte.js';
  import { sfx } from '#lib/game/audio.js';
  import Window from './Window.svelte';

  let entry = $state([]);
  const rows = $derived(Array.from({ length: TRIES }, (_, i) => power.tries[i] ?? (i === power.tries.length && !power.released ? { guess: entry, open: true } : null)));
  const status = $derived(power.done ? 'RESET COMPLETE. MAIN BUS LIVE.' : power.released ? 'INTERLOCK RELEASED. SWITCH ARMED.' : `INTERLOCK HELD. ${TRIES - power.tries.length} TRIES BEFORE RE-KEY.`);

  function type(n) { if (!power.released && entry.length < CODE_LEN) { entry.push(n); sfx.click(); } }
  function back() { entry.pop(); }
  function submit() { if (entry.length === CODE_LEN) { const g = entry; entry = []; power.attempt(g); } }
  function keydown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Escape' || e.key === 'Tab') return;
    e.stopPropagation();
    if (e.key >= '1' && e.key <= String(CODE_MAX)) type(+e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); back(); }
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
  }
</script>

<Window id="power" title="Main Power" minW={300} minH={300}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
  <div id="power-body" tabindex="0" bind:this={refs.power} onkeydown={keydown}>
    <div class="status inset" class:ok={power.released}>{status}</div>
    <div class="cols">
      <div class="board inset">
        {#each rows as row, i (i)}
          <div class="try" class:now={row?.open}>
            <span class="n">{i + 1}</span>
            {#each { length: CODE_LEN } as _, k (k)}<span class="fig">{row?.guess[k] ?? ''}</span>{/each}
            <span class="marks">
              {#if row && !row.open}{#each { length: CODE_LEN } as _, k (k)}<i class={k < row.set ? 'set' : k < row.set + row.loose ? 'loose' : ''}></i>{/each}{/if}
            </span>
          </div>
        {/each}
      </div>
      <div class="side">
        <div class="pad">
          {#each { length: CODE_MAX } as _, n (n)}<button disabled={power.released} onclick={() => type(n + 1)}>{n + 1}</button>{/each}
          <button disabled={power.released} onclick={back}>&larr;</button>
          <button class="wide" disabled={power.released || entry.length < CODE_LEN} onclick={submit}>Try</button>
        </div>
        <p class="key"><i class="set"></i> right figure, right place<br><i class="loose"></i> right figure, wrong place</p>
        <!-- the switch: dead until the interlock lets go, and spent once it has been thrown -->
        <button class="switch" class:armed={power.released && !power.done} disabled={!power.released || power.done || game.mode !== 'play'} onclick={() => power.cut()}>
          <span class="lamp"></span>
          <span>MAIN POWER<br><b>{power.done ? 'ON' : 'CUT ALL POWER'}</b></span>
        </button>
      </div>
    </div>
  </div>
</Window>

<style>
  #power-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px;padding:6px;outline:none}
  .status{flex:none;padding:4px 8px;background:#1a1410;color:#ff5a3c;font:bold 12px/16px "Courier New",monospace;letter-spacing:.5px}
  .status.ok{color:#7dff7a}
  .cols{flex:1;min-height:0;display:flex;gap:8px}
  .board{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--well);padding:3px 0;overflow:auto}
  .try{flex:1;min-height:22px;display:flex;align-items:center;gap:4px;padding:0 8px;font:bold 14px "Courier New",monospace}
  .try.now{background:#e9e6c9}
  .n{width:16px;color:var(--lo);font-size:11px}
  .fig{width:20px;height:18px;line-height:18px;text-align:center;background:#f3f0e4;border:1px solid var(--lo)}
  .marks{display:flex;gap:3px;margin-left:8px}
  i{display:inline-block;width:9px;height:9px;border:1px solid #555;background:#9a9a9a;border-radius:50%}
  i.set{background:#1fbf4a} i.loose{background:#f2c81d}
  .side{flex:0 0 132px;display:flex;flex-direction:column;gap:6px}
  .pad{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
  .pad button,.pad button:active{padding:5px 0;font:bold 13px Helvetica,Arial,sans-serif}
  .pad .wide{grid-column:span 2}
  .key{margin:0;font:11px/16px Helvetica,Arial,sans-serif}
  .switch,.switch:active{margin-top:auto;display:flex;align-items:center;gap:8px;padding:8px;text-align:left;font:bold 11px/14px Helvetica,Arial,sans-serif}
  .switch b{font-size:12px}
  .lamp{flex:none;width:14px;height:14px;border-radius:50%;border:1px solid #333;background:#5a5a5a}
  .switch.armed{background:#d9b3ab;border-color:#f3dcd7 #7d4a40 #7d4a40 #f3dcd7}
  .switch.armed .lamp{background:#ff2a12;box-shadow:0 0 6px #ff2a12;animation:arm .8s steps(1) infinite}
  @keyframes arm{50%{background:#7a1408;box-shadow:none}}
</style>
