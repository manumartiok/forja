// Temporizador de descanso entre series (barra flotante).
import { fmtClock, beep, vibrate } from './ui.js';
import { icon } from './icons.js';
import { store } from './store.js';

const $bar = () => document.getElementById('rest-bar');
let end = 0, total = 0, timer = null, finished = false;

function render() {
  const el = $bar();
  const left = Math.max(0, (end - Date.now()) / 1000);
  if (left <= 0 && !finished) {
    finished = true;
    const st = store.get().settings;
    if (st.sound) beep({ freq: 988, times: 3 });
    if (st.vibrate) vibrate([200, 100, 200]);
    setTimeout(stop, 4000);
  }
  el.classList.toggle('done', finished);
  el.innerHTML = `
    <div><div class="lbl">${finished ? '¡A la próxima serie!' : 'Descanso'}</div><div class="t">${fmtClock(Math.ceil(left))}</div></div>
    <button class="btn small ghost" data-rest="-15" aria-label="Restar 15 segundos">−15</button>
    <button class="btn small ghost" data-rest="15" aria-label="Sumar 15 segundos">+15</button>
    <button class="icon-btn" data-rest="skip" aria-label="Saltar descanso">${icon('x')}</button>
    <div class="prog" style="width:${total ? (1 - left / total) * 100 : 0}%"></div>`;
}

export function startRest(sec) {
  total = sec;
  end = Date.now() + sec * 1000;
  finished = false;
  $bar().hidden = false;
  clearInterval(timer);
  timer = setInterval(render, 250);
  render();
}

export function stop() {
  clearInterval(timer);
  timer = null;
  $bar().hidden = true;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-rest]');
  if (!b) return;
  const v = b.dataset.rest;
  if (v === 'skip') return stop();
  end += +v * 1000;
  total = Math.max(total + +v, 1);
  finished = false;
  render();
});
