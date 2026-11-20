<script>
  // A System 7 window. It does what the workstation's windows do, in this machine's idiom:
  // drag by the title bar, resize from the grow box or any edge, close box, zoom box (fill the
  // screen and back), and a double-click on the title bar rolls it up. The vertical scroll bar
  // works: arrows, the track, the thumb, and the mouse wheel.
  import { mac, MENUBAR } from '#lib/game/mac.svelte.js';
  import { resized } from '#lib/ui-geometry.js';
  // header: the strip under the title bar (item counts, column names). plain: a picture
  // window, with no scroll bars. aspect: the width/height its content keeps when resized.
  let { id, header = null, plain = false, aspect = null, children } = $props();
  const win = $derived(mac.wins[id]);
  const focused = $derived(mac.focus === id);
  const style = $derived.by(() => {
    const r = win.rect;
    return `z-index:${win.z}` + (win.zoom ? '' : `;left:${r.x}px;top:${r.y}px;width:${r.w}px` + (win.shade ? '' : `;height:${r.h}px`));
  });
  const HANDLES = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
  const FRAME_W = 2, FRAME_H = 20;          // borders and title bar around a plain window's content
  let grab = null;

  function press(e, dir) {
    if (win.zoom || e.target.closest('.box')) return;
    grab = { dir, mx: e.clientX, my: e.clientY, ...win.rect };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!grab) return;
    const g = grab, dx = e.clientX - g.mx, dy = e.clientY - g.my;
    if (g.dir) Object.assign(win.rect, resized(g, dx, dy, { minW: 180, minH: 110, top: MENUBAR, aspect, frameW: FRAME_W, frameH: FRAME_H }));
    else {
      const screen = mac.size();
      win.rect.x = Math.max(60 - g.w, Math.min(screen.w - 60, g.x + dx));
      win.rect.y = Math.max(MENUBAR, Math.min(screen.h - 30, g.y + dy));
    }
  }
  const drop = () => { grab = null; };
  // a picture window takes the picture's shape as soon as that is known
  $effect(() => { if (aspect && plain) win.rect.h = (win.rect.w - FRAME_W) / aspect + FRAME_H; });

  /* ------------------------------------------------------------ scrolling */
  const LINE = 19, ARROW = 15, THUMB = 16;
  let content = $state(), inner = $state();
  let top = $state(0), max = $state(0), view = $state(0);
  function measure() { if (!content) return; top = content.scrollTop; view = content.clientHeight; max = Math.max(0, content.scrollHeight - view); }
  $effect(() => {
    if (!content || !inner) return;
    // the observer must come from the window the content is in, which may be the second display's
    const ro = new (content.ownerDocument.defaultView.ResizeObserver)(measure); ro.observe(content); ro.observe(inner);
    return () => ro.disconnect();
  });
  const scrollBy = d => { content.scrollTop += d; };
  const travel = $derived(Math.max(0, view - 2 * ARROW - THUMB));       // how far the thumb can move
  let thumbGrab = null;
  function thumbDown(e) { thumbGrab = { y: e.clientY, top }; e.currentTarget.setPointerCapture(e.pointerId); e.stopPropagation(); }
  function thumbMove(e) { if (thumbGrab && travel) content.scrollTop = thumbGrab.top + (e.clientY - thumbGrab.y) / travel * max; }
  // a click in the track above or below the thumb moves a windowful
  function page(e) { const t = e.currentTarget.querySelector('.thumb').getBoundingClientRect(); scrollBy((e.clientY < t.top ? -1 : 1) * (view - LINE)); }
</script>

<!-- A scroll arrow, pointing up unless turned; filled when there is something to scroll. -->
{#snippet arrow(turn, on = false)}
  <svg width="14" height="14" viewBox="0 0 14 14" style="transform:rotate({turn}deg)"><path d="M7 2.500 11.500 7.500h-2v4h-5v-4h-2z" fill={on ? '#a4a7d8' : 'none'} stroke={on ? '#343555' : '#777'}/></svg>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="mwin" class:open={win.open} class:focused class:shade={win.shade} class:zoom={win.zoom} {style} onpointerdowncapture={() => mac.front(id)}>
  {#if !win.shade}{#each HANDLES as dir (dir)}
    <div class="rz rz-{dir}" onpointerdown={e => press(e, dir)} onpointermove={move} onpointerup={drop} onpointercancel={drop}></div>
  {/each}{/if}
  <div class="title" onpointerdown={e => press(e)} onpointermove={move} onpointerup={drop} onpointercancel={drop} ondblclick={e => { if (!e.target.closest('.box')) mac.shade(id); }}>
    {#if focused}
      <i class="stripes"></i>
      <svg class="box l" width="13" height="12" viewBox="0 0 13 12" shape-rendering="crispEdges" onclick={() => mac.close(id)}><title>Close</title><rect width="13" height="12" fill="#eee"/><rect x="1.5" y="1.5" width="9" height="9" fill="#a5a5b0" stroke="#333355"/><path d="M2.5 9.5v-7h7" fill="none" stroke="#d6d6ea"/></svg>
      <svg class="box r" width="13" height="12" viewBox="0 0 13 12" shape-rendering="crispEdges" onclick={() => mac.zoom(id)}><title>Zoom</title><rect width="13" height="12" fill="#eee"/><rect x="1.5" y="1.5" width="9" height="9" fill="#a5a5b0" stroke="#333355"/><path d="M2.5 9.5v-7h7" fill="none" stroke="#d6d6ea"/><path d="M2 6.5h4.500v-4.500" fill="none" stroke="#333355"/></svg>
    {/if}
    <span>{win.title}</span>
  </div>
  {#if !win.shade}
    {#if header}<div class="header">{@render header()}</div>{/if}
    {#if plain}
      <div class="mid">{@render children()}</div>
    {:else}
      <div class="mid">
        <div class="content" bind:this={content} onscroll={measure}><div bind:this={inner}>{@render children()}</div></div>
        <div class="bar v">
          {#if focused && max > 0}
            <div class="cell on" title="Scroll up" onclick={() => scrollBy(-LINE * 2)}>{@render arrow(0, true)}</div>
            <div class="track" onpointerdown={page}>
              <div class="thumb" style="top:{travel * top / max}px" onpointerdown={thumbDown} onpointermove={thumbMove} onpointerup={() => { thumbGrab = null; }} onpointercancel={() => { thumbGrab = null; }}></div>
            </div>
            <div class="cell on" title="Scroll down" onclick={() => scrollBy(LINE * 2)}>{@render arrow(180, true)}</div>
          {:else if focused}<div class="cell">{@render arrow(0)}</div><div class="cell">{@render arrow(180)}</div>{/if}
        </div>
      </div>
      <div class="bottom">
        <div class="bar h">{#if focused}<div class="cell">{@render arrow(270)}</div><div class="cell">{@render arrow(90)}</div>{/if}</div>
        <div class="grow" onpointerdown={e => press(e, 'se')} onpointermove={move} onpointerup={drop} onpointercancel={drop}>
          <svg width="14" height="14" viewBox="0 0 14 14" shape-rendering="crispEdges"><rect x="5.500" y="5.500" width="6" height="6" fill={focused ? '#a5a5b0' : '#fff'} stroke="#333355"/><rect x="2.500" y="2.500" width="5" height="5" fill={focused ? '#dcdcee' : '#fff'} stroke="#333355"/></svg>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .mwin{position:absolute;display:none;flex-direction:column;background:#fff;border:1px solid #000;box-shadow:1px 1px 0 #000;color:#000}
  .mwin.open{display:flex}
  .mwin.zoom{left:2px;top:22px;right:3px;bottom:3px}
  .mwin.zoom.shade{bottom:auto}

  /* title bar: six pinstripes with the name on a clear patch, or plain white when not in front */
  .title{flex:none;position:relative;height:18px;display:flex;justify-content:center;align-items:center;background:#fff;
    border-bottom:1px solid #000;touch-action:none;cursor:default}
  .shade .title{border-bottom:0}
  .focused .title{background:#eee;box-shadow:inset 0 1px 0 #ccccdd,inset 0 -1px 0 #aaa}
  .stripes{position:absolute;left:1px;right:1px;top:3px;height:11px;background:repeating-linear-gradient(#777 0 1px,transparent 1px 2px)}
  .title span{position:relative;padding:0 7px;font:bold 12px/15px Charcoal,Chicago,Geneva,Verdana,sans-serif;color:#838383;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:calc(100% - 50px)}
  .focused .title span{background:#eee;color:#000}
  .box{position:absolute;top:2px;cursor:pointer}
  .box.l{left:7px} .box.r{right:7px}

  .header{flex:none;border-bottom:3px double #000;font:10px Geneva,Verdana,sans-serif;white-space:nowrap;overflow:hidden}
  .mid{flex:1;min-height:0;display:flex}
  .content{flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
  .content::-webkit-scrollbar{display:none}
  .bar{flex:none;display:flex;justify-content:space-between;background:#fff}
  .focused .bar{background:#eee}
  .bar.v{width:15px;flex-direction:column;border-left:1px solid #000}
  /* arrow cells: a rule divides each from the track */
  .cell{flex:none;width:14px;height:14px}
  .bar.v .cell:first-child{border-bottom:1px solid #777} .bar.v .cell:last-child{border-top:1px solid #777}
  .bar.h .cell:first-child{border-right:1px solid #777} .bar.h .cell:last-child{border-left:1px solid #777}
  .bar .cell.on{border-color:#000;cursor:pointer}
  /* the track is a light grey with a sprinkling of dark dots; the thumb is ribbed */
  .track{flex:1;position:relative;background:#ddd url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='2'%3E%3Crect x='1' width='1' height='1' fill='%23777'/%3E%3Crect x='3' y='1' width='1' height='1' fill='%23777'/%3E%3C/svg%3E")}
  .thumb{position:absolute;left:0;width:14px;height:16px;box-sizing:border-box;border:1px solid #333355;touch-action:none;
    background:repeating-linear-gradient(#63628e 0 1px,#d1d0fb 1px 2px) 3px 4px/6px 8px no-repeat,#a5a8cb}
  .bar.h{flex:1;height:14px}
  .bottom{flex:none;display:flex;border-top:1px solid #000}
  .grow{flex:none;width:14px;height:14px;border-left:1px solid #000;background:#fff;cursor:nwse-resize;touch-action:none}
  .focused .grow{background:#eee}
  svg{display:block}

  /* the edges resize too, as on the workstation; the grow box is the visible way */
  .rz{position:absolute;touch-action:none}
  .zoom .rz{display:none}
  .rz-n,.rz-s{left:10px;right:10px;height:5px;cursor:ns-resize}
  .rz-e,.rz-w{top:10px;bottom:10px;width:5px;cursor:ew-resize}
  .rz-n{top:-4px} .rz-s{bottom:-4px} .rz-e{right:-4px} .rz-w{left:-4px}
  .rz-nw,.rz-ne,.rz-sw,.rz-se{width:12px;height:12px}
  .rz-nw{left:-4px;top:-4px;cursor:nwse-resize} .rz-ne{right:-4px;top:-4px;cursor:nesw-resize}
  .rz-sw{left:-4px;bottom:-4px;cursor:nesw-resize} .rz-se{right:-4px;bottom:-4px;cursor:nwse-resize}
</style>
