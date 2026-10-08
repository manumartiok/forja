// Entrenar: elegir rutina / entrenamiento libre, y la sesión activa.
import { store } from '../store.js';
import { EXERCISES, DISCIPLINES, TYPE_LABEL } from '../data/exercises.js';
import { BUILTIN_ROUTINES } from '../data/game.js';
import { getExercise, setXP, bodyweightAt, sessionStats } from '../engine.js';
import { icon } from '../icons.js';
import { esc, nf, fmtClock, modal, confirmDialog, toast } from '../ui.js';
import {
  startSession, cancelSession, finishSession, newExerciseItem, lastPerformance, deleteRoutine, addCustomExercise, fmtSet,
} from '../actions.js';
import { startRest, stop as stopRest } from '../rest.js';

export function render(root, ctx) {
  return store.get().activeSession ? renderSession(root, ctx) : renderPicker(root, ctx);
}

// ---------------------------------------------------------------- selector
function renderPicker(root, { state, rerender }) {
  let filter = 'all';
  const mine = state.profile.disciplines;

  const routineCard = (r, own) => `
    <div class="routine-wrap">
      <button class="routine" data-routine="${esc(r.id)}">
        <div class="row">${r.disc ? `<span class="chip primary">${icon(DISCIPLINES[r.disc].icon)} ${DISCIPLINES[r.disc].short}</span>` : '<span class="chip xp">Propia</span>'}</div>
        <h3>${esc(r.name)}</h3><p>${esc(r.desc || '')}</p>
        <div class="exlist">${r.items.map(it => esc((getExercise(state, it.ex) || {}).name || it.ex)).join(' · ')}</div>
      </button>
      ${own ? `<button class="icon-btn danger del" data-del-routine="${esc(r.id)}" aria-label="Borrar rutina ${esc(r.name)}">${icon('trash')}</button>` : ''}
    </div>`;

  const draw = () => {
    const builtins = BUILTIN_ROUTINES
      .filter(r => filter === 'all' || r.disc === filter)
      .sort((a, b) => (mine.includes(b.disc) ? 1 : 0) - (mine.includes(a.disc) ? 1 : 0));
    root.innerHTML = `
      <header class="page-head"><div><h1>Entrenar</h1><p>Elegí una rutina o arrancá libre. Cada serie completada suma XP.</p></div></header>
      <button class="cta" data-free style="margin-bottom:24px">${icon('plus')}<div><b>Entrenamiento libre</b><span>Agregá los ejercicios que quieras sobre la marcha</span></div></button>
      ${state.routines.length ? `<h2 class="card-title">${icon('star')} Mis rutinas</h2><div class="routine-grid" style="margin-bottom:26px">${state.routines.map(r => routineCard(r, true)).join('')}</div>` : ''}
      <div class="row" style="margin-bottom:14px"><h2 class="card-title" style="margin:0">${icon('grid')} Rutinas</h2><span class="spacer"></span>
        <div class="chips">${[['all', 'Todas'], ...Object.entries(DISCIPLINES).map(([k, d]) => [k, d.short])]
          .map(([k, l]) => `<button class="chip filter-chip ${filter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}</div></div>
      <div class="routine-grid">${builtins.map(r => routineCard(r, false)).join('') || '<div class="empty">No hay rutinas para este filtro.</div>'}</div>`;
  };

  root.onclick = async e => {
    const f = e.target.closest('[data-filter]');
    if (f) { filter = f.dataset.filter; return draw(); }
    if (e.target.closest('[data-free]')) { startSession(); return rerender(); }
    const del = e.target.closest('[data-del-routine]');
    if (del) {
      if (await confirmDialog('La rutina se va a borrar. Tus entrenamientos registrados no se tocan.', { ok: 'Borrar', danger: true })) {
        deleteRoutine(del.dataset.delRoutine);
        state = store.get();
        draw();
      }
      return;
    }
    const r = e.target.closest('[data-routine]');
    if (r) {
      const routine = [...state.routines, ...BUILTIN_ROUTINES].find(x => x.id === r.dataset.routine);
      const ok = await modal({
        title: routine.name,
        body: `<p class="muted">${esc(routine.desc || '')}</p><table class="data"><thead><tr><th>Ejercicio</th><th>Series</th><th>Objetivo</th></tr></thead><tbody>
          ${routine.items.map(it => {
            const ex = getExercise(state, it.ex) || { name: it.ex, type: 'bw' };
            const unit = { weight: 'reps', bw: 'reps', hold: 's', cardio: 'min', time: 'min' }[ex.type];
            return `<tr><td>${esc(ex.name)}</td><td>${it.sets}</td><td>${it.target ? `${it.target} ${unit}` : '—'}</td></tr>`;
          }).join('')}</tbody></table>`,
        actions: [{ label: 'Cancelar', value: false }, { label: `${icon('play')} Empezar`, kind: 'primary', value: true }],
      });
      if (ok) { startSession({ routine }); rerender(); }
    }
  };
  draw();
  return () => (root.onclick = null);
}

// ---------------------------------------------------------------- sesión activa
const FIELDS = {
  weight: [['kg', 'Kg', 0.5], ['reps', 'Reps', 1]],
  bw: [['reps', 'Reps', 1], ['kg', '+Kg', 0.5]],
  hold: [['sec', 'Segundos', 1]],
  cardio: [['min', 'Minutos', 1], ['km', 'Km', 0.01]],
  time: [['min', 'Minutos', 1]],
};
const MAIN_FIELD = { weight: 'reps', bw: 'reps', hold: 'sec', cardio: 'min', time: 'min' };

function renderSession(root, { rerender }) {
  const S = () => store.get();
  const A = () => S().activeSession;
  let timer;

  const fieldsFor = ex => (ex.type === 'cardio' && !ex.distance ? FIELDS.cardio.slice(0, 1) : FIELDS[ex.type]);

  const setRow = (ex, i, j, set, bw) => {
    const xp = set.done ? Math.round(setXP(ex, set, bw)) : 0;
    return `<tr class="${set.done ? 'done' : ''}" data-row="${i}-${j}">
      <td>${j + 1}</td>
      ${fieldsFor(ex).map(([f, label, step]) => `<td><input type="number" inputmode="decimal" min="0" step="${step}" aria-label="${label} serie ${j + 1}"
        data-i="${i}" data-j="${j}" data-f="${f}" value="${esc(set[f] ?? '')}" placeholder="${f === 'kg' && ex.type === 'bw' ? '0' : '—'}"></td>`).join('')}
      <td><button class="check-btn" data-check="${i}-${j}" aria-label="${set.done ? 'Desmarcar' : 'Completar'} serie ${j + 1}" aria-pressed="${set.done}">${icon('check')}</button><span class="set-xp">${xp ? `+${xp}` : ''}</span></td>
      <td><button class="icon-btn danger" data-del-set="${i}-${j}" aria-label="Borrar serie ${j + 1}">${icon('minus')}</button></td>
    </tr>`;
  };

  const exCard = (item, i) => {
    const s = S();
    const ex = getExercise(s, item.ex);
    if (!ex) return '';
    const bw = bodyweightAt(s, new Date());
    const prev = lastPerformance(s, item.ex);
    return `<section class="card ex-card" data-card="${i}">
      <div class="ex-head"><h3>${esc(ex.name)}</h3><span class="chip">${TYPE_LABEL[ex.type]}</span>
        <button class="icon-btn danger" data-del-ex="${i}" aria-label="Quitar ejercicio">${icon('trash')}</button></div>
      ${prev ? `<div class="ex-prev">Anterior: ${prev.map(x => esc(fmtSet(ex, x))).join(' · ')}</div>` : '<div class="ex-prev">Primera vez: ¡nuevo ejercicio!</div>'}
      <table class="sets"><thead><tr><th>Serie</th>${fieldsFor(ex).map(([, l]) => `<th>${l}</th>`).join('')}<th>Hecha</th><th></th></tr></thead>
        <tbody>${item.sets.map((set, j) => setRow(ex, i, j, set, bw)).join('')}</tbody></table>
      <button class="btn small ghost" data-add-set="${i}">${icon('plus')} Serie</button>
    </section>`;
  };

  const liveStats = () => {
    const a = A();
    const st = sessionStats(S(), { ...a, duration: 0 });
    const bw = bodyweightAt(S(), new Date());
    let xp = 0;
    for (const it of a.exercises) {
      const ex = getExercise(S(), it.ex);
      for (const set of it.sets) xp += setXP(ex, set, bw);
    }
    return `<span><b>${st.sets}</b> series</span>${st.volume ? `<span><b>${nf(st.volume)}</b> kg</span>` : ''}<span><b style="color:var(--xp)">+${nf(xp)}</b> XP</span>`;
  };

  const draw = () => {
    const a = A();
    root.innerHTML = `
      <div class="session-head">
        <div class="title"><input class="name" value="${esc(a.name)}" data-name aria-label="Nombre del entrenamiento" maxlength="40">
          <div class="live-stats" id="live">${liveStats()}</div></div>
        <div class="clock" id="clock" aria-label="Tiempo transcurrido">${fmtClock((Date.now() - new Date(a.start)) / 1000)}</div>
        <button class="btn ghost small" data-cancel>${icon('x')} Descartar</button>
        <button class="btn gold" data-finish>${icon('flag')} Terminar</button>
      </div>
      <div id="cards">${a.exercises.map(exCard).join('') || `<div class="card empty">${icon('dumbbell')}<div>Agregá tu primer ejercicio para empezar a sumar XP.</div></div>`}</div>
      <button class="btn primary block big" data-add-ex style="margin-top:16px">${icon('plus')} Agregar ejercicio</button>
      <label class="field" style="margin-top:18px"><span>Notas</span><textarea class="input" data-notes placeholder="Cómo te sentiste, ajustes para la próxima…">${esc(a.notes || '')}</textarea></label>`;
  };

  const redrawCard = i => {
    const el = root.querySelector(`[data-card="${i}"]`);
    if (el) el.outerHTML = exCard(A().exercises[i], i);
    const live = root.querySelector('#live');
    if (live) live.innerHTML = liveStats();
  };

  const upd = fn => store.update(s => fn(s.activeSession));

  root.oninput = e => {
    const t = e.target;
    if (t.dataset.name !== undefined) return upd(a => (a.name = t.value));
    if (t.dataset.notes !== undefined) return upd(a => (a.notes = t.value));
    if (t.dataset.f) {
      const v = t.value === '' ? '' : Math.max(0, +t.value);
      upd(a => (a.exercises[+t.dataset.i].sets[+t.dataset.j][t.dataset.f] = v));
    }
  };

  root.onclick = async e => {
    const b = e.target.closest('button, [data-check]');
    if (!b) return;

    if (b.dataset.check) {
      const [i, j] = b.dataset.check.split('-').map(Number);
      const item = A().exercises[i], ex = getExercise(S(), item.ex), set = item.sets[j];
      const main = MAIN_FIELD[ex.type];
      if (!set.done && !(+set[main] > 0)) {
        return toast(`Completá ${main === 'sec' ? 'los segundos' : main === 'min' ? 'los minutos' : 'las repeticiones'} de la serie.`, { kind: 'bad', iconName: 'info' });
      }
      if (!set.done && ex.type === 'weight' && !(+set.kg > 0)) {
        return toast('Completá el peso de la serie.', { kind: 'bad', iconName: 'info' });
      }
      upd(a => (a.exercises[i].sets[j].done = !set.done));
      redrawCard(i);
      const now = A().exercises[i].sets[j];
      if (now.done && ['weight', 'bw', 'hold'].includes(ex.type) && S().settings.restSec > 0) startRest(S().settings.restSec);
      return;
    }
    if (b.dataset.addSet) {
      const i = +b.dataset.addSet;
      upd(a => {
        const sets = a.exercises[i].sets;
        const last = sets[sets.length - 1] || {};
        sets.push({ ...last, done: false });
      });
      redrawCard(i);
      const inputs = root.querySelectorAll(`[data-card="${i}"] tbody tr:last-child input`);
      if (inputs[0]) inputs[0].focus();
      return;
    }
    if (b.dataset.delSet) {
      const [i, j] = b.dataset.delSet.split('-').map(Number);
      upd(a => a.exercises[i].sets.splice(j, 1));
      if (A().exercises[i].sets.length) redrawCard(i);
      else {
        upd(a => a.exercises.splice(i, 1));
        draw();
      }
      return;
    }
    if (b.dataset.delEx) {
      const i = +b.dataset.delEx;
      const ex = getExercise(S(), A().exercises[i].ex);
      if (await confirmDialog(`¿Quitar ${esc(ex.name)} del entrenamiento?`, { ok: 'Quitar', danger: true })) {
        upd(a => a.exercises.splice(i, 1));
        draw();
      }
      return;
    }
    if (b.dataset.addEx !== undefined) {
      const id = await pickExercise(S());
      if (id) {
        upd(a => a.exercises.push(newExerciseItem(S(), id, { sets: 1 })));
        draw();
        const card = root.querySelector(`[data-card="${A().exercises.length - 1}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (b.dataset.cancel !== undefined) {
      if (await confirmDialog('Se va a descartar este entrenamiento y no vas a recibir su XP.', { ok: 'Descartar', danger: true, title: '¿Descartar entrenamiento?' })) {
        stopRest();
        cancelSession();
        rerender();
      }
      return;
    }
    if (b.dataset.finish !== undefined) return finish();
  };

  async function finish() {
    const a = A();
    const done = a.exercises.reduce((n, it) => n + it.sets.filter(s => s.done).length, 0);
    if (!done) {
      return toast('Completá al menos una serie (botón ✓) para terminar el entrenamiento.', { kind: 'bad', iconName: 'info', ms: 4500 });
    }
    const elapsed = Math.max(1, Math.round((Date.now() - new Date(a.start)) / 60000));
    let feeling = 3;
    const res = await modal({
      title: 'Terminar entrenamiento',
      body: `<p class="muted">${done} ${done === 1 ? 'serie completada' : 'series completadas'}. Las series sin marcar no se guardan.</p>
        <label class="field" style="margin:14px 0"><span>Duración (minutos)</span><input class="input" type="number" min="1" max="600" id="dur" value="${elapsed}"></label>
        <div class="field"><span>¿Cómo te sentiste?</span><div class="chips" id="feel">
          ${['Agotado', 'Duro', 'Bien', 'Muy bien', 'Imparable'].map((l, k) => `<button type="button" class="chip filter-chip ${k + 1 === feeling ? 'on' : ''}" data-feel="${k + 1}">${l}</button>`).join('')}</div></div>`,
      actions: [{ label: 'Seguir entrenando', value: false }, { label: `${icon('flag')} Terminar y cobrar XP`, kind: 'gold', onClick: w => ({ dur: +w.querySelector('#dur').value }) }],
      onMount: w => w.querySelector('#feel').addEventListener('click', e => {
        const c = e.target.closest('[data-feel]');
        if (!c) return;
        feeling = +c.dataset.feel;
        w.querySelectorAll('[data-feel]').forEach(x => x.classList.toggle('on', x === c));
      }),
    });
    if (!res) return;
    stopRest();
    const id = finishSession({ feeling, durationMin: res.dur > 0 ? Math.min(600, res.dur) : null });
    location.hash = `#/resumen/${id}`;
  }

  draw();
  timer = setInterval(() => {
    const c = root.querySelector('#clock');
    if (c && A()) c.textContent = fmtClock((Date.now() - new Date(A().start)) / 1000);
  }, 1000);
  return () => {
    clearInterval(timer);
    root.oninput = root.onclick = null;
  };
}

// ---------------------------------------------------------------- selector de ejercicios
function pickExercise(state) {
  const mine = state.profile.disciplines;
  let filter = 'all', q = '';
  const all = () => [...EXERCISES, ...state.customExercises];
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const list = () => all()
    .filter(e => (filter === 'all' || e.disc.includes(filter)) && norm(e.name).includes(norm(q)))
    .sort((a, b) => (mine.includes(b.disc[0]) ? 1 : 0) - (mine.includes(a.disc[0]) ? 1 : 0) || a.name.localeCompare(b.name))
    .map(e => `<button class="picker-item" data-pick="${esc(e.id)}"><span class="pi">${icon(DISCIPLINES[e.disc[0]].icon)}</span>
      <span><b>${esc(e.name)}</b><small>${DISCIPLINES[e.disc[0]].short} · ${TYPE_LABEL[e.type]}${e.custom ? ' · propio' : ''}</small></span></button>`)
    .join('') || '<div class="empty">No hay ejercicios con ese nombre.</div>';

  return modal({
    title: 'Agregar ejercicio',
    wide: true,
    body: `<input class="input" type="search" id="ex-q" placeholder="Buscar ejercicio…" autocomplete="off">
      <div class="chips" id="ex-f" style="margin-top:12px">${[['all', 'Todos'], ...Object.entries(DISCIPLINES).map(([k, d]) => [k, d.short])]
        .map(([k, l]) => `<button class="chip filter-chip ${k === filter ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <div class="picker-list" id="ex-list">${list()}</div>
      <button class="btn small ghost" id="ex-new" style="margin-top:12px">${icon('plus')} Crear ejercicio propio</button>`,
    onMount: (w, close) => {
      const $list = w.querySelector('#ex-list');
      w.querySelector('#ex-q').addEventListener('input', e => { q = e.target.value; $list.innerHTML = list(); });
      w.querySelector('#ex-f').addEventListener('click', e => {
        const c = e.target.closest('[data-f]');
        if (!c) return;
        filter = c.dataset.f;
        w.querySelectorAll('#ex-f [data-f]').forEach(x => x.classList.toggle('on', x === c));
        $list.innerHTML = list();
      });
      $list.addEventListener('click', e => {
        const p = e.target.closest('[data-pick]');
        if (p) close(p.dataset.pick);
      });
      w.querySelector('#ex-new').addEventListener('click', async () => {
        const created = await modal({
          title: 'Ejercicio propio',
          body: `<div class="stack">
            <label class="field"><span>Nombre</span><input class="input" id="cn" maxlength="40" value="${esc(q)}"></label>
            <label class="field"><span>Tipo</span><select class="input" id="ct">${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
            <label class="field"><span>Disciplina</span><select class="input" id="cd">${Object.entries(DISCIPLINES).map(([k, d]) => `<option value="${k}" ${k === mine[0] ? 'selected' : ''}>${d.name}</option>`).join('')}</select></label></div>`,
          actions: [{ label: 'Cancelar', value: false }, {
            label: 'Crear', kind: 'primary',
            onClick: m => {
              const name = m.querySelector('#cn').value.trim();
              if (!name) { toast('Poné un nombre.', { kind: 'bad' }); return false; }
              return addCustomExercise({ name, type: m.querySelector('#ct').value, disc: m.querySelector('#cd').value });
            },
          }],
        });
        if (created) close(created);
      });
    },
  });
}
