<script>
  // OS logo slot: drop an image at static/assets/os-logo.png and it replaces the placeholder.
  import { asset } from '$app/paths';
  let found = $state(true);
</script>

<div id="oslogo">
  <div class="slot">
    {#if found}<img src={asset('assets/os-logo.png')} alt="" onerror={() => { found = false; }}>{:else}<span>OS LOGO</span>{/if}
  </div>
</div>

<style>
  #oslogo{height:86px;background:#fff;border:2px solid #b0b4b6;padding:4px;display:flex}
  .slot{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;
    color:#b4b4b4;font:10px Helvetica,Arial,sans-serif;letter-spacing:1px;text-align:center}
  img{max-width:100%;max-height:100%;object-fit:contain}
  @media (max-width:760px){
    #oslogo{display:none}
  }
</style>
