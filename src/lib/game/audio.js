// Web Audio: square-wave UI blips and the flight hum. Silent until initAudio() runs
// from a user gesture.
let AC = null, master = null, engGain = null, engOsc = null, soundOn = true;

export function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = soundOn ? .5 : 0; master.connect(AC.destination);
    // flight hum: saw through a lowpass, gain follows speed
    engOsc = AC.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 55;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    engGain = AC.createGain(); engGain.gain.value = 0;
    engOsc.connect(lp).connect(engGain).connect(master); engOsc.start();
  } catch (e) { AC = null; }
}

export function setSoundOn(on) {
  soundOn = on; if (master) master.gain.value = soundOn ? .5 : 0;
}

// Called every frame with the camera speed in world units per second.
export function hum(speed) {
  if (!engGain) return;
  const t = AC.currentTime, v = Math.min(1, speed / 130);
  engGain.gain.setTargetAtTime(v * .16, t, .08); engOsc.frequency.setTargetAtTime(50 + v * 75, t, .08);
}

function beep(f, d = .08, type = 'square', v = .12, when = 0, slide = 0) {
  if (!AC) return;
  const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g).connect(master); o.start(t); o.stop(t + d + .03);
}

export const sfx = {
  click: () => beep(1320, .03, 'square', .07),
  select: () => { beep(880, .05); beep(1175, .06, 'square', .1, .05); },
  open: () => { beep(523, .06); beep(659, .06, 'square', .1, .06); beep(784, .09, 'square', .1, .12); },
  close: () => { beep(784, .05); beep(523, .07, 'square', .1, .05); },
  fly: () => beep(220, .35, 'triangle', .14, 0, 660),
  err: () => { beep(140, .14, 'square', .16); beep(110, .22, 'square', .16, .15); },
  key: () => [659, 784, 988, 1319].forEach((f, i) => beep(f, .12, 'square', .12, i * .08)),
  penalty: () => { beep(900, .5, 'sawtooth', .18, 0, 80); beep(70, .5, 'square', .16, .1); },
  tick: () => beep(1760, .025, 'square', .06),
  alarm: () => beep(310, .16, 'sawtooth', .13, 0, 240),
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => beep(f, i === 6 ? .5 : .13, 'square', .13, i * .12)),
  lose: () => { beep(440, 1.6, 'sawtooth', .2, 0, 40); beep(446, 1.6, 'square', .1, 0, 38); },
};
