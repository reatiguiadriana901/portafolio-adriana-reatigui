// Dibuja y anima a Lapilli. Dónde va lo deciden scene/scroll.js (ruta) y
// scene/stage.js (franja móvil); aquí se elige el fotograma, se coloca el
// botón y se muestra la burbuja.
// Emite mascot:poke al activarlo y mascot:state { name, prev } cuando cambia
// entre walk, idle, tap y sleep (brain.js lo usa para hablar).

import { state } from '../state.js';
import { emit } from '../bus.js';
import { addTask, wake } from '../loop.js';
import { drawPixels } from '../pixel.js';
import { FRAME_W, FRAME_H, PALETTE, ANIMATIONS } from './sprites.js';
import { BUBBLE_MS, IDLE_TAP_MS, IDLE_SLEEP_MS } from '../config.js';

const TRANSIENT_MS = { jump: 350, roar: 800, look: 1200, wave: 2000 };
const JUMP_HEIGHT = 12; // en píxeles del sprite

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

let button;
let canvas;
let ctx;
let bubble;
let bubbleText;
let announcer;
let slot;

let transient = null; // animación corta con prioridad: { name, start, end, face }
let animation = '';
let frame = 0;
let lastFrameAt = 0;
let walked = 0;
let lastMoveAt = performance.now();
let locomotion = 'idle';
let bubbleUntil = 0;
let bubbleSize = { w: 0, h: 0 };
let drawnKey = '';

export function initMascot() {
  button = document.querySelector('.mascot');
  canvas = button.querySelector('.mascot__canvas');
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  ctx = canvas.getContext('2d');
  bubble = document.querySelector('.bubble');
  bubbleText = bubble.querySelector('.bubble__text');
  announcer = document.querySelector('#sr-announcer');
  slot = document.querySelector('.hero__mascot-slot');

  // event.detail es 0 cuando el clic viene del teclado (Enter o Espacio)
  button.addEventListener('click', (event) => {
    emit('mascot:poke', { source: event.detail === 0 ? 'keyboard' : 'pointer' });
  });
  addTask('mascot', update, 20);
}

/** Reproduce una animación corta (jump, roar, look o wave). `face` la voltea mientras dura. */
export function play(name, { face } = {}) {
  const now = performance.now();
  transient = { name, start: now, end: now + (TRANSIENT_MS[name] ?? 800), face };
  wake('mascot');
}

/** Muestra un texto en la burbuja. Con announce también lo lee el lector de pantalla. */
export function say(text, { ms = BUBBLE_MS, announce = false } = {}) {
  bubbleText.textContent = text;
  bubble.hidden = false;
  bubble.style.maxWidth = `${maxBubbleWidth()}px`;
  bubbleSize = { w: bubble.offsetWidth, h: bubble.offsetHeight };
  bubbleUntil = performance.now() + ms;
  if (announce) announcer.textContent = text;
  placeBubble();
  wake('mascot');
}

export function hideBubble() {
  bubble.hidden = true;
  bubbleUntil = 0;
}

function pickAnimation(now) {
  if (transient && now < transient.end) return transient.name;
  transient = null;

  let next = 'idle';
  if (state.motionOn && state.mode !== 'static') {
    if (state.pose.moving) {
      next = 'walk';
      lastMoveAt = now;
    } else if (now - lastMoveAt > IDLE_SLEEP_MS) {
      next = 'sleep';
    } else if (now - lastMoveAt > IDLE_TAP_MS) {
      next = 'tap';
    }
  }
  if (next !== locomotion) {
    emit('mascot:state', { name: next, prev: locomotion });
    locomotion = next;
  }
  return next;
}

function update(dt, now) {
  const name = pickAnimation(now);
  const { frames, fps } = ANIMATIONS[name];
  if (name !== animation) {
    animation = name;
    frame = 0;
    lastFrameAt = now;
  } else if (state.motionOn) {
    if (name === 'walk') {
      // Un paso cada ~24 px recorridos: las patas siguen el ritmo del scroll
      walked += (state.pose.speed * dt) / 1000;
      if (walked > 24) {
        walked = 0;
        frame++;
      }
    } else if (now - lastFrameAt > 1000 / fps) {
      lastFrameAt = now;
      frame++;
    }
  }
  draw(frames[frame % frames.length], `${name}${frame % frames.length}`);
  place(now);

  if (bubbleUntil && now > bubbleUntil) hideBubble();
  else if (bubbleUntil) placeBubble();

  if (!state.motionOn || state.mode === 'static') return bubbleUntil ? 250 : Infinity;
  if (transient || name === 'walk') return 0;
  return Math.min(1000 / fps, bubbleUntil ? 100 : 1000);
}

function draw(rows, key) {
  if (key === drawnKey) return;
  drawnKey = key;
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  drawPixels(ctx, rows, PALETTE);
}

function place(now) {
  const { mode, pose, layout } = state;
  if (mode === 'static' || !layout) {
    if (button.parentElement !== slot) slot.append(button);
    button.style.transform = '';
    canvas.style.transform = '';
    return;
  }
  if (button.parentElement !== document.body) document.body.append(button);

  let lift = 0;
  if (transient?.name === 'jump') {
    const t = Math.min(1, (now - transient.start) / (transient.end - transient.start));
    lift = Math.sin(Math.PI * t) * JUMP_HEIGHT * (layout.spriteW / FRAME_W);
  }
  // Redondeado a píxeles del dispositivo para que el pixel art no se vea borroso
  const dpr = layout.viewport.dpr || 1;
  let x = Math.round((pose.x - layout.spriteW / 2) * dpr) / dpr;
  // En la franja móvil, que nunca quede cortado contra el borde de la pantalla
  if (mode === 'stage') x = clamp(x, 4, layout.viewport.w - layout.spriteW - 4);
  const y = Math.round((pose.y - layout.spriteH - lift) * dpr) / dpr;
  button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  const facing = transient?.face ?? pose.facing;
  canvas.style.transform = facing < 0 ? 'scaleX(-1)' : '';
}

function laneAt(x) {
  const { lanes } = state.layout;
  if (x >= lanes.left.x0 - 1 && x <= lanes.left.x1 + 1) return lanes.left;
  if (x >= lanes.right.x0 - 1 && x <= lanes.right.x1 + 1) return lanes.right;
  return null;
}

function maxBubbleWidth() {
  const { mode, layout, pose } = state;
  if (mode === 'route' && layout) {
    const lane = laneAt(pose.x);
    return lane ? clamp(lane.x1 - lane.x0 - 8, 140, 260) : 260;
  }
  if (mode === 'stage' && layout) return Math.min(300, layout.viewport.w - layout.spriteW - 40);
  return 240;
}

function placeBubble() {
  const { mode, pose, layout } = state;
  const { w, h } = bubbleSize;
  let left;
  let top;

  if (mode === 'route' && layout) {
    const lane = laneAt(pose.x);
    if (lane) {
      // Encima de Lapilli, sin salir de su carril (ahí no hay texto)
      left = clamp(pose.x - w / 2, lane.x0, lane.x1 - w);
      top = pose.y - layout.spriteH - h - 10;
    } else {
      // Cruzando una banda: al lado de Lapilli, dentro de la escena sin texto
      const toRight = pose.x + layout.spriteW / 2 + 12 + w < layout.viewport.w - 16;
      left = toRight ? pose.x + layout.spriteW / 2 + 12 : pose.x - layout.spriteW / 2 - 12 - w;
      top = pose.y - layout.spriteH;
    }
  } else if (mode === 'stage' && layout) {
    // Dentro de la franja inferior, del lado con más espacio
    const toRight = pose.x < layout.viewport.w / 2;
    left = toRight ? pose.x + layout.spriteW / 2 + 8 : pose.x - layout.spriteW / 2 - 8 - w;
    left = clamp(left, 8, layout.viewport.w - w - 8);
    const stageTop = pose.y + 10 - 72;
    top = stageTop + Math.max(0, (72 - h) / 2);
  } else {
    // Modo estático: a la derecha de Lapilli, en el inicio
    const rect = button.getBoundingClientRect();
    left = Math.min(rect.right + 12, window.innerWidth - w - 8) + scrollX;
    top = rect.top + scrollY;
  }
  bubble.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
}
