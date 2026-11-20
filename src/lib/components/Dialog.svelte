<script>
  // The modal dialog. Its body is trusted HTML written in actions.js / desktop.js.
  import { ui } from '#lib/game/state.svelte.js';
</script>

<div id="shade" class:open={ui.dialog}>
  <div class="win" id="dialog">
    <div class="titlebar"><div class="b menu"></div><div class="t">{ui.dialog?.title ?? 'notice'}</div></div>
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
