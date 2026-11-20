// The station's file system: directory tree, per-run secrets, file contents,
// the 2D layout the 3D view is built on, and the queries the desktop tools share.
// Pure data and functions. Nothing here touches the DOM or three.js.

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const PATHS = ['/', '/usr', '/usr/staff', '/usr/staff/okafor', '/usr/staff/lindqvist', '/usr/staff/varga', '/usr/spool', '/usr/demos',
  '/lab', '/lab/cryo', '/lab/hydro', '/lab/specimens',
  '/sys', '/sys/sec', '/sys/sec/vault', '/sys/sec/audit', '/sys/daemons', '/sys/hvac',
  '/logs', '/logs/shift_a', '/logs/shift_b', '/tmp'];
const nodes = {};
for (const p of PATHS) {
  const n = { path: p, name: p === '/' ? '/' : p.split('/').pop(), children: [], files: [], depth: 0, parent: null };
  nodes[p] = n;
  if (p !== '/') { n.parent = nodes[p.slice(0, p.lastIndexOf('/')) || '/']; n.parent.children.push(n); n.depth = n.parent.depth + 1; }
}
const ROOT = nodes['/'], nodeList = Object.values(nodes);

// per-run secrets
const hx = shuffle(['A4', '1C', '7F', '3B', 'E9', 'D2', '58', 'C6', '0B', '9E', 'F1', '6A']);
const RUN = {
  A: hx[0], B: hx[1],
  ids: [hx[0] + hx[1], hx[0] + hx[2], hx[3] + hx[1], hx[4] + hx[5]],          // [true, shares head, shares tail, unrelated]
  ovrDirs: shuffle(['/sys/sec/vault', '/sys/sec/audit', '/sys/daemons', '/sys/hvac']),
  okLoc: pick(['/lab/cryo', '/lab/specimens', '/tmp']),
  liLoc: pick(['/lab/hydro', '/tmp', '/logs/shift_a']),
  vaLoc: pick(['/sys/hvac', '/usr/staff/varga', '/sys/sec/vault']),
};

const TYPES = {
  txt: { label: 'text', color: 0x2fd68f },
  msg: { label: 'mail', color: 0x4aa3ff },
  key: { label: 'signature key', color: 0xffd23a },
  cmd: { label: 'executable', color: 0xff4466 },
  bin: { label: 'binary data', color: 0x8a7fc0 },
  img: { label: 'image', color: 0xf2f2f2 },
};
function add(path, name, type, kb, text, extra = {}) {
  nodes[path].files.push({ name, type, kb, text, dir: nodes[path], path: (path === '/' ? '' : path) + '/' + name, ...extra });
}

add('/', 'README.1st', 'txt', 2,
`M9-OPS FILE SYSTEM NAVIGATOR   rev 2.3
Night operator notes. Read once, then move.

 - The override is staged under /sys. There are FOUR
   builds. Three are unsigned and running one costs
   you thirty seconds.
 - The signed build's ID is recorded in two halves.
   Look in /logs/shift_b and /usr/spool.
 - The override wants three signature keys (*.key).
   Staff leave them mounted in stupid places. The
   shift logs and the mail spool say where.
 - watchdogd patrols the tree. While it is on top of
   you the clock runs three times as fast. Move.`);
add('/', 'motd', 'txt', 1,
`MERIDIAN-9 SUBGLACIAL STATION
Depth below ice surface: 2,140 m
Days since last containment event: 0

Have a productive shift.`);

add('/logs/shift_a', '0412.log', 'txt', 4,
`SHIFT A  --  DAY 412
0602  Okafor on. Core 31 holding at -41 C.
0715  Hydro bay reports growlights cycling on their
      own. Logged, ignored.
1130  Core 31 sample tray 3 found two centimetres
      left of where it was racked.
1420  Okafor signed out in a hurry. Her key image is
      still mounted under ${RUN.okLoc}
      Somebody tell her.
1800  Handover to B.`);
add('/logs/shift_a', '0413.log', 'txt', 3,
`SHIFT A  --  DAY 413
0600  Lindqvist on. Complains about the coffee, then
      about the ice.
0940  Duct pressure in Wing C reads high. HVAC says
      the sensor is wrong.
1210  Sensor replaced. New sensor also reads high.
1655  Specimen catalog lists 31 cores. Rack count is
      30. Recount tomorrow.`);
add('/logs/shift_b', '0414.log', 'txt', 4,
`SHIFT B  --  DAY 414
1802  Varga on. Runs the perimeter check twice.
2140  Varga rotating signature keys. Says his stays
      parked under ${RUN.vaLoc}
      until the audit is finished.
2315  Cryo tank 2 door-open alarm. Door is shut.
      Alarm continues.
0250  Frost on the INSIDE of the Wing C observation
      glass.`);
add('/logs/shift_b', 'incident.log', 'txt', 6,
`INCIDENT RECORD  --  DAY 417  --  AUTO
0311  Wing C differential pressure lost.
0311  Bulkheads C1-C6 sealed.
0312  WHITEOUT armed. Sterilant flood on timer.
0312  secd staged override builds under /sys.
      Only one carries a valid signature.
0313  secd: signed build ID begins with   ${RUN.A}__
0313  secd: remainder withheld from this log per
      policy 7. See operator mail.`);

add('/usr/spool', 'mail.0417.msg', 'msg', 2,
`From: secd@m9-ops
To:   operator
Subj: override build (part 2 of 2)

Per policy 7 the build ID is split across two
channels.

The signed override build ID ends with   __${RUN.B}

Do not run the others. They are bait for whoever
let Core 31 out.`);
add('/usr/spool', 'mail.0402.msg', 'msg', 2,
`From: okafor
To:   lindqvist
Subj: your key. again.

Erik, you left your signature key mounted under
${RUN.liLoc}
That is the third time this month. If Varga finds
it before you do, I am not covering for you.

 -- N.`);
add('/usr/spool', 'mail.0398.msg', 'msg', 1,
`From: facilities
To:   all-staff
Subj: galley freezer

Whoever is storing sample trays in the galley
freezer: stop. That is not what "cold storage
overflow" means.`);

add('/usr/staff/okafor', 'notes.txt', 'txt', 5,
`Core 31 -- working notes -- N. Okafor

Not a lichen. Not a mat. It extends along the
temperature gradient, toward warm.

Tray 3 moved again. I measured this time.
2.1 cm toward the door heater.

Correction to the above. It is not growing toward
warm. It is going there.`);
add('/usr/staff/okafor', 'todo.txt', 'txt', 1,
`- recalibrate tank 2
- ask Varga why the audit wants my key
- sleep`);
add('/usr/staff/lindqvist', 'journal.txt', 'txt', 4,
`Day 409. Eleven weeks under the ice. At night you
can hear the glacier settling. It sounds like
someone moving furniture upstairs.

Day 415. Okafor says the core is moving. I say
Okafor needs a holiday.

Day 416. I counted the racks myself. Thirty.`);
add('/usr/staff/lindqvist', 'chess.sav', 'bin', 12);
add('/usr/staff/varga', 'memo.txt', 'txt', 3,
`SECURITY MEMO -- I. Varga

1. The override requires all three signatures:
   Okafor, Lindqvist, mine. No exceptions.
2. If WHITEOUT arms, secd stages four builds. One
   is real. The checksum bait was my idea and I
   stand by it.
3. watchdogd is not your enemy. It is just very
   thorough.`);
add('/usr/staff/varga', 'roster.dat', 'bin', 20);

// left over from the workstation's demo disk; the picture itself is looked up by name in actions.js
add('/usr/demos', 'zebraGirl.jpg', 'img', 234);

add('/lab/cryo', 'tank_temps.log', 'txt', 8,
`TANK   SET    READ
  1    -41    -41
  2    -41    -38
  3    -41    -41
  2    -41    -29
  2    -41    -11
  2    -41     +4
  ** tank 2 sensor offline **`);
add('/lab/cryo', 'core31.dat', 'bin', 180);
add('/lab/hydro', 'growlights.log', 'txt', 3,
`0200  bank 4 ON   (no schedule)
0201  bank 4 OFF
0201  bank 5 ON   (no schedule)
0202  bank 5 OFF
0202  bank 6 ON   (no schedule)
      note: sequence runs down the bay toward the
      Wing C door.`);
add('/lab/hydro', 'nutrient.dat', 'bin', 40);
add('/lab/specimens', 'catalog.txt', 'txt', 6,
`ID        DEPTH    STATUS
core-27   1,880 m  racked
core-28   1,912 m  racked
core-29   1,990 m  racked
core-30   2,065 m  racked
core-31   2,138 m  NOT IN RACK`);
add('/lab/specimens', 'core31_obs.log', 'txt', 9,
`OBS 01  Sample inert at -41 C.
OBS 07  Filaments visible at -30 C. Photographed.
OBS 12  Filaments absent from photographs.
OBS 13  Filaments absent from tray.
OBS 14  Tray absent.`);

add('/sys/sec', 'policy.txt', 'txt', 5,
`SECURITY POLICY (EXCERPT)

4. Override execution requires three staff
   signature keys loaded in this session.
7. Build identifiers are never written whole to a
   single channel.
9. Executing an unsigned build is treated as
   hostile. Penalty: 30 s. watchdogd is notified
   and a second instance is spawned.`);
add('/sys/sec/vault', 'seal.dat', 'bin', 64);
add('/sys/sec/audit', 'audit.log', 'txt', 4,
`AUDIT TRAIL
0312  secd staged 4 override builds
0312  placed: /sys/sec/vault  /sys/sec/audit
              /sys/daemons    /sys/hvac
0312  signatures on file: 0 of 3`);
add('/sys/daemons', 'watchdogd.cfg', 'txt', 1,
`# watchdogd -- process sentinel
patrol          = all
on_contact      = accelerate_timer x3
on_bad_checksum = spawn second instance
mercy           = no`);
add('/sys/daemons', 'purged.pid', 'bin', 1);
add('/sys/hvac', 'duct_pressure.log', 'txt', 7,
`DUCT   kPa    NOTE
C-1    101
C-2    101
C-3    104    sensor suspected
C-3    109    sensor replaced
C-3    117    sensor fine
C-3    ---    duct occluded`);
add('/tmp', 'scratch.txt', 'txt', 1,
`if you are reading this, the vending machine on
level 2 owes me four credits.`);
add('/tmp', 'core.dump', 'bin', 420);

RUN.ovrDirs.forEach((d, i) => add(d, `ovr_${RUN.ids[i]}.cmd`, 'cmd', 96,
`executable, stripped
build tag:        ${RUN.ids[i]}
signature block:  [sealed]

Use Execute to run.`, { real: i === 0 }));
add(RUN.okLoc, 'okafor.key', 'key', 2, '', { who: 'okafor' });
add(RUN.liLoc, 'lindqvist.key', 'key', 2, '', { who: 'lindqvist' });
add(RUN.vaLoc, 'varga.key', 'key', 2, '', { who: 'varga' });

function hexdump(f) {
  let s = 0; for (const c of f.name) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) >>> 24;
  let out = '';
  for (let l = 0; l < 14; l++) {
    const b = Array.from({ length: 12 }, r);
    out += (l * 12).toString(16).padStart(6, '0') + '  ' + b.map(x => x.toString(16).padStart(2, '0')).join(' ') +
      '  ' + b.map(x => x > 32 && x < 127 ? String.fromCharCode(x) : '.').join('') + '\n';
  }
  return out + '...\n(' + f.kb + ' KB, not text)';
}

/* ------------------------------------------------------------------ layout */
const SP = 42, ROW = 78, CELL = 11;
let leaf = 0;
(function place(n) {
  if (!n.children.length) n.x = leaf++ * SP;
  else { n.children.forEach(place); n.x = (n.children[0].x + n.children.at(-1).x) / 2; }
  n.z = -n.depth * ROW;
})(ROOT);
const xoff = ROOT.x;
for (const n of nodeList) {
  n.x -= xoff;
  const rows = Math.max(1, Math.ceil(n.files.length / 2));
  n.w = 26; n.d = Math.max(14, rows * CELL + 4);
}
const BOUND = { x0: Math.min(...nodeList.map(n => n.x)) - 90, x1: Math.max(...nodeList.map(n => n.x)) + 90, z0: -3 * ROW - 90, z1: 190 };

/* ----------------------------------------------------------------- queries */
const dirPath = n => n.path === '/' ? '/' : n.path + '/';

function search(q) {
  q = q.trim().toLowerCase(); const out = [];
  if (!q) return out;
  for (const n of nodeList) {
    if (n.path.toLowerCase().includes(q)) out.push({ dir: n });
    // key images are mounted volumes, not indexed: finding them still takes reading the logs
    for (const f of n.files) if (f.type !== 'key' && f.path.toLowerCase().includes(q)) out.push({ file: f });
  }
  return out;
}

// Resolve a shell-style path against a working directory to { dir } or { file }, or null.
function resolve(arg, cwd) {
  let p = !arg ? cwd.path : arg[0] === '/' ? arg : cwd.path + '/' + arg;
  const parts = [];
  for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') parts.pop(); else parts.push(s); }
  p = '/' + parts.join('/');
  if (nodes[p]) return { dir: nodes[p] };
  const d = nodes['/' + parts.slice(0, -1).join('/')], f = d && d.files.find(f => f.name === parts.at(-1));
  return f ? { file: f } : null;
}

export { rnd, pick, shuffle, nodes, ROOT, nodeList, RUN, TYPES, hexdump, SP, ROW, CELL, BOUND, dirPath, search, resolve };
