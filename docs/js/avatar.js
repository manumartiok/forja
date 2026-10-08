// Emblema del personaje: un escudo hexagonal que evoluciona con el rango
// (marco, estrellas, alas y corona) con el ícono de la clase al centro.
import { RANKS } from './data/game.js';

const CLASS_GLYPH = {
  titan: '<path d="M-14 -6v12M14 -6v12M-19 -2.5v5M19 -2.5v5M-14 0h28" stroke-width="4.2"/>',
  runner: '<circle cx="4" cy="-14" r="3.4" fill="currentColor" stroke="none"/><path d="M-8 16l5-10 5 3 3 7M-12 2l5-7 7 2 3 6 5 2M-3 6l-2-6" stroke-width="3.6"/>',
  monk: '<path d="M0 14c-7 0-14-3-16-10 5-2 11 0 16 5 5-5 11-7 16-5-2 7-9 10-16 10z" stroke-width="3"/><path d="M0 9c-4-6-4-12 0-19 4 7 4 13 0 19z" stroke-width="3"/>',
  acrobat: '<path d="M-7 -16v10M7 -16v10" stroke-width="3.4"/><circle cx="-7" cy="3" r="7" stroke-width="3.4"/><circle cx="7" cy="3" r="7" stroke-width="3.4"/>',
  warrior: '<path d="M6 10L-12 -8v-5h5L11 5M4 13l9-9M8 9l6 6" stroke-width="3.2"/><path d="M-6 10l12-18h5v5l-9 13M-8 7l6 6M-5 11l-5 5" stroke-width="3.2"/>',
};

const hex = r => {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
};

let n = 0;
export function emblem({ level, rank, cls, size = 140 }) {
  const id = `em${++n}`;
  const tier = RANKS.indexOf(RANKS.find(r => r.name === rank.name));
  const stars = Math.min(3, tier); // 0..3 estrellas
  const wings = tier >= 4; // platino en adelante
  const crown = tier >= 6; // mítico
  const glyph = CLASS_GLYPH[cls.id] || CLASS_GLYPH.warrior;

  const starSvg = Array.from({ length: stars }, (_, i) => {
    const x = (i - (stars - 1) / 2) * 14;
    return `<path transform="translate(${x} 62) scale(.55)" d="M0 -10l3 6.5 7 1-5 4.8 1.2 7L0 6l-6.2 3.3 1.2-7-5-4.8 7-1z" fill="${rank.color}"/>`;
  }).join('');

  const wingSvg = wings
    ? `<g fill="${rank.color}" opacity=".85">
        <path d="M-52 -6c-14 -6 -22 -20 -20 -34 8 10 16 14 24 14-6 4-8 12-4 20z"/>
        <path d="M52 -6c14 -6 22 -20 20 -34-8 10-16 14-24 14 6 4 8 12 4 20z"/>
      </g>`
    : '';
  const crownSvg = crown
    ? `<path transform="translate(0 -66)" d="M-14 6l-4-14 9 7 9-11 9 11 9-7-4 14z" fill="${rank.color}" stroke="#0d0b1a" stroke-width="1.5"/>`
    : '';

  return `<svg class="emblem" viewBox="-80 -84 160 168" width="${size}" height="${size}" role="img" aria-label="Emblema: ${cls.name}, rango ${rank.name}, nivel ${level}">
    <defs>
      <linearGradient id="${id}g" x1="0" y1="-1" x2="0" y2="1">
        <stop offset="0" stop-color="${rank.color}"/><stop offset="1" stop-color="${rank.glow}"/>
      </linearGradient>
      <radialGradient id="${id}r" cx="0" cy="-.3" r="1">
        <stop offset="0" stop-color="#2a2458"/><stop offset="1" stop-color="#120f26"/>
      </radialGradient>
      <filter id="${id}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <polygon points="${hex(54)}" fill="${rank.glow}" opacity=".45" filter="url(#${id}f)"/>
    ${wingSvg}
    <polygon points="${hex(54)}" fill="url(#${id}g)"/>
    <polygon points="${hex(47)}" fill="url(#${id}r)"/>
    <polygon points="${hex(41)}" fill="none" stroke="${rank.color}" stroke-opacity=".35" stroke-width="1.2"/>
    <g fill="none" stroke="${rank.color}" stroke-linecap="round" stroke-linejoin="round" color="${rank.color}" transform="translate(0 -4)">${glyph}</g>
    ${crownSvg}
    <g transform="translate(0 40)">
      <rect x="-19" y="-11" width="38" height="22" rx="11" fill="#0d0b1a" stroke="url(#${id}g)" stroke-width="2.5"/>
      <text x="0" y="5.5" text-anchor="middle" font-family="'Chakra Petch', sans-serif" font-weight="700" font-size="15" fill="${rank.color}">${level}</text>
    </g>
    ${starSvg}
  </svg>`;
}
