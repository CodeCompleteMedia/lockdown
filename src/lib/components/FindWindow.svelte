<script>
  import { TYPES, dirPath } from '#lib/game/fs.js';
  import { ui, refs } from '#lib/game/state.svelte.js';
  import { sfx } from '#lib/game/audio.js';
  import { press, goTo } from '#lib/game/actions.js';
  import { runFind } from '#lib/game/desktop.js';
  import Window from './Window.svelte';

  const swatch = r => r.dir ? '#23468c' : '#' + TYPES[r.file.type].color.toString(16).padStart(6, '0');
</script>

<Window id="find" title="Find — search for files">
  <div class="row">
    <input type="text" placeholder="name or path" spellcheck="false" autocomplete="off" bind:this={refs.findq}
      value={ui.findQ} oninput={e => { ui.findQ = e.currentTarget.value; runFind(); }}>
    <button onclick={press(runFind)}>Search</button>
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div id="findlist" class="inset">{#each ui.findRes as r}<div onclick={() => { sfx.click(); goTo(r); }}><i class="sw" style="background:{swatch(r)}"></i>{r.dir ? dirPath(r.dir) : r.file.path}</div>{/each}</div>
  <div id="findnote">{ui.findNote}</div>
  <div class="foot"><button onclick={() => ui.close('find')}>Close</button></div>
</Window>

<style>
  #findlist{margin:6px 8px 0;flex:1 1 auto;min-height:40px;height:min(220px,35vh);overflow-y:auto;background:var(--well);font:bold 12px/1.5 "Courier New",monospace}
  #findlist div{padding:0 6px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #findlist div:hover{background:var(--dk);color:#fff}
  #findnote{padding:4px 10px 0;font-size:11px;font-weight:normal}
</style>
