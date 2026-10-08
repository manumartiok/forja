// Contenido del juego: atributos, rangos, clases, misiones, logros y rutinas.

// Orden fijo de atributos = orden fijo de colores (paleta validada para daltonismo).
export const ATTRS = [
  { id: 'fue', name: 'Fuerza', short: 'FUE', color: '#3987e5' },
  { id: 'res', name: 'Resistencia', short: 'RES', color: '#d95926' },
  { id: 'mov', name: 'Movilidad', short: 'MOV', color: '#199e70' },
  { id: 'agi', name: 'Agilidad', short: 'AGI', color: '#c98500' },
  { id: 'con', name: 'Constancia', short: 'CON', color: '#d55181' },
];

export const RANKS = [
  { min: 1, name: 'Hierro', title: 'Novato', color: '#9aa3b5', glow: '#6b7488' },
  { min: 5, name: 'Bronce', title: 'Aprendiz', color: '#d08b54', glow: '#8a5530' },
  { min: 10, name: 'Plata', title: 'Combatiente', color: '#cfd8e6', glow: '#7d8ba3' },
  { min: 20, name: 'Oro', title: 'Veterano', color: '#ffc94d', glow: '#b8862b' },
  { min: 35, name: 'Platino', title: 'Élite', color: '#5ee7d8', glow: '#2b9d92' },
  { min: 50, name: 'Diamante', title: 'Maestro', color: '#8fb7ff', glow: '#4a6fd1' },
  { min: 75, name: 'Mítico', title: 'Leyenda', color: '#ff7ad9', glow: '#b33f97' },
];

// La clase depende del atributo dominante (se recalcula a medida que entrenás).
export const CLASSES = {
  fue: { id: 'titan', name: 'Titán', desc: 'La fuerza bruta es tu idioma. Barras, discos y cargas pesadas.', icon: 'dumbbell' },
  res: { id: 'runner', name: 'Corredor', desc: 'Tu arma es el aguante: kilómetros, minutos y pulmones de acero.', icon: 'run' },
  mov: { id: 'monk', name: 'Monje', desc: 'Control, flexibilidad y calma. Tu cuerpo se mueve sin límites.', icon: 'lotus' },
  agi: { id: 'acrobat', name: 'Acróbata', desc: 'Dominás tu propio peso: equilibrio, control y habilidades imposibles.', icon: 'rings' },
  con: { id: 'warrior', name: 'Guerrero', desc: 'Equilibrado y constante. Entrenás de todo y nunca faltás.', icon: 'swords' },
  hybrid: { id: 'warrior', name: 'Guerrero', desc: 'Equilibrado y versátil: ningún desafío te es ajeno.', icon: 'swords' },
};

// Clase inicial según la disciplina principal elegida.
export const START_CLASS = { gym: 'fue', cali: 'agi', cardio: 'res', hiit: 'res', mov: 'mov' };

export const GOALS = {
  strength: 'Ganar fuerza',
  muscle: 'Ganar músculo',
  fat: 'Perder grasa',
  endurance: 'Mejorar resistencia',
  skills: 'Aprender habilidades',
  health: 'Salud y bienestar',
};

export const EXPERIENCE = {
  beginner: 'Principiante (menos de 6 meses)',
  intermediate: 'Intermedio (6 meses a 2 años)',
  advanced: 'Avanzado (más de 2 años)',
};

// ---------------------------------------------------------------- misiones
// metric: qué se mide en el período; target puede escalar con la experiencia.
// disc: disciplinas para las que tiene sentido (vacío = cualquiera).
export const DAILY_QUESTS = [
  { id: 'd_workout', name: 'Completá un entrenamiento', metric: 'sessions', target: 1, xp: 50, disc: [] },
  { id: 'd_sets', name: 'Completá {n} series', metric: 'sets', target: 15, xp: 60, disc: ['gym', 'cali', 'hiit'] },
  { id: 'd_pushups', name: 'Hacé {n} flexiones', metric: 'repsOf', ex: ['incline_pushup', 'pushup', 'decline_pushup', 'diamond_pushup', 'archer_pushup', 'pike_pushup'], target: 50, xp: 70, disc: ['cali', 'hiit'] },
  { id: 'd_squats', name: 'Hacé {n} sentadillas o zancadas', metric: 'repsOf', ex: ['bw_squat', 'jump_squat', 'lunge', 'bulgarian', 'pistol', 'squat', 'front_squat', 'db_lunge'], target: 60, xp: 60, disc: ['cali', 'hiit', 'gym'] },
  { id: 'd_cali_reps', name: 'Sumá {n} repeticiones de calistenia', metric: 'repsDisc', d: 'cali', target: 100, xp: 70, disc: ['cali'] },
  { id: 'd_volume', name: 'Mové {n} kg de volumen', metric: 'volume', target: 3000, xp: 70, disc: ['gym'] },
  { id: 'd_cardio', name: 'Hacé {n} minutos de cardio', metric: 'cardioMin', target: 20, xp: 60, disc: ['cardio', 'hiit'] },
  { id: 'd_distance', name: 'Recorré {n} km', metric: 'distance', target: 3, xp: 60, disc: ['cardio'] },
  { id: 'd_mobility', name: 'Dedicá {n} minutos a la movilidad', metric: 'mobilityMin', target: 10, xp: 50, disc: [] },
  { id: 'd_holds', name: 'Acumulá {n} segundos de isométricos', metric: 'holdSec', target: 90, xp: 50, disc: ['cali', 'mov', 'hiit'] },
  { id: 'd_weigh', name: 'Registrá tu peso', metric: 'weighIns', target: 1, xp: 20, disc: [] },
  { id: 'd_long', name: 'Entrená al menos {n} minutos', metric: 'longestMin', target: 45, xp: 60, disc: [] },
];

export const WEEKLY_QUESTS = [
  { id: 'w_days', name: 'Entrená {n} días esta semana', metric: 'days', target: 'weeklyTarget', xp: 250, disc: [] },
  { id: 'w_volume', name: 'Mové {n} kg en la semana', metric: 'volume', target: 15000, xp: 200, disc: ['gym'] },
  { id: 'w_cali', name: 'Sumá {n} repeticiones de calistenia', metric: 'repsDisc', d: 'cali', target: 500, xp: 200, disc: ['cali'] },
  { id: 'w_cardio', name: 'Hacé {n} minutos de cardio', metric: 'cardioMin', target: 90, xp: 200, disc: ['cardio', 'hiit'] },
  { id: 'w_distance', name: 'Recorré {n} km', metric: 'distance', target: 15, xp: 200, disc: ['cardio'] },
  { id: 'w_mobility', name: 'Dedicá {n} minutos a la movilidad', metric: 'mobilityMin', target: 45, xp: 150, disc: [] },
  { id: 'w_pr', name: 'Batí al menos un récord personal', metric: 'prs', target: 1, xp: 150, disc: [] },
  { id: 'w_new', name: 'Probá un ejercicio nuevo', metric: 'newExercises', target: 1, xp: 100, disc: [] },
  { id: 'w_hiit', name: 'Completá {n} sesiones de HIIT', metric: 'sessionsDisc', d: 'hiit', target: 2, xp: 180, disc: ['hiit'] },
  { id: 'w_weigh', name: 'Registrá tu peso {n} veces', metric: 'weighIns', target: 2, xp: 60, disc: [] },
];

// ---------------------------------------------------------------- logros
// Los logros de nivel no dan XP (evita una dependencia circular con el nivel).
export const ACHIEVEMENTS = [
  { id: 'first', name: 'Primer paso', desc: 'Completá tu primer entrenamiento', icon: 'flag', xp: 100 },
  { id: 's10', name: 'Hábito en marcha', desc: '10 entrenamientos', icon: 'medal', xp: 200 },
  { id: 's50', name: 'Dedicación', desc: '50 entrenamientos', icon: 'medal', xp: 400 },
  { id: 's100', name: 'Centurión', desc: '100 entrenamientos', icon: 'crown', xp: 800 },
  { id: 's250', name: 'Inquebrantable', desc: '250 entrenamientos', icon: 'crown', xp: 1500 },
  { id: 'streak4', name: 'Racha de un mes', desc: '4 semanas seguidas cumpliendo tu objetivo', icon: 'fire', xp: 300 },
  { id: 'streak12', name: 'Racha de hierro', desc: '12 semanas seguidas cumpliendo tu objetivo', icon: 'fire', xp: 800 },
  { id: 'streak26', name: 'Medio año imparable', desc: '26 semanas seguidas cumpliendo tu objetivo', icon: 'fire', xp: 1500 },
  { id: 'early', name: 'Madrugador', desc: 'Empezá un entrenamiento antes de las 7:00', icon: 'sun', xp: 100 },
  { id: 'night', name: 'Búho', desc: 'Empezá un entrenamiento después de las 22:00', icon: 'moon', xp: 100 },
  { id: 'long', name: 'Maratón de hierro', desc: 'Un entrenamiento de 90 minutos o más', icon: 'clock', xp: 150 },
  { id: 'pr1', name: 'Superación', desc: 'Batí tu primer récord personal', icon: 'up', xp: 100 },
  { id: 'pr25', name: 'Rompe récords', desc: '25 récords personales', icon: 'up', xp: 400 },
  { id: 'ex20', name: 'Coleccionista', desc: 'Probá 20 ejercicios distintos', icon: 'grid', xp: 200 },
  { id: 'ton', name: 'Una tonelada', desc: 'Mové 1.000 kg en un entrenamiento', icon: 'weight', xp: 150 },
  { id: 'ton100', name: 'Mueve montañas', desc: 'Acumulá 100.000 kg de volumen total', icon: 'mountain', xp: 600 },
  { id: 'push1000', name: 'Mil flexiones', desc: 'Acumulá 1.000 flexiones', icon: 'push', xp: 400 },
  { id: 'pull500', name: 'Quinientas dominadas', desc: 'Acumulá 500 dominadas', icon: 'pull', xp: 500 },
  { id: 'km100', name: 'Cien kilómetros', desc: 'Acumulá 100 km de cardio', icon: 'run', xp: 500 },
  { id: 'allround', name: 'Todoterreno', desc: 'Entrená las 5 disciplinas', icon: 'star', xp: 300 },
  { id: 'body10', name: 'Bajo control', desc: 'Registrá tu peso 10 veces', icon: 'scale', xp: 150 },
  { id: 'goalw', name: 'Objetivo cumplido', desc: 'Alcanzá tu peso objetivo', icon: 'target', xp: 500 },
  { id: 'skill5', name: 'Aprendiz de habilidades', desc: 'Desbloqueá 5 habilidades', icon: 'spark', xp: 200 },
  { id: 'skill20', name: 'Virtuoso', desc: 'Desbloqueá 20 habilidades', icon: 'spark', xp: 600 },
  { id: 'lvl10', name: 'Nivel 10', desc: 'Alcanzá el nivel 10', icon: 'shield', xp: 0 },
  { id: 'lvl25', name: 'Nivel 25', desc: 'Alcanzá el nivel 25', icon: 'shield', xp: 0 },
  { id: 'lvl50', name: 'Nivel 50', desc: 'Alcanzá el nivel 50', icon: 'shield', xp: 0 },
];

// ---------------------------------------------------------------- rutinas prearmadas
// item: [ejercicio, series, objetivo] (objetivo = reps, segundos o minutos según el tipo)
const R = (id, name, disc, desc, items) => ({
  id, name, disc, desc, builtin: true,
  items: items.map(([ex, sets, target]) => ({ ex, sets, target })),
});

export const BUILTIN_ROUTINES = [
  R('r_fb', 'Full body principiante', 'gym', 'Lo básico para construir fuerza en todo el cuerpo.', [
    ['squat', 3, 10], ['bench', 3, 10], ['row', 3, 10], ['ohp', 3, 10], ['plank', 3, 30],
  ]),
  R('r_push', 'Empuje (push)', 'gym', 'Pecho, hombros y tríceps.', [
    ['bench', 4, 8], ['incline_db', 3, 10], ['ohp', 3, 8], ['lat_raise', 3, 15], ['triceps_push', 3, 12],
  ]),
  R('r_pull', 'Tracción (pull)', 'gym', 'Espalda y bíceps.', [
    ['deadlift', 3, 5], ['lat_pull', 3, 10], ['cable_row', 3, 10], ['face_pull', 3, 15], ['curl', 3, 12],
  ]),
  R('r_legs', 'Piernas', 'gym', 'Cuádriceps, isquios, glúteos y gemelos.', [
    ['squat', 4, 8], ['rdl', 3, 10], ['leg_press', 3, 12], ['leg_curl', 3, 12], ['calf', 4, 15],
  ]),
  R('r_cali1', 'Calistenia básica', 'cali', 'Primeros pasos con tu peso corporal.', [
    ['pushup', 3, 10], ['aus_row', 3, 10], ['bw_squat', 3, 20], ['bench_dips', 3, 10], ['plank', 3, 30],
  ]),
  R('r_cali2', 'Calistenia intermedia', 'cali', 'Dominadas, fondos y core avanzado.', [
    ['pullup', 4, 6], ['dips', 4, 10], ['pike_pushup', 3, 8], ['bulgarian', 3, 10], ['lsit', 3, 10], ['hanging_leg_raise', 3, 10],
  ]),
  R('r_skills', 'Habilidades', 'cali', 'Práctica de pino y front lever.', [
    ['wall_handstand', 4, 30], ['tuck_fl', 4, 10], ['hollow', 3, 30], ['pike_pushup', 3, 8],
  ]),
  R('r_hiit', 'HIIT 20 minutos', 'hiit', 'Intervalos intensos para quemar y ganar aire.', [
    ['burpee', 4, 12], ['jump_squat', 4, 15], ['mountain', 4, 20], ['jacks', 4, 30], ['plank', 4, 30],
  ]),
  R('r_run', 'Carrera', 'cardio', 'Salida a correr: registrá tiempo y distancia.', [['run', 1, 30]]),
  R('r_bike', 'Bicicleta', 'cardio', 'Salida en bici.', [['bike', 1, 45]]),
  R('r_mob', 'Movilidad 15 minutos', 'mov', 'Para días de descanso activo o después de entrenar.', [
    ['mobility', 1, 5], ['stretch', 1, 5], ['deep_squat', 3, 30], ['toe_touch', 2, 30],
  ]),
  R('r_yoga', 'Yoga', 'mov', 'Sesión de yoga libre.', [['yoga', 1, 30]]),
];
