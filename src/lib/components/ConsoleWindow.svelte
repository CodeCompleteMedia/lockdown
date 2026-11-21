<script>
  import { game, ui, refs } from '#lib/game/state.svelte.js';
  import { sfx } from '#lib/game/audio.js';
  import { shell } from '#lib/game/desktop.js';
  import Window from './Window.svelte';

  const lines = $derived(game.logs.filter(l => l.id > ui.conCleared));
  $effect(() => { lines; refs.conout.scrollTop = refs.conout.scrollHeight; });

  function key(e) {
    if (e.code !== 'Enter') return;
    sfx.click(); shell(e.currentTarget.value); e.currentTarget.value = '';
  }
</script>

<Window id="conwin" title="Central Park Control Console — m9-ops" minW={300}>
  <div id="conout" class="term inset" bind:this={refs.conout}>{#each lines as l (l.id)}<div class={l.cls}>{l.msg}</div>{/each}</div>
  <div class="row conrow">
    <span>m9-ops%</span>
    <input type="text" placeholder="help" spellcheck="false" autocomplete="off" bind:this={refs.conin} onkeydown={key}>
    <button onclick={() => ui.close('conwin')}>Close</button>
  </div>
</Window>

<style>
  #conout{margin:6px 6px 0;flex:1 1 auto;min-height:40px;height:min(280px,40vh)}
  .row.conrow{padding:6px}
  .conrow span{font:bold 12px "Courier New",monospace}
</style>
