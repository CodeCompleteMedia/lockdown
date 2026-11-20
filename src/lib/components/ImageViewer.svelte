<script>
  // Shows an image file from the file system. The window takes the file's name and keeps
  // the picture's proportions as it is resized, so there is never empty space beside it.
  import { ui } from '#lib/game/state.svelte.js';
  import Window from './Window.svelte';

  let aspect = $state(null);
  function loaded(e) {
    aspect = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
    // a window already resized for the last picture is refitted to this one at the same width
    const r = ui.wins.imgview.rect;
    if (r.h != null) r.h = (r.w - 2) / aspect + 27;
  }
</script>

<Window id="imgview" title={ui.image.title} minW={160} minH={120} {aspect}>
  <div id="imgview-body">{#if ui.image.src}<img src={ui.image.src} alt={ui.image.title} draggable="false" onload={loaded}>{/if}</div>
</Window>

<style>
  #imgview-body{flex:1 1 auto;min-height:0;display:flex;background:#fff}
  img{display:block;width:100%;height:100%;min-height:0;object-fit:contain}
</style>
