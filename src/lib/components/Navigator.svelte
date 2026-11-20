<script>
  // The main fsnav window: the 3D view plus the containment / selection side panel.
  import { onMount } from 'svelte';
  import { game, fmt } from '#lib/game/state.svelte.js';
  import { TYPES } from '#lib/game/fs.js';
  import { createEngine } from '#lib/game/engine.js';
  import { attachEngine, boot, fatal, press, select, activate, lose, openFile, execFile, flyHome, flyUp, overview, inPlay, toggleSound, showHelp } from '#lib/game/actions.js';
  import Window from './Window.svelte';

  let canvas, view, con;

  onMount(() => {
    let engine;
    try { engine = createEngine(canvas, view, { select, activate, lose }); }
    catch (e) { fatal(); throw e; }
    attachEngine(engine);
    boot();
    return () => engine.dispose();
  });

  const info = $derived.by(() => {
    const f = game.sel;
    return f ? `name  ${f.name}\ntype  ${TYPES[f.type].label}\nsize  ${f.kb} KB\npath  ${f.path}` : '(nothing selected)';
  });
  $effect(() => { game.logs; con.scrollTop = con.scrollHeight; });

  const SIGS = ['okafor', 'lindqvist', 'varga'];
</script>

<Window id="main" title="fsnav — m9-ops:{game.cwd.path}" minW={520} minH={360}>
  <div class="menubar">
    <button onclick={press(() => location.reload())}>Restart</button>
    <button onclick={press(inPlay(overview))}>Overview</button>
    <button onclick={press(toggleSound)}>Sound: {game.soundOn ? 'On' : 'Off'}</button>
    <span class="sp"></span>
    <button onclick={press(showHelp)}>Help</button>
  </div>
  <div class="body">
    <div id="view" class="inset" bind:this={view}>
      <canvas bind:this={canvas} class:hot={game.hot} class:drag={game.dragging}></canvas>
      <div id="pathtag">{game.cwd.path}</div>
      <div id="hovertag">{game.hoverTag}</div>
      <div id="alarm" class:on={game.alarm}></div>
      <div id="alarmtag">WATCHDOG CONTACT — CLOCK x3</div>
      <div id="whiteout" class:on={game.mode === 'lost'}></div>
    </div>
    <div id="side">
      <div class="group" style="margin-top:6px">
        <h4>Containment</h4>
        <div id="timer" class="inset" class:hit={game.timerHit} class:safe={game.mode === 'won'}>{fmt(game.time)}</div>
        <div id="sigs">
          {#each SIGS as who (who)}<div class="sig inset" class:on={game.keys.includes(who)}>{who.toUpperCase()}</div>{/each}
        </div>
      </div>
      <div class="group" style="margin-top:6px">
        <h4>Selection</h4>
        <div id="info" class="inset">{info}</div>
      </div>
      <div class="btnrow">
        <button disabled={!game.sel} onclick={press(() => openFile(game.sel))}>Open</button>
        <button disabled={!game.sel} onclick={press(() => execFile(game.sel))}>Execute</button>
        <button onclick={press(inPlay(flyUp))}>Parent Dir</button>
        <button onclick={press(inPlay(flyHome))}>Home /</button>
      </div>
      <div id="console" class="term inset" bind:this={con}>{#each game.logs as l (l.id)}<div class={l.cls}>{l.msg}</div>{/each}</div>
    </div>
  </div>
  <div class="statusbar inset">Drag: look &nbsp;|&nbsp; W A S D: fly &nbsp;|&nbsp; R / F: climb / dive &nbsp;|&nbsp; Shift: boost &nbsp;|&nbsp; Click: select or fly to &nbsp;|&nbsp; Double-click / Enter: open or run</div>
</Window>

<style>
  .menubar{display:flex;gap:2px;padding:2px 4px;flex:none;border-bottom:2px solid;border-color:var(--lo);box-shadow:0 1px 0 var(--hi)}
  .menubar button{border-color:transparent;outline:none;padding:3px 10px}
  .menubar button:hover{border-color:var(--hi) var(--lo) var(--lo) var(--hi)}
  .menubar button:active{border-color:var(--lo) var(--hi) var(--hi) var(--lo);padding:3px 10px}
  .menubar .sp{flex:1}
  .body{flex:1;display:flex;min-height:0;padding:6px;gap:6px}
  #view{flex:1;position:relative;min-width:0;min-height:0;background:#000;overflow:hidden}
  canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
  canvas.hot{cursor:pointer}
  canvas.drag{cursor:grabbing}
  #pathtag{position:absolute;left:8px;top:6px;font:bold 13px "Courier New",monospace;color:#7ff;text-shadow:0 0 6px #0cf;pointer-events:none}
  #hovertag{position:absolute;left:8px;bottom:6px;font:bold 12px "Courier New",monospace;color:#ffe27a;text-shadow:0 0 6px #b80;pointer-events:none}
  #alarm{position:absolute;inset:0;pointer-events:none;opacity:0;
    box-shadow:inset 0 0 90px 30px #f02;transition:opacity .15s}
  #alarm.on{opacity:1;animation:pulse .4s steps(2) infinite}
  #alarmtag{position:absolute;right:8px;top:6px;font:bold 13px "Courier New",monospace;color:#ff5a6e;text-shadow:0 0 6px #f02;pointer-events:none;visibility:hidden}
  #alarm.on + #alarmtag{visibility:visible}
  @keyframes pulse{50%{opacity:.45}}
  #whiteout{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity 2.5s ease-in}
  #whiteout.on{opacity:1}

  #side{width:250px;flex:none;display:flex;flex-direction:column;gap:6px;min-height:0}
  .group{padding:6px;border:2px solid;border-color:var(--lo) var(--hi) var(--hi) var(--lo);position:relative}
  .group > h4{margin:-13px 0 4px 4px;font-size:11px;background:var(--face);display:table;padding:0 4px}
  #timer{
    background:#120000;color:#ff2a1a;text-align:center;
    font:bold 34px "Courier New",monospace;letter-spacing:2px;line-height:44px;
    text-shadow:0 0 8px #f00,0 0 2px #f88;
  }
  #timer.hit{background:#600;color:#fff}
  #timer.safe{color:#3dff8a;text-shadow:0 0 8px #0f6;background:#001207}
  #sigs{display:flex;gap:4px;margin-top:6px}
  .sig{flex:1;text-align:center;font-size:9px;padding:3px 0;background:#3c3c3c;color:#909090;letter-spacing:.5px}
  .sig.on{background:#ffd23a;color:#221a00;box-shadow:0 0 8px #fc0}
  #info{font:12px "Courier New",monospace;font-weight:bold;line-height:1.45;min-height:74px;white-space:pre-wrap;word-break:break-all;background:var(--well);padding:4px 6px}
  .btnrow{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  #console{flex:1;min-height:60px}
  .statusbar{flex:none;margin:0 6px 6px;padding:3px 8px;font-size:11px;font-weight:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  @media (max-width:760px){
    .body{flex-direction:column}
    #side{width:auto;height:44%;}
    #console{min-height:40px}
    #timer{font-size:24px;line-height:30px}
  }
</style>
