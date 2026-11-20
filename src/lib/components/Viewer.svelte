<script>
  import { ui, refs } from '#lib/game/state.svelte.js';
  import { press, closeViewer } from '#lib/game/actions.js';
  import Window from './Window.svelte';
</script>

<Window id="viewer" title={ui.viewer.title}>
  <div id="viewtext" class="inset" bind:this={refs.viewtext}>{ui.viewer.text}</div>
  <div class="foot"><button onclick={press(closeViewer)}>Close</button></div>
</Window>

<style>
  #viewtext{margin:6px;flex:1 1 auto;min-height:40px;height:min(300px,45vh);overflow:auto;background:#f3f0e4;color:#111;
    font:13px/1.45 "Courier New",monospace;padding:8px 10px;white-space:pre-wrap;user-select:text;-webkit-user-select:text}
</style>
