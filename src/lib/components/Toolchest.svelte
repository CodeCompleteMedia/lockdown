<script>
  import { ui } from '#lib/game/state.svelte.js';
  import { TOOLCHEST, toggleMenu } from '#lib/game/desktop.js';
</script>

<div class="panel" id="chest">
  {#each TOOLCHEST as [key, label] (key)}
    <button class="tc" class:down={ui.menu?.key === key} onclick={e => toggleMenu(key, e.currentTarget)}>{label}</button>
  {/each}
</div>

<style>
  #chest{position:relative}
  /* rows are flat and divided by grooves: each has a light top edge and a dark bottom edge */
  .tc{display:flex;justify-content:space-between;align-items:center;height:22px;padding:0 6px 0 8px;text-align:left;
    border:0;border-top:1px solid var(--hi);border-bottom:1px solid var(--lo);outline:none}
  .tc:active,.tc.down{padding:1px 5px 0 9px;background:var(--press);border-top-color:var(--lo);border-bottom-color:var(--hi)}
  /* the little menu-card glyph */
  .tc::after{content:"";width:8px;height:11px;border:1px solid var(--dk);border-bottom-width:2px;border-radius:1px;
    background:linear-gradient(var(--dk),var(--dk)) 0 2px/100% 1px no-repeat}
  @media (max-width:760px){
    #chest{flex-direction:row}
    .tc::after{display:none}
    .tc,.tc:active,.tc.down{flex:1;justify-content:center;padding:0 2px}
  }
</style>
