// Perfil: personaje, atributos, logros, ajustes y copia de seguridad.
import { store } from '../store.js';
import { emblem } from '../avatar.js';
import { ACHIEVEMENTS, GOALS, EXPERIENCE, RANKS } from '../data/game.js';
import { DISCIPLINES } from '../data/exercises.js';
import { icon } from '../icons.js';
import { esc, nf, bar, fmtDate, modal, confirmDialog, toast } from '../ui.js';
import { runEvaluate } from '../actions.js';

export function render(root, { state, profile, rerender }) {
  const p = profile;
  const pr = state.profile;
  const unlocked = Object.keys(state.achievements).length;
  const nextRank = RANKS.find(r => r.min > p.level);

  root.innerHTML = `
    <header class="page-head"><div><h1>Perfil</h1><p>Tu personaje, tus logros y la configuración.</p></div></header>
    <div class="grid cols-2">
      <section class="card" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        ${emblem({ level: p.level, rank: p.rank, cls: p.cls, size: 150 })}
        <div style="flex:1;min-width:200px">
          <div class="chip" style="color:${p.rank.color}">${esc(p.rank.title)} · Rango ${esc(p.rank.name)}</div>
          <h2 style="font-size:28px;margin:8px 0 2px">${esc(pr.name)}</h2>
          <b style="font-family:var(--display);font-size:18px">${esc(p.cls.name)}</b>
          <p class="muted" style="margin:4px 0 10px;font-size:14px">${esc(p.cls.desc)}</p>
          <p class="muted" style="font-size:12.5px;margin:0">${nextRank ? `Próximo rango: <b style="color:${nextRank.color}">${nextRank.name}</b> en el nivel ${nextRank.min}.` : 'Alcanzaste el rango máximo.'} Tu clase cambia según el atributo que más entrenes.</p>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">${icon('star')} Atributos</h2>
        ${p.attrs.map(a => `<div class="attr-row" style="--c:${a.color}" title="${nf(a.into)} / ${nf(a.need)} XP para el próximo nivel">
          <span class="name"><i class="sw" style="background:${a.color}"></i>${a.name}</span>${bar(a.pct)}<span class="lv"><small>nv</small>${a.level}</span></div>`).join('')}
        <p class="muted" style="font-size:12.5px;margin:14px 0 0">Fuerza: pesas y ejercicios de empuje/tracción · Resistencia: cardio y volumen · Movilidad: estiramientos y yoga · Agilidad: equilibrio y habilidades · Constancia: entrenar seguido y cumplir misiones.</p>
      </section>

      <section class="card">
        <h2 class="card-title">${icon('bolt')} De dónde sale tu XP</h2>
        <table class="data"><tbody>
          <tr><td>Entrenamientos</td><td style="text-align:right" class="num">${nf(p.xpParts.sessions)}</td></tr>
          <tr><td>Habilidades</td><td style="text-align:right" class="num">${nf(p.xpParts.skills)}</td></tr>
          <tr><td>Misiones</td><td style="text-align:right" class="num">${nf(p.xpParts.quests)}</td></tr>
          <tr><td>Logros</td><td style="text-align:right" class="num">${nf(p.xpParts.achievements)}</td></tr>
          <tr><td><b>Total</b></td><td style="text-align:right;color:var(--xp)" class="num"><b>${nf(p.totalXP)}</b></td></tr>
        </tbody></table>
        <p class="muted" style="font-size:12.5px;margin:12px 0 0">Cada serie da XP según la carga relativa a tu peso corporal, las repeticiones y la dificultad. También suman los minutos de cardio y movilidad, los récords y completar sesiones. Mejor racha: <b>${p.streak.best}</b> semanas.</p>
      </section>

      <section class="card">
        <h2 class="card-title">${icon('settings')} Ajustes</h2>
        <div class="stack" style="gap:6px">
          <label class="toggle"><span>Sonido al terminar el descanso</span><input type="checkbox" data-set="sound" ${state.settings.sound ? 'checked' : ''}></label>
          <label class="toggle"><span>Vibración (celular)</span><input type="checkbox" data-set="vibrate" ${state.settings.vibrate ? 'checked' : ''}></label>
          <label class="toggle"><span>Descanso entre series</span>
            <select class="input" data-set="restSec" style="width:auto">${[0, 30, 45, 60, 90, 120, 150, 180, 240].map(v => `<option value="${v}" ${state.settings.restSec === v ? 'selected' : ''}>${v ? `${v} s` : 'Desactivado'}</option>`).join('')}</select></label>
        </div>
        <div class="row" style="margin-top:14px"><button class="btn" data-edit>${icon('edit')} Editar perfil</button></div>
      </section>

      <section class="card" style="grid-column:1/-1">
        <h2 class="card-title">${icon('trophy')} Logros <small>${unlocked}/${ACHIEVEMENTS.length}</small></h2>
        <div class="ach-grid">${ACHIEVEMENTS.map(a => {
          const got = state.achievements[a.id];
          return `<div class="ach ${got ? 'on' : ''}"><div class="ai">${icon(got ? a.icon : 'lock')}</div>
            <div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>
            <small>${got ? `Conseguido el ${esc(fmtDate(got.date, { day: 'numeric', month: 'short', year: 'numeric' }))}` : a.xp ? `+${a.xp} XP` : ''}</small></div></div>`;
        }).join('')}</div>
      </section>

      <section class="card" style="grid-column:1/-1">
        <h2 class="card-title">${icon('download')} Tus datos</h2>
        <p class="muted" style="margin-top:0">Todo se guarda solo en este dispositivo y navegador. Exportá una copia para no perder tu progreso o para pasarlo a otro dispositivo.</p>
        <div class="row">
          <button class="btn" data-export>${icon('download')} Exportar copia</button>
          <label class="btn">${icon('upload')} Importar copia<input type="file" accept="application/json,.json" data-import hidden></label>
          <span class="spacer"></span>
          <button class="btn danger" data-reset>${icon('trash')} Borrar todo</button>
        </div>
      </section>
    </div>`;

  root.onchange = async e => {
    const t = e.target;
    if (t.dataset.set) {
      const k = t.dataset.set;
      store.update(s => (s.settings[k] = t.type === 'checkbox' ? t.checked : +t.value));
      return toast('Ajuste guardado.', { kind: 'good', iconName: 'check', ms: 1800 });
    }
    if (t.dataset.import !== undefined && t.files[0]) {
      const text = await t.files[0].text();
      t.value = '';
      if (!(await confirmDialog('Se van a reemplazar los datos de este dispositivo por los de la copia.', { ok: 'Importar', title: '¿Importar copia?' }))) return;
      try {
        store.importJSON(text);
        runEvaluate({ silent: true });
        toast('Copia importada correctamente.', { kind: 'good', iconName: 'check' });
        location.hash = '#/';
        rerender();
      } catch (err) {
        toast(esc(err.message || 'No se pudo leer el archivo.'), { kind: 'bad', iconName: 'info' });
      }
    }
  };

  root.onclick = async e => {
    if (e.target.closest('[data-export]')) {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `forja-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return toast('Copia descargada.', { kind: 'good', iconName: 'download' });
    }
    if (e.target.closest('[data-reset]')) {
      const ok = await modal({
        title: '¿Borrar todo?',
        body: `<p class="muted">Se elimina tu personaje, entrenamientos, registros y logros de este dispositivo. No se puede deshacer.</p>
          <label class="field" style="margin-top:12px"><span>Escribí BORRAR para confirmar</span><input class="input" id="confirm-reset" autocomplete="off"></label>`,
        actions: [{ label: 'Cancelar', value: false }, { label: 'Borrar todo', kind: 'danger', onClick: w => w.querySelector('#confirm-reset').value.trim().toUpperCase() === 'BORRAR' || (toast('Escribí BORRAR para confirmar.', { kind: 'bad' }), false) }],
      });
      if (ok) {
        store.reset();
        location.hash = '#/';
        rerender();
      }
      return;
    }
    if (e.target.closest('[data-edit]')) return editProfile(state, rerender);
  };
  return () => (root.onclick = root.onchange = null);
}

async function editProfile(state, rerender) {
  const p = state.profile;
  const disc = [...p.disciplines];
  const res = await modal({
    title: 'Editar perfil',
    wide: true,
    body: `<div class="form-grid">
      <label class="field"><span>Nombre</span><input class="input" id="pn" maxlength="24" value="${esc(p.name)}"></label>
      <label class="field"><span>Sexo</span><select class="input" id="ps">
        <option value="">Prefiero no decirlo</option><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Masculino</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Femenino</option></select></label>
      <label class="field"><span>Nacimiento</span><input class="input" type="date" id="pb" value="${esc(p.birthDate || '')}"></label>
      <label class="field"><span>Estatura (cm)</span><input class="input" type="number" id="ph" value="${p.height}"></label>
      <label class="field"><span>Peso objetivo (kg)</span><input class="input" type="number" step="0.1" id="pg" value="${p.goalWeight || ''}"></label>
      <label class="field"><span>Días por semana</span><select class="input" id="pw">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option ${p.weeklyTarget === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="field"><span>Objetivo</span><select class="input" id="po">${Object.entries(GOALS).map(([k, v]) => `<option value="${k}" ${p.goal === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field"><span>Experiencia</span><select class="input" id="pe">${Object.entries(EXPERIENCE).map(([k, v]) => `<option value="${k}" ${p.experience === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>
    <div class="field" style="margin-top:16px"><span>Disciplinas (la primera es la principal)</span>
      <div class="chips" id="pd">${Object.entries(DISCIPLINES).map(([k, d]) => `<button type="button" class="chip filter-chip ${disc.includes(k) ? 'on' : ''}" data-d="${k}">${d.short}</button>`).join('')}</div></div>`,
    onMount: w => w.querySelector('#pd').addEventListener('click', e => {
      const c = e.target.closest('[data-d]');
      if (!c) return;
      const i = disc.indexOf(c.dataset.d);
      if (i >= 0) disc.splice(i, 1);
      else disc.push(c.dataset.d);
      c.classList.toggle('on', i < 0);
    }),
    actions: [{ label: 'Cancelar', value: false }, {
      label: 'Guardar', kind: 'primary',
      onClick: w => {
        const v = id => w.querySelector(id).value.trim();
        if (!v('#pn')) { toast('El nombre no puede quedar vacío.', { kind: 'bad' }); return false; }
        if (!(+v('#ph') >= 120 && +v('#ph') <= 230)) { toast('Estatura entre 120 y 230 cm.', { kind: 'bad' }); return false; }
        if (!disc.length) { toast('Elegí al menos una disciplina.', { kind: 'bad' }); return false; }
        return {
          name: v('#pn'), sex: v('#ps'), birthDate: v('#pb') || null, height: +v('#ph'), goalWeight: +v('#pg') || null,
          weeklyTarget: +v('#pw'), goal: v('#po'), experience: v('#pe'), disciplines: disc,
        };
      },
    }],
  });
  if (res) {
    store.update(s => Object.assign(s.profile, res), { immediate: true });
    runEvaluate();
    toast('Perfil actualizado.', { kind: 'good', iconName: 'check' });
    rerender();
  }
}
