// Acciones que modifican el estado y disparan la evaluación del juego.
import { store, uid } from './store.js';
import { evaluate, computeProfile, getExercise } from './engine.js';
import { toast, esc, nf } from './ui.js';

let lastSummary = null;
export const takeSummary = id => (lastSummary && lastSummary.id === id ? lastSummary : null);

/** Avisos de desbloqueos (habilidades, misiones, logros). */
export function notify(news) {
  for (const q of news.quests) toast(`<b>Misión cumplida</b><br>${esc(q.name)} · <span class="num" style="color:var(--xp)">+${q.xp} XP</span>`, { kind: 'xp', iconName: 'quest' });
  for (const s of news.skills) toast(`<b>¡Habilidad desbloqueada!</b><br>${esc(s.name)} · <span class="num" style="color:var(--xp)">+${s.xp} XP</span>`, { kind: 'xp', iconName: 'spark', ms: 4500 });
  for (const a of news.achievements) toast(`<b>Logro: ${esc(a.name)}</b><br>${esc(a.desc)}${a.xp ? ` · <span class="num" style="color:var(--xp)">+${a.xp} XP</span>` : ''}`, { kind: 'xp', iconName: 'trophy', ms: 4500 });
}

/** Re-evalúa el juego, guarda los desbloqueos y avisa (salvo silent). */
export function runEvaluate({ silent = false } = {}) {
  const before = computeProfile(store.get());
  let res;
  store.update(s => (res = evaluate(s)), { immediate: true });
  if (!silent) {
    notify(res.news);
    if (res.profile.level > before.level) toast(`<b>¡Subiste a nivel ${res.profile.level}!</b>`, { kind: 'xp', iconName: 'star', ms: 5000 });
  }
  return res;
}

// ---------------------------------------------------------------- entrenamientos
/** Último registro de un ejercicio (para sugerir valores y mostrar "anterior"). */
export function lastPerformance(state, exId) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const item = state.sessions[i].exercises.find(e => e.ex === exId);
    if (item) {
      const done = item.sets.filter(s => s.done);
      if (done.length) return done;
    }
  }
  return null;
}

function blankSet(ex, prev, target) {
  const p = prev || {};
  switch (ex.type) {
    case 'weight': return { kg: p.kg ?? '', reps: target ?? p.reps ?? '', done: false };
    case 'bw': return { reps: target ?? p.reps ?? '', kg: p.kg || '', done: false };
    case 'hold': return { sec: target ?? p.sec ?? '', done: false };
    case 'cardio': return { min: target ?? p.min ?? '', km: p.km ?? '', done: false };
    case 'time': return { min: target ?? p.min ?? '', done: false };
  }
  return { done: false };
}

export function newExerciseItem(state, exId, { sets = 1, target } = {}) {
  const ex = getExercise(state, exId);
  const prev = lastPerformance(state, exId);
  return {
    ex: exId,
    sets: Array.from({ length: sets }, (_, i) => blankSet(ex, prev && (prev[i] || prev[prev.length - 1]), target)),
  };
}

export function startSession({ name = 'Entrenamiento libre', routine = null } = {}) {
  store.update(s => {
    s.activeSession = {
      id: uid(),
      name: routine ? routine.name : name,
      routineId: routine ? routine.id : null,
      start: new Date().toISOString(),
      exercises: routine ? routine.items.map(it => newExerciseItem(s, it.ex, { sets: it.sets, target: it.target })) : [],
      notes: '',
    };
  }, { immediate: true });
}

export function cancelSession() {
  store.update(s => (s.activeSession = null), { immediate: true });
}

/**
 * Cierra el entrenamiento en curso: lo guarda, evalúa el juego y prepara el
 * resumen con lo ganado (XP, nivel, récords, habilidades, misiones, logros).
 */
export function finishSession({ feeling = null, durationMin = null } = {}) {
  const before = computeProfile(store.get());
  let res, id;
  store.update(s => {
    const a = s.activeSession;
    const now = new Date();
    a.end = now.toISOString();
    a.duration = durationMin != null ? durationMin * 60 : Math.round((now - new Date(a.start)) / 1000);
    a.feeling = feeling;
    // solo se guardan las series completadas
    a.exercises = a.exercises.map(e => ({ ...e, sets: e.sets.filter(x => x.done) })).filter(e => e.sets.length);
    id = a.id;
    s.sessions.push(a);
    s.activeSession = null;
    res = evaluate(s, now);
  }, { immediate: true });

  const after = res.profile;
  lastSummary = {
    id,
    before: { xp: before.totalXP, level: before.level, into: before.into, need: before.need, rank: before.rank },
    after: { xp: after.totalXP, level: after.level, into: after.into, need: after.need, rank: after.rank },
    news: res.news,
  };
  return id;
}

export function deleteSession(id) {
  store.update(s => (s.sessions = s.sessions.filter(x => x.id !== id)), { immediate: true });
}

export function saveRoutineFromSession(session, name) {
  store.update(s => {
    s.routines.push({
      id: uid(),
      name,
      disc: null,
      desc: 'Rutina propia',
      items: session.exercises.map(e => {
        const first = e.sets[0] || {};
        return { ex: e.ex, sets: e.sets.length, target: first.reps ?? first.sec ?? first.min ?? null };
      }),
    });
  }, { immediate: true });
}

export function deleteRoutine(id) {
  store.update(s => (s.routines = s.routines.filter(r => r.id !== id)), { immediate: true });
}

export function addCustomExercise({ name, type, disc }) {
  const id = `c_${uid().slice(0, 8)}`;
  const attrsByDisc = { gym: { fue: 0.8, res: 0.2 }, cali: { fue: 0.6, agi: 0.4 }, cardio: { res: 1 }, hiit: { res: 0.7, fue: 0.3 }, mov: { mov: 1 } };
  store.update(s => {
    s.customExercises.push({
      id, name, type, disc: [disc], custom: true,
      attrs: attrsByDisc[disc], bwf: 0.6, diff: 1, met: type === 'cardio' ? 7 : 3,
      distance: type === 'cardio',
    });
  }, { immediate: true });
  return id;
}

// ---------------------------------------------------------------- cuerpo
export function logBody(entry) {
  store.update(s => {
    s.bodyLog.push(entry);
    s.bodyLog.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, { immediate: true });
  return runEvaluate();
}

export function deleteBody(date) {
  store.update(s => (s.bodyLog = s.bodyLog.filter(e => e.date !== date)), { immediate: true });
}

// ---------------------------------------------------------------- habilidades
export function claimSkill(nodeId) {
  store.update(s => (s.skills[nodeId] = { date: new Date().toISOString(), manual: true }), { immediate: true });
  return runEvaluate();
}

export const fmtSet = (ex, set) => {
  switch (ex.type) {
    case 'weight': return `${nf(set.kg, 1)} kg × ${nf(set.reps)}`;
    case 'bw': return `${nf(set.reps)} reps${+set.kg ? ` (+${nf(set.kg, 1)} kg)` : ''}`;
    case 'hold': return `${nf(set.sec)} s`;
    case 'cardio': return `${nf(set.min)} min${+set.km ? ` · ${nf(set.km, 2)} km` : ''}`;
    case 'time': return `${nf(set.min)} min`;
  }
  return '';
};
