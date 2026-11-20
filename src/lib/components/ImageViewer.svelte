<script>
  // Shows an image file from the file system. The window takes the file's name.
  import { ui } from '#lib/game/state.svelte.js';
  import Window from './Window.svelte';
</script>

<Window id="imgview" title={ui.image.title} minW={160} minH={160}>
  <div id="imgview-body">{#if ui.image.src}<img src={ui.image.src} alt={ui.image.title} draggable="false">{/if}</div>
</Window>

<style>
  #imgview-body{flex:1 1 auto;min-height:0;display:flex;background:#fff}
  img{display:block;width:100%;height:100%;min-height:0;object-fit:contain}
</style>
