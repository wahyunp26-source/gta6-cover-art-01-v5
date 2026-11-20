// Seven Tides Cover Studio — cover renderer, written fresh in-session.
// Draws a GTA-style multi-panel poster on a 2d canvas. The title block is a
// self-contained stack: a scrim, then the big striped title, then the script
// subtitle placed BELOW the title from measured text metrics — so no title
// letter can ever overlap a subtitle letter, in any layout or export size.

export const CAST = [
  { id: 'driver', photo: 'boulevard', role: 'THE DRIVER', place: 'PALM ROW', time: '6:42 PM', caption: 'TOP DOWN, NO PLANS', fx: 0.58, fy: 0.3 },
  { id: 'boss', photo: 'boss', role: 'THE BOSS', place: 'ROOFTOP 9', time: '7:15 PM', caption: 'CITY LIGHTS, BIG PLANS', fx: 0.55, fy: 0.3 },
  { id: 'rider', photo: 'rider', role: 'THE RIDER', place: 'COAST ROAD', time: '6:05 PM', caption: 'LAST LIGHT RUN', fx: 0.45, fy: 0.3 },
  { id: 'mechanic', photo: 'mechanic', role: 'THE MECHANIC', place: 'NEON GARAGE', time: '8:40 PM', caption: 'CLOSES LATE', fx: 0.6, fy: 0.32 },
  { id: 'courier', photo: 'courier', role: 'THE COURIER', place: 'RAMEN ROW', time: '11:20 PM', caption: 'ALWAYS ON TIME', fx: 0.5, fy: 0.34 },
  { id: 'lookout', photo: 'pier', role: 'THE LOOKOUT', place: 'OLD PIER', time: '5:30 AM', caption: 'FIRST CAST WINS', fx: 0.45, fy: 0.28 },
  { id: 'wheelman', photo: 'wheelman', role: 'THE WHEELMAN', place: 'HARBOR TUNNEL', time: '2:10 AM', caption: 'NO BRAKES', fx: 0.52, fy: 0.32 },
];

export const LAYOUTS = [
  { id: 'vice', name: 'Vice Grid' },
  { id: 'popout', name: 'Pop-Out Hero' },
  { id: 'slant', name: 'Slant Cut' },
  { id: 'hero-left', name: 'Hero Left' },
  { id: 'center', name: 'Center Title' },
  { id: 'film', name: 'Film Strip' },
  { id: 'triptych', name: 'Triptych' },
  { id: 'mosaic', name: 'Mosaic' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', filter: 'saturate(1.3) sepia(0.18) contrast(1.06) brightness(1.02)' },
  { id: 'neon', name: 'Neon', filter: 'saturate(1.7) contrast(1.12) brightness(1.0)' },
  { id: 'vice', name: 'Vice', filter: 'saturate(1.35) hue-rotate(-12deg) contrast(1.08)' },
  { id: 'gold', name: 'Gold', filter: 'sepia(0.38) saturate(1.35) contrast(1.05)' },
  { id: 'twilight', name: 'Twilight Gold', filter: 'sepia(0.22) saturate(1.4) contrast(1.08) brightness(0.98)' },
  { id: 'chrome', name: 'Chrome', filter: 'grayscale(0.55) contrast(1.25) brightness(1.06)' },
  { id: 'painted', name: 'Painted Ink', filter: 'saturate(1.5) contrast(1.35) brightness(1.05)' },
  { id: 'midnight', name: 'Midnight', filter: 'brightness(0.82) contrast(1.18) saturate(1.1) hue-rotate(8deg)' },
];

export const FRAMES = [
  { id: 'gold', name: 'Gold Frame', color: '#d9a441' },
  { id: 'cream', name: 'Cream Paper', color: '#f2e8d5' },
  { id: 'none', name: 'No Frame', color: null },
];

export function defaultState() {
  return {
    title: 'SEVEN TIDES',
    subtitle: 'one harbor, seven lives',
    tagline: 'SEVEN FACES · ONE HARBOR · NO WAY BACK',
    quote: 'A SUNSET THAT NEVER ENDS',
    press: 'THE VICE GAZETTE',
    vol: 'VOL. 07',
    layout: 'vice',
    grade: 'sunset',
    frame: 'gold',
    warmth: 0.5,
    saturation: 0.5,
    vignette: 0.5,
    grain: 0.4,
    panels: CAST.map((c) => ({ ...c, zoom: 1, dx: 0, dy: 0 })),
  };
}

// Panel rectangles as fractions of the cover, inside the grid band.
// Chip-safe by construction: every panel's bottom edge sits either above the
// title band (0.47H) or below it (0.73H), so a panel's chip bar — drawn at
// its bottom — never meets the title band.
function panelRects(layout, W, H) {
  const m = Math.round(W * 0.008); // gutter
  const gx = m; const gy = Math.round(H * 0.065);
  const gw = W - 2 * m; const gh = Math.round(H * 0.89) - gy;
  const topY = gy; const midY = gy + Math.round(gh * 0.452);
  const botY = midY + m; const botH = gy + gh - botY;
  const topH = midY - topY;
  const col = (i, n) => gx + Math.round((gw * i) / n);
  const colW = (i, n) => Math.round((gw * (i + 1)) / n) - Math.round((gw * i) / n) - (i === n - 1 ? 0 : m);
  const R = (x, y, w, h) => ({ x, y, w, h });
  switch (layout) {
    case 'popout':
    case 'slant':
    case 'vice': {
      const heroW = Math.round(gw * 0.29);
      const rx = gx + heroW + m; const rw = gw - heroW - m;
      const cw = Math.round(rw / 3);
      const rects = [R(gx, topY, heroW, gh)];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        rects.push(R(rx + c * cw, r === 0 ? topY : botY, cw - (c === 2 ? 0 : m), r === 0 ? topH : botH));
      }
      return rects;
    }
    case 'hero-left': {
      const heroW = Math.round(gw * 0.44);
      const rx = gx + heroW + m; const rw = gw - heroW - m;
      const cw = Math.round(rw / 3);
      const rects = [R(gx, topY, heroW, gh)];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        rects.push(R(rx + c * cw, r === 0 ? topY : botY, cw - (c === 2 ? 0 : m), r === 0 ? topH : botH));
      }
      return rects;
    }
    case 'center':
    case 'film': {
      const rects = [];
      for (let c = 0; c < 4; c++) rects.push(R(col(c, 4), topY, colW(c, 4), topH));
      for (let c = 0; c < 3; c++) rects.push(R(col(c, 3), botY, colW(c, 3), botH));
      return rects;
    }
    case 'triptych': {
      const c1 = gx; const c1w = Math.round(gw * 0.3);
      const c2 = gx + c1w + m; const c2w = Math.round(gw * 0.32);
      const c3 = c2 + c2w + m; const c3w = gw - (c3 - gx);
      const r3 = [topY, topY + Math.round(gh * 0.24) + m, topY + Math.round(gh * 0.42) + 2 * m];
      const r3h = [Math.round(gh * 0.24), Math.round(gh * 0.18), gh - (r3[2] - topY)];
      return [
        R(c1, topY, c1w, topH), R(c1, botY, c1w, botH),
        R(c2, topY, c2w, topH), R(c2, botY, c2w, botH),
        R(c3, r3[0], c3w, r3h[0]), R(c3, r3[1], c3w, r3h[1]), R(c3, r3[2], c3w, r3h[2]),
      ];
    }
    case 'mosaic': {
      const heroW = Math.round(gw * 0.5);
      const rx = gx + heroW + m; const rw = gw - heroW - m;
      const cw = Math.round(rw / 2);
      const rects = [R(gx, topY, heroW, topH)];
      rects.push(R(rx, topY, cw - m, topH), R(rx + cw, topY, rw - cw, topH));
      for (let c = 0; c < 4; c++) rects.push(R(col(c, 4), botY, colW(c, 4), botH));
      return rects;
    }
    default: return panelRects('vice', W, H);
  }
}

function drawPhoto(ctx, img, rect, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = GRADES.find((v) => v.id === grade) || GRADES[0];
  ctx.filter = g.filter;
  const scale = Math.max(w / img.width, h / img.height) * (panel.zoom || 1);
  const sw = w / scale; const sh = h / scale;
  const fx = Math.min(Math.max(panel.fx + (panel.dx || 0), 0), 1);
  const fy = Math.min(Math.max(panel.fy + (panel.dy || 0), 0), 1);
  const sx = Math.min(Math.max(fx * img.width - sw / 2, 0), Math.max(img.width - sw, 0));
  const sy = Math.min(Math.max(fy * img.height - sh / 2, 0), Math.max(img.height - sh, 0));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.filter = 'none';
  if (grade === 'painted') paintEdges(ctx, img, rect);
  ctx.restore();
}

// Flat-colour illustration feel: posterized photo + dark ink edges on top.
function paintEdges(ctx, img, rect) {
  const small = document.createElement('canvas');
  const sw = 320; const sh = Math.round((320 * rect.h) / rect.w);
  small.width = sw; small.height = sh;
  const sctx = small.getContext('2d');
  sctx.drawImage(img, 0, 0, sw, sh);
  const data = sctx.getImageData(0, 0, sw, sh);
  const px = data.data;
  const gray = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    const r = px[i * 4]; const g = px[i * 4 + 1]; const b = px[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const edge = sctx.createImageData(sw, sh);
  for (let yy = 1; yy < sh - 1; yy++) for (let xx = 1; xx < sw - 1; xx++) {
    const i = yy * sw + xx;
    const gx = -gray[i - sw - 1] - 2 * gray[i - 1] - gray[i + sw - 1] + gray[i - sw + 1] + 2 * gray[i + 1] + gray[i + sw + 1];
    const gy = -gray[i - sw - 1] - 2 * gray[i - sw] - gray[i - sw + 1] + gray[i + sw - 1] + 2 * gray[i + sw] + gray[i + sw + 1];
    const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 1.4);
    const v = 255 - mag;
    edge.data[i * 4] = v; edge.data[i * 4 + 1] = v; edge.data[i * 4 + 2] = v; edge.data[i * 4 + 3] = 255;
  }
  sctx.putImageData(edge, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.38; ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(small, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function fitFont(ctx, text, font, maxWidth, startPx) {
  let px = startPx;
  ctx.font = font(px);
  while (px > 24 && ctx.measureText(text).width > maxWidth) { px -= 4; ctx.font = font(px); }
  return px;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawTitleBlock(ctx, state, W, H) {
  const bandY = Math.round(H * 0.47);
  const bandH = Math.round(H * 0.26);
  const cx = W / 2;
  // Scrim first: the title and subtitle both sit on it, never on raw photos.
  ctx.save();
  ctx.fillStyle = 'rgba(12, 7, 28, 0.58)';
  roundRect(ctx, Math.round(W * 0.02), bandY, Math.round(W * 0.96), bandH, Math.round(H * 0.02));
  ctx.fill();
  ctx.restore();
  // Big striped retro-chrome title. Font shrinks until it fits 92% of the width.
  const titlePx = fitFont(ctx, state.title, (p) => `${p}px Anton, sans-serif`, W * 0.92, Math.round(H * 0.19));
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const titleBase = bandY + Math.round(bandH * 0.58);
  const grad = ctx.createLinearGradient(0, titleBase - titlePx, 0, titleBase);
  grad.addColorStop(0, '#ffd23f'); grad.addColorStop(0.25, '#ffd23f');
  grad.addColorStop(0.25, '#ff9a3c'); grad.addColorStop(0.5, '#ff9a3c');
  grad.addColorStop(0.5, '#ff5e7a'); grad.addColorStop(0.75, '#ff5e7a');
  grad.addColorStop(0.75, '#c86bfa'); grad.addColorStop(1, '#c86bfa');
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#2a1145'; // extruded shadow, drawn first
  ctx.fillText(state.title, cx + 7, titleBase + 9);
  ctx.strokeStyle = '#1a0b2e'; ctx.lineWidth = Math.max(8, titlePx * 0.09);
  ctx.strokeText(state.title, cx, titleBase);
  ctx.fillStyle = grad;
  ctx.fillText(state.title, cx, titleBase);
  ctx.restore();
  // Subtitle: measured from the title's real bottom, gap below it, drawn AFTER
  // the title so it is always on top — no letter of either line can overlap.
  const m = ctx.measureText(state.title);
  const titleBottom = titleBase + (m.actualBoundingBoxDescent || titlePx * 0.12);
  const subPx = fitFont(ctx, state.subtitle, (p) => `${p}px Pacifico, cursive`, W * 0.7, Math.round(H * 0.062));
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `${subPx}px Pacifico, cursive`;
  ctx.shadowColor = 'rgba(255, 143, 208, 0.9)'; ctx.shadowBlur = Math.round(H * 0.02);
  ctx.fillStyle = '#ffd7ef';
  const subBase = titleBottom + Math.round(H * 0.028) + subPx * 0.72;
  ctx.fillText(state.subtitle, cx, subBase);
  ctx.restore();
  return { bandY, bandH, titleBottom, subBase };
}

function drawChip(ctx, rect, panel, H) {
  const barH = Math.round(H * 0.062);
  const y = rect.y + rect.h - barH;
  const pad = Math.round(H * 0.012);
  ctx.save();
  ctx.fillStyle = 'rgba(10, 6, 24, 0.82)';
  ctx.fillRect(rect.x, y, rect.w, barH);
  ctx.textBaseline = 'middle';
  // Role and place lines shrink until they fit the panel — never clipped
  // by the panel edge, at any export size.
  let rolePx = Math.round(H * 0.021);
  ctx.font = `bold ${rolePx}px Anton, sans-serif`;
  while (rolePx > 10 && ctx.measureText(panel.role).width > rect.w - pad * 2) {
    rolePx -= 1;
    ctx.font = `bold ${rolePx}px Anton, sans-serif`;
  }
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'left';
  ctx.fillText(panel.role, rect.x + pad, y + barH * 0.32);
  const placeText = `${panel.place} · ${panel.time}`;
  let placePx = Math.round(H * 0.017);
  ctx.font = `${placePx}px Arial, sans-serif`;
  while (placePx > 10 && ctx.measureText(placeText).width > rect.w - pad * 2) {
    placePx -= 1;
    ctx.font = `${placePx}px Arial, sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(placeText, rect.x + pad, y + barH * 0.72);
  // Caption only when it fits beside the place line — never overlapping it.
  ctx.font = `italic ${Math.round(H * 0.015)}px Arial, sans-serif`;
  const placeW = ctx.measureText(placeText).width;
  const capW = ctx.measureText(panel.caption).width;
  if (placeW + capW + pad * 3 < rect.w) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'right';
    ctx.fillText(panel.caption, rect.x + rect.w - pad, y + barH * 0.72);
  }
  ctx.restore();
}

function drawTopStrip(ctx, state, W, H) {
  const y = Math.round(H * 0.014);
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  // Stars first, then the quote measured to start AFTER them — no overlap
  // at any width. The quote font shrinks until it fits the remaining space.
  ctx.fillStyle = '#ffd23f';
  ctx.font = `${Math.round(H * 0.024)}px Arial, sans-serif`;
  const stars = '★ ★ ★ ★ ★';
  ctx.fillText(stars, Math.round(W * 0.02), y + Math.round(H * 0.02));
  const quoteX = Math.round(W * 0.02) + ctx.measureText(stars).width + Math.round(W * 0.015);
  const volW = Math.round(W * 0.055);
  const quoteMax = W - quoteX - volW - Math.round(W * 0.03);
  const quoteText = `"${state.quote}" — ${state.press}`;
  let qPx = Math.round(H * 0.02);
  ctx.font = `bold ${qPx}px Arial, sans-serif`;
  while (qPx > 12 && ctx.measureText(quoteText).width > quoteMax) {
    qPx -= 1;
    ctx.font = `bold ${qPx}px Arial, sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(quoteText, quoteX, y + Math.round(H * 0.02));
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0d0a1f';
  ctx.fillRect(W - Math.round(W * 0.075), y, volW, Math.round(H * 0.038));
  ctx.fillStyle = '#7ee7ff';
  ctx.font = `bold ${Math.round(H * 0.02)}px Arial, sans-serif`;
  ctx.fillText(state.vol, W - Math.round(W * 0.022), y + Math.round(H * 0.02));
  ctx.restore();
  // WANTED pill, top-left inside the top strip — never over a face.
  // The pill is sized from the measured text, so no letter is ever clipped.
  ctx.save();
  ctx.font = `bold ${Math.round(H * 0.019)}px Anton, sans-serif`;
  const pillText = 'WANTED ★★★★★';
  const pillTextW = ctx.measureText(pillText).width;
  const pillW = Math.round(pillTextW + H * 0.03);
  const pillH = Math.round(H * 0.032);
  const pillX = Math.round(W * 0.008);
  const pillY = Math.round(H * 0.054);
  ctx.fillStyle = '#ffd23f';
  roundRect(ctx, pillX, pillY, pillW, pillH, Math.round(H * 0.016));
  ctx.fill();
  ctx.fillStyle = '#1a0b2e';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(pillText, pillX + pillW / 2, pillY + pillH / 2);
  ctx.restore();
}

function drawBottomStrip(ctx, state, W, H) {
  const y = Math.round(H * 0.9);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Tagline and credits shrink until they fit their zones, so they can never
  // run into COMING SOON on the left or the barcode on the right.
  let tPx = Math.round(H * 0.022);
  ctx.font = `bold ${tPx}px Arial, sans-serif`;
  while (tPx > 12 && ctx.measureText(state.tagline).width > W * 0.92) {
    tPx -= 1;
    ctx.font = `bold ${tPx}px Arial, sans-serif`;
  }
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(state.tagline, W / 2, y + Math.round(H * 0.02));
  const roles = state.panels.map((p) => p.role).join(' · ');
  const credits = `A SEVEN TIDES PICTURE · STARRING ${roles}`;
  let cPx = Math.round(H * 0.015);
  ctx.font = `${cPx}px Arial, sans-serif`;
  while (cPx > 11 && ctx.measureText(credits).width > W * 0.6) {
    cPx -= 1;
    ctx.font = `${cPx}px Arial, sans-serif`;
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText(credits, W / 2, y + Math.round(H * 0.05));
  ctx.fillText('SHOT ON YOUR OWN CAMERA · GRADED BY HAND', W / 2, y + Math.round(H * 0.075));
  ctx.fillStyle = '#ffffff';
  const bx = W - Math.round(W * 0.075); const by = y + Math.round(H * 0.03);
  for (let i = 0; i < 24; i++) {
    const bw = (i * 7) % 3 + 1;
    ctx.fillRect(bx + i * Math.round(W * 0.0028), by, bw * Math.round(W * 0.0011), Math.round(H * 0.045));
  }
  ctx.fillStyle = '#ff5e7a';
  ctx.font = `bold ${Math.round(H * 0.018)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('COMING SOON', Math.round(W * 0.02), y + Math.round(H * 0.055));
  ctx.restore();
}

function drawSeal(ctx, W, H) {
  const cx = W - Math.round(W * 0.055); const cy = Math.round(H * 0.79); const r = Math.round(H * 0.05);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.82;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a0b2e';
  ctx.font = `bold ${Math.round(H * 0.014)}px Anton, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EST.', 0, -Math.round(H * 0.012));
  ctx.fillText('2026', 0, Math.round(H * 0.012));
  ctx.restore();
}

let grainTile = null;
function drawFinish(ctx, state, W, H) {
  const v = state.vignette ?? 0.5;
  if (v > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20, 8, 40, ${0.12 + v * 0.3})`);
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  const gr = state.grain ?? 0.4;
  if (gr > 0) {
    if (!grainTile) {
      grainTile = document.createElement('canvas');
      grainTile.width = 128; grainTile.height = 128;
      const gctx = grainTile.getContext('2d');
      const img = gctx.createImageData(128, 128);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = 110 + Math.floor(Math.random() * 90);
        img.data[i] = n; img.data[i + 1] = n; img.data[i + 2] = n; img.data[i + 3] = 255;
      }
      gctx.putImageData(img, 0, 0);
    }
    ctx.save(); ctx.globalAlpha = gr * 0.12; ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
    ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  const frame = FRAMES.find((f) => f.id === state.frame);
  if (frame && frame.color) {
    ctx.save();
    ctx.strokeStyle = frame.color; ctx.lineWidth = Math.max(6, Math.round(H * 0.013));
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    ctx.restore();
  }
}

// Full draw. Order matters: photos, dividers, pop-out hero, title block,
// top/bottom strips, seal, then CHIPS LAST so nothing ever covers a chip.
export function drawCover(ctx, state, images, W, H) {
  ctx.save();
  ctx.fillStyle = '#0d0a1f';
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(state.layout, W, H);
  const hero = state.layout === 'popout' ? 0 : -1;
  state.panels.forEach((panel, i) => {
    if (i === hero) return;
    const img = images[panel.photo];
    if (img) drawPhoto(ctx, img, rects[i], panel, state.grade);
  });
  // Slant dividers.
  if (state.layout === 'slant') {
    ctx.save();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = Math.max(3, Math.round(H * 0.004));
    rects.forEach((r) => {
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.12, r.y); ctx.lineTo(r.x + r.w * 0.88, r.y + r.h);
      ctx.stroke();
    });
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = 'rgba(13, 10, 31, 0.9)'; ctx.lineWidth = Math.max(3, Math.round(H * 0.005));
    rects.forEach((r) => ctx.strokeRect(r.x, r.y, r.w, r.h));
    ctx.restore();
  }
  // Pop-out hero: drawn bigger than its cell, but chips come later, so the
  // hero can never cover a chip — the chip-safe zone is enforced by order.
  if (hero === 0) {
    const r = rects[0];
    const img = images[state.panels[0].photo];
    if (img) {
      const big = { x: r.x - r.w * 0.09, y: r.y - r.h * 0.03, w: r.w * 1.18, h: r.h * 1.1 };
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = Math.round(H * 0.03); ctx.shadowOffsetY = Math.round(H * 0.012);
      drawPhoto(ctx, img, big, state.panels[0], state.grade);
      ctx.restore();
    }
  }
  drawTitleBlock(ctx, state, W, H);
  drawTopStrip(ctx, state, W, H);
  drawBottomStrip(ctx, state, W, H);
  drawSeal(ctx, W, H);
  // Chips last: always on top of photos, hero and title band alike.
  state.panels.forEach((panel, i) => drawChip(ctx, rects[i], panel, H));
  drawFinish(ctx, state, W, H);
  ctx.restore();
}

export async function loadImages() {
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('60px Pacifico'),
  ]).catch(() => {});
  const out = {};
  for (const p of CAST) {
    const img = new Image();
    img.src = `samples/${p.photo}.jpg`;
    await img.decode().catch(() => {});
    out[p.photo] = img;
  }
  return out;
}
