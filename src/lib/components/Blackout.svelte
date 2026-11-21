<script>
  // The workstation with its power cut: a black tube, then two words and a cursor.
  import { power } from '#lib/game/power.svelte.js';
</script>

{#if power.dark}
  <div id="blackout">
    {#if power.phase !== 'off'}<p>System Ready<span></span></p>{/if}
  </div>
{/if}

<style>
  /* above every window, the menu and the dialog; the tabs at the screen edges stay on top */
  #blackout{position:absolute;inset:0;z-index:20000;background:#000;cursor:default;animation:cut .45s ease-out}
  /* the picture collapsing to a line as the tube loses power */
  #blackout::before{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:#dfe;opacity:0;animation:line .45s ease-out}
  p{position:absolute;left:18px;bottom:14px;margin:0;display:flex;align-items:center;gap:6px;
    font:bold 15px/18px "Courier New",monospace;color:#9db82f;text-shadow:0 0 6px rgba(140,170,30,.55)}
  span{width:10px;height:17px;background:#9db82f;box-shadow:0 0 6px rgba(140,170,30,.55);animation:blink 1s steps(1) infinite}
  @keyframes cut{0%{background:rgba(0,0,0,.2);clip-path:inset(0)}35%{background:#000}100%{background:#000}}
  @keyframes line{0%{opacity:1;transform:scaleX(1)}60%{opacity:1;transform:scaleX(.35)}100%{opacity:0;transform:scaleX(0)}}
  @keyframes blink{50%{opacity:0}}
  @media (prefers-reduced-motion:reduce){ #blackout,#blackout::before{animation:none} }
</style>
