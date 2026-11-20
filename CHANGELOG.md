# Changelog

Versions are `major.minor.bug`. The rules for choosing the next number are in `CLAUDE.md`.

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
