// Convierte el scroll en el avance del viaje:
//   state.scroll   posición, ancla, dirección y velocidad del scroll (px/s)
//   state.segment  sección o banda donde está el ancla y cuánto lleva recorrido (0 a 1)
//   state.pose     solo en modo ruta: dónde va Lapilli, con los pies sobre la ruta
// El ancla es el punto de la página que queda al ANCHOR (60 %) del alto de la ventana.
// Corre en todos los modos para que la cabecera siempre sepa el segmento actual.

import { state } from '../state.js';
import { on, emit } from '../bus.js';
import { addTask, wake } from '../loop.js';
import { ANCHOR } from '../config.js';
import { pointAtY, getRoute, setProgress } from './route.js';

const FOLLOW_MS = 120; // qué tan rápido alcanza Lapilli al ancla (más alto = más lento)
const SPEED_MS = 100; // suavizado de la velocidad del scroll
const JUMP_SCREENS = 1.5; // si el ancla se aleja más que esto (en altos de ventana), Lapilli se teletransporta

let lastScrollY = null;
let smoothY = null; // altura de Lapilli en la ruta: persigue al ancla
let lastS = 0;
let teleport = true; // el primer frame siempre es un salto
let currentId = null;

export function initScroll() {
  // El listener no calcula nada: solo despierta el loop
  window.addEventListener('scroll', () => wake(), { passive: true });
  on('layout:change', requestTeleport);
  on('route:ready', requestTeleport);
  addTask('scroll', update, 10);
}

// Con medidas nuevas, Lapilli salta al ancla y todas las tareas se recalculan
function requestTeleport() {
  teleport = true;
  wake();
}

function update(dt) {
  const layout = state.layout;
  if (!layout) return Infinity;

  const scrollY = window.scrollY;
  const anchor = scrollY + ANCHOR * layout.viewport.h;
  updateScroll(scrollY, anchor, dt);
  updateSegment(layout, anchor);

  let walking = false;
  if (state.mode === 'route') walking = updatePose(anchor, layout.viewport.h, dt);
  else smoothY = null; // al volver al modo ruta, Lapilli aparece directo en el ancla

  // Sigue en cada frame mientras Lapilli camina o la velocidad no ha bajado a cero
  return (walking || state.scroll.speed > 0) ? 0 : Infinity;
}

function updateScroll(scrollY, anchor, dt) {
  const scroll = state.scroll;
  const delta = lastScrollY === null ? 0 : scrollY - lastScrollY;
  lastScrollY = scrollY;
  if (delta !== 0) scroll.dir = Math.sign(delta);

  // Velocidad suavizada, así un frame suelto no la dispara
  const rawSpeed = (Math.abs(delta) / dt) * 1000;
  scroll.speed += (rawSpeed - scroll.speed) * follow(dt, SPEED_MS);
  if (scroll.speed < 1) scroll.speed = 0;
  scroll.y = scrollY;
  scroll.anchor = anchor;
}

function updateSegment(layout, anchor) {
  const segments = layout.segments;
  if (segments.length === 0) return;
  const index = findSegment(segments, anchor);
  const segment = segments[index];

  // Solo cuenta la parte del segmento que el ancla puede recorrer: así el viaje
  // empieza en 0 arriba del todo y llega a 1 al final de la página
  const viewportH = layout.viewport.h;
  const top = Math.max(segment.top, ANCHOR * viewportH);
  const bottom = Math.min(segment.bottom, layout.docHeight - (1 - ANCHOR) * viewportH);
  const progress = bottom > top ? (anchor - top) / (bottom - top) : 1;

  const current = state.segment;
  current.progress = Math.min(Math.max(progress, 0), 1);
  if (segment.id === currentId) return;

  const prevId = currentId;
  const prevIndex = current.index;
  currentId = segment.id;
  current.id = segment.id;
  current.kind = segment.kind;
  current.index = index;
  const dir = prevId === null ? 0 : Math.sign(index - prevIndex);
  emit('segment:enter', { id: segment.id, prevId, kind: segment.kind, index, dir });
}

// Búsqueda binaria del último segmento cuyo borde superior está sobre el ancla
function findSegment(segments, anchor) {
  let low = 0;
  let high = segments.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (segments[mid].top <= anchor) low = mid;
    else high = mid - 1;
  }
  return low;
}

// Modo ruta: Lapilli persigue al ancla con suavizado. Devuelve true mientras camina.
function updatePose(anchor, viewportH, dt) {
  const route = getRoute();
  if (!route) return false;

  const from = smoothY; // null en el primer frame
  const jumped = teleport || smoothY === null || Math.abs(anchor - smoothY) > JUMP_SCREENS * viewportH;
  if (jumped) {
    smoothY = anchor;
    teleport = false;
  } else {
    smoothY += (anchor - smoothY) * follow(dt, FOLLOW_MS);
    if (Math.abs(anchor - smoothY) < 0.5) smoothY = anchor;
  }
  const settled = smoothY === anchor;

  const point = pointAtY(smoothY);
  const pose = state.pose;
  const dx = point.x - pose.x;
  if (!jumped && Math.abs(dx) > 0.5) pose.facing = Math.sign(dx);
  // Velocidad sobre la ruta en px/s; al saltar o al llegar queda en cero
  pose.speed = jumped || settled ? 0 : (Math.abs(point.s - lastS) / dt) * 1000;
  pose.moving = pose.speed > 5;
  pose.x = point.x;
  pose.y = Math.min(Math.max(smoothY, route.startY), route.endY);
  lastS = point.s;
  setProgress(point.s);

  // Se avisa después de mover la pose: quien escucha ya ve la posición nueva
  if (jumped) emit('scroll:jump', { from, to: anchor });
  return !settled;
}

// Fracción del camino que avanza un suavizado exponencial en dt milisegundos
function follow(dt, ms) {
  return 1 - Math.exp(-dt / ms);
}
