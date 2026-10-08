// Inicio: personaje, racha, misiones del día/semana, atributos y próximas habilidades.
import { emblem } from '../avatar.js';
import { icon } from '../icons.js';
import { esc, nf, bar, fmtDate, fmtMin } from '../ui.js';
import { SKILL_TREES } from '../data/skills.js';
import { ACHIEVEMENTS } from '../data/game.js';
import { reqText } from '../engine.js';

const QUEST_ICON = {
  sessions: 'check', sets: 'grid', repsOf: 'push', repsDisc: 'rings', volume: 'weight', cardioMin: 'run', distance: 'run',
  mobilityMin: 'lotus', holdSec: 'timer', weighIns: 'scale', longestMin: 'clock', days: 'fire', prs: 'up', newExercises: 'star', sessionsDisc: 'bolt',
};

function ring(value, max, label) {
  const r = 34, c = 2 * Math.PI * r, k = Math.min(1, value / max);
  return `<div class="ring" role="img" aria-label="${value} de ${max} ${label}">
    <svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="8"/>
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="${k >= 1 ? 'var(--good)' : 'var(--primary-2)'}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - k)}"/></svg>
    <div class="lbl"><b>${value}/${max}</b><span>${label}</span></div></div>`;
}

function timeLeft(kind) {
  const now = new Date(), end = new Date(now);
  if (kind === 'D') end.setHours(24, 0, 0, 0);
  else {
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7)));
  }
  const h = Math.round((end - now) / 36e5);
  return h >= 24 ? `${Math.floor(h / 24)} d ${h % 24} h` : `${h} h`;
}

function questList(period, kind) {
  return period.quests.map(q => {
    const pct = Math.min(1, q.value / q.target);
    const fmt = v => (q.metric === 'distance' ? nf(v, 1) : nf(v));
    return `<div class="quest ${q.done ? 'done' : ''}">
      <div class="qi">${icon(q.done ? 'check' : QUEST_ICON[q.metric] || 'quest')}</div>
      <div><div class="qname">${esc(q.name)}</div>
        <div class="qprog">${bar(pct, `thin ${q.done ? 'good' : ''}`)}<span class="num">${fmt(Math.min(q.value, q.target))}/${fmt(q.target)}</span></div></div>
      <div class="reward">+${q.xp}</div></div>`;
  }).join('') + `<p class="muted" style="font-size:12px;margin:12px 0 0">${icon('clock')} Se renuevan en ${timeLeft(kind)}</p>`;
}

export function render(root, { state, profile }) {
  const p = profile;
  const name = state.profile.name;
  const a = state.activeSession;
  const last = p.derived.sessions.filter(s => s.stats.sets).slice(-1)[0];

  // Habilidades más cercanas a desbloquearse
  const near = SKILL_TREES.flatMap(t => t.nodes.map(n => ({ n, t, st: p.skills[n.id] })))
    .filter(x => x.st.available && (state.profile.disciplines.includes(x.t.disc)))
    .map(x => {
      const pr = x.st.progress;
      const pct = pr.lowerIsBetter ? (pr.current ? Math.min(1, pr.target / pr.current) : 0) : Math.min(1, (pr.current || 0) / pr.target);
      return { ...x, pct };
    })
    .sort((x, y) => y.pct - x.pct)
    .slice(0, 3);

  const recentAch = Object.entries(state.achievements)
    .sort((x, y) => new Date(y[1].date) - new Date(x[1].date))
    .slice(0, 3)
    .map(([id]) => ACHIEVEMENTS.find(x => x.id === id))
    .filter(Boolean);

  root.innerHTML = `
    <section class="hero" style="--rank:${p.rank.color}">
      ${emblem({ level: p.level, rank: p.rank, cls: p.cls, size: 132 })}
      <div class="who">
        <div class="cls">${esc(p.cls.name)} · ${esc(p.rank.title)} de ${esc(p.rank.name)}</div>
        <h1>${esc(name)}</h1>
        <div class="xp-line"><span>Nivel <b>${p.level}</b> → ${p.level + 1}</span><span><b>${nf(p.into)}</b> / ${nf(p.need)} XP</span></div>
        ${bar(p.pct, 'xp')}
        <div class="muted" style="font-size:12.5px;margin-top:8px">${nf(p.totalXP)} XP totales</div>
      </div>
      <div class="side">
        <div class="streak" title="Semanas seguidas cumpliendo tu objetivo">${icon('fire')}<div>${p.streak.streak}<small>${p.streak.streak === 1 ? 'semana' : 'semanas'} de racha</small></div></div>
        ${ring(p.streak.thisWeek, p.streak.target, 'días')}
      </div>
    </section>

    <div style="margin:18px 0">
      ${a
        ? `<button class="cta resume" data-go="#/entrenar">${icon('play')}<div><b>Continuar entrenamiento</b><span>${esc(a.name)} · en curso</span></div></button>`
        : `<button class="cta" data-start>${icon('bolt')}<div><b>Empezar a entrenar</b><span>Libre o con una rutina · cada serie suma XP</span></div></button>`}
    </div>

    <div class="grid cols-2">
      <section class="card"><h2 class="card-title">${icon('quest')} Misiones diarias</h2>${questList(p.daily, 'D')}</section>
      <section class="card"><h2 class="card-title">${icon('trophy')} Misiones semanales</h2>${questList(p.weekly, 'W')}</section>

      <section class="card">
        <h2 class="card-title">${icon('star')} Atributos <small><a href="#/perfil">Ver detalle</a></small></h2>
        ${p.attrs.map(x => `<div class="attr-row" style="--c:${x.color}">
          <span class="name"><i class="sw" style="background:${x.color}"></i>${x.name}</span>
          ${bar(x.pct)}<span class="lv"><small>nv</small>${x.level}</span></div>`).join('')}
      </section>

      <section class="card">
        <h2 class="card-title">${icon('spark')} Cerca de desbloquear <small><a href="#/habilidades">Árbol</a></small></h2>
        ${near.length ? near.map(x => `<div class="mini-skill"><div class="si">${icon(x.t.icon)}</div>
            <div><b>${esc(x.n.name)}</b> <span class="chip xp" style="margin-left:6px">+${x.n.xp}</span>
            <div class="muted" style="font-size:12.5px;margin:2px 0 6px">${esc(reqText(x.n.req, state))}</div>${bar(x.pct, 'thin')}</div></div>`).join('')
          : `<div class="empty">${icon('tree')}<div>Registrá entrenamientos para ver tus próximas habilidades.</div></div>`}
      </section>

      <section class="card">
        <h2 class="card-title">${icon('clock')} Último entrenamiento</h2>
        ${last ? `<a class="history-item" href="#/progreso/historial" style="margin:0">
            <div class="hd"><b>${new Date(last.start).getDate()}</b><span>${esc(fmtDate(last.start, { month: 'short' }))}</span></div>
            <div><h4>${esc(last.name)}</h4><p>${fmtMin(last.stats.durationMin)} · ${last.stats.sets} series${last.prs.length ? ` · ${last.prs.length} récord${last.prs.length > 1 ? 's' : ''}` : ''}</p></div>
            <span class="chip xp">+${nf(last.xp)} XP</span></a>`
          : `<div class="empty">${icon('dumbbell')}<div>Todavía no entrenaste. ¡Tu primera sesión te da un logro!</div></div>`}
      </section>

      <section class="card">
        <h2 class="card-title">${icon('trophy')} Logros recientes <small><a href="#/perfil">${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}</a></small></h2>
        ${recentAch.length ? `<div class="stack" style="gap:10px">${recentAch.map(x => `<div class="ach on"><div class="ai">${icon(x.icon)}</div><div><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></div></div>`).join('')}</div>`
          : `<div class="empty">${icon('trophy')}<div>Tus logros van a aparecer acá.</div></div>`}
      </section>
    </div>`;

  root.onclick = e => {
    const go = e.target.closest('[data-go]');
    if (go) location.hash = go.dataset.go;
    if (e.target.closest('[data-start]')) location.hash = '#/entrenar';
  };
  return () => (root.onclick = null);
}

