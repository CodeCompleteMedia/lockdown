<script>
  // The left monitor: an early Macintosh desktop with its menu bar, icons and windows.
  import { mac, tallWindowFor } from '#lib/game/mac.svelte.js';
  import { HD, TRASH, CLIP } from '#lib/game/macfs.js';
  import { sfx } from '#lib/game/audio.js';
  import { ui } from '#lib/game/state.svelte.js';
  import { closeSecondDisplay, toggleFullScreen } from '#lib/second-display.js';
  import MacWindow from './MacWindow.svelte';
  import MacIcon from './MacIcon.svelte';
  import MacList from './MacList.svelte';
  import MacKing from './MacKing.svelte';

  tallWindowFor(HD);
  const count = n => n === 1 ? '1 item' : n + ' items';
  let screenEl = $state();
  $effect(() => { mac.screenEl = screenEl; return () => { if (mac.screenEl === screenEl) mac.screenEl = null; }; });

  // The desktop is a one-pixel checkerboard, which turns to moiré bands the moment a check
  // is not a whole number of physical pixels. So the pattern follows the screen, and is
  // rebuilt whenever the zoom level or the display changes:
  //  - at whole-number scales it is a plain CSS gradient, one CSS pixel per check;
  //  - at fractional scales (browser zoom, 125% display scaling) a gradient would be blended
  //    and a fractional tile size gets rounded, so the tile is drawn pixel for pixel on a
  //    canvas, at a size that is a whole number of both CSS and device pixels;
  //  - if no such size exists, a flat mid grey, which is what the pattern averages to.
  const DARK = '#606060', LIGHT = '#a0a0a0';
  let pattern = $state('');
  function checkerboard(dpr) {
    if (dpr === Math.round(dpr)) return `repeating-conic-gradient(${DARK} 0 25%,${LIGHT} 0 50%) 0 0/2px 2px`;
    const n = Math.max(2, Math.round(dpr));                 // device pixels per check
    for (let css = 1; css <= 256; css++) {                  // tile width in CSS pixels
      const px = css * dpr, whole = Math.round(px);
      if (Math.abs(px - whole) > 1e-4 || whole % (2 * n)) continue;
      const c = document.createElement('canvas'), g = c.getContext('2d');
      c.width = c.height = whole;
      g.fillStyle = LIGHT; g.fillRect(0, 0, whole, whole);
      g.fillStyle = DARK;
      for (let y = 0; y < whole; y += n) for (let x = (y / n) % 2 ? n : 0; x < whole; x += 2 * n) g.fillRect(x, y, n, n);
      return `url(${c.toDataURL()}) 0 0/${css}px ${css}px`;
    }
    return '#808080';
  }
  $effect(() => {
    if (!screenEl) return;
    // ask the window this desktop is actually in: a second display can have a different pixel ratio
    const view = screenEl.ownerDocument.defaultView;
    let query, stop = false;
    const measure = () => {
      if (stop) return;
      const dpr = view.devicePixelRatio || 1;
      pattern = 'background:' + checkerboard(dpr);
      query = view.matchMedia(`(resolution: ${dpr}dppx)`);
      query.addEventListener('change', measure, { once: true });
    };
    measure();
    return () => { stop = true; query?.removeEventListener('change', measure); };
  });

  // Menus: [label, action] with no action meaning greyed out; null is a divider.
  let menu = $state(null);
  const MENUS = $derived({
    File: [['Open', mac.selected ? () => mac.openSelected() : null], ['Close Window', mac.focus ? () => mac.closeFront() : null]],
    Edit: [['Undo'], null, ['Cut'], ['Copy'], ['Paste'], ['Clear']],
    Special: [['Clean Up Desktop'], ['Empty Trash'], null, ['Full Screen', () => toggleFullScreen(screenEl)], ...(ui.dual ? [['Return To One Display', closeSecondDisplay]] : []), null, ['Restart', () => location.reload()]],
  });
  function pick(fn) { menu = null; sfx.click(); fn(); }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div id="mac">
  <div class="screen" bind:this={screenEl} style={pattern} onpointerdown={e => { if (e.target === e.currentTarget) { mac.focus = null; mac.selected = null; } menu = e.target.closest('.menus') ? menu : null; }}>
    <div class="deskicons">
      <MacIcon id="desk/hd" name="Macintosh HD" icon="disk" onopen={() => mac.open(HD, 'hd')} />
      <MacIcon id="desk/clip" name="fiveDocksClip" onopen={() => mac.open(CLIP, 'desk/clip')} />
    </div>
    <div class="trash"><MacIcon id="desk/trash" name="Trash" icon="trash" onopen={() => mac.open(TRASH, 'trash')} /></div>

    {#each Object.entries(mac.wins) as [id, w] (id)}
      {#if w.kind === 'list'}
        <MacWindow {id}>
          {#snippet header()}
            <div class="info"><span>{count(w.node.children.length)}</span><span>42.0 MB in disk</span><span>777.0 available</span></div>
            <div class="cols"><span class="c-name"><u>Name</u></span><span class="c-size">Size</span><span class="c-kind">Kind</span><span>Label</span></div>
          {/snippet}
          <div class="list" onpointerdown={e => { if (e.target === e.currentTarget) mac.selected = null; }}><MacList node={w.node} path={w.path} /></div>
        </MacWindow>
      {:else if w.kind === 'text'}
        <MacWindow {id}><div class="text">{w.text}</div></MacWindow>
      {:else if w.kind === 'image'}
        <MacWindow {id} plain aspect={w.aspect}><img class="pic" src={w.src} alt={w.title} draggable="false" onload={e => { w.aspect = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight; }}></MacWindow>
      {:else}
        <MacWindow {id} plain><MacKing /></MacWindow>
      {/if}
    {/each}

    <div class="menubar">
      <div class="menus">
        {#each Object.keys(MENUS) as name (name)}
          <div class="menu" class:on={menu === name} onpointerdown={() => { menu = menu === name ? null : name; }} onpointerenter={() => { if (menu) menu = name; }}>
            {name}
            {#if menu === name}
              <div class="drop" onpointerdown={e => e.stopPropagation()}>
                {#each MENUS[name] as item}
                  {#if item}<div class="item" class:off={!item[1]} onclick={() => item[1] && pick(item[1])}>{item[0]}</div>{:else}<hr>{/if}
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      <!-- the help menu and the application menu, at the right as on the real thing -->
      <svg width="16" height="16" viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="#ddd" stroke="#000"/><text x="8" y="12.5" text-anchor="middle" font-family="Charcoal,Chicago,Geneva,Verdana,sans-serif" font-weight="bold" font-size="12" fill="#000" stroke="#ffee55" stroke-width="2.5" paint-order="stroke">?</text></svg>
      <svg width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="M3.5 1.5h9v11h-9z" fill="#ddd" stroke="#000"/><rect x="5.5" y="3.5" width="5" height="4" fill="#99aaff" stroke="#000"/><path d="M8 10.5h3" stroke="#000"/><path d="M2.5 12.5h11v2h-11z" fill="#bbb" stroke="#000"/></svg>
    </div>

    {#if mac.alert}
      <div class="veil">
        <div class="alert">
          <svg width="32" height="32" viewBox="0 0 32 32"><path d="M16 2 30 29H2z" fill="#fff" stroke="#000" stroke-width="2"/><path d="M15 11h2v10h-2zM15 23h2v2h-2z"/></svg>
          <p>{mac.alert}</p>
          <div class="ok" onclick={() => { mac.alert = null; }}>OK</div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* the tube: black behind, the picture with slightly rounded corners in front */
  #mac{position:absolute;left:0;top:0;width:100vw;height:100%;background:#000;color:#000;
    font:12px Geneva,Verdana,sans-serif;-webkit-font-smoothing:none;font-smooth:never;font-kerning:none;cursor:default}
  /* the checkerboard itself is set from the script above; the grey shows until it is */
  .screen{position:absolute;inset:0;border-radius:7px;overflow:hidden;background-color:#808080;image-rendering:pixelated}
  .menubar{position:absolute;left:0;right:0;top:0;height:20px;z-index:100000;display:flex;align-items:center;gap:12px;padding:0 16px 0 30px;background:#fff;border-bottom:1px solid #000}
  .menus{flex:1;display:flex;align-self:stretch}
  .menu{position:relative;display:flex;align-items:center;padding:0 9px;font:bold 12px Charcoal,Chicago,Geneva,Verdana,sans-serif}
  .menu.on{background:#000;color:#fff}
  .drop{position:absolute;left:0;top:19px;min-width:150px;padding:1px 0;background:#fff;color:#000;border:1px solid #000;box-shadow:1px 1px 0 #000}
  .item{padding:1px 14px;white-space:nowrap}
  .item:hover{background:#000;color:#fff}
  .item.off,.item.off:hover{background:none;color:#999}
  hr{margin:2px 0;border:0;border-top:1px dotted #777}
  .deskicons{position:absolute;right:8px;top:42px;display:flex;flex-direction:column;align-items:center;gap:14px}
  .trash{position:absolute;right:26px;bottom:20px}
  .info{height:17px;display:flex;align-items:center;justify-content:space-between;padding:0 6px 0 10px;border-bottom:1px dotted #000}
  .cols{height:17px;display:flex;align-items:center;padding-right:4px}
  .c-name{flex:0 0 235px;padding-left:38px;box-sizing:border-box}
  .c-size{flex:0 0 56px;text-align:right}
  .c-kind{flex:1;padding-left:10px}
  .list{min-height:100%;padding:3px 0;font:10px Geneva,Verdana,sans-serif}
  .text{padding:8px 10px;white-space:pre-wrap;font:12px/16px Geneva,Verdana,sans-serif;user-select:text;-webkit-user-select:text}
  .pic{display:block;width:100%;height:100%;min-height:0;object-fit:contain;image-rendering:auto}
  /* the alert box: nothing else answers until it is dismissed */
  .veil{position:absolute;inset:0;z-index:200000;display:flex;align-items:center;justify-content:center}
  .alert{width:370px;max-width:calc(100% - 20px);display:grid;grid-template-columns:32px 1fr;gap:10px 16px;padding:16px 18px 14px;background:#fff;border:1px solid #000;outline:2px solid #fff;box-shadow:0 0 0 3px #000,0 0 0 4px #fff,0 0 0 5px #000}
  .alert p{margin:0;font:bold 12px/16px Charcoal,Chicago,Geneva,Verdana,sans-serif}
  .ok{grid-column:2;justify-self:end;min-width:58px;padding:2px 0;text-align:center;font:bold 12px Charcoal,Chicago,Geneva,Verdana,sans-serif;border:1px solid #000;border-radius:5px;box-shadow:0 0 0 2px #fff,0 0 0 4px #000;margin:4px 4px 2px 0;cursor:pointer}
  .ok:active{background:#000;color:#fff}
</style>
