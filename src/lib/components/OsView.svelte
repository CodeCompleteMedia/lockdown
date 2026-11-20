<script>
  // gr_osview, the system monitor. Samples only while its window is showing.
  import { untrack } from 'svelte';
  import { ui } from '#lib/game/state.svelte.js';
  import { createMonitor, INTERVAL } from '#lib/game/monitor.js';
  import Window from './Window.svelte';

  let rows = $state.raw([]);
  $effect(() => {
    if (!ui.shown('osview')) return;
    const monitor = createMonitor();
    rows = untrack(() => monitor.sample());
    const timer = setInterval(() => { rows = monitor.sample(); }, INTERVAL);
    return () => { clearInterval(timer); monitor.stop(); };
  });
</script>

<Window id="osview" title="gr_osview" minW={300} minH={300}>
  <div id="osview-body">
    {#each rows as r (r.name)}
      <div class="meter" title={r.tip}>
        <div class="head">
          <b>{r.name}:</b>{#each r.legend as [word, color]}<i style="color:{color}">{word}</i>{/each}
          {#if r.top}<span class="num {r.top[1]}">{r.top[0]}</span>{/if}
        </div>
        <div class="line">
          <div class="trough">
            <div class="bar">{#each r.segs as [color, part]}<span style="background:{color};width:{part * 100}%"></span>{/each}</div>
            <div class="rule"></div>
          </div>
          {#if r.side}<div class="side">{#each r.side as [text, cls]}<span class="num box {cls}">{text}</span>{/each}</div>{/if}
        </div>
      </div>
    {/each}
  </div>
</Window>

<style>
  #osview-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;padding:2px 7px 5px;background:#a8bcbb;
    font:italic bold 12px/14px "Times New Roman",Times,serif;overflow:hidden}
  .meter{flex:1 1 42px;min-height:24px;display:flex;flex-direction:column}
  .head{display:flex;align-items:baseline;gap:5px;white-space:nowrap;overflow:hidden;padding:2px 0 3px}
  .head i{font-size:11px}
  .head .num{margin-left:auto}
  .line{flex:1;min-height:8px;display:flex;gap:10px}
  /* the trough: a dark top edge, and under it a black rule and a grey one ticked every tenth */
  .trough{flex:1;min-width:0;display:flex;flex-direction:column}
  .bar{flex:1;min-height:0;display:flex;overflow:hidden;background:#bdb7a3;border-top:1px solid #3c3c3c}
  .bar span{flex:none}
  .rule{flex:none;height:3px;background:
    repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),#8a8779 calc(10% - 1px) 10%) bottom/100% 1px no-repeat,
    linear-gradient(#000 2px,#52514b 2px)}
  .side{flex:none;width:36px;display:flex;flex-direction:column;justify-content:center;gap:1px}
  .num{font-size:10px;line-height:11px;text-align:right}
  .box{background:#000;color:#fff;padding:0 1px;min-width:36px}
  .box.red{color:#f00}
  .box.blue{background:#fff;color:#1600ff}
</style>
