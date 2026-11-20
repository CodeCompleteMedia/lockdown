<script>
  // Text chess against the computer. Everything is typed; the board is drawn in characters.
  import { ui, refs } from '#lib/game/state.svelte.js';
  import { sfx } from '#lib/game/audio.js';
  import { chess } from '#lib/game/chess/session.svelte.js';
  import Window from './Window.svelte';

  let out;
  $effect(() => { chess.lines; out.scrollTop = out.scrollHeight; });

  function key(e) {
    if (e.code !== 'Enter') return;
    const text = e.currentTarget.value; e.currentTarget.value = '';
    sfx.click();
    if (text.trim().toLowerCase() === '3d') return ui.open('chess3d');
    chess.input(text);
  }
  const board = $derived(chess.board);
  const edge = $derived('    ' + board.files.join(' '));
  const RULE = '  +-----------------+';
</script>

<Window id="chess" title="chess" minW={300} minH={330}>
  <div id="chessboard" class="term">
    <div class="grid">
      <div>{edge}</div>
      <div>{RULE}</div>
      {#each board.rows as row (row.rank)}
        <div>{row.rank + ' | '}{#each row.cells as p}<span class={p === '.' ? 'empty' : p < 'a' ? 'white' : 'black'}>{p}</span>{' '}{/each}{'| ' + row.rank}</div>
      {/each}
      <div>{RULE}</div>
      <div>{edge}</div>
    </div>
    <div class="status">{chess.status}</div>
  </div>
  <div id="chesslog" class="term inset" bind:this={out}>{#each chess.lines as l (l.id)}<div class={l.cls}>{l.msg}</div>{/each}</div>
  <div class="row chessrow">
    <span>{chess.human === 'w' ? 'white' : 'black'}&gt;</span>
    <input type="text" placeholder="e2e4" spellcheck="false" autocomplete="off" bind:this={refs.chessin} onkeydown={key}>
  </div>
</Window>

<style>
  #chessboard{flex:none;margin:6px 6px 0;padding:8px 6px;font-size:14px;line-height:1.25;overflow:hidden;
    display:flex;flex-direction:column;align-items:center;gap:8px;white-space:normal}
  .grid div{white-space:pre}
  .white{color:#fff}
  .black{color:#ffd23a}
  .empty{color:#2f8f60}
  #chesslog{margin:6px 6px 0;flex:1 1 auto;min-height:40px;height:130px}
  .row.chessrow{padding:6px}
  .chessrow span{font:bold 12px "Courier New",monospace}
</style>
