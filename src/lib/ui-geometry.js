// Shared by both desktops' windows: the new rectangle while an edge or corner is dragged.
// g is the rectangle when the drag began plus `dir` (some of n, s, e, w); dx, dy are how far
// the pointer has moved. With `aspect`, the content area (the window less its frame) keeps
// that width/height ratio: sides and corners set the width, top and bottom set the height.
export function resized(g, dx, dy, { minW, minH, aspect = null, frameW = 0, frameH = 0, top = 0 }) {
  let w = g.w, h = g.h;
  if (g.dir.includes('e')) w = Math.max(minW, g.w + dx);
  if (g.dir.includes('w')) w = Math.max(minW, g.w - dx);
  if (g.dir.includes('s')) h = Math.max(minH, g.h + dy);
  if (g.dir.includes('n')) h = Math.max(minH, Math.min(g.h - dy, g.y + g.h - top));
  if (aspect) { if (/[ew]/.test(g.dir)) h = (w - frameW) / aspect + frameH; else w = (h - frameH) * aspect + frameW; }
  return { x: g.dir.includes('w') ? g.x + g.w - w : g.x, y: g.dir.includes('n') ? g.y + g.h - h : g.y, w, h };
}
