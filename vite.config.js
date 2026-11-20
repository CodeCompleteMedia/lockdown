import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

// The game is a fully static site: `npm run build` writes it to build/.
export default defineConfig({
  // package.json is the single source of the version; the game reads it as __APP_VERSION__
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [sveltekit({ adapter: adapter() })]
});
