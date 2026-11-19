// Presentación a pantalla completa al abrir la página: arranca una terminal,
// suben los estratos (cada capa es una parte de lo que sé hacer) y aparecen el
// nombre de Adriana y su rol (unos 3,5 s). Si Lapilli está visible (Ajustes),
// antes cae un huevo, nace Lapilli en grande y se presenta (unos 5 s).
// Se salta con el botón, Esc, un clic o la rueda del ratón. Si toca mostrarla lo
// decide el script del <head> (una vez por sesión y nunca con movimiento
// reducido); ?intro la fuerza.

import { state } from './state.js';
import { emit } from './bus.js';
import { pick } from './i18n.js';
import { drawPixels } from './pixel.js';
import { FRAME_W, FRAME_H, PALETTE, ANIMATIONS } from './mascot/sprites.js';

const SEEN_KEY = 'portafolio:intro';
const SHELL_BITS = 16;

const TEXT = {
  boot: { es: 'iniciando portafolio…', en: 'starting portfolio…' },
  hello: {
    es: '¡Hola! Soy Lapilli, el asistente de campo de Adriana. ¿Me acompañas?',
    en: "Hi! I'm Lapilli, Adriana's field assistant. Want to come along?",
  },
  role: { es: 'Geóloga · Desarrolladora de software', en: 'Geologist · Software developer' },
  skip: { es: 'Saltar intro', en: 'Skip intro' },
  // Una etiqueta por estrato, como en la sección de habilidades
  layers: [
    { es: 'Superficie · Frontend', en: 'Surface · Frontend' },
    { es: 'Subsuelo · Backend con Java', en: 'Subsurface · Java backend' },
    { es: 'Basamento · Bases de datos', en: 'Basement · Databases' },
    { es: 'Núcleo · Datos y automatización', en: 'Core · Data and automation' },
  ],
};

// Momentos de la presentación, en milisegundos desde que empieza
const AT = { drop: 500, wobble: 1050, crack: 1700, hatch: 2100, roar: 2250, bubble: 2350, name: 2600, idle: 3050, leave: 4800 };
// Sin Lapilli (lo normal) el nombre aparece en cuanto suben los estratos
const AT_PLAIN = { name: 900, leave: 3500 };

let root = null;
let overlay = null;
let ctx = null;
let timers = [];
let frameTimer = 0;
let finished = false;
let previousFocus = null;
let plain = true; // sin Lapilli

/** Arranca la presentación si el <head> la pidió. */
export function initIntro() {
  root = document.documentElement;
  if (!root.classList.contains('has-intro')) return;
  // Si motion.js ya apagó las animaciones (por ejemplo, con ?motion=off), no hay presentación
  if (!state.motionOn) {
    finish();
    return;
  }
  window.__introStarted = true; // el script del <head> ya no la cancela
  build();
  schedule();
}

/** true mientras la presentación está en pantalla. */
export function isIntroPlaying() {
  return Boolean(root?.classList.contains('has-intro')) && !finished;
}

function build() {
  plain = root.classList.contains('no-lapilli');
  overlay = document.createElement('div');
  overlay.className = plain ? 'intro is-plain' : 'intro';
  const layers = TEXT.layers.map((text, i) => `<span><em style="--i: ${i}">${pick(text)}</em></span>`).join('');
  const lapilli = plain ? '' : `
    <div class="intro__lapilli" aria-hidden="true">
      <canvas width="${FRAME_W}" height="${FRAME_H}"></canvas>
      <div class="intro__shell"></div>
      <p class="intro__bubble">${pick(TEXT.hello)}</p>
    </div>`;
  // Los textos son nuestros (TEXT), no vienen del usuario
  overlay.innerHTML = `
    <p class="intro__boot" aria-hidden="true"><span class="intro__prompt">$</span> ${pick(TEXT.boot)}</p>
    <div class="intro__title" aria-hidden="true">
      <p class="intro__name">Adriana Reatigui</p>
      <p class="intro__role">${pick(TEXT.role)}</p>
    </div>
    <div class="intro__strata" aria-hidden="true">${layers}</div>${lapilli}
    <button class="intro__skip" type="button">${pick(TEXT.skip)}</button>`;
  document.body.append(overlay);
  if (!plain) ctx = overlay.querySelector('canvas').getContext('2d');

  const skip = overlay.querySelector('.intro__skip');
  skip.addEventListener('click', leave);
  overlay.addEventListener('click', leave);
  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', leave, { passive: true });
  window.addEventListener('touchmove', leave, { passive: true });

  // El foco va al botón para poder saltarla con Enter
  previousFocus = document.activeElement;
  skip.focus({ preventScroll: true });
}

function schedule() {
  if (plain) {
    at(AT_PLAIN.name, () => overlay.classList.add('is-named'));
    at(AT_PLAIN.leave, leave);
    return;
  }
  const egg = ANIMATIONS.egg;
  drawFrame(egg.frames[0], egg.palette);
  at(AT.drop, () => overlay.classList.add('is-dropping'));
  at(AT.wobble, () => playFrames(egg.frames, egg.palette, 7));
  at(AT.crack, () => {
    stopFrames();
    drawFrame(ANIMATIONS.crack.frames[0], ANIMATIONS.crack.palette);
  });
  at(AT.hatch, () => {
    burstShell();
    drawFrame(ANIMATIONS.jump.frames[0], PALETTE);
    overlay.classList.add('is-hatched');
  });
  at(AT.roar, () => playFrames(ANIMATIONS.roar.frames, PALETTE, 6));
  at(AT.bubble, () => overlay.classList.add('is-talking'));
  at(AT.name, () => overlay.classList.add('is-named'));
  at(AT.idle, () => playFrames(ANIMATIONS.idle.frames, PALETTE, 2));
  at(AT.leave, leave);
}

function at(ms, action) {
  timers.push(setTimeout(action, ms));
}

function drawFrame(rows, palette) {
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  drawPixels(ctx, rows, palette);
}

function playFrames(frames, palette, fps) {
  stopFrames();
  let index = 0;
  drawFrame(frames[0], palette);
  frameTimer = setInterval(() => {
    index = (index + 1) % frames.length;
    drawFrame(frames[index], palette);
  }, 1000 / fps);
}

function stopFrames() {
  clearInterval(frameTimer);
}

// Pedazos de cáscara que salen disparados en todas las direcciones
function burstShell() {
  const shell = overlay.querySelector('.intro__shell');
  for (let i = 0; i < SHELL_BITS; i++) {
    const bit = document.createElement('span');
    const angle = (Math.PI * 2 * i) / SHELL_BITS + Math.random() * 0.4;
    const distance = 70 + Math.random() * 110;
    bit.style.setProperty('--dx', `${Math.round(Math.cos(angle) * distance)}px`);
    bit.style.setProperty('--dy', `${Math.round(Math.sin(angle) * distance - 50)}px`);
    bit.style.setProperty('--r', `${Math.round(Math.random() * 360)}deg`);
    bit.style.setProperty('--s', `${6 + Math.round(Math.random() * 8)}px`);
    bit.style.setProperty('--c', i % 3 ? '#F6E7C8' : '#A8B58A');
    shell.append(bit);
  }
}

function onKey(event) {
  if (event.key === 'Escape') leave();
}

// Sube como un telón y deja ver la página
function leave() {
  if (finished || overlay.classList.contains('is-leaving')) return;
  timers.forEach(clearTimeout);
  timers = [];
  stopFrames();
  overlay.classList.add('is-leaving');
  overlay.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 1100); // por si el navegador no avisa del final de la transición
}

function finish() {
  if (finished) return;
  finished = true;
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('wheel', leave);
  window.removeEventListener('touchmove', leave);
  overlay?.remove();
  // Sin la clase, la página aparece y arranca su propia entrada (css/sections.css)
  root.classList.remove('has-intro');
  try {
    sessionStorage.setItem(SEEN_KEY, 'visto');
  } catch {
    // Sin almacenamiento: en la próxima visita se vuelve a mostrar
  }
  if (previousFocus && previousFocus !== document.body) previousFocus.focus?.({ preventScroll: true });
  emit('intro:done');
}
