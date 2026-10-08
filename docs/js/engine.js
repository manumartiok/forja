// Motor del juego: todo lo que se muestra (XP, nivel, atributos, récords,
// habilidades, misiones, logros, rachas) se calcula a partir de los datos
// guardados. Las funciones son puras salvo `evaluate`, que registra los
// desbloqueos nuevos en el estado para conservar su fecha.
import { EX_BY_ID } from './data/exercises.js';
import { SKILL_TREES } from './data/skills.js';
import {
  ATTRS, RANKS, CLASSES, START_CLASS, DAILY_QUESTS, WEEKLY_QUESTS, ACHIEVEMENTS,
} from './data/game.js';

// ---------------------------------------------------------------- fechas
export const pad = n => String(n).padStart(2, '0');
export const dayKey = d => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export function weekStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // lunes
  return x;
}
export const weekKey = d => dayKey(weekStart(d));

// ---------------------------------------------------------------- utilidades
const sum = (a, f = x => x) => a.reduce((s, x) => s + (f(x) || 0), 0);
const num = v => (v == null || v === '' || isNaN(+v) ? 0 : +v);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function getExercise(state, id) {
  return EX_BY_ID[id] || (state.customExercises || []).find(e => e.id === id) || null;
}

/** Peso corporal vigente en una fecha (último registro anterior). */
export function bodyweightAt(state, date) {
  const log = state.bodyLog || [];
  if (!log.length) return 70;
  const t = new Date(date).getTime();
  let best = log[0];
  for (const e of log) if (new Date(e.date).getTime() <= t) best = e;
  return best.weight || 70;
}

export const currentWeight = state => {
  const log = state.bodyLog || [];
  return log.length ? log[log.length - 1].weight : null;
};

/** 1RM estimado (Epley). Más allá de 12 reps la estimación pierde precisión. */
export const e1rm = (kg, reps) => (reps <= 1 ? kg : kg * (1 + Math.min(reps, 12) / 30));

// ---------------------------------------------------------------- XP por serie
export const XP_SET_CAP = 80;

export function setXP(ex, set, bw) {
  if (!ex || !set || !set.done) return 0;
  let xp = 0;
  switch (ex.type) {
    case 'weight': xp = ((num(set.kg) * num(set.reps)) / bw) * 2.2; break;
    case 'bw': xp = (((bw * (ex.bwf || 0.6) + num(set.kg)) * num(set.reps)) / bw) * 2.2 * (ex.diff || 1); break;
    case 'hold': xp = (num(set.sec) / 3) * (ex.diff || 1); break;
    case 'cardio': xp = (num(set.min) * (ex.met || 7)) / 3; break;
    case 'time': xp = (num(set.min) * (ex.met || 3)) / 2.5; break;
  }
  return clamp(xp, 0, XP_SET_CAP);
}

/** Estadísticas agregadas de una sesión. */
export function sessionStats(state, s) {
  const st = {
    sets: 0, reps: 0, volume: 0, holdSec: 0, cardioMin: 0, distance: 0, mobilityMin: 0,
    durationMin: Math.round((s.duration || 0) / 60), disc: new Set(), repsByDisc: {}, repsByEx: {}, exercises: new Set(),
  };
  for (const item of s.exercises || []) {
    const ex = getExercise(state, item.ex);
    if (!ex) continue;
    const done = (item.sets || []).filter(x => x.done);
    if (!done.length) continue;
    st.exercises.add(ex.id);
    const d = ex.disc[0];
    st.disc.add(d);
    for (const set of done) {
      st.sets++;
      if (ex.type === 'weight' || ex.type === 'bw') {
        const r = num(set.reps);
        st.reps += r;
        st.repsByDisc[d] = (st.repsByDisc[d] || 0) + r;
        st.repsByEx[ex.id] = (st.repsByEx[ex.id] || 0) + r;
        // volumen = carga externa (pesas o lastre), como se mide en el gimnasio
        st.volume += num(set.kg) * r;
      } else if (ex.type === 'hold') {
        st.holdSec += num(set.sec);
        if (d === 'mov') st.mobilityMin += num(set.sec) / 60;
      } else if (ex.type === 'cardio') {
        st.cardioMin += num(set.min);
        st.distance += num(set.km);
      } else if (ex.type === 'time') {
        if (d === 'mov') st.mobilityMin += num(set.min);
        else st.cardioMin += num(set.min);
      }
    }
  }
  st.volume = Math.round(st.volume);
  // si se cargó una actividad larga después de hacerla, el cronómetro no la refleja
  st.durationMin = Math.max(st.durationMin, Math.round(st.cardioMin + st.mobilityMin));
  return st;
}

// ---------------------------------------------------------------- niveles
export const xpToNext = L => Math.round(150 + 60 * Math.pow(L, 1.4));
export const MAX_LEVEL = 100;

export function levelInfo(xp, scale = 1) {
  let L = 1, rem = Math.max(0, xp);
  while (L < MAX_LEVEL && rem >= xpToNext(L) / scale) {
    rem -= xpToNext(L) / scale;
    L++;
  }
  const need = L >= MAX_LEVEL ? 0 : xpToNext(L) / scale;
  return { level: L, into: Math.round(rem), need: Math.round(need), pct: need ? rem / need : 1 };
}

export const rankFor = level => [...RANKS].reverse().find(r => level >= r.min);

// ---------------------------------------------------------------- reconstrucción
/**
 * Recorre las sesiones en orden cronológico: calcula XP, récords personales
 * (comparando con lo anterior) y las mejores marcas por ejercicio.
 */
export function rebuild(state) {
  const sessions = [...(state.sessions || [])].sort((a, b) => new Date(a.start) - new Date(b.start));
  const bests = {}; // por ejercicio
  const seen = new Set();
  const out = [];
  const attrXP = { fue: 0, res: 0, mov: 0, agi: 0, con: 0 };
  let sessionsXP = 0;
  const totals = { volume: 0, distance: 0, reps: 0, repsByEx: {}, sessionsByDisc: {}, prs: 0, minutes: 0 };

  for (const s of sessions) {
    const bw = bodyweightAt(state, s.start);
    const stats = sessionStats(state, s);
    const xpAttr = { fue: 0, res: 0, mov: 0, agi: 0, con: 0 };
    let base = 0;
    const prs = [];
    const newEx = [];

    for (const item of s.exercises || []) {
      const ex = getExercise(state, item.ex);
      if (!ex) continue;
      const done = (item.sets || []).filter(x => x.done);
      if (!done.length) continue;
      if (!seen.has(ex.id)) newEx.push(ex.id);

      for (const set of done) {
        const x = setXP(ex, set, bw);
        base += x;
        for (const [a, w] of Object.entries(ex.attrs || {})) xpAttr[a] += x * w;
      }

      // Mejores marcas de esta sesión para el ejercicio
      const b = (bests[ex.id] = bests[ex.id] || { maxReps: 0, bestE1rm: 0, bestRatio: 0, maxKg: 0, maxHold: 0, maxDist: 0, maxMin: 0, runs: [], sessions: 0 });
      const had = b.sessions > 0;
      b.sessions++;
      const cur = { reps: 0, e1rm: 0, ratio: 0, kg: 0, hold: 0, dist: 0, min: 0 };
      for (const set of done) {
        if (ex.type === 'weight' || ex.type === 'bw') {
          cur.reps = Math.max(cur.reps, num(set.reps));
          if (ex.type === 'weight' && num(set.reps) > 0) {
            cur.e1rm = Math.max(cur.e1rm, e1rm(num(set.kg), num(set.reps)));
            cur.kg = Math.max(cur.kg, num(set.kg));
          }
        } else if (ex.type === 'hold') cur.hold = Math.max(cur.hold, num(set.sec));
      }
      if (ex.type === 'cardio' || ex.type === 'time') {
        cur.dist = sum(done, x => num(x.km));
        cur.min = sum(done, x => num(x.min));
        if (ex.type === 'cardio' && cur.dist > 0 && cur.min > 0) b.runs.push({ km: cur.dist, min: cur.min, date: s.start });
      }
      cur.ratio = cur.e1rm / bw;

      const pr = (metric, value, prev, unit) => {
        if (had && value > prev + 1e-9) prs.push({ ex: ex.id, metric, value, prev, unit });
      };
      if (ex.type === 'weight') pr('1RM estimado', cur.e1rm, b.bestE1rm, 'kg');
      if (ex.type === 'bw') pr('Repeticiones', cur.reps, b.maxReps, 'reps');
      if (ex.type === 'hold') pr('Tiempo', cur.hold, b.maxHold, 's');
      if (ex.type === 'cardio' && cur.dist) pr('Distancia', cur.dist, b.maxDist, 'km');

      b.maxReps = Math.max(b.maxReps, cur.reps);
      b.bestE1rm = Math.max(b.bestE1rm, cur.e1rm);
      b.bestRatio = Math.max(b.bestRatio, cur.ratio);
      b.maxKg = Math.max(b.maxKg, cur.kg);
      b.maxHold = Math.max(b.maxHold, cur.hold);
      b.maxDist = Math.max(b.maxDist, cur.dist);
      b.maxMin = Math.max(b.maxMin, cur.min);
      b.last = s.start;
    }
    for (const id of stats.exercises) seen.add(id);

    const completion = stats.sets ? 25 : 0;
    const durBonus = stats.sets ? Math.min(stats.durationMin, 90) / 3 : 0;
    const prBonus = Math.min(prs.length, 5) * 30;
    const conXP = stats.sets ? 30 : 0;
    xpAttr.con += conXP + durBonus;
    const total = Math.round(base + completion + durBonus + prBonus + conXP);
    for (const a in attrXP) attrXP[a] += xpAttr[a];
    // la XP de completar y de récords se reparte según los atributos del día
    const share = completion + prBonus;
    const baseAttr = xpAttr.fue + xpAttr.res + xpAttr.mov + xpAttr.agi;
    if (baseAttr > 0) for (const a of ['fue', 'res', 'mov', 'agi']) attrXP[a] += (share * xpAttr[a]) / baseAttr;
    sessionsXP += total;

    totals.volume += stats.volume;
    totals.distance += stats.distance;
    totals.reps += stats.reps;
    totals.prs += prs.length;
    totals.minutes += stats.durationMin;
    for (const [id, r] of Object.entries(stats.repsByEx)) totals.repsByEx[id] = (totals.repsByEx[id] || 0) + r;
    for (const d of stats.disc) totals.sessionsByDisc[d] = (totals.sessionsByDisc[d] || 0) + 1;

    out.push({ ...s, stats, xp: total, xpBase: Math.round(base), xpAttr, prs, newEx, bw });
  }
  return { sessions: out, bests, attrXP, sessionsXP, totals, seen };
}

// ---------------------------------------------------------------- habilidades
const asList = x => (Array.isArray(x) ? x : [x]);

/** Progreso hacia el requisito: { met, current, target, unit }. */
export function reqProgress(req, derived) {
  const B = id => derived.bests[id];
  const best = (f) => Math.max(0, ...asList(req.ex || []).map(id => (B(id) ? f(B(id)) : 0)));
  switch (req.kind) {
    case 'reps': { const c = best(b => b.maxReps); return { met: c >= req.n, current: c, target: req.n, unit: 'reps' }; }
    case 'hold': { const c = best(b => b.maxHold); return { met: c >= req.s, current: c, target: req.s, unit: 's' }; }
    case 'ratio': { const c = best(b => b.bestRatio); return { met: c >= req.r, current: c, target: req.r, unit: '× peso' }; }
    case 'distance': { const c = best(b => b.maxDist); return { met: c >= req.km, current: c, target: req.km, unit: 'km' }; }
    case 'duration': { const c = best(b => b.maxMin); return { met: c >= req.min, current: c, target: req.min, unit: 'min' }; }
    case 'pace': {
      const runs = asList(req.ex).flatMap(id => (B(id) ? B(id).runs : []));
      const ok = runs.filter(r => r.km >= req.km);
      const bestMin = ok.length ? Math.min(...ok.map(r => (r.min * req.km) / r.km)) : null;
      return { met: ok.some(r => r.min <= req.min), current: bestMin, target: req.min, unit: 'min', lowerIsBetter: true };
    }
    case 'sessions': { const c = derived.totals.sessionsByDisc[req.disc] || 0; return { met: c >= req.n, current: c, target: req.n, unit: 'sesiones' }; }
  }
  return { met: false, current: 0, target: 0 };
}

export function reqText(req, state) {
  const exName = id => (getExercise(state, asList(id)[0]) || {}).name || id;
  const any = Array.isArray(req.ex) && req.ex.length > 1 ? ` (o ${asList(req.ex).slice(1).map(exName).join(', ')})` : '';
  switch (req.kind) {
    case 'reps': return `${req.n} ${req.n === 1 ? 'repetición' : 'repeticiones'} de ${exName(req.ex)}${any} en una serie`;
    case 'hold': return `Sostener ${exName(req.ex)} ${req.s} segundos`;
    case 'ratio': return `${exName(req.ex)}: 1RM estimado de ${String(req.r).replace('.', ',')} × tu peso corporal`;
    case 'distance': return `${exName(req.ex)}: ${String(req.km).replace('.', ',')} km en una sesión`;
    case 'pace': return `${exName(req.ex)}: ${req.km} km en menos de ${req.min} minutos`;
    case 'duration': return `${exName(req.ex)} durante ${req.min} minutos seguidos`;
    case 'sessions': return `${req.n} entrenamientos de esta disciplina`;
  }
  return '';
}

/**
 * Estado de cada árbol: si un nodo avanzado cumple su requisito, los
 * anteriores del mismo árbol cuentan como desbloqueados "por mérito".
 */
export function skillStatus(state, derived) {
  const claimed = state.skills || {};
  const result = {};
  for (const tree of SKILL_TREES) {
    let highest = -1;
    tree.nodes.forEach((n, i) => {
      if (claimed[n.id] || reqProgress(n.req, derived).met) highest = i;
    });
    tree.nodes.forEach((n, i) => {
      const prog = reqProgress(n.req, derived);
      result[n.id] = {
        unlocked: i <= highest,
        available: i === highest + 1,
        progress: prog,
        date: claimed[n.id] && claimed[n.id].date,
        manual: claimed[n.id] && claimed[n.id].manual,
      };
    });
  }
  return result;
}

// ---------------------------------------------------------------- misiones
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(pool, n, seed) {
  const arr = [...pool];
  let s = seed;
  const out = [];
  while (arr.length && out.length < n) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    out.push(arr.splice(s % arr.length, 1)[0]);
  }
  return out;
}

const SCALE = { beginner: 0.6, intermediate: 1, advanced: 1.4 };
const FIXED = new Set(['sessions', 'weighIns', 'prs', 'newExercises', 'days', 'sessionsDisc', 'longestMin']);

function niceRound(v) {
  if (v < 10) return Math.max(1, Math.round(v));
  if (v < 100) return Math.round(v / 5) * 5;
  if (v < 1000) return Math.round(v / 10) * 10;
  return Math.round(v / 500) * 500;
}

/** Misiones activas del período ('D' diario o 'W' semanal) para una fecha. */
export function questsFor(state, kind, date = new Date()) {
  const p = state.profile || {};
  const disc = p.disciplines && p.disciplines.length ? p.disciplines : ['gym'];
  const key = kind === 'D' ? `D:${dayKey(date)}` : `W:${weekKey(date)}`;
  const pool = (kind === 'D' ? DAILY_QUESTS : WEEKLY_QUESTS).filter(
    q => !q.disc.length || q.disc.some(d => disc.includes(d))
  );
  const fixed = pool[0]; // la primera de cada lista siempre está
  const rest = pick(pool.slice(1), 2, hash(key + disc.join(',')));
  const scale = SCALE[p.experience] || 1;
  return {
    key,
    quests: [fixed, ...rest].map(q => {
      let target = q.target === 'weeklyTarget' ? p.weeklyTarget || 3 : q.target;
      if (!FIXED.has(q.metric) && q.target !== 'weeklyTarget') target = niceRound(target * scale);
      return { ...q, target, name: q.name.replace('{n}', target.toLocaleString('es-AR')) };
    }),
  };
}

function periodRange(key) {
  const [k, d] = key.split(':');
  const [y, m, dd] = d.split('-').map(Number);
  const start = new Date(y, m - 1, dd);
  const end = new Date(start);
  end.setDate(end.getDate() + (k === 'D' ? 1 : 7));
  return [start, end];
}

function metricValue(q, state, derived, key) {
  const [start, end] = periodRange(key);
  const inP = d => { const t = new Date(d); return t >= start && t < end; };
  const ss = derived.sessions.filter(s => inP(s.start) && s.stats.sets > 0);
  switch (q.metric) {
    case 'sessions': return ss.length;
    case 'sets': return sum(ss, s => s.stats.sets);
    case 'repsOf': return sum(ss, s => sum(q.ex, id => s.stats.repsByEx[id] || 0));
    case 'repsDisc': return sum(ss, s => s.stats.repsByDisc[q.d] || 0);
    case 'volume': return sum(ss, s => s.stats.volume);
    case 'cardioMin': return Math.round(sum(ss, s => s.stats.cardioMin));
    case 'distance': return Math.round(sum(ss, s => s.stats.distance) * 10) / 10;
    case 'mobilityMin': return Math.round(sum(ss, s => s.stats.mobilityMin));
    case 'holdSec': return sum(ss, s => s.stats.holdSec);
    case 'weighIns': return (state.bodyLog || []).filter(e => inP(e.date)).length;
    case 'longestMin': return Math.max(0, ...ss.map(s => s.stats.durationMin));
    case 'days': return new Set(ss.map(s => dayKey(s.start))).size;
    case 'prs': return sum(ss, s => s.prs.length);
    case 'newExercises': return sum(ss, s => s.newEx.length);
    case 'sessionsDisc': return ss.filter(s => s.stats.disc.has(q.d)).length;
  }
  return 0;
}

export function questProgress(state, derived, kind, date = new Date()) {
  const { key, quests } = questsFor(state, kind, date);
  const done = (state.quests || {})[key] || {};
  return {
    key,
    quests: quests.map(q => {
      const value = metricValue(q, state, derived, key);
      return { ...q, value, done: !!done[q.id] || value >= q.target, claimed: !!done[q.id] };
    }),
  };
}

// ---------------------------------------------------------------- rachas
export function streakInfo(state, derived, now = new Date()) {
  const target = (state.profile && state.profile.weeklyTarget) || 3;
  const days = {};
  for (const s of derived.sessions) if (s.stats.sets) {
    const w = weekKey(s.start);
    (days[w] = days[w] || new Set()).add(dayKey(s.start));
  }
  const met = w => (days[w] ? days[w].size : 0) >= target;
  const thisWeek = weekKey(now);
  const thisCount = days[thisWeek] ? days[thisWeek].size : 0;

  let streak = 0;
  const d = weekStart(now);
  if (!met(thisWeek)) d.setDate(d.getDate() - 7); // la semana actual todavía está en juego
  while (met(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 7);
  }
  // mejor racha histórica: recorremos semana a semana desde la primera
  let best = 0, run = 0;
  const weeks = Object.keys(days).sort();
  if (weeks.length) {
    const [y, m, dd] = weeks[0].split('-').map(Number);
    for (const w = new Date(y, m - 1, dd); w <= now; w.setDate(w.getDate() + 7)) {
      run = met(dayKey(w)) ? run + 1 : 0;
      best = Math.max(best, run);
    }
  }
  return { streak, best: Math.max(best, streak), thisWeek: thisCount, target, metThisWeek: met(thisWeek) };
}

// ---------------------------------------------------------------- logros
function achievementCheck(id, ctx) {
  const { derived, state, level, skillsUnlocked, streak } = ctx;
  const S = derived.sessions.filter(s => s.stats.sets);
  const t = derived.totals;
  const reps = ids => sum(ids, i => t.repsByEx[i] || 0);
  switch (id) {
    case 'first': return S.length >= 1;
    case 's10': return S.length >= 10;
    case 's50': return S.length >= 50;
    case 's100': return S.length >= 100;
    case 's250': return S.length >= 250;
    case 'streak4': return streak.best >= 4;
    case 'streak12': return streak.best >= 12;
    case 'streak26': return streak.best >= 26;
    case 'early': return S.some(s => new Date(s.start).getHours() < 7);
    case 'night': return S.some(s => new Date(s.start).getHours() >= 22);
    case 'long': return S.some(s => s.stats.durationMin >= 90);
    case 'pr1': return t.prs >= 1;
    case 'pr25': return t.prs >= 25;
    case 'ex20': return derived.seen.size >= 20;
    case 'ton': return S.some(s => s.stats.volume >= 1000);
    case 'ton100': return t.volume >= 100000;
    case 'push1000': return reps(['incline_pushup', 'pushup', 'decline_pushup', 'diamond_pushup', 'archer_pushup', 'one_arm_pushup', 'pike_pushup', 'hspu']) >= 1000;
    case 'pull500': return reps(['pullup', 'chinup', 'muscle_up']) >= 500;
    case 'km100': return t.distance >= 100;
    case 'allround': return ['gym', 'cali', 'cardio', 'hiit', 'mov'].every(d => t.sessionsByDisc[d]);
    case 'body10': return (state.bodyLog || []).length >= 10;
    case 'goalw': {
      const p = state.profile || {}, log = state.bodyLog || [];
      if (!p.goalWeight || log.length < 2) return false;
      const first = log[0].weight, last = log[log.length - 1].weight;
      return first > p.goalWeight ? last <= p.goalWeight : first < p.goalWeight ? last >= p.goalWeight : false;
    }
    case 'skill5': return skillsUnlocked >= 5;
    case 'skill20': return skillsUnlocked >= 20;
    case 'lvl10': return level >= 10;
    case 'lvl25': return level >= 25;
    case 'lvl50': return level >= 50;
  }
  return false;
}

// ---------------------------------------------------------------- perfil completo
export function classFor(state, attrXP) {
  const main = ['fue', 'res', 'mov', 'agi'];
  const totalAttr = sum(main, a => attrXP[a]);
  const p = state.profile || {};
  if (totalAttr < 400) return CLASSES[START_CLASS[(p.disciplines || [])[0]] || 'con'];
  const sorted = [...main].sort((a, b) => attrXP[b] - attrXP[a]);
  if (attrXP[sorted[0]] < 1.3 * attrXP[sorted[1]]) return CLASSES.hybrid;
  return CLASSES[sorted[0]];
}

/** Calcula todo lo derivado (sin modificar el estado). */
export function computeProfile(state, now = new Date()) {
  const derived = rebuild(state);
  const skills = skillStatus(state, derived);
  const unlockedNodes = SKILL_TREES.flatMap(t => t.nodes).filter(n => skills[n.id].unlocked);
  const skillsXP = sum(unlockedNodes, n => n.xp);

  const questsXP = sum(Object.values(state.quests || {}), period => sum(Object.values(period), q => q.xp));
  const achXP = sum(Object.keys(state.achievements || {}), id => (ACHIEVEMENTS.find(a => a.id === id) || {}).xp);

  // Las habilidades suman a los atributos de su disciplina
  const attrXP = { ...derived.attrXP };
  const discAttr = { cali: 'agi', gym: 'fue', cardio: 'res', hiit: 'res', mov: 'mov' };
  for (const n of unlockedNodes) {
    const tree = SKILL_TREES.find(t => t.nodes.includes(n));
    attrXP[discAttr[tree.disc]] += n.xp * 0.5;
  }
  attrXP.con += questsXP * 0.3;

  const totalXP = Math.round(derived.sessionsXP + skillsXP + questsXP + achXP);
  const lvl = levelInfo(totalXP);
  const rank = rankFor(lvl.level);
  const attrs = ATTRS.map(a => ({ ...a, xp: Math.round(attrXP[a.id]), ...levelInfo(attrXP[a.id], 4) }));
  const streak = streakInfo(state, derived, now);
  const cls = classFor(state, attrXP);

  return {
    derived, skills, skillsUnlocked: unlockedNodes.length, totalXP, xpParts: { sessions: Math.round(derived.sessionsXP), skills: skillsXP, quests: questsXP, achievements: achXP },
    ...lvl, rank, attrs, streak, cls,
    daily: questProgress(state, derived, 'D', now),
    weekly: questProgress(state, derived, 'W', now),
  };
}

/**
 * Evalúa y registra desbloqueos nuevos (habilidades, misiones, logros).
 * Muta `state` y devuelve el perfil final junto con las novedades.
 */
export function evaluate(state, now = new Date()) {
  const news = { skills: [], quests: [], achievements: [] };
  state.skills = state.skills || {};
  state.quests = state.quests || {};
  state.achievements = state.achievements || {};
  let profile;
  for (let pass = 0; pass < 4; pass++) {
    profile = computeProfile(state, now);
    let changed = false;

    for (const tree of SKILL_TREES)
      for (const n of tree.nodes)
        if (profile.skills[n.id].unlocked && !state.skills[n.id]) {
          state.skills[n.id] = { date: now.toISOString() };
          news.skills.push({ ...n, tree });
          changed = true;
        }

    for (const period of [profile.daily, profile.weekly])
      for (const q of period.quests)
        if (q.done && !q.claimed) {
          (state.quests[period.key] = state.quests[period.key] || {})[q.id] = { xp: q.xp, date: now.toISOString() };
          news.quests.push(q);
          changed = true;
        }

    const ctx = { derived: profile.derived, state, level: profile.level, skillsUnlocked: profile.skillsUnlocked, streak: profile.streak };
    for (const a of ACHIEVEMENTS)
      if (!state.achievements[a.id] && achievementCheck(a.id, ctx)) {
        state.achievements[a.id] = { date: now.toISOString() };
        news.achievements.push(a);
        changed = true;
      }

    if (!changed) break;
  }
  return { profile, news };
}

// ---------------------------------------------------------------- cuerpo
export function bmi(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const v = weight / Math.pow(heightCm / 100, 2);
  const cat = v < 18.5 ? 'Bajo peso' : v < 25 ? 'Normal' : v < 30 ? 'Sobrepeso' : 'Obesidad';
  return { value: v, cat };
}

export function ageFrom(birth) {
  if (!birth) return null;
  const b = new Date(birth), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

/** Metabolismo basal (Mifflin-St Jeor) y gasto diario estimado. */
export function energy(state, sessionsPerWeek) {
  const p = state.profile || {};
  const w = currentWeight(state), h = p.height, age = ageFrom(p.birthDate);
  if (!w || !h || !age) return null;
  const bmr = 10 * w + 6.25 * h - 5 * age + (p.sex === 'f' ? -161 : p.sex === 'm' ? 5 : -78);
  const factor = 1.2 + Math.min(sessionsPerWeek, 6) * 0.075;
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * factor), factor };
}

/** Kcal aproximadas de una sesión (MET × peso × horas). */
export function sessionKcal(state, s) {
  const bw = bodyweightAt(state, s.start);
  let kcal = 0, timedMin = 0;
  for (const item of s.exercises || []) {
    const ex = getExercise(state, item.ex);
    if (!ex || (ex.type !== 'cardio' && ex.type !== 'time')) continue;
    const min = sum((item.sets || []).filter(x => x.done), x => num(x.min));
    timedMin += min;
    kcal += (min / 60) * (ex.met || 5) * bw;
  }
  // el resto de la sesión (fuerza, isométricos) a ≈ 5 MET
  const restMin = Math.max(0, (s.duration || 0) / 60 - timedMin);
  kcal += (restMin / 60) * 5 * bw;
  return Math.round(kcal);
}
