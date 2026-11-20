<script>
  // A System 7 window. It does what the workstation's windows do, in this machine's idiom:
  // drag by the title bar, resize from the grow box or any edge, close box, zoom box (fill the
  // screen and back), and a double-click on the title bar rolls it up. The vertical scroll bar
  // works: arrows, the track, the thumb, and the mouse wheel.
  import { mac, MENUBAR } from '#lib/game/mac.svelte.js';
  import { resized } from '#lib/ui-geometry.js';
  import close from '#lib/assets/mac/close.png';
  import zoom from '#lib/assets/mac/zoom.png';
  import up from '#lib/assets/mac/up.png';
  import down from '#lib/assets/mac/down.png';
  import upOn from '#lib/assets/mac/upon.png';
  import downOn from '#lib/assets/mac/downon.png';
  import thumbImg from '#lib/assets/mac/thumb.png';
  import track from '#lib/assets/mac/track.png';
  import left from '#lib/assets/mac/left.png';
  import right from '#lib/assets/mac/right.png';
  import growOn from '#lib/assets/mac/grow.png';
  import growOff from '#lib/assets/mac/growblur.png';

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
      win.rect.x = Math.max(60 - g.w, Math.min(innerWidth - 60, g.x + dx));
      win.rect.y = Math.max(MENUBAR, Math.min(innerHeight - 30, g.y + dy));
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
    const ro = new ResizeObserver(measure); ro.observe(content); ro.observe(inner);
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

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="mwin" class:open={win.open} class:focused class:shade={win.shade} class:zoom={win.zoom} {style} onpointerdowncapture={() => mac.front(id)}>
  {#if !win.shade}{#each HANDLES as dir (dir)}
    <div class="rz rz-{dir}" onpointerdown={e => press(e, dir)} onpointermove={move} onpointerup={drop} onpointercancel={drop}></div>
  {/each}{/if}
  <div class="title" onpointerdown={e => press(e)} onpointermove={move} onpointerup={drop} onpointercancel={drop} ondblclick={e => { if (!e.target.closest('.box')) mac.shade(id); }}>
    {#if focused}
      <i class="stripes"></i>
      <img class="box l" src={close} alt="Close" title="Close" draggable="false" onclick={() => mac.close(id)}>
      <img class="box r" src={zoom} alt="Zoom" title="Zoom" draggable="false" onclick={() => mac.zoom(id)}>
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
            <img src={upOn} alt="Scroll up" draggable="false" onclick={() => scrollBy(-LINE * 2)}>
            <div class="track" style="background-image:url({track})" onpointerdown={page}>
              <img class="thumb" src={thumbImg} alt="" draggable="false" style="top:{travel * top / max}px" onpointerdown={thumbDown} onpointermove={thumbMove} onpointerup={() => { thumbGrab = null; }} onpointercancel={() => { thumbGrab = null; }}>
            </div>
            <img src={downOn} alt="Scroll down" draggable="false" onclick={() => scrollBy(LINE * 2)}>
          {:else if focused}<img src={up} alt="" draggable="false"><img src={down} alt="" draggable="false">{/if}
        </div>
      </div>
      <div class="bottom">
        <div class="bar h">{#if focused}<img src={left} alt="" draggable="false"><img src={right} alt="" draggable="false">{/if}</div>
        <img class="grow" src={focused ? growOn : growOff} alt="" draggable="false" onpointerdown={e => press(e, 'se')} onpointermove={move} onpointerup={drop} onpointercancel={drop}>
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
  .bar.v > img{cursor:pointer}
  .track{flex:1;position:relative;image-rendering:pixelated}
  .thumb{position:absolute;left:0;touch-action:none}
  .bar.h{flex:1;height:14px}
  .bottom{flex:none;display:flex;border-top:1px solid #000}
  .grow{flex:none;width:15px;height:14px;padding-left:1px;background:#000;box-sizing:border-box;cursor:nwse-resize;touch-action:none}
  img{display:block}

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
