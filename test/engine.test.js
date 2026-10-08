// Pruebas del motor del juego con un historial simulado: node test/engine.test.js
import assert from 'node:assert/strict';
import {
  evaluate, computeProfile, setXP, levelInfo, xpToNext, e1rm, streakInfo, rebuild, questsFor, bmi, energy,
} from '../docs/js/engine.js';
import { EX_BY_ID } from '../docs/js/data/exercises.js';

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log('  ✓', name);
};

const empty = () => ({
  profile: { name: 'Test', sex: 'm', birthDate: '1995-05-10', height: 178, disciplines: ['gym', 'cali'], experience: 'intermediate', weeklyTarget: 3, goalWeight: 75 },
  bodyLog: [{ date: '2026-07-01T08:00:00', weight: 80 }],
  sessions: [], skills: {}, quests: {}, achievements: {}, customExercises: [],
});

const sess = (date, exercises, minutes = 60) => ({
  id: date, start: date, duration: minutes * 60,
  exercises: exercises.map(([ex, sets]) => ({ ex, sets: sets.map(s => ({ ...s, done: true })) })),
});

// Historial: 12 semanas, 3 sesiones por semana (lun, mié, vie), con progresión
function buildHistory() {
  const st = empty();
  const start = new Date(2026, 6, 6, 18, 0); // lunes 6/7/2026 18:00
  for (let w = 0; w < 12; w++) {
    for (const [i, offset] of [0, 2, 4].entries()) {
      const d = new Date(start);
      d.setDate(d.getDate() + w * 7 + offset);
      const iso = d.toISOString();
      if (i === 0) st.sessions.push(sess(iso, [
        ['bench', [{ kg: 50 + w * 2.5, reps: 8 }, { kg: 50 + w * 2.5, reps: 8 }, { kg: 50 + w * 2.5, reps: 7 }]],
        ['squat', [{ kg: 70 + w * 5, reps: 6 }, { kg: 70 + w * 5, reps: 6 }]],
        ['row', [{ kg: 45 + w * 2.5, reps: 10 }, { kg: 45 + w * 2.5, reps: 10 }]],
      ]));
      if (i === 1) st.sessions.push(sess(iso, [
        ['pushup', [{ reps: 15 + w }, { reps: 12 + w }]],
        ['pullup', [{ reps: 2 + Math.floor(w / 2) }, { reps: 2 + Math.floor(w / 3) }]],
        ['plank', [{ sec: 45 + w * 3 }]],
        ['dead_hang', [{ sec: 25 + w * 2 }]],
      ], 45));
      if (i === 2) st.sessions.push(sess(iso, [['run', [{ min: 25 + w, km: 4 + w * 0.3 }]]], 30));
    }
    st.bodyLog.push({ date: new Date(start.getTime() + w * 7 * 864e5).toISOString(), weight: 80 - w * 0.4 });
  }
  return st;
}

console.log('\nMotor de FORJA');

test('curva de niveles creciente y coherente', () => {
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(xpToNext(1)).level, 2);
  assert.ok(xpToNext(10) > xpToNext(5));
  assert.equal(levelInfo(1e9).level, 100);
});

test('XP por serie escala con el peso y tiene tope', () => {
  const a = setXP(EX_BY_ID.bench, { kg: 60, reps: 10, done: true }, 75);
  const b = setXP(EX_BY_ID.bench, { kg: 80, reps: 10, done: true }, 75);
  assert.ok(b > a && a > 10);
  assert.equal(setXP(EX_BY_ID.bench, { kg: 60, reps: 10, done: false }, 75), 0);
  assert.equal(setXP(EX_BY_ID.pushup, { reps: 10000, done: true }, 75), 80);
});

test('1RM estimado (Epley)', () => {
  assert.equal(e1rm(100, 1), 100);
  assert.ok(Math.abs(e1rm(100, 10) - 133.33) < 0.01);
});

const st = buildHistory();
const now = new Date(2026, 8, 27, 20, 0); // domingo de la semana 12
const { profile, news } = evaluate(st, now);

test('historial: XP, nivel y récords', () => {
  assert.ok(profile.totalXP > 5000, `XP total ${profile.totalXP}`);
  assert.ok(profile.level >= 5);
  assert.ok(profile.derived.totals.prs > 10);
});

test('racha semanal de 12 semanas', () => {
  assert.equal(profile.streak.streak, 12);
  assert.equal(profile.streak.best, 12);
});

test('habilidades desbloqueadas por mérito (cadena completa)', () => {
  assert.ok(profile.skills.push2.unlocked, 'flexión x10');
  assert.ok(profile.skills.push1.unlocked, 'nodo anterior por mérito');
  assert.ok(profile.skills.pull4.unlocked, 'primera dominada');
  assert.ok(profile.skills.run3.unlocked, '5 km');
  assert.ok(!profile.skills.pull7.unlocked, 'muscle-up no');
  assert.ok(profile.skills.bp2.unlocked, 'banca 0,75× (77,5×8 ≈ 98 kg 1RM / 75,6 kg)');
});

test('logros registrados', () => {
  for (const id of ['first', 's10', 'streak4', 'pr1', 'ton', 'body10']) assert.ok(st.achievements[id], id);
  assert.ok(!st.achievements.s100);
});

test('misiones deterministas y escaladas por experiencia', () => {
  const a = questsFor(st, 'D', new Date(2026, 9, 8));
  const b = questsFor(st, 'D', new Date(2026, 9, 8));
  assert.deepEqual(a.quests.map(q => q.id), b.quests.map(q => q.id));
  assert.equal(a.quests[0].id, 'd_workout');
  assert.equal(a.quests.length, 3);
});

test('evaluate es idempotente', () => {
  const again = evaluate(st, now);
  assert.equal(again.news.skills.length + again.news.quests.length + again.news.achievements.length, 0);
  assert.equal(again.profile.totalXP, profile.totalXP);
});

test('borrar la semana actual no rompe la racha anterior', () => {
  const s2 = buildHistory();
  s2.sessions = s2.sessions.slice(0, -3);
  const d = rebuild(s2);
  assert.equal(streakInfo(s2, d, now).streak, 11);
});

test('IMC y energía', () => {
  assert.equal(bmi(80, 180).cat, 'Normal');
  assert.ok(energy(st, 3).tdee > energy(st, 3).bmr);
});

console.log(`\n  ${passed} pruebas OK`);
console.log('\nResumen del usuario simulado:');
console.log({
  xp: profile.totalXP, partes: profile.xpParts, nivel: profile.level, rango: profile.rank.name, clase: profile.cls.name,
  atributos: profile.attrs.map(a => `${a.short} nv${a.level} (${a.xp})`).join(' · '),
  habilidades: profile.skillsUnlocked, logros: Object.keys(st.achievements).length,
  xpSesiones: profile.derived.sessions.slice(-3).map(s => s.xp),
  novedades: { habilidades: news.skills.length, misiones: news.quests.length, logros: news.achievements.length },
});
