// Utilidades de interfaz: escape, formatos, avisos, modales y sonido.
import { icon } from './icons.js';

export const esc = v =>
  String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const nf = (v, d = 0) =>
  v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString('es-AR', opts);
export const fmtDateTime = d =>
  new Date(d).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function fmtClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function fmtMin(min) {
  min = Math.round(min);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ''}`.trim();
}

/** Ritmo en min/km. */
export const fmtPace = (min, km) => {
  if (!min || !km) return '—';
  const p = min / km;
  return `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, '0')} /km`;
};

// ---------------------------------------------------------------- avisos
const $toasts = () => document.getElementById('toasts');

export function toast(html, { kind = 'info', ms = 3500, iconName } = {}) {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `${iconName ? icon(iconName) : ''}<div>${html}</div>`;
  $toasts().appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// ---------------------------------------------------------------- modales
let openCount = 0;

/**
 * Abre un modal. `body` es HTML; `onMount(el, close)` permite enganchar eventos.
 * Devuelve una promesa que resuelve con el valor pasado a close().
 */
export function modal({ title, body, actions = [], onMount, wide = false, className = '' }) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''} ${className}" role="dialog" aria-modal="true" aria-label="${esc(title || '')}">
        ${title ? `<header class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></header>` : ''}
        <div class="modal-body">${body}</div>
        ${actions.length ? `<footer class="modal-foot">${actions
          .map((a, i) => `<button class="btn ${a.kind || 'ghost'}" data-act="${i}">${a.label}</button>`)
          .join('')}</footer>` : ''}
      </div>`;
    const prevFocus = document.activeElement;
    const close = value => {
      wrap.classList.remove('in');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        wrap.remove();
        if (--openCount === 0) document.body.classList.remove('modal-open');
        if (prevFocus && prevFocus.focus) prevFocus.focus();
      }, 180);
      resolve(value);
    };
    const onKey = e => e.key === 'Escape' && close(undefined);
    wrap.addEventListener('click', e => {
      if (e.target === wrap || e.target.closest('[data-close]')) return close(undefined);
      const b = e.target.closest('[data-act]');
      if (b) {
        const a = actions[+b.dataset.act];
        const v = a.value !== undefined ? a.value : a.onClick ? a.onClick(wrap) : true;
        if (v !== false) close(v);
      }
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    openCount++;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => wrap.classList.add('in'));
    if (onMount) onMount(wrap, close);
    const first = wrap.querySelector('input, select, textarea, button:not([data-close])');
    if (first) setTimeout(() => first.focus(), 50);
  });
}

/** Confirmación propia (los diálogos nativos pueden estar bloqueados). */
export const confirmDialog = (text, { ok = 'Confirmar', danger = false, title = '¿Seguro?' } = {}) =>
  modal({
    title,
    body: `<p class="muted">${text}</p>`,
    actions: [
      { label: 'Cancelar', value: false },
      { label: ok, kind: danger ? 'danger' : 'primary', value: true },
    ],
  }).then(v => v === true);

// ---------------------------------------------------------------- sonido y vibración
let audio;
export function beep({ freq = 880, ms = 160, times = 1 } = {}) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const t = audio.currentTime + i * (ms / 1000 + 0.08);
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = freq;
      o.type = 'sine';
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + ms / 1000 + 0.02);
    }
  } catch {}
}

export const vibrate = pattern => {
  try {
    navigator.vibrate && navigator.vibrate(pattern);
  } catch {}
};

// ---------------------------------------------------------------- celebración
export function confetti(host = document.body, n = 70) {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const colors = ['#ffc94d', '#7c5cff', '#3ee08f', '#ff7ad9', '#5ee7d8'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    p.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(p);
  }
  host.appendChild(layer);
  setTimeout(() => layer.remove(), 3500);
}

/** Anima un número desde `from` hasta `to`. */
export function countUp(el, from, to, ms = 1200) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = nf(to);
    return;
  }
  const t0 = performance.now();
  const step = t => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = nf(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function bar(pct, cls = '') {
  return `<div class="bar ${cls}"><div style="width:${Math.max(0, Math.min(100, pct * 100))}%"></div></div>`;
}
