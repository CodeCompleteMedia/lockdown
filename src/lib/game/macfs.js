// The Macintosh's disk: a tree of folders and files. Pure data.
// A file's `open` says what happens when it is opened: { text }, { image } (a file name in
// src/lib/assets), { anim } or nothing, in which case the Finder apologises.

const K = { app: 'application program', txt: 'SimpleText document', jpg: 'JPEG Image', cp: 'control panel', file: 'file' };
const dir = (name, size, children) => ({ name, size, kind: 'folder', children });
const file = (name, size, kind, open) => ({ name, size, kind, open });
const text = (name, size, body) => file(name, size, K.txt, { text: body });
const jpeg = (name, size, image) => file(name, size, K.jpg, { image });
const app = (name, size) => file(name, size, K.app);

export const HD = dir('Macintosh HD', 0, [
  dir('Adobe Photoshop 3.0', 9192, [
    app('Adobe Photoshop™ 3.0', 6201),
    dir('Plug-ins', 2610, [dir('Acquire/Export', 412, [file('Quick Edit', 96, K.file), file('TWAIN Acquire', 316, K.file)]), dir('Filters', 2198, [file('Gaussian Blur', 64, K.file), file('Lens Flare', 88, K.file), file('Unsharp Mask', 71, K.file)])]),
    text('Read Me First', 12, `Adobe Photoshop 3.0

Station copy, licensed to Meridian-9 Imaging. Assign at least 12 MB to the program or it will tell you the scratch disk is full, which it is not.

Do not install the demo filters. Lindqvist did, and the specimen photographs for week 31 came out with lens flares in them.`),
    dir('Tutorial', 369, [jpeg('Portrait', 142, 'pinup_04.png'), jpeg('Studio Light', 227, 'pinup_05.png')]),
  ]),
  dir('Adobe Streamline™ 2.2', 1014, [app('Adobe Streamline™ 2.2', 906), text('Streamline Notes', 6, `Traces scanned line art into outlines.

Tried it on the core sample sketches. It traced the filaments in sample 31 as a single closed path. I had drawn them as separate strands.`), file('Tracing Defaults', 102, K.file)]),
  dir('Applications', 161, [app('Disinfectant', 58), app('SimpleText', 77), app('Stuffit Expander', 26)]),
  dir('Calendar Creator 1.01', 750, [app('Calendar Creator', 498), jpeg('January', 99, 'pinup_03.png'), file('Station Calendar', 153, 'Calendar Creator document')]),
  dir('Claris Works', 1506, [app('ClarisWorks', 1310), text('Letter Home', 8, `Dear M.,

Eleven weeks now. The supply sled is late again, so this will reach you after the next one does.

They gave me the Macintosh because the big workstation is "for operations". That suits me. The Mac does not count down at you.

If the lights in the hydro bay are ever on when you ring, do not worry. They do that.

  -- E.`), text('Shift Roster', 14, `SHIFT ROSTER, WEEKS 59-60

        A (0600-1800)    B (1800-0600)
Mon     Okafor           Varga
Tue     Lindqvist        Varga
Wed     Okafor           Varga
Thu     Lindqvist        Okafor
Fri     Okafor           Varga
Sat     Lindqvist        Varga
Sun     (ops terminal unattended)

Whoever is on shift holds the terminal. Whoever is off shift leaves their key mounted somewhere sensible. See the logs for how that has gone.`), file('Stationery', 174, K.file)]),
  dir('COLORSQUEEZE™', 777, [app('COLORSQUEEZE™', 301), dir('Squeezed', 476, [jpeg('Bedrock', 112, 'pinup_07.png'), jpeg('Stockings', 49, 'pinup_08.png'), jpeg('Washing Up', 151, 'pinup_09.png')])]),
  dir('ColorSync™ 1.0.3', 108, [file('ColorSync™ System Profile', 42, K.cp), file('13-inch RGB Standard', 33, K.file), file('16-inch Color Display', 33, K.file)]),
  file('Epson Namer', 303, K.app),
  dir('HyperCard 2.1 Player', 653, [app('HyperCard Player', 420), file('Home', 96, 'HyperCard document'), file('Station Tour', 137, 'HyperCard document')]),
  file('Labels-Laserwriter', 9, 'QuarkXPress®3.2'),
  text('Mail Is Information', 42, `MAIL IS INFORMATION

A reminder from Security, which nobody asked for:

Anything you put in the mail spool can be read by anyone who can reach the spool. That is why secd never sends a whole build number in one message. Half goes in the incident log, half in the operator's mail.

If you only have one half you do not have anything.

  -- I. Varga`),
  file('Multi-Driver', 57, K.cp),
  jpeg('Newman', 42),
  file('Note Pad File', 3, K.file, { text: `- ask facilities about the galley freezer
- the override wants THREE keys, not two. three.
- watchdogd doubles up if you run a bad build
- return Okafor's stapler` }),
  dir('Other', 23, [
    text('Read Me', 4, `If you are reading this on the Mac, the big machine is probably counting down again.

Two things nobody writes in the official notes:

1. watchdogd only looks down. Its ring reaches about 110 units up. Fly above that and it cannot touch your clock.

2. The Find tool will not show you a signature key, but "ls" in the console will, if you are standing in the right directory.

  -- E.L.`),
    file('Scores', 2, K.file, { text: `CHESS vs. the workstation

E.L.   3
SGI    41

It does not get tired. I do.` }),
    dir('Empty Folder', 0, []),
    jpeg('Rug Dept', 17, 'pinup_06.png'),
  ]),
  file('Picture 1', 131, K.txt, { image: 'pinup_10.png' }),
  file('THE KING', 420, 'GIF Animation', { anim: 'king' }),
  jpeg('zebraGirl 0', 142, 'zebraGirl.jpg'),
  jpeg('zebraGirl 1', 142, 'zebraGirl_wht.png'),
  jpeg('zebraGirl 2', 142, 'zebraGirl_superHiRes.png'),
  jpeg('zebraGirl 3', 142, 'pinup_02.png'),
  jpeg('zebraGirl 4', 142, 'zebraGirl.jpg'),
  jpeg('zebraGirl 5', 142, 'zebraGirl_wht.png'),
  jpeg('zebraGirl 6', 142, 'zebraGirl_superHiRes.png'),
  jpeg('zebraGirl 7', 142, 'zebraGirl.jpg'),
  jpeg('zebraGirl 8', 142, 'zebraGirl_wht.png'),
]);

export const TRASH = dir('Trash', 0, []);

export const CLIP = text('fiveDocksClip', 2, `Five docks, north face. Supply sled due at dock 3 on the first clear day.

Docks 1 and 2 are iced shut. Dock 4 is the one with the working heater. Nobody has seen the door to dock 5 since the autumn.

  -- clipped from the quartermaster's log`);

export const sizeText = n => n.kind === 'folder' && !n.size ? '—' : n.size.toLocaleString('en-US') + 'K';
