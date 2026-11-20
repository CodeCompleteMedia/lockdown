// Running totals the system monitor samples. Plain numbers that only ever go up, so
// counting costs an addition and nothing is retained; the monitor works from differences.
export const stats = {
  update: 0,   // ms the engine spent on a frame before drawing (flight, watchdogs, labels)
  render: 0,   // ms spent submitting the scene to WebGL
  late: 0,     // ms by which frames arrived later than a 60 Hz frame should
  frames: 0,   // frames presented
  calls: 0,    // WebGL draw calls
  tris: 0,     // triangles drawn
  events: 0,   // input events (counted only while the monitor is open)
  fork: 0,     // windows opened
  exec: 0,     // builds executed and console commands run
  iget: 0,     // files opened
};
