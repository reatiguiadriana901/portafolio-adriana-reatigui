// Hallazgos del recorrido: rocas, fósiles y cosas de programación junto a la ruta
// de Lapilli, en los carriles laterales (solo en modo ruta y en las secciones
// claras). Cuando Lapilli pasa por uno, el hallazgo salta y Lapilli cuenta algo.

import { state } from '../state.js';
import { on, emit } from '../bus.js';
import { addTask } from '../loop.js';
import { paintIcon } from './icons.js';
import { pointAtY } from '../scene/route.js';
import { LANDMARKS } from '../data/lines.js';
import { pick } from '../i18n.js';

const SPACING = 520; // distancia aproximada entre hallazgos (px)
const MARGIN = 220; // sin hallazgos muy cerca del borde de cada sección
const GAP = 22; // espacio entre Lapilli y el hallazgo
const SIZE = 48; // 12 píxeles del dibujo × 4

let layer = null;
let items = [];
let lastAnchor = null;

export function initLandmarks() {
  layer = document.querySelector('.scene');
  on('route:ready', place);
  on('layout:change', ({ mode }) => {
    if (mode !== 'route') clear();
  });
  on('scroll:jump', () => { lastAnchor = null; });
  on('lang:change', () => items.forEach((item) => { item.tag.textContent = pick(item.label); }));
  addTask('landmarks', update, 16);
}

function clear() {
  items.forEach((item) => item.el.remove());
  items = [];
  lastAnchor = null;
}

function place() {
  clear();
  const { segments, lanes, spriteW, viewport } = state.layout;
  let next = 0;
  segments.forEach((segment) => {
    // En las secciones oscuras la escena queda tapada, así que ahí no van
    if (segment.kind !== 'section' || segment.el.classList.contains('theme-dark')) return;
    for (let y = segment.top + MARGIN; y < segment.bottom - MARGIN; y += SPACING) {
      const point = pointAtY(y);
      if (!point) continue;
      const lane = point.x < viewport.w / 2 ? lanes.left : lanes.right;
      // Del lado del carril con más espacio, sin tocar a Lapilli
      const toRight = lane.x1 - point.x >= point.x - lane.x0;
      const x = toRight ? point.x + spriteW / 2 + GAP : point.x - spriteW / 2 - GAP - SIZE;
      const data = LANDMARKS[next % LANDMARKS.length];
      next++;
      items.push(makeItem(data, Math.max(lane.x0, Math.min(x, lane.x1 - SIZE)), y));
    }
  });
}

function makeItem({ sprite, label, line }, x, y) {
  const el = document.createElement('div');
  el.className = 'landmark';
  const canvas = document.createElement('canvas');
  paintIcon(canvas, sprite);
  const tag = document.createElement('span');
  tag.className = 'landmark__label';
  tag.textContent = pick(label);
  el.append(canvas, tag);
  // Los pies del dibujo quedan a la altura de los pies de Lapilli
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y - SIZE)}px)`;
  el.style.setProperty('--delay', `${(items.length % 5) * -0.6}s`);
  layer.append(el);
  return { el, tag, label, x: x + SIZE / 2, y, line, found: false };
}

function update() {
  if (state.mode !== 'route' || items.length === 0) {
    lastAnchor = null;
    return Infinity;
  }
  const { anchor } = state.scroll;
  if (lastAnchor !== null && anchor > lastAnchor) {
    items.forEach((item) => {
      if (item.found || item.y <= lastAnchor || item.y > anchor) return;
      item.found = true;
      item.el.classList.add('is-found');
      emit('landmark:found', { x: item.x, line: item.line });
    });
  }
  lastAnchor = anchor;
  return Infinity; // vuelve a correr cuando el scroll despierta el loop
}
