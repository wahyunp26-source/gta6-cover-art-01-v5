// Seven Tides Cover Studio — editor wiring, written fresh in-session.
// State, undo/redo, panel editing (drag to pan, wheel to zoom, face focus),
// auto-fill cast, and PNG export in the three common post sizes.
import { CAST, LAYOUTS, GRADES, FRAMES, defaultState, drawCover, loadImages } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

let state = defaultState();
let images = {};
let selected = 0;
let undoStack = [];
let redoStack = [];
let drag = null;

function snapshot() { return JSON.stringify(state); }
function pushUndo() { undoStack.push(snapshot()); if (undoStack.length > 60) undoStack.shift(); redoStack = []; }
function restore(json) { state = JSON.parse(json); syncControls(); redraw(); }

function redraw() { drawCover(ctx, state, images, canvas.width, canvas.height); }

function chipButtons(list, el, current, onPick) {
  el.innerHTML = '';
  list.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name;
    if (item.id === current) b.classList.add('on');
    b.addEventListener('click', () => { pushUndo(); onPick(item.id); syncControls(); redraw(); });
    el.appendChild(b);
  });
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('tagline').value = state.tagline;
  chipButtons(LAYOUTS, document.getElementById('layouts'), state.layout, (id) => { state.layout = id; });
  chipButtons(GRADES, document.getElementById('grades'), state.grade, (id) => { state.grade = id; });
  chipButtons(FRAMES, document.getElementById('frames'), state.frame, (id) => { state.frame = id; });
  document.getElementById('warmth').value = state.warmth;
  document.getElementById('saturation').value = state.saturation;
  document.getElementById('vignette').value = state.vignette;
  document.getElementById('grain').value = state.grain;
  const castEl = document.getElementById('cast');
  castEl.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${i + 1} · ${p.role}`;
    if (i === selected) b.classList.add('on');
    b.addEventListener('click', () => { selected = i; syncPanelEdit(); syncControls(); });
    castEl.appendChild(b);
  });
  syncPanelEdit();
}

function syncPanelEdit() {
  const p = state.panels[selected];
  document.getElementById('panel-edit-title').textContent = `Panel ${selected + 1} · ${p.role}`;
  const sel = document.getElementById('panel-photo');
  sel.innerHTML = '';
  CAST.forEach((c) => {
    const o = document.createElement('option');
    o.value = c.photo; o.textContent = c.role;
    if (c.photo === p.photo) o.selected = true;
    sel.appendChild(o);
  });
  document.getElementById('panel-role').value = p.role;
  document.getElementById('panel-place').value = p.place;
  document.getElementById('panel-time').value = p.time;
  document.getElementById('panel-caption').value = p.caption;
  document.getElementById('panel-zoom').value = p.zoom;
}

function bindText(id, key) {
  document.getElementById(id).addEventListener('input', (e) => { state[key] = e.target.value; redraw(); });
}
bindText('title', 'title');
bindText('subtitle', 'subtitle');
bindText('tagline', 'tagline');

['warmth', 'saturation', 'vignette', 'grain'].forEach((key) => {
  document.getElementById(key).addEventListener('input', (e) => { state[key] = parseFloat(e.target.value); redraw(); });
});

document.getElementById('panel-photo').addEventListener('change', (e) => {
  pushUndo();
  const p = state.panels[selected];
  p.photo = e.target.value;
  const c = CAST.find((v) => v.photo === p.photo);
  if (c) { p.fx = c.fx; p.fy = c.fy; }
  redraw();
});
document.getElementById('panel-role').addEventListener('input', (e) => { state.panels[selected].role = e.target.value.toUpperCase(); redraw(); });
document.getElementById('panel-place').addEventListener('input', (e) => { state.panels[selected].place = e.target.value.toUpperCase(); redraw(); });
document.getElementById('panel-time').addEventListener('input', (e) => { state.panels[selected].time = e.target.value; redraw(); });
document.getElementById('panel-caption').addEventListener('input', (e) => { state.panels[selected].caption = e.target.value.toUpperCase(); redraw(); });
document.getElementById('panel-zoom').addEventListener('input', (e) => { state.panels[selected].zoom = parseFloat(e.target.value); redraw(); });

document.getElementById('face-focus').addEventListener('click', () => {
  pushUndo();
  const p = state.panels[selected];
  const c = CAST.find((v) => v.photo === p.photo) || CAST[selected];
  p.fx = c.fx; p.fy = c.fy; p.dx = 0; p.dy = 0; p.zoom = 1;
  document.getElementById('panel-zoom').value = 1;
  status.textContent = `Face focus on ${p.role} — crop centred on the face.`;
  redraw();
});

document.getElementById('upload-photo').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  await img.decode().catch(() => {});
  img.src = url;
  await new Promise((res) => { img.onload = res; img.onerror = res; });
  const key = `upload-${Date.now()}`;
  images[key] = img;
  pushUndo();
  state.panels[selected].photo = key;
  state.panels[selected].fx = 0.5; state.panels[selected].fy = 0.35;
  status.textContent = 'Photo loaded — it stays on your machine, never uploaded.';
  redraw();
});

document.getElementById('autofill').addEventListener('click', () => {
  pushUndo();
  state.panels = CAST.map((c) => ({ ...c, zoom: 1, dx: 0, dy: 0 }));
  status.textContent = 'Cast auto-filled: 7 roles, 7 faces, 7 places.';
  syncControls(); redraw();
});
document.getElementById('undo').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
});
document.getElementById('redo').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
});

// Drag a panel to pan its photo; scroll over a panel to zoom it.
function panelAt(mx, my) {
  const r = canvas.getBoundingClientRect();
  const px = (mx - r.left) * (canvas.width / r.width);
  const py = (my - r.top) * (canvas.height / r.height);
  return { px, py };
}
canvas.addEventListener('pointerdown', (e) => {
  const { px, py } = panelAt(e.clientX, e.clientY);
  drag = { px, py, p: state.panels[selected] };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { px, py } = panelAt(e.clientX, e.clientY);
  drag.p.dx = Math.min(Math.max(drag.p.dx - (px - drag.px) / canvas.width, -0.4), 0.4);
  drag.p.dy = Math.min(Math.max(drag.p.dy - (py - drag.py) / canvas.height, -0.4), 0.4);
  drag.px = px; drag.py = py;
  redraw();
});
canvas.addEventListener('pointerup', () => { if (drag) { pushUndo(); drag = null; } });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[selected];
  p.zoom = Math.min(Math.max(p.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1), 2.2);
  document.getElementById('panel-zoom').value = p.zoom;
  redraw();
}, { passive: false });

function exportPng(w, h, name) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), state, images, w, h);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    status.textContent = `Saved ${name} — ${w} x ${h}.`;
  }, 'image/png');
}
document.getElementById('export-1080').addEventListener('click', () => exportPng(1080, 1080, 'cover-1080x1080.png'));
document.getElementById('export-1350').addEventListener('click', () => exportPng(1080, 1350, 'cover-1080x1350.png'));
document.getElementById('export-1920').addEventListener('click', () => exportPng(1920, 1080, 'cover-1920x1080.png'));

export async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
images = await loadImages();
syncControls();
if (shot) {
  await runShot(shot, query, state, images, canvas, ctx, redraw);
} else {
  redraw();
}
