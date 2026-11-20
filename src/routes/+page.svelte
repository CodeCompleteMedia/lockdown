<script>
  import { onMount } from 'svelte';
  import { installKeyboard } from '#lib/game/keyboard.js';
  import { ui } from '#lib/game/state.svelte.js';
  import MacDesktop from '#lib/components/mac/MacDesktop.svelte';
  import MonitorEdge from '#lib/components/MonitorEdge.svelte';
  import Toolchest from '#lib/components/Toolchest.svelte';
  import OsLogo from '#lib/components/OsLogo.svelte';
  import Thumbs from '#lib/components/Thumbs.svelte';
  import Navigator from '#lib/components/Navigator.svelte';
  import Viewer from '#lib/components/Viewer.svelte';
  import FindWindow from '#lib/components/FindWindow.svelte';
  import ConsoleWindow from '#lib/components/ConsoleWindow.svelte';
  import SystemManager from '#lib/components/SystemManager.svelte';
  import OsView from '#lib/components/OsView.svelte';
  import ChessWindow from '#lib/components/ChessWindow.svelte';
  import Chess3DWindow from '#lib/components/Chess3DWindow.svelte';
  import Calculator from '#lib/components/Calculator.svelte';
  import ImageViewer from '#lib/components/ImageViewer.svelte';
  import Menu from '#lib/components/Menu.svelte';
  import Dialog from '#lib/components/Dialog.svelte';

  onMount(installKeyboard);
</script>

<svelte:head><title>LOCKDOWN :: fsnav</title></svelte:head>

<!-- Two monitors side by side; only one is on screen, and the stage slides between them. -->
<div id="stage" class:left={ui.monitor === 'left'}>
  <MacDesktop />
  <div id="irix">
    <div id="deskcol">
      <Toolchest />
      <OsLogo />
    </div>
    <Thumbs />

    <Navigator />

    <Viewer />
    <FindWindow />
    <ConsoleWindow />
    <SystemManager />
    <OsView />
    <ChessWindow />
    <Chess3DWindow />
    <Calculator />
    <ImageViewer />

    <Menu />
    <Dialog />
  </div>
</div>
<MonitorEdge />

<style>
  #stage{position:absolute;left:0;top:0;width:200vw;height:100%;transform:translateX(-100vw);transition:transform .7s cubic-bezier(.65,0,.35,1)}
  #stage.left{transform:none}
  /* the workstation's screen; its windows are positioned inside it and cannot spill onto the other monitor */
  #irix{position:absolute;left:100vw;top:0;width:100vw;height:100%;overflow:hidden;background:#2f6b70 url('../lib/assets/irixBackgroundTexture.jpg')}
  @media (prefers-reduced-motion:reduce){ #stage{transition:none} }
  #deskcol{position:absolute;left:12px;top:12px;width:100px;display:flex;flex-direction:column;gap:4px;z-index:5}
  @media (max-width:760px){
    #deskcol{left:4px;right:4px;top:4px;width:auto}
  }
</style>
