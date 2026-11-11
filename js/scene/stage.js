// Escenario inferior (modo 'stage': celular y tableta). Lapilli camina de un lado
// al otro de la pantalla sobre una franja de suelo fija en la parte de abajo.
// Su x sale del avance dentro del segmento actual (state.segment.progress) y la
// pose va en coordenadas de la ventana, con los pies sobre el suelo.

import { state } from '../state.js';
import { on } from '../bus.js';
import { addTask, wake } from '../loop.js';

const MARGIN = 12; // espacio libre entre Lapilli y el borde de la pantalla
const FOLLOW_MS = 120; // suavizado del paso (más alto = más lento)
const FOOT_SINK = 2; // los pies entran un poco en el suelo para que no parezca que flota

let stage = null;
let ground = null;
let x = null;
let lastIndex = 0;

export function initStage() {
  stage = document.querySelector('.stage');
  ground = stage.querySelector('.stage__ground');

  on('layout:change', ({ mode }) => {
    stage.hidden = mode !== 'stage';
    x = null; // con medidas nuevas, Lapilli aparece directo en su lugar
    wake('stage');
  });
  // En el celular, la barra del navegador mueve el borde inferior de la ventana
  window.addEventListener('resize', () => wake('stage'));
  addTask('stage', update, 11);
}

function update(dt) {
  if (state.mode !== 'stage') return Infinity;

  const half = state.layout.spriteW / 2;
  const minX = MARGIN + half;
  const maxX = state.viewport.w - MARGIN - half;
  const { index, progress } = state.segment;
  // Segmentos pares de izquierda a derecha e impares al revés: así nunca salta de orilla
  const t = index % 2 === 0 ? progress : 1 - progress;
  const target = minX + (maxX - minX) * t;

  const previous = x;
  // Si pasó más de un segmento de golpe (por ejemplo, con el menú), aparece directo
  if (x === null || Math.abs(index - lastIndex) > 1) {
    x = target;
  } else {
    x += (target - x) * (1 - Math.exp(-dt / FOLLOW_MS));
    if (Math.abs(target - x) < 0.5) x = target;
  }
  lastIndex = index;
  const settled = x === target;

  const pose = state.pose;
  const dx = previous === null ? 0 : x - previous;
  if (Math.abs(dx) > 0.5) pose.facing = Math.sign(dx);
  pose.speed = settled ? 0 : (Math.abs(dx) / dt) * 1000; // px/s
  pose.moving = pose.speed > 5;
  pose.x = x;
  pose.y = ground.getBoundingClientRect().top + FOOT_SINK;

  return settled ? Infinity : 0;
}
