// Ruta de Lapilli en escritorio (solo en modo 'route'): baja en zigzag por un carril
// lateral y en cada banda cruza al otro carril, siempre dentro de .band__scene.
// Bajo cada cruce dibuja el terreno de la banda (con estratos): así Lapilli camina
// sobre su superficie.
// Cada tramo P -> Q es una curva en S con tangentes verticales, así la altura (y)
// siempre crece. Por eso a cada altura le corresponde un solo punto de la ruta.

import { on, emit } from '../bus.js';
import { ANCHOR } from '../config.js';

const STEP = 150; // alto aproximado de cada tramo del zigzag (px)
const SAMPLE = 6; // distancia aproximada entre dos muestras de la ruta (px)
const SWING = 0.35; // cuánto se aleja el zigzag del centro del carril (fracción del ancho)
const SCENE_GAP = 8; // espacio libre arriba y abajo dentro de la escena de la banda
const MIN_CROSS = 24; // alto mínimo para que valga la pena cruzar una banda

let scene = null;
let svg = null;
let trail = null;
let done = null;
let terrainPath = null;
let groundPath = null;
let route = null; // { xs, ys, ss, startY, endY, length }
let terrains = []; // uno por banda cruzada: { top, bottom, surface: [{ x, y }] ordenada por x }
let lastProgress = -1;

export function initRoute() {
  scene = document.querySelector('.scene');
  svg = scene.querySelector('.scene__route');
  trail = svg.querySelector('#route-path');
  done = svg.querySelector('#route-done');
  terrainPath = svg.querySelector('#route-terrain');
  groundPath = svg.querySelector('#route-ground');

  on('layout:change', (layout) => {
    if (layout.mode === 'route') build(layout);
    else clear();
  });
}

/** Dónde está la ruta a la altura y (documento): { x, s } con s = distancia recorrida. */
export function pointAtY(y) {
  if (!route) return null;
  const { xs, ys, ss } = route;
  const last = ys.length - 1;
  if (y <= ys[0]) return { x: xs[0], s: 0 };
  if (y >= ys[last]) return { x: xs[last], s: ss[last] };

  // Búsqueda binaria: las muestras están ordenadas por altura
  let low = 0;
  let high = last;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (ys[mid] <= y) low = mid;
    else high = mid;
  }
  // Entre dos muestras se interpola en línea recta
  const f = (y - ys[low]) / (ys[high] - ys[low]);
  return { x: xs[low] + (xs[high] - xs[low]) * f, s: ss[low] + (ss[high] - ss[low]) * f };
}

export function getRoute() {
  if (!route) return null;
  return { startY: route.startY, endY: route.endY, length: route.length };
}

/** Altura (documento) de la superficie del terreno en x, en la banda que contiene la altura y. */
export function surfaceAt(x, y) {
  const terrain = terrains.find((item) => y >= item.top && y <= item.bottom);
  if (!terrain) return null;
  const { surface } = terrain;
  if (x <= surface[0].x) return surface[0].y;
  for (let i = 1; i < surface.length; i++) {
    const a = surface[i - 1];
    const b = surface[i];
    if (x <= b.x) return b.x === a.x ? b.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  }
  return surface[surface.length - 1].y;
}

/** Pinta como recorrida la ruta desde el inicio hasta la distancia s. */
export function setProgress(s) {
  if (!route) return;
  const value = Math.min(Math.max(s, 0), route.length);
  if (Math.abs(value - lastProgress) < 0.5) return; // medio píxel no se nota: no se toca el DOM
  lastProgress = value;
  // Un solo trazo de largo "value" seguido de un hueco del largo de toda la ruta
  done.style.strokeDasharray = `${value} ${route.length}`;
}

function build(layout) {
  const points = makeWaypoints(layout);
  if (!points) {
    clear();
    return;
  }

  const xs = [points[0].x];
  const ys = [points[0].y];
  const ss = [0];
  let d = `M${round(points[0].x)} ${round(points[0].y)}`;
  terrains = [];
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const q = points[i];
    const half = (q.y - p.y) / 2;
    // Controles justo debajo de P y justo encima de Q: tangentes verticales
    const c1 = { x: p.x, y: p.y + half };
    const c2 = { x: q.x, y: q.y - half };
    d += ` C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(q.x)} ${round(q.y)}`;
    const from = xs.length - 1;
    sampleCurve(p, c1, c2, q, xs, ys, ss);
    // El cruce de una banda es la superficie de su terreno
    if (q.band) terrains.push(makeTerrain(q.band, xs, ys, from, layout.viewport.w));
  }

  const length = ss[ss.length - 1];
  route = { xs, ys, ss, startY: ys[0], endY: ys[ys.length - 1], length };

  scene.style.height = `${layout.docHeight}px`;
  svg.setAttribute('width', layout.viewport.w);
  svg.setAttribute('height', layout.docHeight);
  trail.setAttribute('d', d);
  done.setAttribute('d', d);
  terrainPath.setAttribute('d', terrains.map(terrainShape).join(' '));
  groundPath.setAttribute('d', terrains.map((terrain) => polyline(terrain.surface)).join(' '));
  // pathLength: el navegador mide el trazo con nuestra longitud, así lo recorrido
  // termina justo en los pies de Lapilli
  done.setAttribute('pathLength', length);
  done.style.strokeDasharray = `0 ${length}`;
  lastProgress = 0;

  emit('route:ready', getRoute());
}

function clear() {
  route = null;
  terrains = [];
  trail.setAttribute('d', '');
  done.setAttribute('d', '');
  terrainPath.setAttribute('d', '');
  groundPath.setAttribute('d', '');
  svg.setAttribute('height', 0);
  scene.style.height = '';
}

// Puntos de paso con y estrictamente creciente: zigzag en un carril y un cruce por banda
function makeWaypoints(layout) {
  const viewportH = layout.viewport.h;
  const startY = ANCHOR * viewportH;
  const endY = layout.docHeight - (1 - ANCHOR) * viewportH;
  if (endY - startY < STEP) return null;

  const lanes = [layout.lanes.left, layout.lanes.right];
  let lane = 0; // empieza en el carril izquierdo
  let side = 1;
  const points = [{ x: lanes[0].center, y: startY }];
  const lastY = () => points[points.length - 1].y;

  // Switchbacks dentro del carril actual hasta la altura toY
  const zigzag = (toY) => {
    const fromY = lastY();
    if (toY <= fromY) return;
    const { x0, x1, center } = lanes[lane];
    // Lapilli entero cabe en el carril: el centro se aleja como mucho (ancho - sprite) / 2
    const swing = Math.max(0, Math.min((x1 - x0) * SWING, (x1 - x0 - layout.spriteW) / 2));
    const count = Math.max(1, Math.round((toY - fromY) / STEP));
    for (let i = 1; i <= count; i++) {
      side = -side;
      points.push({ x: center + swing * side, y: fromY + ((toY - fromY) * i) / count });
    }
  };

  layout.segments.forEach((segment) => {
    if (segment.kind !== 'band' || segment.sceneTop === undefined) return;
    // Al cruzar, Lapilli (pies y cabeza) queda completo dentro de la escena de la banda
    const crossTop = segment.sceneTop + layout.spriteH + SCENE_GAP;
    const crossBottom = segment.sceneBottom - SCENE_GAP;
    if (crossTop <= lastY() || crossBottom >= endY || crossBottom - crossTop < MIN_CROSS) return;
    zigzag(crossTop);
    lane = 1 - lane;
    points.push({ x: lanes[lane].center, y: crossBottom, band: { top: segment.sceneTop, bottom: segment.sceneBottom } });
  });
  zigzag(endY);
  return points;
}

// Terreno de una banda: meseta a la altura donde empieza el cruce, la ladera que
// sigue la ruta y llanura a la altura donde termina. `from` es el índice de la
// primera muestra del cruce.
function makeTerrain(band, xs, ys, from, width) {
  const slope = [];
  for (let k = from; k < xs.length; k++) slope.push({ x: xs[k], y: ys[k] });
  const first = slope[0];
  const last = slope[slope.length - 1];
  const leftToRight = first.x < last.x;
  const surface = [{ x: leftToRight ? 0 : width, y: first.y }, ...slope, { x: leftToRight ? width : 0, y: last.y }];
  if (!leftToRight) surface.reverse();
  return { top: band.top, bottom: band.bottom, surface };
}

// Contorno cerrado del terreno: la superficie y el fondo de la banda
function terrainShape({ surface, bottom }) {
  const first = surface[0];
  const last = surface[surface.length - 1];
  return `${polyline(surface)} L${round(last.x)} ${round(bottom)} L${round(first.x)} ${round(bottom)} Z`;
}

function polyline(points) {
  return points.map((point, i) => `${i ? 'L' : 'M'}${round(point.x)} ${round(point.y)}`).join(' ');
}

// Toma muestras de una curva cúbica. La curva nunca es más larga que su polígono
// de control, así que con estos pasos hay una muestra cada 6 px o menos.
function sampleCurve(p, c1, c2, q, xs, ys, ss) {
  const polygon = distance(p, c1) + distance(c1, c2) + distance(c2, q);
  const steps = Math.max(2, Math.ceil(polygon / SAMPLE));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = bezier(p.x, c1.x, c2.x, q.x, t);
    const y = bezier(p.y, c1.y, c2.y, q.y, t);
    const last = xs.length - 1;
    ss.push(ss[last] + Math.hypot(x - xs[last], y - ys[last]));
    xs.push(x);
    ys.push(y);
  }
}

// Fórmula de Bézier cúbica para una coordenada
function bezier(a, b, c, d, t) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// Un decimal basta para el atributo "d" y lo mantiene corto
function round(value) {
  return Math.round(value * 10) / 10;
}
