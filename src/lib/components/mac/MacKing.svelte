<script>
  // "THE KING": a short movie, played on a loop for as long as its window is open. It has
  // a soundtrack, which follows the game's Sound setting.
  import { game } from '#lib/game/state.svelte.js';
  import movie from '#lib/assets/theKing.mp4';
  let { open = true } = $props();
  let video = $state();
  $effect(() => {
    if (!video) return;
    if (!open) return video.pause();
    // a browser that will not start a film with sound unasked gets it silent instead
    video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
  });
</script>

<video bind:this={video} src={movie} muted={!game.soundOn} loop playsinline preload="auto" disablepictureinpicture></video>

<style>
  video{display:block;width:100%;height:100%;min-height:0;object-fit:contain;background:#000;image-rendering:auto}
</style>
