<script>
  import { ui } from '#lib/game/state.svelte.js';
  import { press } from '#lib/game/actions.js';
  import { toggleConsole, toggleSys } from '#lib/game/desktop.js';

  // Console and System always have a tile. Other windows get one while they are minimized.
  const ICONS = [['main', 'fsnav', 'grid'], ['viewer', 'view', 'page'], ['find', 'Find', 'list'], ['osview', 'osview', 'bars']];
  const icons = $derived(ICONS.filter(([id]) => ui.wins[id].open && ui.wins[id].min));
</script>

<div id="thumbs">
  <button class="thumb" class:on={ui.shown('conwin')} title="Console" onclick={press(toggleConsole)}>
    <span class="pic"><svg viewBox="0 0 70 54" preserveAspectRatio="none">
      <defs><linearGradient id="thumb-con" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#241733"/><stop offset=".55" stop-color="#5a4a6c"/><stop offset="1" stop-color="#8f8296"/></linearGradient></defs>
      <rect width="70" height="54" fill="url(#thumb-con)"/>
      <path d="M17 44c-6 0-8-5-3-7s9-1 9-6" fill="none" stroke="#e9e1dc" stroke-width="1.2"/>
      <ellipse cx="18" cy="45" rx="4.2" ry="2.6" fill="#ddd0c6"/>
      <path d="M21 7l-6 3v22l6 3z" fill="#a39086"/><path d="M21 7l27-2v28l-27 2z" fill="#cdbbad"/><path d="M21 7l27-2-5-2-26 2z" fill="#e2d5ca"/>
      <path d="M25 11l19-1.4v19L25 30z" fill="#17225a"/>
      <path d="M27 17l15-1.1M27 21l15-1.1M27 25l15-1.1" stroke="#a9c6ff" stroke-width="1"/>
      <path d="M28 35l14-1 3 4-19 1.4z" fill="#b3a094"/>
      <path d="M30 42l25-3 7 8-27 4z" fill="#dccfc3"/><path d="M35 51l27-4v2l-27 4z" fill="#97877d"/>
      <path d="M33 43.6l22-2.7M35 46l23-3M37 48.4l23-3.2" stroke="#b9a99d" stroke-width=".8"/>
    </svg></span>
    <span class="cap">Console</span>
  </button>
  <button class="thumb" class:on={ui.shown('sysman')} title="System Manager" onclick={press(toggleSys)}>
    <span class="pic sky"></span>
    <span class="cap">System</span>
  </button>
  {#each icons as [id, label, pic] (id)}
    <button class="thumb" title="Restore {label}" onclick={press(() => ui.open(id))}>
      <span class="pic {pic}"></span>
      <span class="cap">{label}</span>
    </button>
  {/each}
</div>

<style>
  #thumbs{position:absolute;left:121px;top:12px;display:flex;z-index:5}
  /* tiles sit edge to edge; picture in a sunken well, caption below a groove */
  .thumb,.thumb:active{width:82px;padding:0;display:flex;flex-direction:column;align-items:stretch;
    background:#aaa;border:1px solid;border-color:#dcdcdc #5e5e5e #5e5e5e #dcdcdc;outline:0}
  .thumb:active,.thumb.on{background:#9d9d9d;border-color:#5e5e5e #dcdcdc #dcdcdc #5e5e5e}
  .pic{display:block;height:56px;margin:4px 4px 3px;border:1px solid;border-color:#656565 #d4d4d4 #d4d4d4 #656565}
  .sky{background:linear-gradient(#222ec0,#1727f8 8%,#1d33fa 26%,#6898ed 42%,#78b4e4 52%,#7ab4e4 62%,#a0c1ec 74%,#cfcdf4 88%,#d2cdf5)}
  .grid{background:
    repeating-linear-gradient(90deg,#35f0e0 0 1px,transparent 1px 10px),
    repeating-linear-gradient(#35f0e0 0 1px,transparent 1px 9px),
    linear-gradient(#01030a,#17506c 45%,#03101a 46%)}
  .page{background:repeating-linear-gradient(transparent 0 5px,#555 5px 6px) 6px 6px/70% 80% no-repeat,#f3f0e4}
  .list{background:
    repeating-linear-gradient(#23468c 0 4px,transparent 4px 9px) 6px 7px/4px 80% no-repeat,
    repeating-linear-gradient(transparent 0 1px,#444 1px 3px,transparent 3px 9px) 14px 7px/60% 80% no-repeat,var(--well)}
  .bars{background:
    linear-gradient(90deg,#1600ff 30%,#f00 30% 36%,#0cff00 36%) 5px 6px/60px 9px no-repeat,
    linear-gradient(90deg,#1600ff 55%,#0cff00 55%) 5px 22px/60px 9px no-repeat,
    linear-gradient(90deg,#00feff 20%,#1600ff 20% 34%,#bdb7a3 34%) 5px 38px/60px 9px no-repeat,#a8bcbb}
  svg{display:block;width:100%;height:100%}
  .cap{display:block;height:19px;border-top:1px solid #5e5e5e;box-shadow:inset 0 1px 0 #d4d4d4;
    font:12px/18px Helvetica,Arial,sans-serif;text-align:center}
  @media (max-width:760px){
    #thumbs{display:none}
  }
</style>
