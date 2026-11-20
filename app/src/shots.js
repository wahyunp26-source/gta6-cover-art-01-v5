// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the
// requested layout and grade; ?shot=editor shows the page with the cast
// loaded. window.__shotReady is set once the cover is painted.
export async function runShot(shot, query, state, images, canvas, ctx, redraw) {
  const layout = query.get('layout');
  const grade = query.get('grade');
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const w = parseInt(query.get('w') || '1920', 10);
    const h = parseInt(query.get('h') || '1080', 10);
    canvas.width = w; canvas.height = h;
  }
  redraw();
  await document.fonts.ready.catch(() => {});
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
