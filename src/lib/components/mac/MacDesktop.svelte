<script>
  // The left monitor: an early Macintosh desktop with its menu bar, icons and windows.
  import { mac, tallWindowFor } from '#lib/game/mac.svelte.js';
  import { HD, TRASH, CLIP } from '#lib/game/macfs.js';
  import { sfx } from '#lib/game/audio.js';
  import MacWindow from './MacWindow.svelte';
  import MacIcon from './MacIcon.svelte';
  import MacList from './MacList.svelte';
  import MacKing from './MacKing.svelte';
  import pattern from '#lib/assets/mac/pattern.png';
  import help from '#lib/assets/mac/help.png';
  import app from '#lib/assets/mac/app.png';
  import hd from '#lib/assets/mac/hd.png';
  import trash from '#lib/assets/mac/trash.png';

  tallWindowFor(HD);
  const count = n => n === 1 ? '1 item' : n + ' items';

  // Menus: [label, action] with no action meaning greyed out; null is a divider.
  let menu = $state(null);
  const MENUS = $derived({
    File: [['Open', mac.selected ? () => mac.openSelected() : null], ['Close Window', mac.focus ? () => mac.closeFront() : null]],
    Edit: [['Undo'], null, ['Cut'], ['Copy'], ['Paste'], ['Clear']],
    Special: [['Clean Up Desktop'], ['Empty Trash'], null, ['Restart', () => location.reload()]],
  });
  function pick(fn) { menu = null; sfx.click(); fn(); }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div id="mac">
  <div class="screen" style="background-image:url({pattern})" onpointerdown={e => { if (e.target === e.currentTarget) { mac.focus = null; mac.selected = null; } menu = e.target.closest('.menus') ? menu : null; }}>
    <div class="deskicons">
      <MacIcon id="desk/hd" name="Main HD" src={hd} onopen={() => mac.open(HD, 'hd')} />
      <MacIcon id="desk/clip" name="fiveDocksClip" onopen={() => mac.open(CLIP, 'desk/clip')} />
    </div>
    <div class="trash"><MacIcon id="desk/trash" name="Trash" src={trash} onopen={() => mac.open(TRASH, 'trash')} /></div>

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
      <img src={help} alt="" draggable="false"><img src={app} alt="" draggable="false">
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
