<script>
  // The Macintosh with the power out. Black at first; then the distribution board, where
  // each area of the park is switched back on by hand. A breaker flips its own area and
  // every area wired to it, so they have to be thrown in a combination that leaves all on.
  import { power, AREAS, COLS } from '#lib/game/power.svelte.js';
  let hover = $state(-1);
  const linked = $derived(hover < 0 ? [] : [hover, ...power.neighbours(hover)]);
  const has = (a, b) => power.links.some(l => l[0] === a && l[1] === b);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="dead" onpointerdown={e => e.stopPropagation()}>
  {#if power.phase === 'grid' || power.phase === 'boot'}
    <div class="board">
      <h1>POWER DISTRIBUTION</h1>
      <p class="sub">Main bus live. Restore every area by hand.</p>
      <div class="grid" style="grid-template-columns:repeat({COLS},1fr)">
        {#each AREAS as name, i (i)}
          <div class="area" class:on={power.live[i]} class:mark={linked.includes(i)} class:right={has(i, i + 1)} class:down={has(i, i + COLS)}
            onclick={() => power.flip(i)} onpointerenter={() => { hover = i; }} onpointerleave={() => { hover = -1; }}>
            <b>{name}</b>
            <span>{power.live[i] ? 'ONLINE' : 'NO POWER'}</span>
          </div>
        {/each}
      </div>
      {#if power.phase === 'boot'}
        <p class="foot all">ALL AREAS ONLINE. RESTARTING SYSTEMS...</p>
      {:else}
        <p class="foot">
          <span>{power.online} of {AREAS.length} online</span>
          <span>{power.thrown} thrown</span>
          <span class="btn" onclick={() => power.tripAll()}>Trip All</span>
        </p>
        <p class="hint">A breaker switches its own area and every area wired to it.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dead{position:absolute;inset:0;z-index:300000;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;animation:cut .45s ease-out}
  .board{width:min(100% - 32px,760px);animation:rise .5s steps(4)}
  h1{margin:0;font:16px/16px ChiKareGo2,Charcoal,Chicago,Geneva,sans-serif}
  .sub{margin:4px 0 18px}
  .grid{display:grid;gap:26px 30px}
  /* an area: an outline when dead, filled white when it has power */
  .area{position:relative;height:46px;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:0 8px;border:1px solid #fff;color:#aaa;cursor:pointer;white-space:nowrap}
  .area b{font:16px/16px ChiKareGo2,Charcoal,Chicago,Geneva,sans-serif;overflow:hidden;text-overflow:ellipsis}
  .area.on{background:#fff;color:#000}
  .area.mark{outline:1px dotted #fff;outline-offset:3px}
  /* the wiring: a line across the gap to the area on the right, and to the one below */
  .area.right::after{content:"";position:absolute;left:100%;top:50%;width:30px;border-top:1px solid #fff;margin-left:1px}
  .area.down::before{content:"";position:absolute;top:100%;left:50%;height:26px;border-left:1px solid #fff;margin-top:1px}
  .foot{margin:20px 0 0;display:flex;align-items:center;gap:24px}
  .foot.all{font:16px/16px ChiKareGo2,Charcoal,Chicago,Geneva,sans-serif;animation:blink .5s steps(1) infinite}
  .btn{margin-left:auto;padding:3px 12px;border:1px solid #fff;border-radius:5px;font:16px/16px ChiKareGo2,Charcoal,Chicago,Geneva,sans-serif;cursor:pointer}
  .btn:active{background:#fff;color:#000}
  .hint{margin:8px 0 0;color:#aaa}
  @keyframes cut{0%{background:rgba(0,0,0,.2)}35%,100%{background:#000}}
  @keyframes rise{0%{opacity:0}100%{opacity:1}}
  @keyframes blink{50%{opacity:.35}}
  @media (prefers-reduced-motion:reduce){ .dead,.board,.foot.all{animation:none} }
</style>
