// Árboles de habilidades por disciplina.
import { SKILL_TREES } from '../data/skills.js';
import { DISCIPLINES } from '../data/exercises.js';
import { reqText } from '../engine.js';
import { icon } from '../icons.js';
import { esc, nf, bar, fmtDate, confirmDialog } from '../ui.js';
import { claimSkill } from '../actions.js';

function progressText(pr) {
  if (pr.current == null || pr.current === 0) return 'Sin registros todavía';
  const d = pr.unit === 'km' || pr.unit === '× peso' ? 2 : 0;
  if (pr.lowerIsBetter) return `Tu mejor marca: ${nf(pr.current, 1)} min (objetivo ${pr.target} min)`;
  return `${nf(pr.current, d)} / ${nf(pr.target, d)} ${pr.unit}`;
}

export function render(root, { state, profile, params, rerender }) {
  const mine = state.profile.disciplines;
  const discs = Object.keys(DISCIPLINES)
    .filter(d => SKILL_TREES.some(t => t.disc === d))
    .sort((a, b) => (mine.indexOf(a) === -1 ? 99 : mine.indexOf(a)) - (mine.indexOf(b) === -1 ? 99 : mine.indexOf(b)));
  const disc = discs.includes(params[0]) ? params[0] : discs[0];
  const total = SKILL_TREES.reduce((n, t) => n + t.nodes.length, 0);

  const nodeHtml = n => {
    const st = profile.skills[n.id];
    const cls = st.unlocked ? 'unlocked' : st.available ? 'available' : 'locked';
    const pr = st.progress;
    const pct = pr.lowerIsBetter ? (pr.current ? Math.min(1, pr.target / pr.current) : 0) : Math.min(1, (pr.current || 0) / pr.target);
    return `<div class="node ${cls}">
      <div class="dot" aria-hidden="true">${st.unlocked ? icon('check') : st.available ? n.tier : icon('lock')}</div>
      <div class="nb">
        <b>${esc(n.name)} <span class="nxp">+${n.xp} XP</span></b>
        <p>${esc(reqText(n.req, state))}</p>
        ${st.unlocked
          ? `<p class="muted">${st.date ? `Desbloqueada el ${esc(fmtDate(st.date, { day: 'numeric', month: 'short', year: 'numeric' }))}` : 'Desbloqueada'}${st.manual ? ' · marcada a mano' : ''}</p>`
          : `<div class="np">${bar(pct, 'thin')}<span>${esc(progressText(pr))}</span></div>
             ${st.available ? `<button class="btn small ghost" data-claim="${n.id}" style="margin-top:8px">${icon('check')} Ya lo logré</button>` : ''}`}
      </div></div>`;
  };

  root.innerHTML = `
    <header class="page-head"><div><h1>Habilidades</h1>
      <p>Se desbloquean solas cuando registrás la marca. Si lográs una avanzada, las anteriores del árbol cuentan por mérito.</p></div>
      <span class="chip xp">${icon('spark')} ${profile.skillsUnlocked}/${total} desbloqueadas</span></header>
    <div class="tabs" role="tablist">${discs.map(d => `<button role="tab" aria-selected="${d === disc}" class="${d === disc ? 'on' : ''}" data-disc="${d}">${icon(DISCIPLINES[d].icon)}${DISCIPLINES[d].short}</button>`).join('')}</div>
    <div class="trees">
      ${SKILL_TREES.filter(t => t.disc === disc).map(t => {
        const un = t.nodes.filter(n => profile.skills[n.id].unlocked).length;
        return `<section class="card"><div class="tree-head"><div class="ti">${icon(t.icon)}</div><h3>${esc(t.name)}</h3>
          <span class="count">${un}/${t.nodes.length}</span></div><div class="nodes">${t.nodes.map(nodeHtml).join('')}</div></section>`;
      }).join('')}
    </div>`;

  root.onclick = async e => {
    const tab = e.target.closest('[data-disc]');
    if (tab) return (location.hash = `#/habilidades/${tab.dataset.disc}`);
    const c = e.target.closest('[data-claim]');
    if (c) {
      const ok = await confirmDialog('Marcala solo si ya lo lograste (por ejemplo, antes de usar la app). Lo ideal es registrarlo en un entrenamiento para que quede como récord.', { ok: 'Lo logré', title: '¿Desbloquear habilidad?' });
      if (ok) {
        claimSkill(c.dataset.claim);
        rerender();
      }
    }
  };
  return () => (root.onclick = null);
}
