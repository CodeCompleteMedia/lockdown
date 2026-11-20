<script>
  // The 3D board: the same game as the text window, played with the mouse.
  import { onMount, untrack } from 'svelte';
  import { chess } from '#lib/game/chess/session.svelte.js';
  import { createBoard3D } from '#lib/game/chess/board3d.js';
  import { press } from '#lib/game/actions.js';
  import { openChess } from '#lib/game/desktop.js';
  import Window from './Window.svelte';

  let canvas, host, board = null, failed = $state(false);

  onMount(() => {
    try { board = createBoard3D(canvas, host, { movesFrom: sq => chess.movesFrom(sq), play: m => chess.play(m) }); }
    catch { failed = true; return; }
    board.show(chess.position, null, chess.human);
    return () => board.dispose();
  });
  // follow the game: every new position, with the move that produced it
  $effect(() => { const p = chess.position, side = chess.human; board?.show(p, untrack(() => chess.lastMove), side); });

  const say = text => press(() => chess.input(text));
</script>

<Window id="chess3d" title="chess 3D" minW={320} minH={300}>
  <div id="chess3d-view" class="inset" bind:this={host}>
    <canvas bind:this={canvas}></canvas>
    {#if failed}<p>This browser could not start a second 3D view. The text window still works.</p>{/if}
  </div>
  <div id="chess3d-status">{chess.status}</div>
  <div class="btns">
    <button onclick={say(chess.human === 'b' ? 'new black' : 'new')}>New</button>
    <button onclick={say(chess.human === 'b' ? 'new' : 'new black')}>Swap Sides</button>
    <button onclick={say('undo')}>Undo</button>
    <button onclick={say('resign')}>Resign</button>
    <button onclick={press(() => board?.flip())}>Flip</button>
    <button onclick={press(() => board?.resetView())}>Reset View</button>
    <button onclick={press(openChess)}>Text</button>
  </div>
</Window>

<style>
  #chess3d-view{flex:1 1 auto;min-height:120px;height:330px;margin:6px 6px 0;position:relative;background:#27a2ad;overflow:hidden}
  canvas{display:block;width:100%;height:100%;touch-action:none;cursor:pointer}
  p{position:absolute;inset:0;margin:0;padding:16px;font-weight:normal}
  #chess3d-status{padding:5px 8px 0;font-size:12px}
  .btns{display:flex;flex-wrap:wrap;gap:6px;padding:6px 7px 8px}
  /* the original's dark blue buttons with white lettering */
  .btns button{flex:1 1 auto;padding:3px 6px;font-size:12px;color:#fff;background:#1b2c96;
    border-color:#5a6fd6 #0b1450 #0b1450 #5a6fd6;outline-color:#000}
  .btns button:active{padding:4px 5px 2px 7px;background:#14217a;border-color:#0b1450 #5a6fd6 #5a6fd6 #0b1450}
</style>
