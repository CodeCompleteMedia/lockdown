# Lockdown

A browser game set on an IRIX-style desktop, built with SvelteKit 3 (Svelte 5) and three.js as a
static site. `npm run dev` to work on it, `npm run build` to produce `build/`.

- Game logic lives in `src/lib/game/`, the interface in `src/lib/components/`.
- SvelteKit 3: configuration is in `vite.config.js` (there is no `svelte.config.js`), and imports
  use `#lib/...`.
- `legacy/index.html` is the original single-file version, kept for reference. Do not update it.

## Versioning

The version is `major.minor.bug`. `package.json` is the only place it is stored; the game reads it
at build time as `__APP_VERSION__` and shows it in System Manager and Help > About.

Whenever you commit a change to the game, decide the bump yourself from what the change does,
without asking, and include it in the same commit:

- **bug** (0.1.0 -> 0.1.1): fixes and corrections only. Nothing new for the player.
- **minor** (0.1.0 -> 0.2.0, bug resets to 0): anything the player can newly see or do: a feature,
  a window, a command, a visible redesign, new game content.
- **major** (0.x.y -> 1.0.0, minor and bug reset to 0): a release the owner calls major, or a change
  that breaks what players already have (for example saved data or shared links). Never bump
  major on your own judgement; propose it and wait.
- **no bump**: changes that do not alter the shipped game: docs, comments, tests, tooling,
  refactors with identical behaviour.

When several changes go in one commit, use the largest bump among them, once.

For every bump:

1. Run `npm version <new> --no-git-tag-version` so `package.json` and `package-lock.json` agree.
2. Add a section at the top of `CHANGELOG.md`: `## <version> - <YYYY-MM-DD>` and a short list of
   what changed, written for a player rather than a programmer.
3. After committing, tag the commit `v<version>`, and push the tag along with the branch when pushing.

Say which bump you chose, and why, when you report the change.
