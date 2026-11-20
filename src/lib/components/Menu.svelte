<script>
  // The pop-up menu used by the Toolchest and by window menu buttons. One instance, refilled and repositioned each time it opens.
  import { ui } from '#lib/game/state.svelte.js';
  import { pickMenuItem } from '#lib/game/desktop.js';

  let el;
  $effect(() => {
    const m = ui.menu;
    if (!m) return;
    // Measured here, after the DOM has updated, so the button is already in its pressed state.
    // Toolchest menus open beside their row; window menus, and all menus on narrow screens
    // (where the toolchest is a strip), drop down below their button.
    const r = m.anchor.getBoundingClientRect(), row = m.below || innerWidth <= 760;
    el.style.left = Math.max(0, Math.min(innerWidth - el.offsetWidth - 8, row ? r.left : r.right + 4)) + 'px';
    el.style.top = Math.max(0, Math.min(innerHeight - el.offsetHeight - 8, row ? r.bottom + 2 : r.top)) + 'px';
  });
</script>

<div class="panel" class:open={ui.menu} id="menu" bind:this={el}>
  {#if ui.menu}
    {#each ui.menu.items as item}
      {#if item}
        <button disabled={!item[1] || !!item[2]} onclick={() => pickMenuItem(item[1])}>{item[0]}</button>
      {:else}
        <hr>
      {/if}
    {/each}
  {/if}
</div>

<style>
  #menu{display:none;flex-direction:column;z-index:9000;min-width:180px;padding:2px}
  #menu.open{display:flex}
  button{border-color:transparent;outline:none;text-align:left;padding:4px 12px;white-space:nowrap}
  /* the item under the pointer rises, as in Motif menus */
  button:hover:enabled{border-color:var(--hi) var(--lo) var(--lo) var(--hi)}
  hr{width:100%;margin:2px 0;border:0;border-top:1px solid var(--lo);border-bottom:1px solid var(--hi)}
</style>
