# Changelog

Versions are `major.minor.bug`. The rules for choosing the next number are in `CLAUDE.md`.

## 0.11.0 - 2026-11-20

- A memo is buried on the Macintosh's disk with clues to the Main Power release key. It narrows the key down without giving it away, and keeps up if the interlock re-keys.

## 0.10.0 - 2026-11-20

- A hard reset. System > Main Power (or `shutdown` in the console) opens an interlock: crack its four-figure release code and the switch behind it cuts all power.
- With the power out, both screens go black. You can still look from one to the other. After a while the workstation shows two words and a cursor.
- The Macintosh then shows the power distribution board: switch every area of the park back on, where each breaker also flips the areas wired to it. The wiring is different every time. When all twelve are online, both machines come back.
- The countdown is stopped while the power is out.
- The file system navigator now comes up only after the power has been reset. Until then the workstation has its console and tools but no file system, and the countdown does not start until the navigator does.
- The calculator, the system monitor and a large 3D chess board are already open on the workstation when you log in, laid out across the desk.
- The game opens with a plain Log In prompt. The WHITEOUT briefing now appears when the navigator comes up, and the countdown starts when you dismiss it.
- The workstation's console is now called the Central Park Control Console, in its window title, the Desktop and System menus, and Help.

## 0.9.0 - 2026-11-20

- The Macintosh's text is far easier to read. Its menus, window titles, file lists and icon names are now drawn in pixel fonts modelled on the originals (Chicago and Geneva), so every letter is sharp without zooming in.
- Notes opened on the Macintosh use the larger, heavier of the two fonts.
- The Macintosh now looks the same in every browser and on every system.
- Rows in its file lists are a touch taller.
- THE KING on the Macintosh's disk is now a short movie with sound, in place of the old animation. It opens large, in the middle of the screen, and follows the Sound setting.
- A small logo sits at the left end of the Macintosh's menu bar, and the two icons at its right end are new.

## 0.8.0 - 2026-11-19

- The Macintosh desktop is redrawn: a new background pattern, and every icon, button and scroll bar drawn fresh instead of taken from a photograph.
- Its disk icon is now named Macintosh HD, matching its window.
- The desktop pattern stays crisp at any zoom level instead of shimmering.
- Two real displays: the Macintosh can be put in a window of its own on a second monitor, from Desktop > Macintosh On Second Display, or from the small tab at the screen edge when a second display is detected.
- Full Screen is in the Desktop menu and in the Macintosh's Special menu.

## 0.7.0 - 2026-11-19

- A second monitor. Move the pointer to the left edge of the screen and click the tab that appears to slide over to an early Macintosh; the tab on its right edge slides back.
- The Macintosh has its own desktop, menu bar, icons and windows, which can be dragged, resized, zoomed, rolled up and closed.
- The Macintosh's hard disk is a file system of its own: folders that open in place, notes to read, pictures to look at, and programs that will not start.

## 0.6.0 - 2026-11-19

- More pictures are tucked away in directories all over the file system.
- Image files now appear in the colour key under Help.
- The image viewer keeps the picture's proportions when you resize it.

## 0.5.0 - 2026-11-19

- Something new is hidden in the file system for those who go looking.
- Image files can be opened, in a viewer window of their own.

## 0.4.0 - 2026-11-19

- Calculator: a scientific calculator window with trig, logs, powers, roots, factorial and degree/radian modes. Find it under Desktop > Calculator, or type `calc` in the console.

## 0.3.0 - 2026-11-19

- Dialogs (log-in, help, about, and the win and lose screens) can be dragged by their title bar.
- Chess: a text chess game against the computer, in its own window. Find it under Desktop > Chess, by typing `chess` in the console, or by opening `chess.sav` in Lindqvist's directory.
- Chess 3D: a 3D board for the same game, played with the mouse. Moves made in either chess window appear in both. Find it under Desktop > Chess 3D, or type `3d` in the chess window.

## 0.2.0 - 2026-11-19

- The version number is now always on screen: at the right of the navigator's status bar and on the log-in screen.

## 0.1.0 - 2026-11-19

First tracked version.

- 3D file system navigator game: find three signature keys and the signed override build before the clock runs out, while avoiding the watchdog.
- IRIX-style desktop: Toolchest menus (Desktop, Selected, Find, System, Help), Console and System icon tiles, OS logo slot, textured background.
- Windows with a window menu, minimize to icon, maximize, close, drag and resize.
- Find window, console shell (`ls`, `cd`, `pwd`, `cat`, `open`, `run`, `find`, `gr_osview`), System Manager.
- `gr_osview` system monitor with measured page activity and modelled station daemons.
- Built with SvelteKit and three.js as a static site. The original single-file version is kept in `legacy/`.
