// Fondo animado: un corte geológico. Capas de roca plegadas (anticlinales y
// sinclinales suaves), una arenisca con granos en cada unidad y fallas
// normales con sus flechas de movimiento relativo. El corte avanza despacio,
// como si caminaras junto a un afloramiento, y al bajar por la página bajas
// también por el subsuelo (parallax): cuanto más hondo, más plegadas las capas.
// Se dibuja en el lienzo fijo de la página (se ve detrás de las secciones
// claras) y en el del inicio, que es oscuro. Con las animaciones en pausa queda
// quieto.
//
// Coordenadas "del corte": x crece hacia la derecha y la profundidad hacia
// abajo. En pantalla, x = x del corte - avance y y = profundidad - profundidad
// de la vista.

import { state } from '../state.js';
import { on } from '../bus.js';
import { addTask, wake } from '../loop.js';

const TAU = Math.PI * 2;

// Capas, agrupadas en unidades (secuencias) de seis
const BEDS = 6; // capas por unidad; el contacto entre unidades va más marcado
const UNIT = 204; // grosor de una unidad (px): seis capas de unos 34 px
const SANDSTONE = 2; // en cada unidad, la capa de arenisca (con granos)
const GRAIN_STEP = 12; // distancia entre granos de arena (px)
const STEP = 8; // distancia entre muestras de cada contacto (px)

// Pliegues: dos ondas suaves cuya amplitud crece con la profundidad
const WAVE = 1150;
const WAVE_2 = 470;
const FOLD_MIN = 24;
const FOLD_MAX = 64;
const FOLD_GROWTH = 0.02; // px de amplitud por cada px de profundidad
const TILT = 0.22; // corre las crestas con la profundidad: planos axiales inclinados

// Fallas normales: a lo sumo una por celda, en celdas alternadas como un tablero
// de ajedrez, así dos fallas nunca se cruzan
const CELL_W = 720;
const CELL_H = 560;
const FAULT_ODDS = 0.85;
const DRAG = 70; // ancho del arrastre junto al plano de falla (px)
const BLOCK = 0.5; // parte del salto que conserva cada bloque lejos del plano
const BLOCK_REACH = 600; // a esta distancia del plano ya no hay desplazamiento (px)
const FOOTWALL = 0.35; // el bloque de piso sube un poco mientras el de techo baja

// Movimiento
const PAN = 0.006; // px por ms: el corte avanza 6 px/s
const PARALLAX = 0.3; // fracción del scroll que baja el corte
const PAGE_DEPTH = 300; // profundidad del corte arriba de la página
const HERO_DEPTH = 40; // profundidad del corte en el inicio
const MARGIN = 160; // corte extra fuera de la vista: pliegues y fallas mueven las líneas
const FRAME_MS = 66; // unos 15 cuadros por segundo cuando no hay scroll

let page = null; // lienzo fijo de toda la página
let hero = null; // lienzo del inicio
let heroBottom = 0; // dónde termina el inicio, en coordenadas del documento
let lastScroll = -1;
let shownScroll = 0; // scroll del último dibujo con movimiento
let pan = 0; // cuánto avanzó el corte (px): solo crece con las animaciones activas
let lastNow = 0;
let frozen = false;
const faultCache = new Map();
const bedDepths = new Float64Array(BEDS + 1);
const point = { x: 0, y: 0 }; // resultado de displace(), sin crear objetos en cada muestra
const cut = { index: -1, x: 0, y: 0, hanging: false }; // resultado de findCut()

export function initCrossSection() {
  page = makeView('#cross-section');
  hero = makeView('.hero__cross-section');
  if (!page) return;
  readColors();
  on('layout:change', resize);
  on('palette:change', () => {
    readColors();
    redraw();
  });
  on('motion:change', redraw);
  addTask('cross-section', update, 5);
}

function makeView(selector) {
  const canvas = document.querySelector(selector);
  if (!canvas) return null;
  return { canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, colors: null };
}

function resize() {
  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  [page, hero].forEach((view) => {
    if (!view) return;
    view.w = view.canvas.clientWidth;
    view.h = view.canvas.clientHeight;
    view.canvas.width = Math.round(view.w * dpr);
    view.canvas.height = Math.round(view.h * dpr);
    view.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });
  heroBottom = hero ? hero.canvas.getBoundingClientRect().bottom + scrollY : 0;
  redraw();
}

function redraw() {
  frozen = false;
  wake('cross-section');
}

function update(dt, now) {
  if (!page.w) return Infinity;
  if (!state.motionOn) {
    // En pausa basta con un dibujo, quieto donde estaba
    lastNow = 0;
    if (!frozen) {
      frozen = true;
      render(pan, shownScroll, true);
    }
    return Infinity;
  }
  // Al reanudar sigue desde donde quedó, sin saltos
  if (lastNow) pan += Math.min(100, now - lastNow) * PAN;
  lastNow = now;
  const scrolling = scrollY !== lastScroll;
  lastScroll = scrollY;
  shownScroll = scrollY;
  render(pan, scrollY, false);
  // Mientras haces scroll se dibuja en cada cuadro, así el parallax va suave
  return scrolling ? 0 : FRAME_MS;
}

function render(pan, scroll, always) {
  // El lienzo fijo no se ve mientras el inicio, que es opaco, llena la ventana
  if (always || scroll + page.h > heroBottom) draw(page, pan, PAGE_DEPTH + scroll * PARALLAX);
  if (hero?.w && (always || scroll < heroBottom)) draw(hero, pan, HERO_DEPTH);
}

// Colores de la paleta activa (ui/settings.js cambia las variables de css/tokens.css)
function readColors() {
  const css = getComputedStyle(document.documentElement);
  const color = (name, fallback) => parseHex(css.getPropertyValue(name).trim()) ?? fallback;
  const rosewood = color('--rosewood', [180, 106, 114]);
  const midnight = color('--midnight', [45, 58, 71]);
  const misty = color('--misty', [169, 183, 198]);
  const vanilla = color('--vanilla', [255, 247, 230]);
  const blush = color('--blush', [247, 200, 211]);
  page.colors = {
    bed: rgba(rosewood, 0.13),
    unit: rgba(rosewood, 0.26),
    grain: rgba(midnight, 0.16),
    fault: rgba(midnight, 0.34),
    clear: rgba(midnight, 0),
  };
  if (hero) {
    hero.colors = {
      bed: rgba(misty, 0.12),
      unit: rgba(misty, 0.24),
      grain: rgba(vanilla, 0.16),
      fault: rgba(blush, 0.42),
      clear: rgba(blush, 0),
    };
  }
}

function parseHex(value) {
  const hex = value.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function rgba([r, g, b], alpha) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function draw(view, pan, depth) {
  const { ctx, w, h, colors } = view;
  ctx.clearRect(0, 0, w, h);
  const left = pan - MARGIN;
  const right = pan + w + MARGIN;
  const top = depth - MARGIN;
  const bottom = depth + h + MARGIN;
  const faults = faultsNear(left, top, right, bottom);

  // Contactos entre capas y granos de la arenisca, unidad por unidad
  const beds = new Path2D();
  const units = new Path2D();
  const grains = new Path2D();
  for (let unit = Math.floor(top / UNIT); unit <= Math.floor(bottom / UNIT); unit++) {
    unitBeds(unit);
    for (let bed = 0; bed < BEDS; bed++) {
      traceContact(bed === 0 ? units : beds, bedDepths[bed], faults, left, right, pan, depth);
    }
    traceGrains(grains, unit, bedDepths[SANDSTONE], bedDepths[SANDSTONE + 1], faults, left, right, pan, depth);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.bed;
  ctx.stroke(beds);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = colors.unit;
  ctx.stroke(units);
  ctx.fillStyle = colors.grain;
  ctx.fill(grains);

  faults.forEach((fault) => drawFault(ctx, fault, pan, depth, colors, w, h));
}

// Profundidad del contacto superior de cada capa de una unidad (y de la base de la
// última). Las capas tienen grosores distintos, pero cada unidad mide siempre UNIT.
function unitBeds(unit) {
  let total = 0;
  for (let bed = 0; bed < BEDS; bed++) total += 0.6 + 0.8 * hash(unit, bed, 7);
  let sum = 0;
  for (let bed = 0; bed <= BEDS; bed++) {
    bedDepths[bed] = unit * UNIT + (UNIT * sum) / total;
    if (bed < BEDS) sum += 0.6 + 0.8 * hash(unit, bed, 7);
  }
}

// Pliegue a la profundidad d: más amplio cuanto más hondo. Las crestas de las dos
// ondas se corren igual con la profundidad: comparten el plano axial inclinado.
function fold(x, d) {
  const depth = Math.max(0, d);
  const amp = Math.min(FOLD_MAX, FOLD_MIN + depth * FOLD_GROWTH);
  const s = x + depth * TILT;
  return amp * (Math.sin((s * TAU) / WAVE) + 0.35 * Math.sin((s * TAU) / WAVE_2 + 1.7));
}

// Un contacto entre capas: se muestrea en puntos fijos del corte (no de la
// pantalla) para que la línea no tiemble mientras el corte avanza. Donde cruza
// una falla se corta: cada lado termina sobre la falla, desplazado.
function traceContact(path, d, faults, left, right, pan, depth) {
  let prevX = 0;
  let prevY = 0;
  let started = false;
  for (let x = Math.floor(left / STEP) * STEP; x <= right; x += STEP) {
    const y = d + fold(x, d);
    if (started && findCut(faults, prevX, prevY, x, y)) {
      displace(cut.x, cut.y, faults, cut.index, cut.hanging);
      path.lineTo(point.x - pan, point.y - depth);
      displace(cut.x, cut.y, faults, cut.index, !cut.hanging);
      path.moveTo(point.x - pan, point.y - depth);
    }
    displace(x, y, faults);
    if (started) path.lineTo(point.x - pan, point.y - depth);
    else path.moveTo(point.x - pan, point.y - depth);
    started = true;
    prevX = x;
    prevY = y;
  }
}

// Granos de arena repartidos dentro de la capa, con un poco de azar fijo
function traceGrains(path, unit, top, bottom, faults, left, right, pan, depth) {
  const mid = (top + bottom) / 2;
  const spread = (bottom - top) * 0.6;
  for (let i = Math.floor(left / GRAIN_STEP); i * GRAIN_STEP <= right; i++) {
    const x = (i + 0.8 * (hash(i, unit, 3) - 0.5)) * GRAIN_STEP;
    const d = mid + spread * (hash(i, unit, 4) - 0.5);
    displace(x, d + fold(x, d), faults);
    path.rect(point.x - pan - 0.75, point.y - depth - 0.75, 1.5, 1.5);
  }
}

// Lado de la falla: negativo en el bloque de techo (encima del plano de falla)
function side(fault, x, y) {
  return y - fault.y0 - fault.s * (x - fault.x0) * fault.tan;
}

// ¿El tramo de (x1, y1) a (x2, y2) cruza una falla donde ya hay desplazamiento?
function findCut(faults, x1, y1, x2, y2) {
  for (let i = 0; i < faults.length; i++) {
    const fault = faults[i];
    const a1 = side(fault, x1, y1);
    const a2 = side(fault, x2, y2);
    if (a1 < 0 === a2 < 0) continue;
    const t = a1 / (a1 - a2);
    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);
    const along = (x - fault.x0) * fault.ux + (y - fault.y0) * fault.uy;
    if (along <= 0 || along >= fault.length) continue;
    cut.index = i;
    cut.x = x;
    cut.y = y;
    cut.hanging = a1 < 0;
    return true;
  }
  return false;
}

// Mueve un punto según las fallas cercanas. En una falla normal el bloque de
// techo baja por el plano y el de piso sube un poco. El salto es mayor en el
// centro de la falla y cero en sus puntas. Junto al plano las capas se arrastran
// (se curvan) en una franja angosta; más lejos, cada bloque conserva parte del
// salto, que se pierde del todo a BLOCK_REACH. `forced` fija el lado de una falla
// para los puntos que caen justo sobre ella.
function displace(x, y, faults, forced = -1, forcedHanging = false) {
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < faults.length; i++) {
    const fault = faults[i];
    const rx = x - fault.x0;
    const ry = y - fault.y0;
    const along = rx * fault.ux + ry * fault.uy;
    if (along <= 0 || along >= fault.length) continue;
    const away = Math.abs(rx * fault.uy - ry * fault.ux);
    if (away >= BLOCK_REACH) continue;
    const hanging = i === forced ? forcedHanging : ry - fault.s * rx * fault.tan < 0;
    const t = away / BLOCK_REACH;
    const reach = BLOCK * (1 - t * t * (3 - 2 * t)) + (1 - BLOCK) * Math.exp(-away / DRAG);
    const slip = fault.slip * Math.sin((Math.PI * along) / fault.length) * reach;
    const amount = hanging ? slip : -slip * FOOTWALL;
    dx += fault.ux * amount;
    dy += fault.uy * amount;
  }
  point.x = x + dx;
  point.y = y + dy;
}

// Fallas que pueden mover algo dentro de la vista: su segmento, ampliado por el
// alcance del desplazamiento, toca el rectángulo visible
function faultsNear(left, top, right, bottom) {
  const list = [];
  for (let row = Math.floor(top / CELL_H) - 2; row <= Math.floor(bottom / CELL_H) + 2; row++) {
    for (let col = Math.floor(left / CELL_W) - 2; col <= Math.floor(right / CELL_W) + 2; col++) {
      const fault = faultIn(col, row);
      if (!fault) continue;
      const x2 = fault.x0 + fault.ux * fault.length;
      const y2 = fault.y0 + fault.uy * fault.length;
      if (Math.max(fault.x0, x2) + BLOCK_REACH < left || Math.min(fault.x0, x2) - BLOCK_REACH > right) continue;
      if (y2 + BLOCK_REACH < top || fault.y0 - BLOCK_REACH > bottom) continue;
      list.push(fault);
    }
  }
  return list;
}

// La falla de una celda (o null). Siempre la misma para la misma celda.
function faultIn(col, row) {
  const key = `${col},${row}`;
  if (faultCache.has(key)) return faultCache.get(key);
  let fault = null;
  if ((col + row) % 2 === 0 && hash(col, row, 1) < FAULT_ODDS) {
    const s = hash(col, row, 2) < 0.5 ? 1 : -1; // hacia dónde buza: derecha o izquierda
    const dip = ((56 + 10 * hash(col, row, 3)) * Math.PI) / 180;
    const length = 300 + 180 * hash(col, row, 4); // corta: no alcanza a la falla vecina
    const ux = s * Math.cos(dip); // dirección del plano, hacia abajo
    const uy = Math.sin(dip);
    const cx = (col + 0.2 + 0.6 * hash(col, row, 5)) * CELL_W;
    const cy = (row + 0.2 + 0.6 * hash(col, row, 6)) * CELL_H;
    fault = {
      s,
      tan: Math.tan(dip),
      ux,
      uy,
      length,
      slip: 26 + 26 * hash(col, row, 7),
      x0: cx - (ux * length) / 2,
      y0: cy - (uy * length) / 2,
    };
  }
  if (faultCache.size > 400) faultCache.clear();
  faultCache.set(key, fault);
  return fault;
}

// Traza de la falla, que se desvanece hacia las puntas como su desplazamiento,
// y las medias flechas de cada bloque: el de techo baja y el de piso sube
function drawFault(ctx, fault, pan, depth, colors, w, h) {
  const x1 = fault.x0 - pan;
  const y1 = fault.y0 - depth;
  const x2 = x1 + fault.ux * fault.length;
  const y2 = y1 + fault.uy * fault.length;
  if (Math.max(x1, x2) < 0 || Math.min(x1, x2) > w || y2 < 0 || y1 > h) return;

  const trace = ctx.createLinearGradient(x1, y1, x2, y2);
  trace.addColorStop(0, colors.clear);
  trace.addColorStop(0.25, colors.fault);
  trace.addColorStop(0.75, colors.fault);
  trace.addColorStop(1, colors.clear);
  ctx.strokeStyle = trace;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Perpendicular a la falla que apunta al bloque de techo
  let nx = fault.uy;
  let ny = -fault.ux;
  if (ny - fault.s * nx * fault.tan > 0) {
    nx = -nx;
    ny = -ny;
  }
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  ctx.strokeStyle = colors.fault;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  halfArrow(ctx, cx + nx * 10, cy + ny * 10, fault.ux, fault.uy, nx, ny);
  halfArrow(ctx, cx - nx * 10, cy - ny * 10, -fault.ux, -fault.uy, -nx, -ny);
  ctx.stroke();
}

// Media flecha de 22 px centrada en (x, y) que apunta hacia (ux, uy), con la
// punta hacia el lado (nx, ny)
function halfArrow(ctx, x, y, ux, uy, nx, ny) {
  const tipX = x + ux * 11;
  const tipY = y + uy * 11;
  ctx.moveTo(x - ux * 11, y - uy * 11);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(tipX - ux * 6 + nx * 5, tipY - uy * 6 + ny * 5);
}

// Número pseudoaleatorio entre 0 y 1, siempre el mismo para los mismos enteros
function hash(a, b, c) {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
