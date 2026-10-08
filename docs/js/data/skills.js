// Árboles de habilidades. Cada nodo se desbloquea automáticamente cuando los
// entrenamientos registrados cumplen su requisito (y el nodo anterior está
// desbloqueado). También se pueden marcar a mano si se lograron fuera de la app.
//
// Requisitos:
//   reps      ex, n      → mejor serie con ≥ n repeticiones
//   hold      ex, s      → mejor isométrico ≥ s segundos
//   ratio     ex, r      → 1RM estimado ≥ r × peso corporal
//   distance  ex, km     → una sesión con ≥ km
//   pace      ex, km, min→ ≥ km en ≤ min minutos
//   duration  ex, min    → una sesión de ≥ min minutos de ese ejercicio
//   sessions  disc, n    → n entrenamientos que incluyan esa disciplina
// `ex` puede ser un id o una lista de ids (vale cualquiera).

const XP = [60, 100, 160, 240, 350, 500, 700, 900, 1200];
const chain = (nodes) => nodes.map((n, i) => ({ ...n, tier: i + 1, xp: n.xp || XP[Math.min(i, XP.length - 1)] }));

export const SKILL_TREES = [
  // ---------------------------------------------------------------- calistenia
  {
    id: 'push', name: 'Empuje', disc: 'cali', icon: 'push',
    nodes: chain([
      { id: 'push1', name: 'Primeros empujes', req: { kind: 'reps', ex: 'incline_pushup', n: 10 } },
      { id: 'push2', name: 'Flexión sólida', req: { kind: 'reps', ex: 'pushup', n: 10 } },
      { id: 'push3', name: 'Motor de flexiones', req: { kind: 'reps', ex: 'pushup', n: 25 } },
      { id: 'push4', name: 'Fondista', req: { kind: 'reps', ex: 'dips', n: 10 } },
      { id: 'push5', name: 'Diamante', req: { kind: 'reps', ex: 'diamond_pushup', n: 15 } },
      { id: 'push6', name: 'Arquero', req: { kind: 'reps', ex: 'archer_pushup', n: 6 } },
      { id: 'push7', name: 'Flexión a una mano', req: { kind: 'reps', ex: 'one_arm_pushup', n: 1 } },
    ]),
  },
  {
    id: 'pull', name: 'Tracción', disc: 'cali', icon: 'pull',
    nodes: chain([
      { id: 'pull1', name: 'Agarre de hierro', req: { kind: 'hold', ex: 'dead_hang', s: 30 } },
      { id: 'pull2', name: 'Remo australiano', req: { kind: 'reps', ex: 'aus_row', n: 10 } },
      { id: 'pull3', name: 'Negativas controladas', req: { kind: 'reps', ex: 'neg_pullup', n: 5 } },
      { id: 'pull4', name: 'Primera dominada', req: { kind: 'reps', ex: ['pullup', 'chinup'], n: 1 } },
      { id: 'pull5', name: 'Dominador', req: { kind: 'reps', ex: 'pullup', n: 8 } },
      { id: 'pull6', name: 'Quince limpias', req: { kind: 'reps', ex: 'pullup', n: 15 } },
      { id: 'pull7', name: 'Muscle-up', req: { kind: 'reps', ex: 'muscle_up', n: 1 } },
      { id: 'pull8', name: 'Serie de muscle-ups', req: { kind: 'reps', ex: 'muscle_up', n: 5 } },
    ]),
  },
  {
    id: 'legs', name: 'Piernas', disc: 'cali', icon: 'legs',
    nodes: chain([
      { id: 'legs1', name: 'Base firme', req: { kind: 'reps', ex: 'bw_squat', n: 20 } },
      { id: 'legs2', name: 'Paso de guerrero', req: { kind: 'reps', ex: 'lunge', n: 20 } },
      { id: 'legs3', name: 'Búlgara', req: { kind: 'reps', ex: 'bulgarian', n: 10 } },
      { id: 'legs4', name: 'Isquios de acero', req: { kind: 'reps', ex: 'nordic', n: 3 } },
      { id: 'legs5', name: 'Primera pistol', req: { kind: 'reps', ex: 'pistol', n: 1 } },
      { id: 'legs6', name: 'Maestro de la pistol', req: { kind: 'reps', ex: 'pistol', n: 8 } },
    ]),
  },
  {
    id: 'core', name: 'Core', disc: 'cali', icon: 'core',
    nodes: chain([
      { id: 'core1', name: 'Plancha de un minuto', req: { kind: 'hold', ex: 'plank', s: 60 } },
      { id: 'core2', name: 'Hollow', req: { kind: 'hold', ex: 'hollow', s: 30 } },
      { id: 'core3', name: 'Piernas al cielo', req: { kind: 'reps', ex: 'hanging_leg_raise', n: 10 } },
      { id: 'core4', name: 'L-sit', req: { kind: 'hold', ex: 'lsit', s: 10 } },
      { id: 'core5', name: 'L-sit sostenido', req: { kind: 'hold', ex: 'lsit', s: 30 } },
      { id: 'core6', name: 'Dragon flag', req: { kind: 'reps', ex: 'dragon_flag', n: 5 } },
    ]),
  },
  {
    id: 'statics', name: 'Estáticos y equilibrio', disc: 'cali', icon: 'handstand',
    nodes: chain([
      { id: 'st1', name: 'Pino contra la pared', req: { kind: 'hold', ex: 'wall_handstand', s: 30 } },
      { id: 'st2', name: 'Hombros de pike', req: { kind: 'reps', ex: 'pike_pushup', n: 10 } },
      { id: 'st3', name: 'Pino libre', req: { kind: 'hold', ex: 'handstand', s: 10 } },
      { id: 'st4', name: 'Flexión en pino', req: { kind: 'reps', ex: 'hspu', n: 5 } },
      { id: 'st5', name: 'Tuck front lever', req: { kind: 'hold', ex: 'tuck_fl', s: 10 } },
      { id: 'st6', name: 'Tuck avanzado', req: { kind: 'hold', ex: 'adv_tuck_fl', s: 10 } },
      { id: 'st7', name: 'Straddle front lever', req: { kind: 'hold', ex: 'straddle_fl', s: 5 } },
      { id: 'st8', name: 'Front lever', req: { kind: 'hold', ex: 'front_lever', s: 5 } },
    ]),
  },

  // ---------------------------------------------------------------- gimnasio
  {
    id: 'bench_t', name: 'Press de banca', disc: 'gym', icon: 'bench',
    nodes: chain([
      { id: 'bp1', name: 'Medio cuerpo', req: { kind: 'ratio', ex: 'bench', r: 0.5 } },
      { id: 'bp2', name: 'Tres cuartos', req: { kind: 'ratio', ex: 'bench', r: 0.75 } },
      { id: 'bp3', name: 'Tu propio peso', req: { kind: 'ratio', ex: 'bench', r: 1 } },
      { id: 'bp4', name: 'Pecho de acero', req: { kind: 'ratio', ex: 'bench', r: 1.25 } },
      { id: 'bp5', name: 'Uno y medio', req: { kind: 'ratio', ex: 'bench', r: 1.5 } },
    ]),
  },
  {
    id: 'squat_t', name: 'Sentadilla', disc: 'gym', icon: 'squat',
    nodes: chain([
      { id: 'sq1', name: 'Primeros discos', req: { kind: 'ratio', ex: 'squat', r: 0.75 } },
      { id: 'sq2', name: 'Tu propio peso', req: { kind: 'ratio', ex: 'squat', r: 1 } },
      { id: 'sq3', name: 'Piernas fuertes', req: { kind: 'ratio', ex: 'squat', r: 1.5 } },
      { id: 'sq4', name: 'Pilares', req: { kind: 'ratio', ex: 'squat', r: 1.75 } },
      { id: 'sq5', name: 'Doble peso corporal', req: { kind: 'ratio', ex: 'squat', r: 2 } },
    ]),
  },
  {
    id: 'dead_t', name: 'Peso muerto', disc: 'gym', icon: 'deadlift',
    nodes: chain([
      { id: 'dl1', name: 'Despegue', req: { kind: 'ratio', ex: 'deadlift', r: 1 } },
      { id: 'dl2', name: 'Uno y medio', req: { kind: 'ratio', ex: 'deadlift', r: 1.5 } },
      { id: 'dl3', name: 'Doble peso corporal', req: { kind: 'ratio', ex: 'deadlift', r: 2 } },
      { id: 'dl4', name: 'Espalda de titán', req: { kind: 'ratio', ex: 'deadlift', r: 2.25 } },
      { id: 'dl5', name: 'Arrancatierras', req: { kind: 'ratio', ex: 'deadlift', r: 2.5 } },
    ]),
  },
  {
    id: 'ohp_t', name: 'Press militar', disc: 'gym', icon: 'ohp',
    nodes: chain([
      { id: 'oh1', name: 'Sobre la cabeza', req: { kind: 'ratio', ex: 'ohp', r: 0.35 } },
      { id: 'oh2', name: 'Hombros firmes', req: { kind: 'ratio', ex: 'ohp', r: 0.5 } },
      { id: 'oh3', name: 'Dos tercios', req: { kind: 'ratio', ex: 'ohp', r: 0.65 } },
      { id: 'oh4', name: 'Atlas', req: { kind: 'ratio', ex: 'ohp', r: 0.8 } },
      { id: 'oh5', name: 'Tu peso al cielo', req: { kind: 'ratio', ex: 'ohp', r: 1 } },
    ]),
  },
  {
    id: 'row_t', name: 'Remo con barra', disc: 'gym', icon: 'row',
    nodes: chain([
      { id: 'rw1', name: 'Espalda activa', req: { kind: 'ratio', ex: 'row', r: 0.5 } },
      { id: 'rw2', name: 'Tres cuartos', req: { kind: 'ratio', ex: 'row', r: 0.75 } },
      { id: 'rw3', name: 'Tu propio peso', req: { kind: 'ratio', ex: 'row', r: 1 } },
      { id: 'rw4', name: 'Espalda de remero', req: { kind: 'ratio', ex: 'row', r: 1.25 } },
    ]),
  },

  // ---------------------------------------------------------------- cardio
  {
    id: 'running', name: 'Carrera', disc: 'cardio', icon: 'run',
    nodes: chain([
      { id: 'run1', name: 'Primer kilómetro', req: { kind: 'distance', ex: 'run', km: 1 } },
      { id: 'run2', name: '3 km', req: { kind: 'distance', ex: 'run', km: 3 } },
      { id: 'run3', name: '5 km', req: { kind: 'distance', ex: 'run', km: 5 } },
      { id: 'run4', name: '5 km en menos de 30 min', req: { kind: 'pace', ex: 'run', km: 5, min: 30 } },
      { id: 'run5', name: '10 km', req: { kind: 'distance', ex: 'run', km: 10 } },
      { id: 'run6', name: '5 km en menos de 25 min', req: { kind: 'pace', ex: 'run', km: 5, min: 25 } },
      { id: 'run7', name: '10 km en menos de 50 min', req: { kind: 'pace', ex: 'run', km: 10, min: 50 } },
      { id: 'run8', name: 'Media maratón', req: { kind: 'distance', ex: 'run', km: 21.1 } },
      { id: 'run9', name: 'Maratón', req: { kind: 'distance', ex: 'run', km: 42.2 }, xp: 2000 },
    ]),
  },
  {
    id: 'cycling', name: 'Ciclismo', disc: 'cardio', icon: 'bike',
    nodes: chain([
      { id: 'bk1', name: '10 km', req: { kind: 'distance', ex: 'bike', km: 10 } },
      { id: 'bk2', name: '25 km', req: { kind: 'distance', ex: 'bike', km: 25 } },
      { id: 'bk3', name: '50 km', req: { kind: 'distance', ex: 'bike', km: 50 } },
      { id: 'bk4', name: '100 km', req: { kind: 'distance', ex: 'bike', km: 100 } },
    ]),
  },
  {
    id: 'swimming', name: 'Natación', disc: 'cardio', icon: 'swim',
    nodes: chain([
      { id: 'sw1', name: '500 m', req: { kind: 'distance', ex: 'swim', km: 0.5 } },
      { id: 'sw2', name: '1 km', req: { kind: 'distance', ex: 'swim', km: 1 } },
      { id: 'sw3', name: '2 km', req: { kind: 'distance', ex: 'swim', km: 2 } },
      { id: 'sw4', name: '3,8 km (Ironman)', req: { kind: 'distance', ex: 'swim', km: 3.8 } },
    ]),
  },

  // ---------------------------------------------------------------- HIIT
  {
    id: 'metcon', name: 'Metcon', disc: 'hiit', icon: 'bolt',
    nodes: chain([
      { id: 'mc1', name: 'Burpees x10', req: { kind: 'reps', ex: 'burpee', n: 10 } },
      { id: 'mc2', name: 'Cuerda 5 minutos', req: { kind: 'duration', ex: 'jump_rope', min: 5 } },
      { id: 'mc3', name: 'Burpees x25', req: { kind: 'reps', ex: 'burpee', n: 25 } },
      { id: 'mc4', name: 'Piernas explosivas', req: { kind: 'reps', ex: 'jump_squat', n: 30 } },
      { id: 'mc5', name: 'Burpees x50', req: { kind: 'reps', ex: 'burpee', n: 50 } },
      { id: 'mc6', name: 'Veterano del HIIT', req: { kind: 'sessions', disc: 'hiit', n: 25 } },
    ]),
  },

  // ---------------------------------------------------------------- movilidad
  {
    id: 'flex', name: 'Flexibilidad', disc: 'mov', icon: 'lotus',
    nodes: chain([
      { id: 'fx1', name: 'Tocar los pies', req: { kind: 'hold', ex: 'toe_touch', s: 20 } },
      { id: 'fx2', name: 'Sentadilla profunda', req: { kind: 'hold', ex: 'deep_squat', s: 60 } },
      { id: 'fx3', name: 'Media hora de yoga', req: { kind: 'duration', ex: 'yoga', min: 30 } },
      { id: 'fx4', name: 'Puente', req: { kind: 'hold', ex: 'bridge', s: 20 } },
      { id: 'fx5', name: 'Pancake', req: { kind: 'hold', ex: 'pancake', s: 60 } },
      { id: 'fx6', name: 'Split completo', req: { kind: 'hold', ex: 'split', s: 30 } },
    ]),
  },
  {
    id: 'mindful', name: 'Constancia zen', disc: 'mov', icon: 'calm',
    nodes: chain([
      { id: 'mf1', name: 'Primer respiro', req: { kind: 'sessions', disc: 'mov', n: 3 } },
      { id: 'mf2', name: 'Hábito', req: { kind: 'sessions', disc: 'mov', n: 12 } },
      { id: 'mf3', name: 'Cuerpo libre', req: { kind: 'sessions', disc: 'mov', n: 30 } },
      { id: 'mf4', name: 'Maestro del movimiento', req: { kind: 'sessions', disc: 'mov', n: 75 } },
    ]),
  },
];

export const SKILL_BY_ID = Object.fromEntries(
  SKILL_TREES.flatMap(t => t.nodes.map((n, i) => [n.id, { ...n, tree: t, prev: t.nodes[i - 1] || null }]))
);
