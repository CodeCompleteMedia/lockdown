<!-- "THE KING": a small looping animation of a chess king taking a bow. -->
<div class="stage">
  <svg viewBox="0 0 64 64" shape-rendering="crispEdges">
    <g class="king" fill="#000">
      <path d="M30 2h4v4h4v4h-4v5h-4v-5h-4V6h4z"/>
      <path d="M24 16h16v4h4v8h-4v4h-4v16h4v4h4v4h4v6H16v-6h4v-4h4v-4h4V32h-4v-4h-4v-8h4z"/>
      <path d="M28 22h8v4h-8z" fill="#fff"/>
    </g>
    <g class="spark" fill="#000"><path d="M8 10h2v6H8zM6 12h6v2H6z"/><path d="M52 24h2v6h-2zM50 26h6v2h-6z"/></g>
  </svg>
  <p>long live the king</p>
</div>

<style>
  .stage{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:#fff;min-height:0;overflow:hidden}
  svg{height:70%;max-height:190px;image-rendering:pixelated}
  .king{transform-origin:32px 62px;animation:bow 2.4s steps(1) infinite}
  .spark{animation:blink .6s steps(1) infinite}
  p{margin:0;font:10px Geneva,Verdana,sans-serif;letter-spacing:1px}
  @keyframes bow{0%,45%{transform:none}50%{transform:rotate(8deg)}55%{transform:rotate(16deg)}70%{transform:rotate(8deg)}75%,100%{transform:none}}
  @keyframes blink{50%{opacity:0}}
  @media (prefers-reduced-motion:reduce){ .king,.spark{animation:none} }
</style>
