<script>
  // The modal dialog. Its body is trusted HTML written in actions.js / desktop.js.
  // It opens centred and can be dragged by its title bar; each new dialog starts centred again.
  import { ui } from '#lib/game/state.svelte.js';

  let el, grab = null;
  let off = $state({ x: 0, y: 0 });       // how far it has been dragged from centre
  $effect(() => { if (ui.dialog) off = { x: 0, y: 0 }; });

  function down(e) {
    const r = el.getBoundingClientRect();
    // home is where the dialog sits undragged; keep the title bar reachable from there
    grab = { mx: e.clientX, my: e.clientY, x: off.x, y: off.y, left: r.left - off.x, top: r.top - off.y, w: r.width };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!grab) return;
    const g = grab;
    off.x = Math.max(60 - g.w - g.left, Math.min(innerWidth - 60 - g.left, g.x + e.clientX - g.mx));
    off.y = Math.max(-g.top, Math.min(innerHeight - 30 - g.top, g.y + e.clientY - g.my));
  }
  const drop = () => { grab = null; };
</script>

<div id="shade" class:open={ui.dialog}>
  <div class="win" id="dialog" bind:this={el} style="left:{off.x}px;top:{off.y}px">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="titlebar" onpointerdown={down} onpointermove={move} onpointerup={drop} onpointercancel={drop}><div class="b menu"></div><div class="t">{ui.dialog?.title ?? 'notice'}</div></div>
    <div id="dlgbody">{@html ui.dialog?.html ?? ''}</div>
    <div class="foot"><button class="default" onclick={() => ui.dialogOk()}>{ui.dialog?.btn ?? 'OK'}</button></div>
  </div>
</div>

<style>
  #shade{position:absolute;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(0,10,14,.45)}
  #shade.open{display:flex}
  #dialog{position:relative;width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 24px)}
  #dlgbody{padding:14px 16px 6px;overflow:auto;font-weight:normal;font-size:13px;line-height:1.5}
</style>
