// Resumen de un entrenamiento terminado: XP ganada, subida de nivel, récords,
// habilidades, misiones y logros desbloqueados.
import { getExercise, sessionKcal } from '../engine.js';
import { icon } from '../icons.js';
import { esc, nf, fmtMin, bar, countUp, confetti, modal, toast, beep } from '../ui.js';
import { takeSummary, saveRoutineFromSession } from '../actions.js';
import { store } from '../store.js';

export function render(root, { state, profile, params }) {
  const id = params[0];
  const s = profile.derived.sessions.find(x => x.id === id);
  if (!s) {
    root.innerHTML = `<div class="empty">${icon('info')}<div>No se encontró el entrenamiento.</div><a class="btn" href="#/">Volver</a></div>`;
    return;
  }
  const sum = takeSummary(id); // solo existe justo después de terminar
  const gained = sum ? sum.after.xp - sum.before.xp : s.xp;
  const levelUp = sum && sum.after.level > sum.before.level;
  const news = sum ? sum.news : { skills: [], quests: [], achievements: [] };
  const rankUp = sum && sum.after.rank.name !== sum.before.rank.name;

  const items = [
    ...s.prs.map(pr => ({
      cls: 'pr', ic: 'up', title: `Récord: ${(getExercise(state, pr.ex) || {}).name}`,
      sub: `${pr.metric}: ${nf(pr.prev, pr.unit === 'kg' || pr.unit === 'km' ? 1 : 0)} → <b>${nf(pr.value, pr.unit === 'kg' || pr.unit === 'km' ? 1 : 0)} ${pr.unit}</b>`, xp: 30,
    })),
    ...news.skills.map(k => ({ cls: 'skill', ic: 'spark', title: `Habilidad: ${k.name}`, sub: `Árbol de ${k.tree.name}`, xp: k.xp })),
    ...news.quests.map(q => ({ cls: 'quest', ic: 'quest', title: 'Misión cumplida', sub: q.name, xp: q.xp })),
    ...news.achievements.map(a => ({ cls: 'ach', ic: a.icon, title: `Logro: ${a.name}`, sub: a.desc, xp: a.xp })),
  ];

  const kcal = sessionKcal(state, s);
  root.innerHTML = `
    <section class="card reward-hero" id="hero">
      <div class="muted" style="text-transform:uppercase;letter-spacing:.12em;font-size:13px">Entrenamiento completado</div>
      <h1 style="font-size:26px;margin:6px 0 18px">${esc(s.name)}</h1>
      <div class="big-xp">+<span id="xp">0</span> <small>XP</small></div>
      ${levelUp ? `<div class="level-up">${icon('star')} ¡Nivel ${sum.after.level}!</div>` : ''}
      ${rankUp ? `<div class="chip xp" style="margin-top:12px">Nuevo rango: ${esc(sum.after.rank.title)} de ${esc(sum.after.rank.name)}</div>` : ''}
      ${sum ? `<div style="max-width:420px;margin:22px auto 0">
          <div class="xp-line"><span>Nivel <b>${sum.after.level}</b></span><span><b>${nf(sum.after.into)}</b> / ${nf(sum.after.need)} XP</span></div>
          <div class="bar xp" id="lvlbar"><div style="width:${levelUp ? 0 : (sum.before.into / sum.before.need) * 100}%"></div></div></div>` : ''}
    </section>

    <div class="stat-tiles" style="margin:16px 0">
      <div class="tile"><b>${fmtMin(s.stats.durationMin)}</b><span>Duración</span></div>
      <div class="tile"><b>${s.stats.sets}</b><span>Series</span></div>
      ${s.stats.volume ? `<div class="tile"><b>${nf(s.stats.volume)}</b><span>Kg de volumen</span></div>` : ''}
      ${s.stats.distance ? `<div class="tile"><b>${nf(s.stats.distance, 2)}</b><span>Km</span></div>` : ''}
      <div class="tile"><b>~${nf(kcal)}</b><span>Kcal estimadas</span></div>
    </div>

    <div class="grid cols-2">
      <section class="card"><h2 class="card-title">${icon('trophy')} Recompensas</h2>
        ${items.length ? `<div class="reward-list">${items.map((it, k) => `<div class="reward-item ${it.cls}" style="animation-delay:${0.6 + k * 0.12}s">
            <div class="ri">${icon(it.ic)}</div><div><b>${esc(it.title)}</b><small>${it.sub}</small></div>${it.xp ? `<span class="x">+${it.xp}</span>` : ''}</div>`).join('')}</div>`
          : `<p class="muted">Sin récords ni desbloqueos esta vez. La constancia también suma: cada sesión aumenta tu atributo de Constancia.</p>`}
      </section>
      <section class="card"><h2 class="card-title">${icon('star')} Atributos entrenados</h2>
        ${profile.attrs.map(a => {
          const x = Math.round(s.xpAttr[a.id] || 0);
          return x ? `<div class="attr-row" style="--c:${a.color}"><span class="name"><i class="sw" style="background:${a.color}"></i>${a.name}</span>${bar(a.pct)}<span class="lv num">+${x}</span></div>` : '';
        }).join('')}
      </section>
    </div>

    <div class="row" style="margin-top:20px;justify-content:center">
      <button class="btn" data-save>${icon('star')} Guardar como rutina</button>
      <a class="btn primary" href="#/">${icon('home')} Volver al inicio</a>
    </div>`;

  countUp(root.querySelector('#xp'), 0, gained, 1400);
  if (sum) {
    setTimeout(() => {
      const b = root.querySelector('#lvlbar > div');
      if (b) b.style.width = `${(sum.after.into / sum.after.need) * 100}%`;
    }, 400);
    if (levelUp || news.skills.length || news.achievements.length) {
      setTimeout(() => {
        confetti();
        if (store.get().settings.sound) beep({ freq: 660, times: 2, ms: 120 });
      }, 500);
    }
  }

  root.onclick = async e => {
    if (!e.target.closest('[data-save]')) return;
    const name = await modal({
      title: 'Guardar como rutina',
      body: `<label class="field"><span>Nombre</span><input class="input" id="rn" maxlength="40" value="${esc(s.name)}"></label>`,
      actions: [{ label: 'Cancelar', value: false }, { label: 'Guardar', kind: 'primary', onClick: w => w.querySelector('#rn').value.trim() || false }],
    });
    if (name) {
      saveRoutineFromSession(s, name);
      toast(`Rutina <b>${esc(name)}</b> guardada.`, { kind: 'good', iconName: 'check' });
    }
  };
  return () => (root.onclick = null);
}
