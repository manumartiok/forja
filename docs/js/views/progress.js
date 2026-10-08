// Progreso: cuerpo (peso, IMC, medidas), estadísticas e historial.
import { store } from '../store.js';
import { getExercise, bmi, energy, currentWeight, dayKey, weekStart, sessionKcal, ageFrom } from '../engine.js';
import { lineChart, barChart, heatmap, bindCharts } from '../charts.js';
import { icon } from '../icons.js';
import { esc, nf, fmtDate, fmtDateTime, fmtMin, fmtPace, modal, confirmDialog, toast } from '../ui.js';
import { logBody, deleteBody, deleteSession, fmtSet, runEvaluate } from '../actions.js';

const TABS = [['cuerpo', 'Cuerpo', 'scale'], ['estadisticas', 'Estadísticas', 'chart'], ['historial', 'Historial', 'clock']];

export function render(root, ctx) {
  const tab = TABS.some(t => t[0] === ctx.params[0]) ? ctx.params[0] : 'cuerpo';
  const body = { cuerpo: bodyTab, estadisticas: statsTab, historial: historyTab }[tab](ctx);
  root.innerHTML = `
    <header class="page-head"><div><h1>Progreso</h1><p>Tu cuerpo, tus números y todo lo que entrenaste.</p></div></header>
    <div class="tabs" role="tablist">${TABS.map(([k, l, ic]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}" data-tab="${k}">${icon(ic)}${l}</button>`).join('')}</div>
    <div id="tab">${body.html}</div>`;
  bindCharts(root);
  root.onclick = async e => {
    const t = e.target.closest('[data-tab]');
    if (t) return (location.hash = `#/progreso/${t.dataset.tab}`);
    if (body.onClick) await body.onClick(e);
  };
  root.onchange = e => body.onChange && body.onChange(e);
  return () => (root.onclick = root.onchange = null);
}

// ---------------------------------------------------------------- cuerpo
function bodyTab({ state, profile, rerender }) {
  const p = state.profile;
  const w = currentWeight(state);
  const b = bmi(w, p.height);
  const perWeek = profile.derived.sessions.filter(s => new Date(s.start) > Date.now() - 28 * 864e5).length / 4;
  const en = energy(state, perWeek);
  const log = state.bodyLog;
  const first = log[0];
  const goal = p.goalWeight;
  let goalPct = null;
  if (goal && first && w != null && first.weight !== goal) goalPct = Math.max(0, Math.min(1, (first.weight - w) / (first.weight - goal)));

  const html = `
    <div class="stat-tiles" style="margin-bottom:16px">
      <div class="tile xp"><b>${w != null ? nf(w, 1) : '—'}</b><span>Peso actual (kg)</span></div>
      <div class="tile"><b>${nf(p.height)}</b><span>Estatura (cm)</span></div>
      <div class="tile"><b>${b ? nf(b.value, 1) : '—'}</b><span>IMC · ${b ? b.cat : ''}</span></div>
      ${goal ? `<div class="tile"><b>${nf(goal, 1)}</b><span>Objetivo (kg) · ${goalPct != null ? `${Math.round(goalPct * 100)}% del camino` : ''}</span></div>` : ''}
      ${en ? `<div class="tile"><b>${nf(en.tdee)}</b><span>Kcal/día estimadas</span></div>` : ''}
    </div>
    <div class="grid cols-2">
      <section class="card" style="grid-column:1/-1">
        <h2 class="card-title">${icon('scale')} Evolución del peso <small><button class="btn small primary" data-log>${icon('plus')} Registrar</button></small></h2>
        ${lineChart({ points: log.map(e => ({ t: e.date, y: e.weight, tip: e.bodyFat ? `${nf(e.bodyFat, 1)}% grasa` : '' })), unit: 'kg', goal, goalLabel: 'Objetivo', width: 960, height: 260, ariaLabel: 'Evolución del peso corporal' })}
      </section>
      <section class="card">
        <h2 class="card-title">${icon('note')} Registros</h2>
        <div class="table-wrap"><table class="data"><thead><tr><th>Fecha</th><th>Peso</th><th>% grasa</th><th>Cintura</th><th></th></tr></thead><tbody>
          ${[...log].reverse().slice(0, 12).map(e => `<tr><td>${esc(fmtDate(e.date, { day: 'numeric', month: 'short', year: '2-digit' }))}</td><td>${nf(e.weight, 1)} kg</td>
            <td>${e.bodyFat ? `${nf(e.bodyFat, 1)}%` : '—'}</td><td>${e.waist ? `${nf(e.waist, 1)} cm` : '—'}</td>
            <td style="text-align:right">${log.length > 1 ? `<button class="icon-btn danger" data-del-body="${esc(e.date)}" aria-label="Borrar registro">${icon('trash')}</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>
      </section>
      <section class="card">
        <h2 class="card-title">${icon('heart')} Energía y composición</h2>
        ${en ? `<p>Metabolismo basal: <b class="num">${nf(en.bmr)} kcal</b></p>
          <p>Gasto diario estimado: <b class="num">${nf(en.tdee)} kcal</b> <span class="muted">(con ${nf(perWeek, 1)} entrenamientos por semana)</span></p>
          <p class="muted" style="font-size:12.5px">Estimación con la fórmula de Mifflin-St Jeor${ageFrom(p.birthDate) ? ` para ${ageFrom(p.birthDate)} años` : ''}. Es orientativa, no reemplaza a un profesional.</p>`
          : `<p class="muted">Completá tu fecha de nacimiento en el perfil para calcular tu metabolismo y gasto diario.</p>`}
        ${b ? `<p class="muted" style="font-size:12.5px">El IMC no distingue músculo de grasa: si entrenás fuerza puede sobrestimar. Registrar tu % de grasa o la cintura da una mejor idea.</p>` : ''}
      </section>
    </div>`;

  const onClick = async e => {
    if (e.target.closest('[data-log]')) {
      const today = new Date().toISOString().slice(0, 10);
      const res = await modal({
        title: 'Registrar medidas',
        body: `<div class="form-grid">
          <label class="field"><span>Fecha</span><input class="input" type="date" id="bd" value="${today}" max="${today}"></label>
          <label class="field"><span>Peso (kg)</span><input class="input" type="number" step="0.1" inputmode="decimal" id="bw" value="${w ?? ''}"></label>
          <label class="field"><span>% de grasa (opcional)</span><input class="input" type="number" step="0.1" inputmode="decimal" id="bf"></label>
          <label class="field"><span>Cintura cm (opcional)</span><input class="input" type="number" step="0.1" inputmode="decimal" id="bwa"></label>
          <label class="field"><span>Pecho cm (opcional)</span><input class="input" type="number" step="0.1" inputmode="decimal" id="bc"></label>
          <label class="field"><span>Brazo cm (opcional)</span><input class="input" type="number" step="0.1" inputmode="decimal" id="ba"></label>
          <label class="field"><span>Estatura cm</span><input class="input" type="number" step="0.5" inputmode="decimal" id="bh" value="${p.height}"></label></div>`,
        actions: [{ label: 'Cancelar', value: false }, {
          label: 'Guardar', kind: 'primary',
          onClick: m => {
            const v = id => +m.querySelector(id).value || null;
            const weight = v('#bw');
            if (!weight || weight < 30 || weight > 300) { toast('Ingresá un peso válido (30 a 300 kg).', { kind: 'bad' }); return false; }
            const d = m.querySelector('#bd').value;
            const date = d === today ? new Date().toISOString() : new Date(`${d}T12:00:00`).toISOString();
            return { date, weight, bodyFat: v('#bf'), waist: v('#bwa'), chest: v('#bc'), arm: v('#ba'), height: v('#bh') };
          },
        }],
      });
      if (res) {
        const { height, ...entry } = res;
        if (height && height !== p.height && height >= 120 && height <= 230) store.update(s => (s.profile.height = height));
        logBody(entry);
        rerender();
      }
    }
    const del = e.target.closest('[data-del-body]');
    if (del && (await confirmDialog('¿Borrar este registro de peso?', { ok: 'Borrar', danger: true }))) {
      deleteBody(del.dataset.delBody);
      rerender();
    }
  };
  return { html, onClick };
}

// ---------------------------------------------------------------- estadísticas
function exerciseSeries(state, sessions, exId) {
  const ex = getExercise(state, exId);
  const pts = [];
  for (const s of sessions) {
    const item = s.exercises.find(e => e.ex === exId);
    if (!item) continue;
    const done = item.sets.filter(x => x.done);
    if (!done.length) continue;
    let y = null, tip = '';
    if (ex.type === 'weight') {
      const best = done.reduce((m, x) => { const v = x.reps <= 1 ? +x.kg : +x.kg * (1 + Math.min(+x.reps, 12) / 30); return v > m.v ? { v, x } : m; }, { v: 0 });
      y = best.v;
      tip = `Mejor serie: ${fmtSet(ex, best.x)}`;
    } else if (ex.type === 'bw') { y = Math.max(...done.map(x => +x.reps || 0)); tip = `${done.length} series`; }
    else if (ex.type === 'hold') { y = Math.max(...done.map(x => +x.sec || 0)); }
    else if (ex.type === 'cardio') {
      const km = done.reduce((a, x) => a + (+x.km || 0), 0), min = done.reduce((a, x) => a + (+x.min || 0), 0);
      y = km || min;
      tip = km ? `${nf(min)} min · ritmo ${fmtPace(min, km)}` : '';
    } else y = done.reduce((a, x) => a + (+x.min || 0), 0);
    pts.push({ t: s.start, y, tip });
  }
  const unit = { weight: 'kg (1RM est.)', bw: 'reps', hold: 's', cardio: pts.some(p => p.tip) ? 'km' : 'min', time: 'min' }[ex.type];
  return { pts, unit, ex };
}

function statsTab({ state, profile }) {
  const sessions = profile.derived.sessions.filter(s => s.stats.sets);
  const t = profile.derived.totals;

  // entrenamientos y XP por semana (12 semanas)
  const weeks = [];
  const ws = weekStart(new Date());
  for (let i = 11; i >= 0; i--) {
    const start = new Date(ws);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const ss = sessions.filter(s => new Date(s.start) >= start && new Date(s.start) < end);
    const xp = ss.reduce((a, s) => a + s.xp, 0);
    weeks.push({
      label: fmtDate(start, { day: 'numeric', month: 'numeric' }),
      value: ss.length,
      tip: `<b>${ss.length} entrenamiento${ss.length === 1 ? '' : 's'}</b><span>Semana del ${esc(fmtDate(start))} · ${nf(xp)} XP</span>`,
    });
  }
  const days = {};
  for (const s of sessions) {
    const k = dayKey(s.start);
    days[k] = days[k] || { xp: 0, sessions: 0 };
    days[k].xp += s.xp;
    days[k].sessions++;
  }

  const exIds = [...profile.derived.seen].filter(id => getExercise(state, id));
  exIds.sort((a, b) => profile.derived.bests[b].sessions - profile.derived.bests[a].sessions);
  let selected = exIds[0];

  const exBlock = () => {
    if (!selected) return '<div class="chart-empty">Registrá entrenamientos para ver la evolución de cada ejercicio.</div>';
    const { pts, unit, ex } = exerciseSeries(state, sessions, selected);
    const b = profile.derived.bests[selected];
    const best = ex.type === 'weight' ? `1RM estimado: ${nf(b.bestE1rm, 1)} kg · Máx. ${nf(b.maxKg, 1)} kg`
      : ex.type === 'bw' ? `Máximo: ${nf(b.maxReps)} reps` : ex.type === 'hold' ? `Máximo: ${nf(b.maxHold)} s`
      : ex.type === 'cardio' ? `Máximo: ${nf(b.maxDist, 2)} km · ${nf(b.maxMin)} min` : `Máximo: ${nf(b.maxMin)} min`;
    return `<p class="muted" style="margin:0 0 10px">${esc(best)} · ${b.sessions} sesiones</p>
      ${lineChart({ points: pts, unit, decimals: ex.type === 'weight' || ex.type === 'cardio' ? 1 : 0, integer: ex.type === 'bw' || ex.type === 'hold', width: 960, height: 260, ariaLabel: `Evolución de ${ex.name}` })}`;
  };

  const html = `
    <div class="stat-tiles" style="margin-bottom:16px">
      <div class="tile xp"><b>${nf(profile.totalXP)}</b><span>XP total</span></div>
      <div class="tile"><b>${sessions.length}</b><span>Entrenamientos</span></div>
      <div class="tile"><b>${fmtMin(t.minutes)}</b><span>Tiempo entrenado</span></div>
      <div class="tile"><b>${nf(t.volume)}</b><span>Kg de volumen</span></div>
      <div class="tile"><b>${nf(t.distance, 1)}</b><span>Km recorridos</span></div>
      <div class="tile"><b>${t.prs}</b><span>Récords personales</span></div>
      <div class="tile"><b>~${nf(sessions.reduce((a, s) => a + sessionKcal(state, s), 0))}</b><span>Kcal estimadas</span></div>
    </div>
    <div class="grid cols-2">
      <section class="card"><h2 class="card-title">${icon('chart')} Entrenamientos por semana</h2>
        ${barChart({ bars: weeks, unit: 'entrenamientos', ariaLabel: 'Entrenamientos por semana, últimas 12 semanas' })}</section>
      <section class="card"><h2 class="card-title">${icon('fire')} Actividad <small>últimos 6 meses</small></h2>${heatmap(days, 26)}</section>
      <section class="card" style="grid-column:1/-1">
        <h2 class="card-title">${icon('up')} Evolución por ejercicio
          <small>${exIds.length ? `<select class="input" id="ex-sel" style="padding:6px 10px;min-width:200px">${exIds.map(id => `<option value="${esc(id)}">${esc(getExercise(state, id).name)}</option>`).join('')}</select>` : ''}</small></h2>
        <div id="ex-chart">${exBlock()}</div>
      </section>
    </div>`;

  const onChange = e => {
    if (e.target.id !== 'ex-sel') return;
    selected = e.target.value;
    const box = document.getElementById('ex-chart');
    box.innerHTML = exBlock();
    bindCharts(box);
  };
  return { html, onChange };
}

// ---------------------------------------------------------------- historial
function historyTab({ state, profile, rerender }) {
  const sessions = [...profile.derived.sessions].reverse();
  const FEEL = ['', 'Agotado', 'Duro', 'Bien', 'Muy bien', 'Imparable'];
  const html = sessions.length
    ? `<div>${sessions.map(s => `<button class="history-item" data-session="${esc(s.id)}">
        <div class="hd"><b>${new Date(s.start).getDate()}</b><span>${esc(fmtDate(s.start, { month: 'short' }))}</span></div>
        <div><h4>${esc(s.name)}</h4><p>${esc(fmtDateTime(s.start))} · ${fmtMin(s.stats.durationMin)} · ${s.stats.sets} series${s.prs.length ? ` · ${s.prs.length} récord${s.prs.length > 1 ? 's' : ''}` : ''}</p></div>
        <span class="chip xp">+${nf(s.xp)} XP</span></button>`).join('')}</div>`
    : `<div class="card empty">${icon('clock')}<div>Todavía no hay entrenamientos registrados.</div></div>`;

  const onClick = async e => {
    const b = e.target.closest('[data-session]');
    if (!b) return;
    const s = profile.derived.sessions.find(x => x.id === b.dataset.session);
    const del = await modal({
      title: s.name,
      wide: true,
      body: `<p class="muted">${esc(fmtDateTime(s.start))} · ${fmtMin(s.stats.durationMin)}${s.feeling ? ` · ${FEEL[s.feeling]}` : ''} · <span style="color:var(--xp)">+${nf(s.xp)} XP</span></p>
        ${s.exercises.map(it => {
          const ex = getExercise(state, it.ex);
          return ex ? `<div style="margin-top:14px"><b>${esc(ex.name)}</b><div class="muted" style="font-size:13.5px">${it.sets.map(x => esc(fmtSet(ex, x))).join(' · ')}</div></div>` : '';
        }).join('')}
        ${s.prs.length ? `<p style="margin-top:14px"><span class="chip good">${icon('up')} ${s.prs.length} récord${s.prs.length > 1 ? 's' : ''}</span></p>` : ''}
        ${s.notes ? `<p style="margin-top:14px;white-space:pre-line">${esc(s.notes)}</p>` : ''}`,
      actions: [{ label: `${icon('trash')} Borrar`, kind: 'danger', value: 'delete' }, { label: 'Cerrar', value: false }],
    });
    if (del === 'delete' && (await confirmDialog('Se borra el entrenamiento y la XP que dio. Las habilidades y logros ya conseguidos se mantienen.', { ok: 'Borrar', danger: true }))) {
      deleteSession(s.id);
      runEvaluate({ silent: true });
      rerender();
    }
  };
  return { html, onClick };
}
