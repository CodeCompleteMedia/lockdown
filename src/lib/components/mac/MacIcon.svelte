<script>
  // A Finder icon, drawn in code, with its name underneath. First click selects it, the next opens it.
  import { mac } from '#lib/game/mac.svelte.js';
  let { id, name, icon = 'doc', onopen } = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="icon" class:sel={mac.selected === id} onclick={e => { e.stopPropagation(); mac.click(id, onopen); }}>
  {#if icon === 'disk'}
    <svg width="34" height="14" viewBox="0 0 34 14" shape-rendering="crispEdges">
      <defs><pattern id="mac-disk-dots" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="#ccccff"/><rect width="1" height="1" fill="#6666aa"/></pattern></defs>
      <rect x=".5" y=".5" width="33" height="11" fill="url(#mac-disk-dots)" stroke="#000"/>
      <path d="M1 12.5h33" stroke="#000"/><path d="M4 8.5h3" stroke="#000"/>
    </svg>
  {:else if icon === 'trash'}
    <svg width="26" height="32" viewBox="0 0 26 32" shape-rendering="crispEdges">
      <path d="M9.5 1.5h7v2h-7z" fill="#ccc" stroke="#000"/>
      <path d="M1.5 3.5h23v3h-23z" fill="#e2e2e2" stroke="#000"/>
      <path d="M3.5 6.5h19l-1 24h-17z" fill="#bbb" stroke="#000"/>
      <path d="M8.5 9v19M13.5 9v19M18.5 9v19" stroke="#555"/><path d="M9.5 9v19M14.5 9v19M19.5 9v19" stroke="#fff"/>
    </svg>
  {:else}
    <svg width="26" height="32" viewBox="0 0 26 32" shape-rendering="crispEdges"><path d="M1.5.5h17l6 6v25h-23z" fill="#fff" stroke="#000"/><path d="M18.5.5v6h6" fill="none" stroke="#000"/><path d="M5 12h12M5 15h14M5 18h14M5 21h9" stroke="#000"/></svg>
  {/if}
  <span>{name}</span>
</div>

<style>
  .icon{display:flex;flex-direction:column;align-items:center;gap:3px;width:max-content;cursor:default}
  svg{display:block}
  span{background:#fff;color:#000;padding:0 3px;white-space:nowrap}
  .sel span{background:#000;color:#fff}
  .sel svg{filter:brightness(.5)}
</style>
