<script>
  // The way across to the other monitor. Moving the pointer to the screen edge brings out a
  // tab; clicking the tab slides the view over.
  import { ui } from '#lib/game/state.svelte.js';
  import { lookAt } from '#lib/game/mac.svelte.js';

  // on the workstation the Macintosh is to the left, and from there the workstation is to the right
  const to = $derived(ui.monitor === 'right' ? 'left' : 'right');
</script>

<div class="edge {to}">
  <button class="tab" title={to === 'left' ? 'Look at the left monitor' : 'Look at the right monitor'} onclick={e => { e.currentTarget.blur(); lookAt(to); }}>
    <svg viewBox="0 0 12 20" width="12" height="20"><path d={to === 'left' ? 'M10 2 2 10l8 8' : 'M2 2l8 8-8 8'} fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>
  </button>
</div>

<style>
  /* a thin strip down the edge of the screen; only the tab it reveals can be clicked */
  .edge{position:absolute;top:0;bottom:0;width:10px;z-index:30000}
  .edge.left{left:0} .edge.right{right:0}
  .tab,.tab:active{position:absolute;top:50%;width:30px;height:120px;margin-top:-60px;padding:0;display:flex;align-items:center;justify-content:center;
    color:#fff;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.55);outline:0;cursor:pointer;
    opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}
  .left .tab{left:0;border-left:0;border-radius:0 8px 8px 0;transform:translateX(-100%)}
  .right .tab{right:0;border-right:0;border-radius:8px 0 0 8px;transform:translateX(100%)}
  .edge:hover .tab,.tab:focus-visible{opacity:1;pointer-events:auto;transform:none}
  .tab:hover{background:rgba(0,0,0,.9)}
</style>
