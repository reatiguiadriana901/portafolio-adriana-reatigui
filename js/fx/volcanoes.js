// Volcanes y asteroide de las bandas: hacen erupción cuando Lapilli pasa bajando.
// mono: una sola vez por visita, como los conos monogenéticos de mi tesis;
// poly y fissure: pueden repetir después de enfriarse (los poly también con clic).

import { state } from '../state.js';
import { on, emit } from '../bus.js';
import { addTask } from '../loop.js';
import { paintSprite } from '../pixel.js';
import { pointAtY } from '../scene/route.js';
import { ERUPTION_MAX_SPEED, ERUPTION_COOLDOWN_MS } from '../config.js';

const PALETTE = { r: '#5D6B7A', R: '#2D3A47', a: '#B46A72', l: '#EE9AA8', d: '#9A4F58', c: '#8596A8', g: '#8A929B', G: '#59636E' };

const SPRITES = {
  // Estratovolcán (poligenético)
  poly: [
    '.......ll.......', '......rddr......', '.....rrrrrr.....', '.....rrRrrr.....', '....rrrrRrrr....',
    '...rrRrrrrrrr...', '...rrrrrrRrrr...', '..rrrRrrrrrrrr..', '.rrrrrrrRrrrrrr.', 'rrrRrrrrrrrrRrrr',
  ],
  // Cono de escoria de lapilli rojizo (monogenético)
  mono: ['....dddd....', '...daaaad...', '..daaaaaad..', '.daaaaaaaad.', 'daaaaaaaaaad'],
  // Grieta con coladas apiladas en escalones, como un trap (fisural)
  fissure: [
    '..........ll............', '.....l...dlld...l.......', 'RRRRRdddddddddddddRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRRRR', 'cccccccccccccccccccccccc', 'RRRRRRRRRRRRRRRRRRRRRRRR',
  ],
  asteroid: ['..gg..', '.gGgg.', 'gGggGg', 'gggGgg', '.gggg.', '..gg..'],
};

let items = [];
let lastAnchor = null;

export function initVolcanoes() {
  items = [...document.querySelectorAll('.band__scene [data-volcano], .band__scene [data-asteroid]')].map((el) => {
    const kind = el.dataset.kind ?? 'asteroid';
    const canvas = document.createElement('canvas');
    paintSprite(canvas, SPRITES[kind], PALETTE);
    el.append(canvas);
    const item = { el, canvas, kind, id: el.dataset.volcano ?? el.dataset.asteroid, at: Number(el.dataset.at ?? 0.5),
      offset: Number(el.dataset.offset ?? 0), scene: el.closest('.band__scene'), triggerY: 0, lastAt: -Infinity, done: false };
    if (kind === 'poly') el.addEventListener('click', () => erupt(item));
    return item;
  });

  on('layout:change', placeByCss);
  on('route:ready', placeOnRoute);
  on('scroll:jump', () => { lastAnchor = null; });
  on('motion:change', () => { lastAnchor = null; });
  addTask('volcanoes', update, 15);
}

// Escala de los dibujos según el modo (en la franja móvil, un poco más pequeños)
function scale() {
  return state.mode === 'route' ? 5 : 4;
}

function placeByCss() {
  lastAnchor = null;
  items.forEach((item) => {
    // Altura (en el documento) donde Lapilli lo hace erupcionar al pasar
    const scene = item.scene.getBoundingClientRect();
    item.triggerY = scene.top + scrollY + item.at * scene.height;
    const rows = SPRITES[item.kind];
    item.canvas.style.width = `${rows[0].length * scale()}px`;
    item.canvas.style.height = `${rows.length * scale()}px`;
    // El asteroide cae desde arriba; los volcanes se apoyan en el fondo de la escena
    const isAsteroid = item.kind === 'asteroid';
    Object.assign(item.el.style, {
      left: `${item.at * 100}%`,
      top: isAsteroid ? '0' : '',
      bottom: isAsteroid ? 'auto' : '0',
      transform: isAsteroid ? '' : 'translateX(-50%)',
    });
  });
}

// En escritorio, cada volcán se pone al lado de la ruta, justo donde Lapilli pasa
function placeOnRoute() {
  const sceneTopOf = (item) => item.scene.getBoundingClientRect().top + scrollY;
  items.forEach((item) => {
    if (item.kind === 'asteroid') return;
    const point = pointAtY(item.triggerY);
    if (!point) return;
    const w = parseFloat(item.canvas.style.width);
    const h = parseFloat(item.canvas.style.height);
    const left = Math.max(0, Math.min(point.x + item.offset - w / 2, state.layout.viewport.w - w));
    const top = item.triggerY - sceneTopOf(item) - h;
    Object.assign(item.el.style, { left: `${left}px`, top: `${top}px`, bottom: 'auto', transform: 'none' });
  });
}

function update() {
  const { anchor, speed } = state.scroll;
  const canErupt = state.motionOn && state.mode !== 'static' && speed < ERUPTION_MAX_SPEED;
  if (lastAnchor !== null && canErupt && anchor > lastAnchor) {
    items.forEach((item) => {
      if (lastAnchor < item.triggerY && item.triggerY <= anchor) erupt(item);
    });
  }
  lastAnchor = anchor;
  return Infinity; // vuelve a correr cuando el scroll despierta el loop
}

function sceneClip(scene) {
  const rect = scene.getBoundingClientRect();
  return { left: rect.left + scrollX, top: rect.top + scrollY, right: rect.right + scrollX, bottom: rect.bottom + scrollY };
}

function erupt(item) {
  const now = performance.now();
  if (!state.motionOn || state.mode === 'static') return;
  if (item.done && (item.kind === 'mono' || item.kind === 'asteroid')) return;
  if (now - item.lastAt < ERUPTION_COOLDOWN_MS) return;
  item.lastAt = now;
  item.done = true;

  if (item.kind === 'asteroid') {
    item.el.style.setProperty('--fall-y', `${item.scene.offsetHeight * 0.55}px`);
    item.el.classList.add('is-falling');
    setTimeout(() => {
      const rect = item.el.getBoundingClientRect();
      item.el.classList.add('is-landed');
      emit('impact', { x: rect.left + rect.width / 2 + scrollX, y: rect.bottom + scrollY, clip: sceneClip(item.scene) });
    }, 900);
    return;
  }

  item.el.classList.add('is-erupting');
  setTimeout(() => {
    item.el.classList.remove('is-erupting');
    if (item.kind === 'mono') {
      item.el.classList.add('is-extinct');
      item.el.title = 'Monogenético: una sola erupción';
    }
  }, 1200);

  const rect = item.canvas.getBoundingClientRect();
  emit('volcano:erupt', {
    id: item.id,
    kind: item.kind,
    x: rect.left + rect.width / 2 + scrollX,
    y: rect.top + scrollY + (item.kind === 'fissure' ? rect.height * 0.35 : 2),
    w: rect.width,
    clip: sceneClip(item.scene),
  });
}
