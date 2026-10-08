// Persistencia local (localStorage). Todo queda en el dispositivo: no hay
// servidor ni cuentas. Se puede exportar/importar una copia en JSON.
const KEY = 'forja:v1';
const VERSION = 1;

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export function emptyState() {
  return {
    version: VERSION,
    profile: null, // se completa en la bienvenida
    bodyLog: [], // { date, weight, bodyFat?, waist?, chest?, arm? }
    sessions: [], // entrenamientos terminados
    activeSession: null, // entrenamiento en curso
    routines: [], // rutinas propias
    customExercises: [],
    skills: {}, // { nodeId: { date, manual? } }
    quests: {}, // { 'D:2026-10-08': { questId: { xp, date } } }
    achievements: {}, // { id: { date } }
    settings: { restSec: 90, sound: true, vibrate: true },
  };
}

function migrate(s) {
  const base = emptyState();
  const out = { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) } };
  out.version = VERSION;
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

let state = load();
const listeners = new Set();
let timer = null;
let storageOk = true;

function persist() {
  timer = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOk = true;
  } catch (err) {
    storageOk = false;
    console.error('No se pudo guardar', err);
  }
}

export const store = {
  get: () => state,
  storageOk: () => storageOk,
  /** Aplica cambios y guarda (con un pequeño retardo para agrupar escrituras). */
  update(fn, { immediate = false } = {}) {
    fn(state);
    if (immediate) persist();
    else if (!timer) timer = setTimeout(persist, 250);
    for (const l of listeners) l(state);
  },
  flush() {
    if (timer) {
      clearTimeout(timer);
      persist();
    }
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  exportJSON() {
    return JSON.stringify({ app: 'forja', exportedAt: new Date().toISOString(), data: state }, null, 2);
  },
  importJSON(text) {
    const parsed = JSON.parse(text);
    const data = parsed && parsed.app === 'forja' ? parsed.data : parsed;
    if (!data || !Array.isArray(data.sessions) || !('profile' in data)) {
      throw new Error('El archivo no es una copia de seguridad de FORJA');
    }
    state = migrate(data);
    persist();
    for (const l of listeners) l(state);
  },
  reset() {
    state = emptyState();
    persist();
    for (const l of listeners) l(state);
  },
};

addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && store.flush());
addEventListener('pagehide', () => store.flush());
