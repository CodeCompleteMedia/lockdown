<script>
  // A Finder icon with its name underneath. First click selects it, the next opens it.
  import { mac } from '#lib/game/mac.svelte.js';
  let { id, name, src = null, onopen } = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="icon" class:sel={mac.selected === id} onclick={e => { e.stopPropagation(); mac.click(id, onopen); }}>
  {#if src}<img {src} alt="" draggable="false">
  {:else}
    <svg width="26" height="32" viewBox="0 0 26 32" shape-rendering="crispEdges"><path d="M1.5.5h17l6 6v25h-23z" fill="#fff" stroke="#000"/><path d="M18.5.5v6h6" fill="none" stroke="#000"/><path d="M5 12h12M5 15h14M5 18h14M5 21h9" stroke="#000"/></svg>
  {/if}
  <span>{name}</span>
</div>

<style>
  .icon{display:flex;flex-direction:column;align-items:center;gap:3px;width:max-content;cursor:default}
  img,svg{display:block}
  span{background:#fff;color:#000;padding:0 3px;font:10px/12px Geneva,Verdana,sans-serif;white-space:nowrap}
  .sel span{background:#000;color:#fff}
  .sel img,.sel svg{filter:brightness(.5)}
</style>
