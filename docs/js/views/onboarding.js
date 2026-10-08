// Bienvenida: creación del personaje en 4 pasos.
import { DISCIPLINES } from '../data/exercises.js';
import { GOALS, EXPERIENCE, CLASSES, START_CLASS } from '../data/game.js';
import { store } from '../store.js';
import { icon } from '../icons.js';
import { esc, toast } from '../ui.js';
import { runEvaluate } from '../actions.js';

export function render(root, { done }) {
  const draft = {
    name: '', sex: '', birthDate: '', height: '', weight: '', goalWeight: '',
    disciplines: [], goal: 'strength', experience: 'beginner', weeklyTarget: 3,
  };
  let step = 0;

  const steps = [
    () => `
      <h1>Forjá tu <em>mejor versión</em></h1>
      <p class="lead">Cada serie, cada kilómetro y cada minuto de movilidad te dan experiencia. Subí de nivel, desbloqueá habilidades y cumplí misiones mientras entrenás de verdad.</p>
      <label class="field"><span>¿Cómo te llamamos?</span>
        <input class="input" name="name" maxlength="24" placeholder="Tu nombre o apodo" value="${esc(draft.name)}" autocomplete="nickname"></label>`,
    () => `
      <h1>Tu <em>cuerpo</em></h1>
      <p class="lead">Lo usamos para ajustar la experiencia a tu peso corporal, calcular tu IMC y tu gasto calórico estimado.</p>
      <div class="form-grid">
        <label class="field"><span>Sexo</span>
          <select class="input" name="sex">
            <option value="">Prefiero no decirlo</option>
            <option value="m" ${draft.sex === 'm' ? 'selected' : ''}>Masculino</option>
            <option value="f" ${draft.sex === 'f' ? 'selected' : ''}>Femenino</option>
          </select></label>
        <label class="field"><span>Fecha de nacimiento</span><input class="input" type="date" name="birthDate" value="${esc(draft.birthDate)}" max="${new Date().toISOString().slice(0, 10)}"></label>
        <label class="field"><span>Estatura (cm)</span><input class="input" type="number" inputmode="decimal" name="height" min="120" max="230" placeholder="175" value="${esc(draft.height)}"></label>
        <label class="field"><span>Peso actual (kg)</span><input class="input" type="number" inputmode="decimal" step="0.1" name="weight" min="30" max="300" placeholder="72,5" value="${esc(draft.weight)}"></label>
        <label class="field"><span>Peso objetivo (opcional)</span><input class="input" type="number" inputmode="decimal" step="0.1" name="goalWeight" min="30" max="300" placeholder="—" value="${esc(draft.goalWeight)}"></label>
      </div>`,
    () => `
      <h1>Tu <em>estilo</em></h1>
      <p class="lead">Elegí qué practicás (podés elegir varias). La primera que marques define tu clase inicial; después tu clase evoluciona según cómo entrenes.</p>
      <div class="choice-grid">
        ${Object.entries(DISCIPLINES).map(([id, d]) => {
          const i = draft.disciplines.indexOf(id);
          const cls = CLASSES[START_CLASS[id]];
          return `<button type="button" class="choice ${i >= 0 ? 'on' : ''}" data-disc="${id}" aria-pressed="${i >= 0}">
            ${icon(d.icon)}<b>${d.name}</b><small>Clase: ${cls.name}</small>${i >= 0 ? `<span class="order">${i === 0 ? 'PRINCIPAL' : `#${i + 1}`}</span>` : ''}</button>`;
        }).join('')}
      </div>`,
    () => `
      <h1>Tu <em>misión</em></h1>
      <p class="lead">Con esto ajustamos la dificultad de las misiones y tu objetivo semanal para mantener la racha.</p>
      <div class="form-grid">
        <label class="field"><span>Objetivo principal</span>
          <select class="input" name="goal">${Object.entries(GOALS).map(([k, v]) => `<option value="${k}" ${draft.goal === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Experiencia</span>
          <select class="input" name="experience">${Object.entries(EXPERIENCE).map(([k, v]) => `<option value="${k}" ${draft.experience === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Días por semana</span>
          <select class="input" name="weeklyTarget">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option value="${n}" ${+draft.weeklyTarget === n ? 'selected' : ''}>${n} ${n === 1 ? 'día' : 'días'}</option>`).join('')}</select></label>
      </div>`,
  ];

  const draw = () => {
    root.innerHTML = `
      <section class="onboard">
        <div class="steps" aria-hidden="true">${steps.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
        <form id="ob" novalidate>${steps[step]()}
          <div class="onboard-foot">
            ${step ? '<button type="button" class="btn ghost" data-back>Atrás</button>' : '<span></span>'}
            <button class="btn ${step === steps.length - 1 ? 'gold big' : 'primary'}">${step === steps.length - 1 ? `${icon('spark')} Crear personaje` : 'Siguiente'}</button>
          </div>
        </form>
        <p class="muted" style="font-size:12.5px;margin-top:28px">${icon('lock')} Tus datos se guardan solo en este dispositivo.</p>
      </section>`;
    const first = root.querySelector('input, select');
    if (first) first.focus();
  };

  const collect = () => {
    const f = root.querySelector('#ob');
    for (const el of f.querySelectorAll('input[name], select[name]')) draft[el.name] = el.value.trim();
  };

  const validate = () => {
    if (step === 0 && !draft.name) return 'Ingresá un nombre.';
    if (step === 1) {
      if (!(+draft.height >= 120 && +draft.height <= 230)) return 'Ingresá tu estatura en centímetros (entre 120 y 230).';
      if (!(+draft.weight >= 30 && +draft.weight <= 300)) return 'Ingresá tu peso en kilos (entre 30 y 300).';
    }
    if (step === 2 && !draft.disciplines.length) return 'Elegí al menos una disciplina.';
    return null;
  };

  root.onclick = e => {
    const d = e.target.closest('[data-disc]');
    if (d) {
      const id = d.dataset.disc, i = draft.disciplines.indexOf(id);
      if (i >= 0) draft.disciplines.splice(i, 1);
      else draft.disciplines.push(id);
      return draw();
    }
    if (e.target.closest('[data-back]')) {
      collect();
      step--;
      draw();
    }
  };

  root.onsubmit = e => {
    e.preventDefault();
    collect();
    const err = validate();
    if (err) return toast(err, { kind: 'bad', iconName: 'info' });
    if (step < steps.length - 1) {
      step++;
      return draw();
    }
    const now = new Date().toISOString();
    store.update(s => {
      s.profile = {
        name: draft.name, sex: draft.sex, birthDate: draft.birthDate || null,
        height: +draft.height, goalWeight: +draft.goalWeight || null,
        disciplines: draft.disciplines, goal: draft.goal, experience: draft.experience,
        weeklyTarget: +draft.weeklyTarget, createdAt: now,
      };
      s.bodyLog = [{ date: now, weight: +draft.weight }];
    }, { immediate: true });
    runEvaluate({ silent: true });
    toast(`<b>¡Bienvenido/a, ${esc(draft.name)}!</b><br>Tu aventura empieza en el nivel 1.`, { kind: 'xp', iconName: 'spark' });
    root.onclick = root.onsubmit = null;
    done();
  };

  draw();
  return () => (root.onclick = root.onsubmit = null);
}
