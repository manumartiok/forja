// Gráficos SVG livianos con tooltip: línea, barras y mapa de actividad.
// Cada gráfico es una sola serie, así que el título lo identifica (sin leyenda).
import { esc, nf, fmtDate } from './ui.js';

const tip = () => document.getElementById('tooltip');

function showTip(html, x, y) {
  const t = tip();
  t.innerHTML = html;
  t.hidden = false;
  const r = t.getBoundingClientRect();
  let left = x + 14, top = y - r.height - 12;
  if (left + r.width > innerWidth - 8) left = x - r.width - 14;
  if (top < 8) top = y + 18;
  t.style.left = `${Math.max(8, left)}px`;
  t.style.top = `${top}px`;
}
export const hideTip = () => (tip().hidden = true);

// Tooltips simples por atributo data-tip (barras, celdas del mapa)
document.addEventListener('pointermove', e => {
  const el = e.target.closest && e.target.closest('[data-tip]');
  if (el) showTip(el.dataset.tip, e.clientX, e.clientY);
  else if (!e.target.closest || !e.target.closest('.line-chart')) hideTip();
});
document.addEventListener('pointerleave', hideTip);

/** Escala con pasos redondos (1, 2, 2,5, 5 × 10^k). */
function niceScale(lo, hi, count = 4, integer = false) {
  if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
  const raw = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  let step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
  if (integer) step = Math.max(1, Math.round(step));
  const nlo = Math.floor(lo / step) * step, nhi = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = nlo; v <= nhi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { lo: nlo, hi: nhi, ticks, dec: step < 1 ? (step < 0.1 ? 2 : 1) : 0 };
}

/**
 * Gráfico de línea temporal.
 * points: [{ t: Date|string, y: number, tip?: string }]
 */
export function lineChart({ points, unit = '', goal = null, goalLabel = 'Objetivo', height = 220, width = 640, decimals = 1, integer = false, ariaLabel = '' }) {
  if (points.length < 2) {
    return `<div class="chart-empty">Necesitás al menos 2 registros para ver la evolución.</div>`;
  }
  const W = width, H = height, pl = 44, pr = 14, pt = 16, pb = 28;
  const xs = points.map(p => new Date(p.t).getTime());
  const ys = points.map(p => p.y).concat(goal != null ? [goal] : []);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padY = (maxY - minY) * 0.1 || Math.max(1, Math.abs(maxY) * 0.05);
  const sc = niceScale(Math.max(0, minY - padY), maxY + padY, 4, integer);
  const lo = sc.lo, hi = sc.hi;
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const X = t => pl + ((t - x0) / (x1 - x0 || 1)) * (W - pl - pr);
  const Y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);

  let grid = '';
  for (const v of sc.ticks) {
    grid += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${pl - 8}" y="${Y(v) + 4}" text-anchor="end">${nf(v, sc.dec)}</text>`;
  }
  const n = Math.min(5, points.length);
  for (let i = 0; i < n; i++) {
    const t = x0 + ((x1 - x0) * i) / (n - 1 || 1);
    grid += `<text class="axis" x="${X(t)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(fmtDate(t))}</text>`;
  }
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${d}L${X(xs[xs.length - 1])},${H - pb}L${X(xs[0])},${H - pb}Z`;
  const goalLine = goal != null
    ? `<line class="goal" x1="${pl}" x2="${W - pr}" y1="${Y(goal)}" y2="${Y(goal)}"/><text class="goal-label" x="${W - pr}" y="${Y(goal) - 6}" text-anchor="end">${esc(goalLabel)}: ${nf(goal, decimals)} ${esc(unit)}</text>`
    : '';
  const last = points[points.length - 1];
  const data = points.map((p, i) => ({ x: X(xs[i]), y: Y(p.y), v: p.y, t: xs[i], tip: p.tip || '' }));

  return `<div class="line-chart" data-points='${esc(JSON.stringify(data))}' data-unit="${esc(unit)}" data-dec="${decimals}" data-w="${W}">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">
      ${grid}${goalLine}
      <path class="area" d="${area}"/>
      <path class="line" d="${d}"/>
      <circle class="end" cx="${X(xs[xs.length - 1])}" cy="${Y(last.y)}" r="4.5"/>
      <text class="end-label" x="${X(xs[xs.length - 1]) - 8}" y="${Y(last.y) - 10}" text-anchor="end">${nf(last.y, decimals)} ${esc(unit)}</text>
      <line class="cross" y1="${pt}" y2="${H - pb}" x1="-10" x2="-10"/>
      <circle class="hover-dot" r="5" cx="-10" cy="-10"/>
    </svg></div>`;
}

/** Engancha el hover (crosshair + tooltip) de los gráficos de línea dentro de root. */
export function bindCharts(root) {
  root.querySelectorAll('.line-chart').forEach(el => {
    const pts = JSON.parse(el.dataset.points);
    const unit = el.dataset.unit, dec = +el.dataset.dec, W = +el.dataset.w;
    const svg = el.querySelector('svg');
    const cross = svg.querySelector('.cross'), dot = svg.querySelector('.hover-dot');
    const move = e => {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      let best = pts[0];
      for (const p of pts) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
      cross.setAttribute('x1', best.x);
      cross.setAttribute('x2', best.x);
      dot.setAttribute('cx', best.x);
      dot.setAttribute('cy', best.y);
      el.classList.add('hovering');
      showTip(`<b>${nf(best.v, dec)} ${esc(unit)}</b><span>${esc(fmtDate(best.t, { day: 'numeric', month: 'short', year: 'numeric' }))}</span>${best.tip ? `<span>${esc(best.tip)}</span>` : ''}`, e.clientX, e.clientY);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', () => {
      el.classList.remove('hovering');
      hideTip();
    });
  });
}

/**
 * Barras verticales. bars: [{ label, value, tip }]
 */
export function barChart({ bars, height = 180, unit = '', highlightLast = true, ariaLabel = '' }) {
  if (!bars.length) return '<div class="chart-empty">Sin datos todavía.</div>';
  const W = 640, H = height, pl = 30, pr = 6, pt = 18, pb = 26;
  const sc = niceScale(0, Math.max(1, ...bars.map(b => b.value)), 4, bars.every(b => Number.isInteger(b.value)));
  const max = sc.hi;
  const iw = W - pl - pr, ih = H - pt - pb;
  const step = iw / bars.length, bw = Math.min(34, step * 0.62);
  const Y = v => pt + ih - (v / max) * ih;
  let svg = '';
  for (const v of sc.ticks) {
    svg += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="axis" x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end">${nf(v, sc.dec)}</text>`;
  }
  bars.forEach((b, i) => {
    const cx = pl + step * i + step / 2, top = Y(b.value), base = Y(0);
    const h = base - top;
    if (h > 0.5) {
      const r = Math.min(4, h / 2);
      svg += `<path class="bar${highlightLast && i === bars.length - 1 ? ' current' : ''}" d="M${cx - bw / 2},${base}V${top + r}Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top}H${cx + bw / 2 - r}Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r}V${base}Z"/>`;
    }
    if (bars.length <= 14 || i % 2 === bars.length % 2) svg += `<text class="axis" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(b.label)}</text>`;
    svg += `<rect class="hit" x="${cx - step / 2}" y="${pt}" width="${step}" height="${ih}" data-tip="${esc(b.tip || `${nf(b.value)} ${unit}`)}"/>`;
  });
  return `<div class="bar-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ariaLabel)}">${svg}</svg></div>`;
}

/**
 * Mapa de actividad estilo calendario (columnas = semanas, filas = días).
 * days: { 'YYYY-MM-DD': { xp, sessions } }
 */
export function heatmap(days, weeks = 26) {
  const cell = 13, gap = 3;
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7);
  const vals = Object.values(days).map(d => d.xp);
  const max = Math.max(1, ...vals);
  const level = v => (!v ? 0 : v < max * 0.25 ? 1 : v < max * 0.5 ? 2 : v < max * 0.75 ? 3 : 4);
  let svg = '', monthLabels = '';
  let lastMonth = -1;
  const d = new Date(start);
  for (let w = 0; w < weeks; w++) {
    for (let r = 0; r < 7; r++) {
      if (d > end) break;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const info = days[key];
      const tipText = info
        ? `<b>${nf(info.sessions)} entrenamiento${info.sessions > 1 ? 's' : ''}</b><span>${nf(info.xp)} XP · ${esc(fmtDate(d))}</span>`
        : `<span>Sin actividad · ${esc(fmtDate(d))}</span>`;
      svg += `<rect class="hm l${level(info && info.xp)}" x="${24 + w * (cell + gap)}" y="${16 + r * (cell + gap)}" width="${cell}" height="${cell}" rx="3" data-tip="${esc(tipText)}"/>`;
      if (r === 0 && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        monthLabels += `<text class="axis" x="${24 + w * (cell + gap)}" y="10">${esc(d.toLocaleDateString('es-AR', { month: 'short' }))}</text>`;
      }
      d.setDate(d.getDate() + 1);
    }
  }
  const labels = ['Lu', '', 'Mi', '', 'Vi', '', 'Do'].map((l, r) => `<text class="axis" x="10" y="${16 + r * (cell + gap) + 10}" text-anchor="middle">${l}</text>`).join('');
  const width = 24 + weeks * (cell + gap);
  return `<div class="heatmap-wrap"><svg class="heatmap" viewBox="0 0 ${width} ${16 + 7 * (cell + gap)}" style="min-width:${width}px" role="img" aria-label="Actividad de las últimas ${weeks} semanas">${monthLabels}${labels}${svg}</svg></div>
    <div class="hm-legend"><span>Menos</span>${[0, 1, 2, 3, 4].map(l => `<i class="hm l${l}"></i>`).join('')}<span>Más XP</span></div>`;
}
