<script>
  import { onMount } from 'svelte';
  import { installKeyboard } from '#lib/game/keyboard.js';
  import Toolchest from '#lib/components/Toolchest.svelte';
  import OsLogo from '#lib/components/OsLogo.svelte';
  import Thumbs from '#lib/components/Thumbs.svelte';
  import Navigator from '#lib/components/Navigator.svelte';
  import Viewer from '#lib/components/Viewer.svelte';
  import FindWindow from '#lib/components/FindWindow.svelte';
  import ConsoleWindow from '#lib/components/ConsoleWindow.svelte';
  import SystemManager from '#lib/components/SystemManager.svelte';
  import OsView from '#lib/components/OsView.svelte';
  import Menu from '#lib/components/Menu.svelte';
  import Dialog from '#lib/components/Dialog.svelte';

  onMount(installKeyboard);
</script>

<svelte:head><title>LOCKDOWN :: fsnav</title></svelte:head>

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

<Menu />
<Dialog />

<style>
  #deskcol{position:absolute;left:12px;top:12px;width:100px;display:flex;flex-direction:column;gap:4px;z-index:5}
  @media (max-width:760px){
    #deskcol{left:4px;right:4px;top:4px;width:auto}
  }
</style>
