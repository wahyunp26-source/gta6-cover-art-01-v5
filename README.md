# Seven Tides Cover Studio

[![make.fun](https://make.fun/badge.svg)](https://make.fun/c/gta6-cover-art-01)
[![live](https://img.shields.io/badge/live-makefun.sh-ff5e7a)](https://gta6cover-7b2c1395.makefun.sh/)

Turn your photos into GTA-style cover art: 7 panels, 7 faces, 8 layouts,
8 grades (including Painted Ink), a striped retro-chrome title with a script
subtitle that always sits clear below it, cast role chips, face-aware crops,
and PNG export in 1080×1080, 1080×1350 and 1920×1080.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a layout and a grade, click a cast panel to edit its photo, role,
place, time and caption, drag a panel to pan its photo, scroll to zoom, then
export a PNG.

## Notes

- The app is static files under `app/` and works offline in desktop Chrome.
- Fonts (Anton + Pacifico, SIL Open Font License) ship under `app/fonts/`.
- Sample photos under `app/samples/` are free to use (kit samples made with
  an image model, plus photos made in-session with an image model).
- Built for the make.fun `gta6-cover-art-01` bounty. Referral: `amzcd6wq`.
