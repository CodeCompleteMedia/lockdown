<script>
  // The rows of a Finder list view: a folder's contents, with folders that open in place.
  import { mac } from '#lib/game/mac.svelte.js';
  import { sizeText } from '#lib/game/macfs.js';
  import MacList from './MacList.svelte';

  let { node, path, depth = 0 } = $props();
  const where = child => path + '/' + child.name;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
{#each node.children as child (child.name)}
  {@const p = where(child)}
  <div class="line" class:sel={mac.selected === p} onclick={() => mac.click(p, () => mac.open(child, p))}>
    <span class="name" style="padding-left:{5 + depth * 18}px">
      {#if child.kind === 'folder'}
        <svg class="tri" class:down={mac.expanded[p]} width="9" height="11" viewBox="0 0 9 11" onclick={e => { e.stopPropagation(); mac.expanded[p] = !mac.expanded[p]; }}><path d="M1.5 1.5v8l6-4z" fill="#aaa" stroke="#333"/></svg>
        <svg class="ic" width="14" height="11" viewBox="0 0 14 11" shape-rendering="crispEdges"><path d="M.5 2.5h1l1-1h3l1 1h7v8H.5z" fill="#fff" stroke="#000"/></svg>
      {:else}
        <i class="tri"></i>
        {#if child.kind === 'application program'}
          <svg class="ic" width="14" height="12" viewBox="0 0 14 12"><path d="M7 .7 13.3 6 7 11.3.7 6z" fill="#fff" stroke="#000"/><path d="M4 6h6M7 4v4" stroke="#000"/></svg>
        {:else}
          <svg class="ic" width="14" height="12" viewBox="0 0 14 12" shape-rendering="crispEdges"><path d="M3.5.5h5l3 3v8h-8z" fill="#fff" stroke="#000"/><path d="M8.5.5v3h3" fill="none" stroke="#000"/></svg>
        {/if}
      {/if}
      <b>{child.name}</b>
    </span>
    <span class="size">{sizeText(child)}</span>
    <span class="kind">{child.kind}</span>
  </div>
  {#if child.kind === 'folder' && mac.expanded[p]}<MacList node={child} path={p} depth={depth + 1} />{/if}
{/each}

<style>
  .line{display:flex;align-items:center;height:19px;white-space:nowrap}
  .name{flex:0 0 235px;display:flex;align-items:center;overflow:hidden}
  .tri{flex:none;width:9px;margin-right:6px;cursor:pointer}
  .tri.down{transform:rotate(90deg)}
  .ic{flex:none;margin-right:6px}
  b{font-weight:normal;padding:0 2px;overflow:hidden;text-overflow:ellipsis}
  .sel b{background:#000;color:#fff}
  .sel .ic{filter:brightness(.55)}
  .size{flex:0 0 56px;text-align:right}
  .kind{flex:1;padding-left:10px;overflow:hidden;text-overflow:ellipsis}
</style>
