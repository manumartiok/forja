// Biblioteca de ejercicios.
//
// type:
//   weight  → peso (kg) × repeticiones
//   bw      → repeticiones con el peso corporal (+ lastre opcional)
//   hold    → isométrico, segundos
//   cardio  → minutos + distancia (km) opcional
//   time    → minutos (movilidad, yoga, circuitos)
// attrs: reparto de la XP entre atributos (fue, res, mov, agi)
// bwf: fracción del peso corporal que se mueve (ejercicios con peso corporal)
// diff: multiplicador de dificultad (peso corporal / isométricos)
// met: intensidad aproximada (cardio / tiempo)

export const DISCIPLINES = {
  gym: { name: 'Gimnasio', short: 'Gym', icon: 'dumbbell' },
  cali: { name: 'Calistenia', short: 'Calistenia', icon: 'rings' },
  cardio: { name: 'Cardio', short: 'Cardio', icon: 'run' },
  hiit: { name: 'HIIT / Funcional', short: 'HIIT', icon: 'bolt' },
  mov: { name: 'Movilidad / Yoga', short: 'Movilidad', icon: 'lotus' },
};

const E = (id, name, disc, type, attrs, extra = {}) => ({ id, name, disc, type, attrs, ...extra });

const STR = { fue: 0.8, res: 0.2 };
const STR_LEGS = { fue: 0.75, res: 0.2, mov: 0.05 };
const ISO = { fue: 0.6, res: 0.2, agi: 0.2 };

export const EXERCISES = [
  // ---------------------------------------------------------------- gimnasio
  E('bench', 'Press de banca', ['gym'], 'weight', STR, { muscles: ['pecho', 'tríceps', 'hombro'] }),
  E('db_bench', 'Press con mancuernas', ['gym'], 'weight', STR, { muscles: ['pecho', 'tríceps'] }),
  E('incline_db', 'Press inclinado con mancuernas', ['gym'], 'weight', STR, { muscles: ['pecho', 'hombro'] }),
  E('ohp', 'Press militar', ['gym'], 'weight', STR, { muscles: ['hombro', 'tríceps'] }),
  E('lat_raise', 'Elevaciones laterales', ['gym'], 'weight', STR, { muscles: ['hombro'] }),
  E('fly', 'Aperturas / pec deck', ['gym'], 'weight', STR, { muscles: ['pecho'] }),
  E('squat', 'Sentadilla con barra', ['gym'], 'weight', STR_LEGS, { muscles: ['cuádriceps', 'glúteos'] }),
  E('front_squat', 'Sentadilla frontal', ['gym'], 'weight', STR_LEGS, { muscles: ['cuádriceps', 'core'] }),
  E('deadlift', 'Peso muerto', ['gym'], 'weight', STR_LEGS, { muscles: ['espalda', 'isquios', 'glúteos'] }),
  E('rdl', 'Peso muerto rumano', ['gym'], 'weight', { fue: 0.7, res: 0.15, mov: 0.15 }, { muscles: ['isquios', 'glúteos'] }),
  E('hip_thrust', 'Hip thrust', ['gym'], 'weight', STR_LEGS, { muscles: ['glúteos'] }),
  E('leg_press', 'Prensa de piernas', ['gym'], 'weight', STR_LEGS, { muscles: ['cuádriceps', 'glúteos'] }),
  E('db_lunge', 'Zancadas con mancuernas', ['gym'], 'weight', { fue: 0.6, res: 0.2, agi: 0.2 }, { muscles: ['cuádriceps', 'glúteos'] }),
  E('leg_ext', 'Extensión de cuádriceps', ['gym'], 'weight', STR, { muscles: ['cuádriceps'] }),
  E('leg_curl', 'Curl femoral', ['gym'], 'weight', STR, { muscles: ['isquios'] }),
  E('calf', 'Elevación de gemelos', ['gym'], 'weight', STR, { muscles: ['gemelos'] }),
  E('row', 'Remo con barra', ['gym'], 'weight', STR, { muscles: ['espalda', 'bíceps'] }),
  E('db_row', 'Remo con mancuerna', ['gym'], 'weight', STR, { muscles: ['espalda', 'bíceps'] }),
  E('lat_pull', 'Jalón al pecho', ['gym'], 'weight', STR, { muscles: ['espalda', 'bíceps'] }),
  E('cable_row', 'Remo en polea', ['gym'], 'weight', STR, { muscles: ['espalda'] }),
  E('face_pull', 'Face pull', ['gym'], 'weight', { fue: 0.6, res: 0.2, mov: 0.2 }, { muscles: ['hombro', 'espalda'] }),
  E('curl', 'Curl de bíceps', ['gym'], 'weight', STR, { muscles: ['bíceps'] }),
  E('hammer', 'Curl martillo', ['gym'], 'weight', STR, { muscles: ['bíceps', 'antebrazo'] }),
  E('triceps_push', 'Extensión de tríceps en polea', ['gym'], 'weight', STR, { muscles: ['tríceps'] }),
  E('skull', 'Press francés', ['gym'], 'weight', STR, { muscles: ['tríceps'] }),
  E('cable_crunch', 'Crunch en polea', ['gym'], 'weight', { fue: 0.6, res: 0.4 }, { muscles: ['core'] }),

  // ---------------------------------------------------------------- calistenia
  E('incline_pushup', 'Flexiones inclinadas', ['cali'], 'bw', STR, { bwf: 0.45, diff: 0.8, muscles: ['pecho', 'tríceps'] }),
  E('pushup', 'Flexiones', ['cali', 'hiit'], 'bw', STR, { bwf: 0.65, diff: 1, muscles: ['pecho', 'tríceps'] }),
  E('decline_pushup', 'Flexiones declinadas', ['cali'], 'bw', STR, { bwf: 0.72, diff: 1.1, muscles: ['pecho', 'hombro'] }),
  E('diamond_pushup', 'Flexiones diamante', ['cali'], 'bw', STR, { bwf: 0.65, diff: 1.2, muscles: ['tríceps', 'pecho'] }),
  E('archer_pushup', 'Flexiones arquero', ['cali'], 'bw', { fue: 0.7, agi: 0.3 }, { bwf: 0.8, diff: 1.6, muscles: ['pecho', 'tríceps'] }),
  E('one_arm_pushup', 'Flexión a una mano', ['cali'], 'bw', { fue: 0.6, agi: 0.4 }, { bwf: 0.85, diff: 2.6, muscles: ['pecho', 'core'] }),
  E('pike_pushup', 'Flexiones pike', ['cali'], 'bw', { fue: 0.75, agi: 0.25 }, { bwf: 0.6, diff: 1.3, muscles: ['hombro', 'tríceps'] }),
  E('hspu', 'Flexión en pino contra la pared', ['cali'], 'bw', { fue: 0.6, agi: 0.4 }, { bwf: 0.95, diff: 2.4, muscles: ['hombro', 'tríceps'] }),
  E('dips', 'Fondos en paralelas', ['cali', 'gym'], 'bw', STR, { bwf: 0.95, diff: 1.3, muscles: ['tríceps', 'pecho'] }),
  E('bench_dips', 'Fondos en banco', ['cali'], 'bw', STR, { bwf: 0.5, diff: 0.8, muscles: ['tríceps'] }),
  E('aus_row', 'Remo australiano', ['cali'], 'bw', STR, { bwf: 0.55, diff: 0.9, muscles: ['espalda', 'bíceps'] }),
  E('neg_pullup', 'Dominadas negativas', ['cali'], 'bw', STR, { bwf: 0.8, diff: 1.0, muscles: ['espalda', 'bíceps'] }),
  E('pullup', 'Dominadas', ['cali', 'gym'], 'bw', STR, { bwf: 1, diff: 1.5, muscles: ['espalda', 'bíceps'] }),
  E('chinup', 'Dominadas supinas', ['cali', 'gym'], 'bw', STR, { bwf: 1, diff: 1.4, muscles: ['bíceps', 'espalda'] }),
  E('muscle_up', 'Muscle-up', ['cali'], 'bw', { fue: 0.6, agi: 0.4 }, { bwf: 1, diff: 3, muscles: ['espalda', 'pecho', 'tríceps'] }),
  E('bw_squat', 'Sentadilla (peso corporal)', ['cali', 'hiit'], 'bw', { fue: 0.5, res: 0.4, mov: 0.1 }, { bwf: 0.6, diff: 0.7, muscles: ['cuádriceps', 'glúteos'] }),
  E('lunge', 'Zancadas', ['cali', 'hiit'], 'bw', { fue: 0.5, res: 0.3, agi: 0.2 }, { bwf: 0.6, diff: 0.8, muscles: ['cuádriceps', 'glúteos'] }),
  E('bulgarian', 'Sentadilla búlgara', ['cali', 'gym'], 'bw', { fue: 0.7, agi: 0.2, mov: 0.1 }, { bwf: 0.8, diff: 1.3, muscles: ['cuádriceps', 'glúteos'] }),
  E('pistol', 'Pistol squat', ['cali'], 'bw', { fue: 0.55, agi: 0.3, mov: 0.15 }, { bwf: 0.9, diff: 2.4, muscles: ['cuádriceps', 'glúteos'] }),
  E('glute_bridge', 'Puente de glúteos', ['cali', 'mov'], 'bw', { fue: 0.6, mov: 0.4 }, { bwf: 0.5, diff: 0.6, muscles: ['glúteos'] }),
  E('nordic', 'Nordic curl', ['cali'], 'bw', STR, { bwf: 0.7, diff: 2.2, muscles: ['isquios'] }),
  E('hanging_leg_raise', 'Elevaciones de piernas colgado', ['cali', 'gym'], 'bw', { fue: 0.6, agi: 0.4 }, { bwf: 0.35, diff: 1.6, muscles: ['core'] }),
  E('dragon_flag', 'Dragon flag', ['cali'], 'bw', { fue: 0.6, agi: 0.4 }, { bwf: 0.6, diff: 3, muscles: ['core'] }),
  E('plank', 'Plancha', ['cali', 'hiit', 'gym'], 'hold', { fue: 0.4, res: 0.6 }, { diff: 0.8, muscles: ['core'] }),
  E('side_plank', 'Plancha lateral', ['cali', 'hiit'], 'hold', { fue: 0.4, res: 0.4, agi: 0.2 }, { diff: 0.9, muscles: ['core', 'oblicuos'] }),
  E('hollow', 'Hollow hold', ['cali'], 'hold', ISO, { diff: 1.2, muscles: ['core'] }),
  E('dead_hang', 'Colgarse de la barra', ['cali', 'gym'], 'hold', { fue: 0.5, res: 0.4, mov: 0.1 }, { diff: 0.7, muscles: ['antebrazo', 'espalda'] }),
  E('lsit', 'L-sit', ['cali'], 'hold', { fue: 0.5, agi: 0.3, mov: 0.2 }, { diff: 2.5, muscles: ['core', 'tríceps'] }),
  E('wall_handstand', 'Pino contra la pared', ['cali'], 'hold', { fue: 0.4, agi: 0.6 }, { diff: 1.4, muscles: ['hombro', 'core'] }),
  E('handstand', 'Pino libre', ['cali'], 'hold', { fue: 0.2, agi: 0.8 }, { diff: 3, muscles: ['hombro', 'core'] }),
  E('tuck_fl', 'Tuck front lever', ['cali'], 'hold', { fue: 0.6, agi: 0.4 }, { diff: 2.4, muscles: ['espalda', 'core'] }),
  E('adv_tuck_fl', 'Front lever tuck avanzado', ['cali'], 'hold', { fue: 0.6, agi: 0.4 }, { diff: 3.2, muscles: ['espalda', 'core'] }),
  E('straddle_fl', 'Front lever straddle', ['cali'], 'hold', { fue: 0.6, agi: 0.4 }, { diff: 4.2, muscles: ['espalda', 'core'] }),
  E('front_lever', 'Front lever completo', ['cali'], 'hold', { fue: 0.6, agi: 0.4 }, { diff: 5.5, muscles: ['espalda', 'core'] }),

  // ---------------------------------------------------------------- cardio
  E('run', 'Correr', ['cardio'], 'cardio', { res: 0.85, agi: 0.15 }, { met: 9.5, distance: true }),
  E('walk', 'Caminar', ['cardio'], 'cardio', { res: 0.9, mov: 0.1 }, { met: 3.8, distance: true }),
  E('hike', 'Trekking / senderismo', ['cardio'], 'cardio', { res: 0.8, fue: 0.2 }, { met: 6, distance: true }),
  E('bike', 'Bicicleta', ['cardio'], 'cardio', { res: 0.85, fue: 0.15 }, { met: 7.5, distance: true }),
  E('swim', 'Natación', ['cardio'], 'cardio', { res: 0.75, fue: 0.1, mov: 0.15 }, { met: 8, distance: true }),
  E('rower', 'Remo (ergómetro)', ['cardio', 'gym'], 'cardio', { res: 0.7, fue: 0.3 }, { met: 8.5, distance: true }),
  E('elliptical', 'Elíptica', ['cardio', 'gym'], 'cardio', { res: 1 }, { met: 5.5 }),
  E('stairs', 'Escaladora / escaleras', ['cardio', 'gym'], 'cardio', { res: 0.8, fue: 0.2 }, { met: 8.5 }),
  E('jump_rope', 'Saltar la cuerda', ['cardio', 'hiit'], 'cardio', { res: 0.7, agi: 0.3 }, { met: 11 }),

  // ---------------------------------------------------------------- HIIT / funcional
  E('burpee', 'Burpees', ['hiit'], 'bw', { res: 0.6, fue: 0.25, agi: 0.15 }, { bwf: 0.6, diff: 1.3, muscles: ['cuerpo completo'] }),
  E('jump_squat', 'Sentadilla con salto', ['hiit'], 'bw', { res: 0.5, fue: 0.3, agi: 0.2 }, { bwf: 0.7, diff: 1.0, muscles: ['piernas'] }),
  E('mountain', 'Mountain climbers', ['hiit'], 'bw', { res: 0.7, agi: 0.3 }, { bwf: 0.3, diff: 0.6, muscles: ['core'] }),
  E('jacks', 'Jumping jacks', ['hiit'], 'bw', { res: 0.8, agi: 0.2 }, { bwf: 0.2, diff: 0.4, muscles: ['cuerpo completo'] }),
  E('box_jump', 'Saltos al cajón', ['hiit'], 'bw', { agi: 0.4, fue: 0.3, res: 0.3 }, { bwf: 0.8, diff: 1.2, muscles: ['piernas'] }),
  E('kb_swing', 'Swing con kettlebell', ['hiit', 'gym'], 'weight', { res: 0.5, fue: 0.4, mov: 0.1 }, { muscles: ['glúteos', 'isquios'] }),
  E('thruster', 'Thrusters', ['hiit', 'gym'], 'weight', { fue: 0.5, res: 0.5 }, { muscles: ['piernas', 'hombro'] }),
  E('wall_ball', 'Wall balls', ['hiit'], 'weight', { res: 0.6, fue: 0.4 }, { muscles: ['piernas', 'hombro'] }),
  E('sprints', 'Sprints / intervalos', ['hiit', 'cardio'], 'cardio', { res: 0.6, agi: 0.4 }, { met: 12, distance: true }),
  E('circuit', 'Circuito HIIT', ['hiit'], 'time', { res: 0.7, fue: 0.2, agi: 0.1 }, { met: 9 }),

  // ---------------------------------------------------------------- movilidad / yoga
  E('mobility', 'Movilidad articular', ['mov'], 'time', { mov: 0.9, agi: 0.1 }, { met: 2.5 }),
  E('stretch', 'Estiramientos', ['mov'], 'time', { mov: 1 }, { met: 2.3 }),
  E('yoga', 'Yoga', ['mov'], 'time', { mov: 0.7, agi: 0.2, fue: 0.1 }, { met: 3 }),
  E('foam', 'Foam roller', ['mov'], 'time', { mov: 1 }, { met: 2 }),
  E('deep_squat', 'Sentadilla profunda (sostenida)', ['mov'], 'hold', { mov: 0.9, agi: 0.1 }, { diff: 0.6 }),
  E('bridge', 'Puente (wheel)', ['mov', 'cali'], 'hold', { mov: 0.8, fue: 0.2 }, { diff: 1.2 }),
  E('pancake', 'Pancake / apertura sentado', ['mov'], 'hold', { mov: 1 }, { diff: 0.8 }),
  E('split', 'Split (spagat)', ['mov'], 'hold', { mov: 1 }, { diff: 1.5 }),
  E('toe_touch', 'Tocar la punta de los pies', ['mov'], 'hold', { mov: 1 }, { diff: 0.5 }),
];

export const EX_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

export const TYPE_LABEL = {
  weight: 'Peso × reps',
  bw: 'Repeticiones',
  hold: 'Isométrico',
  cardio: 'Cardio',
  time: 'Tiempo',
};
