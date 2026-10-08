// FORJA — arranque, navegación y router.
import { store } from './store.js';
import { computeProfile } from './engine.js';
import { icon } from './icons.js';
import { fmtClock, toast } from './ui.js';
import { hideTip } from './charts.js';
import * as onboarding from './views/onboarding.js';
import * as home from './views/home.js';
import * as train from './views/train.js';
import * as summary from './views/summary.js';
import * as skills from './views/skills.js';
import * as progress from './views/progress.js';
import * as profileView from './views/profile.js';

const $main = document.getElementById('main');
const $links = document.getElementById('nav-links');
const $session = document.getElementById('nav-session');

const NAV = [
  { href: '#/', label: 'Inicio', icon: 'home', match: /^#\/?$/ },
  { href: '#/entrenar', label: 'Entrenar', icon: 'dumbbell', match: /^#\/(entrenar|resumen)/ },
  { href: '#/habilidades', label: 'Habilidades', icon: 'tree', match: /^#\/habilidades/ },
  { href: '#/progreso', label: 'Progreso', icon: 'chart', match: /^#\/progreso/ },
  { href: '#/perfil', label: 'Perfil', icon: 'user', match: /^#\/perfil/ },
];

const ROUTES = [
  [/^#\/?$/, home],
  [/^#\/entrenar$/, train],
  [/^#\/resumen\/([\w-]+)$/, summary],
  [/^#\/habilidades(?:\/(\w+))?$/, skills],
  [/^#\/progreso(?:\/(\w+))?$/, progress],
  [/^#\/perfil$/, profileView],
];

let cleanup = null;

function renderNav() {
  const h = location.hash || '#/';
  $links.innerHTML = NAV.map(
    n => `<a href="${n.href}" class="${n.match.test(h) ? 'on' : ''}" ${n.match.test(h) ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label}</span></a>`
  ).join('');
}

function tickSession() {
  const a = store.get().activeSession;
  const onSession = /^#\/entrenar$/.test(location.hash);
  $session.hidden = !a || onSession;
  if (a && !onSession) {
    $session.innerHTML = `${icon('timer')}<span>Entrenamiento en curso</span><span class="num">${fmtClock((Date.now() - new Date(a.start)) / 1000)}</span>`;
  }
}

export function render() {
  if (cleanup) cleanup();
  cleanup = null;
  hideTip();
  const state = store.get();

  if (!state.profile) {
    document.body.classList.add('no-nav');
    document.querySelector('.nav').hidden = true;
    cleanup = onboarding.render($main, { state, done: () => { location.hash = '#/'; render(); } }) || null;
    return;
  }
  document.body.classList.remove('no-nav');
  document.querySelector('.nav').hidden = false;
  renderNav();
  tickSession();

  const h = location.hash || '#/';
  for (const [re, view] of ROUTES) {
    const m = h.match(re);
    if (m) {
      const ctx = { state, profile: computeProfile(state), params: m.slice(1), rerender: render };
      cleanup = view.render($main, ctx) || null;
      return;
    }
  }
  location.hash = '#/';
}

addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  render();
  $main.focus({ preventScroll: true });
});
setInterval(tickSession, 1000);
render();

if (!store.storageOk()) toast('No se pueden guardar datos en este navegador (¿modo privado?).', { kind: 'bad', iconName: 'info', ms: 8000 });

// Modo sin conexión / instalable
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
