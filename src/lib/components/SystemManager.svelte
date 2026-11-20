<script>
  import { untrack } from 'svelte';
  import { game, ui } from '#lib/game/state.svelte.js';
  import { press, toggleSound } from '#lib/game/actions.js';
  import { sysInfo } from '#lib/game/desktop.js';
  import Window from './Window.svelte';

  // Refreshed four times a second while the window is open, not on every frame.
  let text = $state('');
  $effect(() => {
    if (!ui.shown('sysman')) return;
    const refresh = () => { text = untrack(sysInfo); };
    refresh();
    const timer = setInterval(refresh, 250);
    return () => clearInterval(timer);
  });
</script>

<Window id="sysman" title="System Manager" minW={300}>
  <div id="sysinfo" class="inset">{text}</div>
  <div class="foot">
    <button onclick={press(toggleSound)}>Sound: {game.soundOn ? 'On' : 'Off'}</button>
    <button onclick={press(() => location.reload())}>Restart</button>
    <button onclick={() => ui.close('sysman')}>Close</button>
  </div>
</Window>

<style>
  #sysinfo{margin:6px;flex:1 1 auto;min-height:40px;overflow:auto;padding:6px 8px;background:var(--well);font:bold 12px/1.5 "Courier New",monospace;white-space:pre-wrap}
</style>
