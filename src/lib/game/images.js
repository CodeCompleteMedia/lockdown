// Every picture in src/lib/assets, by file name. These are URLs, so a picture is only
// downloaded when something shows it.
export const IMAGES = Object.fromEntries(Object.entries(import.meta.glob('../assets/*.{png,jpg,gif}', { eager: true, query: '?url', import: 'default' }))
  .map(([path, url]) => [path.split('/').pop(), url]));
