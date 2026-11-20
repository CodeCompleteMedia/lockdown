<script>
  // A desktop window: title bar with window-menu / minimize / maximize buttons, dragged by
  // the title, resized from any edge or corner of the frame. State lives in ui.wins[id].
  import { ui } from '#lib/game/state.svelte.js';
  import { sfx } from '#lib/game/audio.js';
  import { toggleWindowMenu } from '#lib/game/desktop.js';

  // aspect, when given, is the width/height the content area keeps while the window is resized.
  let { id, title, minW = 240, minH = 140, aspect = null, children } = $props();
  const FRAME_W = 2, FRAME_H = 27;      // what the borders and title bar add around the content
  const win = $derived(ui.wins[id]);
  const style = $derived.by(() => {
    const r = win.rect;
    return `z-index:${win.z}` + (r && !win.max ? `;left:${r.x}px;top:${r.y}px;width:${r.w}px` + (r.h == null ? '' : `;height:${r.h}px`) : '');
  });
  let el, grab = null;

  // Edges and corners of the frame, each a resize handle.
  const HANDLES = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];

  // Pin the current on-screen geometry into state the first time the window is manipulated.
  function pin(withHeight) {
    const b = el.getBoundingClientRect(), r = win.rect;
    win.rect = { x: b.left, y: b.top, w: b.width, h: withHeight || !r || r.h != null ? b.height : null };
    return win.rect;
  }
  function down(e, dir) {
    if (win.max || (!dir && e.target.closest('.b'))) return;
    const r = pin(!!dir);
    grab = { dir, mx: e.clientX, my: e.clientY, ...r };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!grab) return;
    const g = grab, r = win.rect, dx = e.clientX - g.mx, dy = e.clientY - g.my;
    if (!g.dir) {
      r.x = Math.max(0, Math.min(innerWidth - 60, g.x + dx));
      r.y = Math.max(0, Math.min(innerHeight - 30, g.y + dy));
      return;
    }
    let w = g.w, h = g.h;
    if (g.dir.includes('e')) w = Math.max(minW, g.w + dx);
    if (g.dir.includes('w')) w = Math.max(minW, g.w - dx);
    if (g.dir.includes('s')) h = Math.max(minH, g.h + dy);
    if (g.dir.includes('n')) h = Math.max(minH, Math.min(g.h - dy, g.y + g.h));
    // with a locked shape, the sides and corners set the width and the top and bottom set the height
    if (aspect) { if (/[ew]/.test(g.dir)) h = (w - FRAME_W) / aspect + FRAME_H; else w = (h - FRAME_H) * aspect + FRAME_W; }
    r.w = w; r.h = h;
    if (g.dir.includes('w')) r.x = g.x + g.w - w;
    if (g.dir.includes('n')) r.y = g.y + g.h - h;
  }
  const drop = () => { grab = null; };
  const act = fn => () => { ui.closeMenu(); sfx.click(); fn(); };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="win" class:float={id !== 'main'} class:open={ui.shown(id)} class:maxed={win.max} class:fill={!win.rect} {id} {style}
  bind:this={el} onpointerdowncapture={() => ui.raise(id)}>
  {#each HANDLES as dir (dir)}
    <div class="rz {dir}" onpointerdown={e => down(e, dir)} onpointermove={move} onpointerup={drop} onpointercancel={drop}></div>
  {/each}
  <div class="titlebar" onpointerdown={e => down(e)} onpointermove={move} onpointerup={drop} onpointercancel={drop}>
    <div class="b menu" title="Window menu (double-click to close)" onclick={e => toggleWindowMenu(id, e.currentTarget)} ondblclick={() => { ui.closeMenu(); ui.close(id); }}></div>
    <div class="t">{title}</div>
    <div class="b min" title="Minimize" onclick={act(() => ui.minimize(id))}></div>
    <div class="b max" title={win.max ? 'Restore' : 'Maximize'} onclick={act(() => ui.toggleMax(id))}></div>
  </div>
  {@render children()}
</div>

<style>
  .win:not(.open){display:none}
  .float{max-width:calc(100vw - 16px)}
  /* the navigator's default place: beside the toolchest, filling the rest of the desktop */
  .fill{left:129px;top:112px;right:18px;bottom:18px}
  .maxed{left:18px;top:18px;right:18px;bottom:18px;max-width:none}
  .b{cursor:pointer}

  /* resize handles lie over the 7px frame, which is drawn outside the box. Corners are
     L-shaped and reach as far as the notches in the frame. */
  .rz{position:absolute;touch-action:none}
  .maxed .rz{display:none}
  .n,.s{left:24px;right:24px;height:7px;cursor:ns-resize}
  .e,.w{top:24px;bottom:24px;width:7px;cursor:ew-resize}
  .n{top:-7px} .s{bottom:-7px} .e{right:-7px} .w{left:-7px}
  .nw,.ne,.sw,.se{width:31px;height:31px}
  .nw{left:-7px;top:-7px;cursor:nwse-resize;clip-path:polygon(0 0,100% 0,100% 7px,7px 7px,7px 100%,0 100%)}
  .ne{right:-7px;top:-7px;cursor:nesw-resize;clip-path:polygon(0 0,100% 0,100% 100%,calc(100% - 7px) 100%,calc(100% - 7px) 7px,0 7px)}
  .sw{left:-7px;bottom:-7px;cursor:nesw-resize;clip-path:polygon(0 0,7px 0,7px calc(100% - 7px),100% calc(100% - 7px),100% 100%,0 100%)}
  .se{right:-7px;bottom:-7px;cursor:nwse-resize;clip-path:polygon(calc(100% - 7px) 0,100% 0,100% 100%,0 100%,0 calc(100% - 7px),calc(100% - 7px) calc(100% - 7px))}

  @media (max-width:760px){
    .fill,.maxed{left:8px;top:40px;right:8px;bottom:8px}
  }
</style>
